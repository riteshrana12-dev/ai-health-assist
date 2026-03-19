const jwt = require("jsonwebtoken");

// ── Generate signed JWT token ─────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// ── Generate token and send response ─────────────────────────
const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  const token = generateToken(user._id);
  const safeUser = user.toSafeObject ? user.toSafeObject() : user.toObject();

  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: { user: safeUser },
  });
};

module.exports = { generateToken, sendTokenResponse };
