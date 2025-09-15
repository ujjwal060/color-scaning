import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../../models/adminModel.js"; // ✅ updated import
import { loadConfig } from "../../config/loadConfig.js";
import sendEmail from "../../config/sendmail.js";

const config = await loadConfig();

const generateAccessToken = (admin) => {
  return jwt.sign(
    { id: admin._id, email: admin.email, role: admin.role },
    config.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" } // shorter lifespan
  );
};

const generateRefreshToken = (admin) => {
  return jwt.sign(
    { id: admin._id, email: admin.email, role: admin.role },
    config.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};

/**
 * Register Admin (only one allowed)
 */
const registerAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await Admin.findOne({});
    if (existing) {
      return res
        .status(400)
        .json({ message: "Admin already exists. Only one admin allowed." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      email,
      password: hashedPassword,
      role: "Admin", // ✅ set role explicitly
    });

    await admin.save();

    return res.status(201).json({
      status: 201,
      success: true,
      message: "Admin registered successfully",
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

/**
 * Admin Login
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ status: 404, message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password || "");
    if (!isMatch) {
      return res.status(400).json({ status: 400, message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin);

    // Save refresh token in DB
    admin.refreshToken = refreshToken;
    await admin.save();

    return res.status(200).json({
      status: 200,
      message: "Login successful",
      accessToken,
      refreshToken,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

const adminRefreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const admin = await Admin.findOne({ refreshToken });
    if (!admin) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Expired or invalid refresh token" });
      }

      const newAccessToken = generateAccessToken(admin);
      res.json({ accessToken: newAccessToken });
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};


/**
 * Forgot Password - Generate OTP
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ status: 404, message: "Admin not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    admin.otp = otp;
    admin.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    await admin.save();

    await sendEmail(
      admin.email,
      "Admin Password Reset OTP - Color Scanning",
      `<p>Your OTP is <b>${otp}</b>. It will expire in 5 minutes.</p>`
    );

    return res.status(200).json({
      status: 200,
      message: "OTP sent to email",
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

/**
 * Verify OTP
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ status: 404, message: "Admin not found" });
    }

    if (admin.otp !== otp || admin.otpExpires < Date.now()) {
      return res.status(400).json({ status: 400, message: "Invalid or expired OTP" });
    }

    admin.otp = undefined;
    admin.otpExpires = undefined;
    await admin.save();

    const resetToken = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      config.ACCESS_TOKEN_SECRET,
      { expiresIn: "5m" }
    );

    return res.json({
      status: 200,
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

/**
 * Set New Password
 */
const setPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const adminId = req.user.id; // ✅ this assumes middleware decoded JWT and set req.user

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ status: 404, message: "Admin not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    return res.json({ status: 200, message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

export { registerAdmin,adminRefreshAccessToken, adminLogin, forgotPassword, verifyOtp, setPassword };
