import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import adminModel from "../../models/adminModel.js";
import { loadConfig } from "../../config/loadConfig.js";
import sendEmail from "../../config/sendmail.js";


const config = await loadConfig();

const registerAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await adminModel.findOne({});
    if (existing) {
      return res
        .status(400)
        .json({ message: "Admin already exists. Only one admin allowed." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new adminModel({
      email,
      password: hashedPassword,
    });

    await admin.save();

    return res
      .status(201)
      .json({ status: 201, success: true, message: "Admin registered successfully" });
  } catch (err) {
    res.status(500).json({status:500, message: err.message });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.status(404).json({ status: 404, message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password || "");
    if (!isMatch) {
      return res.status(400).json({ status: 400, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: "admin" },
      config.ACCESS_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      status: 200,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
}

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.status(404).json({ status: 404, message: "Admin not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    admin.otp = otp;
    admin.otpExpires = Date.now() + 5 * 60 * 1000;
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
}

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.status(404).json({ status: 404, message: "Admin not found" });
    }

    if (admin.otp !== otp || admin.otpExpires < Date.now()) {
      return res.status(400).json({ status: 400, message: "Invalid or expired OTP" });
    }

    admin.otp = undefined;
    admin.otpExpires = undefined;
    await admin.save();

    const resetToken = jwt.sign({ id: admin._id, email: admin.email }, config.ACCESS_TOKEN_SECRET, {
      expiresIn: "5m",
    });

    return res.json({
      status: 200,
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
}

const setPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const adminId = req.user.id;

    const admin = await adminModel.findById(adminId);
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
}

export { registerAdmin, adminLogin, forgotPassword, verifyOtp, setPassword };