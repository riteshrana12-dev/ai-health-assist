const User = require("../models/User");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { sendTokenResponse } = require("../utils/generateToken");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// ── Register ──────────────────────────────────────────────────
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, age, gender, bloodGroup } = req.body;

  if (!name || !email || !password)
    return next(new AppError("Name, email and password are required", 400));
  if (password.length < 6)
    return next(new AppError("Password must be at least 6 characters", 400));

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing)
    return next(new AppError("An account with this email already exists", 400));

  // User.create triggers pre-save → password gets hashed ✅
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    age: age || undefined,
    gender: gender || undefined,
    bloodGroup: bloodGroup || "unknown",
    lastLogin: new Date(),
  });

  sendTokenResponse(user, 201, res, "Account created successfully");
});

// ── Login ─────────────────────────────────────────────────────
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError("Email and password are required", 400));

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );
  if (!user) return next(new AppError("Invalid email or password", 401));

  if (!user.isActive)
    return next(new AppError("Account deactivated. Contact support.", 401));

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return next(new AppError("Invalid email or password", 401));

  // Use findByIdAndUpdate so pre-save hook is NOT triggered
  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

  sendTokenResponse(user, 200, res, "Login successful");
});

// ── Get Profile ───────────────────────────────────────────────
const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return next(new AppError("User not found", 404));
  res.status(200).json({ success: true, data: { user: user.toSafeObject() } });
});

// ── Update Profile ────────────────────────────────────────────
// Uses findByIdAndUpdate so the password pre-save hook is NEVER triggered
const updateProfile = asyncHandler(async (req, res, next) => {
  // Strip fields that must never be updated this way
  const forbidden = [
    "password",
    "email",
    "isActive",
    "isEmailVerified",
    "passwordChangedAt",
    "passwordResetToken",
    "passwordResetExpires",
  ];
  forbidden.forEach((f) => delete req.body[f]);

  const {
    name,
    age,
    gender,
    phone,
    bloodGroup,
    dateOfBirth,
    height,
    weight,
    allergies,
    medicalHistory,
    currentMedications,
    emergencyContact,
    lifestyle,
    settings,
  } = req.body;

  // Build update object — only include fields that were actually sent
  const update = {};
  if (name) update.name = name.trim();
  if (age !== undefined) update.age = age;
  if (gender) update.gender = gender;
  if (phone) update.phone = phone;
  if (bloodGroup) update.bloodGroup = bloodGroup;
  if (dateOfBirth) update.dateOfBirth = dateOfBirth;
  if (height) update.height = height;
  if (weight) update.weight = weight;
  if (allergies) update.allergies = allergies;
  if (medicalHistory) update.medicalHistory = medicalHistory;
  if (currentMedications) update.currentMedications = currentMedications;
  if (emergencyContact) update.emergencyContact = emergencyContact;

  // For nested objects merge via dot-notation to avoid overwriting sibling fields
  if (lifestyle) {
    Object.keys(lifestyle).forEach((k) => {
      update[`lifestyle.${k}`] = lifestyle[k];
    });
  }
  if (settings) {
    Object.keys(settings).forEach((k) => {
      update[`settings.${k}`] = settings[k];
    });
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: update },
    { new: true, runValidators: true },
  );

  if (!user) return next(new AppError("User not found", 404));

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user: user.toSafeObject() },
  });
});

// ── Update Avatar ─────────────────────────────────────────────
const updateAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError("Please upload an image", 400));

  const user = await User.findById(req.userId);
  if (!user) return next(new AppError("User not found", 404));

  // Delete old avatar from Cloudinary
  if (user.profilePicPublicId) {
    await cloudinary.uploader.destroy(user.profilePicPublicId).catch(() => {});
  }

  // Stream upload new avatar
  const uploadFromBuffer = () =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "ai-health-assist/avatars",
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

  const result = await uploadFromBuffer();

  // Use findByIdAndUpdate — no pre-save hook triggered
  await User.findByIdAndUpdate(req.userId, {
    profilePic: result.secure_url,
    profilePicPublicId: result.public_id,
  });

  res.status(200).json({
    success: true,
    message: "Profile picture updated",
    profilePic: result.secure_url,
  });
});

// ── Change Password ───────────────────────────────────────────
// This IS the one place we intentionally trigger the pre-save hook (to hash)
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return next(new AppError("Current and new password are required", 400));
  if (newPassword.length < 6)
    return next(
      new AppError("New password must be at least 6 characters", 400),
    );

  const user = await User.findById(req.userId).select("+password");
  if (!user) return next(new AppError("User not found", 404));

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) return next(new AppError("Current password is incorrect", 401));

  // This triggers pre-save to hash the new password ✅
  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, "Password changed successfully");
});

// ── Delete Account ────────────────────────────────────────────
const deleteAccount = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  if (!password)
    return next(new AppError("Please confirm with your password", 400));

  const user = await User.findById(req.userId).select("+password");
  if (!user) return next(new AppError("User not found", 404));

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return next(new AppError("Password incorrect", 401));

  // Use findByIdAndUpdate — no pre-save hook triggered
  await User.findByIdAndUpdate(req.userId, { isActive: false });

  res
    .status(200)
    .json({ success: true, message: "Account deactivated successfully" });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  deleteAccount,
};
