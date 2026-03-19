const User = require("../models/User");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { sendTokenResponse } = require("../utils/generateToken");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// ─────────────────────────────────────────────────────────────
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, age, gender, bloodGroup } = req.body;

  // 1. Validate required fields
  if (!name || !email || !password) {
    return next(new AppError("Name, email and password are required", 400));
  }
  if (password.length < 6) {
    return next(new AppError("Password must be at least 6 characters", 400));
  }

  // 2. Check duplicate email
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return next(new AppError("An account with this email already exists", 400));
  }

  // 3. Create user (lastLogin set here avoids a second .save() call)
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

// ─────────────────────────────────────────────────────────────
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and password are required", 400));
  }

  // 1. Find user with password field
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );
  if (!user) {
    return next(new AppError("Invalid email or password", 401));
  }

  // 2. Check account active
  if (!user.isActive) {
    return next(new AppError("Account deactivated. Contact support.", 401));
  }

  // 3. Verify password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new AppError("Invalid email or password", 401));
  }

  // 4. Update last login using findByIdAndUpdate to bypass pre-save hooks
  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

  sendTokenResponse(user, 200, res, "Login successful");
});

// ─────────────────────────────────────────────────────────────
// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
// ─────────────────────────────────────────────────────────────
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw new AppError("User not found", 404);

  res.status(200).json({
    success: true,
    data: { user: user.toSafeObject() },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
// ─────────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res, next) => {
  const forbidden = ["password", "email", "isActive", "isEmailVerified"];
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

  const user = await User.findById(req.userId);
  if (!user) return next(new AppError("User not found", 404));

  // Apply updates selectively
  if (name) user.name = name.trim();
  if (age !== undefined) user.age = age;
  if (gender) user.gender = gender;
  if (phone) user.phone = phone;
  if (bloodGroup) user.bloodGroup = bloodGroup;
  if (dateOfBirth) user.dateOfBirth = dateOfBirth;
  if (height) user.height = height;
  if (weight) user.weight = weight;
  if (allergies) user.allergies = allergies;
  if (medicalHistory) user.medicalHistory = medicalHistory;
  if (currentMedications) user.currentMedications = currentMedications;
  if (emergencyContact) user.emergencyContact = emergencyContact;
  if (lifestyle)
    user.lifestyle = { ...(user.lifestyle.toObject?.() || {}), ...lifestyle };
  if (settings)
    user.settings = { ...(user.settings.toObject?.() || {}), ...settings };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user: user.toSafeObject() },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Upload / update profile picture
// @route   POST /api/auth/profile/avatar
// @access  Private
// ─────────────────────────────────────────────────────────────
const updateAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError("Please upload an image", 400));

  const user = await User.findById(req.userId);
  if (!user) return next(new AppError("User not found", 404));

  // Delete old avatar from Cloudinary if exists
  if (user.profilePicPublicId) {
    await cloudinary.uploader.destroy(user.profilePicPublicId).catch(() => {});
  }

  // Upload new avatar via stream
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

  user.profilePic = result.secure_url;
  user.profilePicPublicId = result.public_id;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Profile picture updated",
    profilePic: result.secure_url,
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
// ─────────────────────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError("Current and new password are required", 400));
  }
  if (newPassword.length < 6) {
    return next(
      new AppError("New password must be at least 6 characters", 400),
    );
  }

  const user = await User.findById(req.userId).select("+password");
  if (!user) return next(new AppError("User not found", 404));

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) return next(new AppError("Current password is incorrect", 401));

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, "Password changed successfully");
});

// ─────────────────────────────────────────────────────────────
// @desc    Delete account
// @route   DELETE /api/auth/account
// @access  Private
// ─────────────────────────────────────────────────────────────
const deleteAccount = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  if (!password)
    return next(new AppError("Please confirm with your password", 400));

  const user = await User.findById(req.userId).select("+password");
  if (!user) return next(new AppError("User not found", 404));

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return next(new AppError("Password incorrect", 401));

  // Soft delete — keep data for 30 days
  user.isActive = false;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Account deactivated successfully",
  });
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
