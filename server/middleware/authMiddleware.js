const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ── Protect Route — Verify JWT ────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Extract token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // 2. Fallback: cookie (optional)
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Check user still exists
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
      });
    }

    // 5. Check if user changed password after token was issued
    if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: "Password recently changed. Please log in again.",
      });
    }

    // 6. Check account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // 7. Attach user to request
    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Authentication error.",
    });
  }
};

// ── Optional Auth — Attach user if token present ──────────────
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id.toString();
      }
    }
    next();
  } catch {
    next(); // silently continue even if token is invalid
  }
};

module.exports = { protect, optionalAuth };
