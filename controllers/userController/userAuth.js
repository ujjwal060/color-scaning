import User from "../../models/userModels.js";
import jwt from "jsonwebtoken";
import { loadConfig } from "../../config/loadConfig.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendEmail from "../../config/sendmail.js";

const config = await loadConfig();

const generateAccessToken = (id,email) => {
  return jwt.sign({ id,email }, config.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (id,email) => {
  return jwt.sign({ id,email }, config.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};


// ---------------- Signup ----------------
export const signup = async (req, res) => {
  try {
    const { name, email, password, phoneNo } = req.body;
    const profile = req.fileLocations?.[0];

    // ✅ Check if email or phone already exists
    const userExists = await User.findOne({ $or: [{ email }, { phoneNo }] });
    if (userExists) {
      const conflictField =
        userExists.email === email ? "Email" : "Phone number";
      return res
        .status(400)
        .json({ message: `${conflictField} already exists` });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.create({
      name,
      email,
      phoneNo,
      password,
      profile,
      signupOtp: hashedOtp,
      signupOtpExpire: Date.now() + 10 * 60 * 1000, // 10 min
    });

    // Send OTP via email
    await sendEmail(
      email,
      "Verify your Email - Color Scanning",
      `<h1>Email Verification</h1><p>Your OTP is: <b>${otp}</b></p>`
    );

    res.status(201).json({ message: "OTP sent to your email. Please verify." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ---------------- Verify Signup OTP ----------------
export const verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    if (user.signupOtp !== hashedOtp || user.signupOtpExpire < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.signupOtp = undefined;
    user.signupOtpExpire = undefined;
    user.isVerified = true;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ---------------- Update Profile Image ----------------
export const updateProfileImage = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const profile = req.fileLocations ? req.fileLocations[0] : null;

    if (!profile) {
      return res.status(400).json({ message: "No profile image uploaded" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profile = profile;
    await user.save();

    res.status(200).json({
      message: "Profile image updated successfully",
      profile: user.profile,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ---------------- Login ----------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.isVerified) {
      return res.status(401).json({ message: "User not verified or not found" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user._id,user.email);
    const refreshToken = generateRefreshToken(user._id,user.email);

    // ✅ Save refresh token in DB (user or a separate model)
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNo: user.phoneNo,
      profile: user.profile,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: "Invalid or expired refresh token" });

      const accessToken = generateAccessToken(decoded.id,decoded.email);
      res.json({ accessToken });
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


// ---------------- Forgot Password ----------------
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    user.resetOtp = hashedOtp;
    user.resetOtpExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail(
      email,
      "Reset Password OTP - Color Scanning",
      `<p>Your OTP is: <b>${otp}</b></p>`
    );

    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ---------------- Reset Password ----------------
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    if (user.resetOtp !== hashedOtp || user.resetOtpExpire < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ---------------- Get Profile ----------------
export const getProfile = async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phoneNo: req.user.phoneNo,
    profile: req.user.profile,
  });
};

export const logoutUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.refreshToken = null;
    await user.save();

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
