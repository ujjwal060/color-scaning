import User from "../../models/userModels.js";
import jwt from "jsonwebtoken";
import { loadConfig } from "../../config/loadConfig.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendEmail from "../../config/sendmail.js";
import {
  registrationOtpTemp,
  verificationSuccessTemp,
} from "../../templates/templates.js";
import { generateOTP } from "../../utils/generateOTP.js";

const config = await loadConfig();

const generateAccessToken = (id, email) => {
  return jwt.sign({ id, email }, config.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (id, email) => {
  return jwt.sign({ id, email }, config.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

export const resendSignupOtp = async (user, email) => {
  try {
    const { otp, expiry } = generateOTP();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    user.signupOtp = hashedOtp;
    user.signupOtpExpire = expiry;
    await user.save();

    const { subject, body } = registrationOtpTemp(user.name, otp);
    const otpSent = await sendEmail(email, subject, body);

    if (!otpSent.success) {
      return {
        success: false,
        message: otpSent.message,
      };
    }

    return {
      success: true,
      message: "OTP has been sent successfully to your email.",
    };
  } catch (error) {
    console.error("Error in resendSignupOtp:", error);
    return {
      success: false,
      message: "Failed to resend OTP. Please try again later.",
    };
  }
};

// ---------------- Signup ----------------

export const signup = async (req, res) => {
  try {
    const { name, email, password, phoneNo } = req.body;
    const profile = req.fileLocations?.[0];

    // ✅ Required field validation
    if (!name || !email || !password || !phoneNo) {
      return res.status(400).json({
        status: 400,
        message: "All fields (name, email, password, phoneNo) are required.",
      });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNo }] });

    if (existingUser) {
      if (existingUser.isVerified) {
        // Already verified → block signup
        return res.status(400).json({
          status: 400,
          message:
            existingUser.email === email
              ? `Email ${email} is already registered. Please login or reset your password.`
              : `Phone number ${phoneNo} is already registered. Please login or reset your password.`,
        });
      } else {
        // Not verified → regenerate OTP & resend
        const { otp, expiry } = generateOTP();
        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

        existingUser.signupOtp = hashedOtp;
        existingUser.signupOtpExpire = expiry;
        await existingUser.save();

        const { subject, body } = registrationOtpTemp(name, otp);
        const otpSent = await sendEmail(email, subject, body);

        if (!otpSent.success) {
          return res.status(500).json({
            status: 500,
            message: otpSent.message,
          });
        }

        return res.status(200).json({
          status: 200,
          message: "OTP re-sent. Please verify your account.",
        });
      }
    }

    // ✅ Create new user
    const { otp, expiry } = generateOTP();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    await User.create({
      name,
      email,
      phoneNo,
      password,
      profile,
      signupOtp: hashedOtp,
      signupOtpExpire: expiry,
      isVerified: false,
    });

    // Send OTP email
    const { subject, body } = registrationOtpTemp(name, otp);
    const otpSent = await sendEmail(email, subject, body);

    if (!otpSent.success) {
      return res.status(500).json({
        status: 500,
        message: otpSent.message,
      });
    }

    res.status(201).json({
      status: 201,
      message: "User registered successfully. Please verify your email.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: error.message || "Server Error",
    });
  }
};

// ---------------- Verify Signup OTP ----------------

export const verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // hash provided OTP
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    if (user.signupOtp !== hashedOtp || user.signupOtpExpire < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // mark as verified
    user.signupOtp = undefined;
    user.signupOtpExpire = undefined;
    user.isVerified = true;
    await user.save();

    const { subject, body } = verificationSuccessTemp(user.name);
    await sendEmail(user.email, subject, body);

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ---------------- Update Profile Image ----------------
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const profile = req.fileLocations ? req.fileLocations[0] : null;

    const { name, email, phoneNo } = req.body;

    const updateData = {};
    if (profile) updateData.profile = profile;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phoneNo) updateData.phoneNo = phoneNo;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No data provided to update" });
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    // if (!profile) {
    //   return res.status(400).json({ message: "No profile image uploaded" });
    // }

    res.status(200).json({
      message: "Profile image updated successfully",
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const resendSignupOtpController = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user)
    return res.status(404).json({ status: 404, message: "User not found" });

  if (user.isVerified)
    return res
      .status(400)
      .json({ status: 400, message: "User already verified" });

  const otpResult = await resendSignupOtp(user, email);
  if (!otpResult.success) {
    return res.status(500).json({ status: 500, message: otpResult.message });
  }

  return res.status(200).json({
    status: 200,
    message: "OTP has been re-sent successfully.",
  });
};

// ---------------- Login ----------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        message: "Email and password are required",
      });
    }

    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 404,
        message:
          "User not found with the provided email. Please check and try again.",
      });
    }

    // 3. Check verification
    if (!user.isVerified) {
      const otpResult = await resendSignupOtp(user, email);
      if (!otpResult.success) {
        return res.status(500).json({
          status: 500,
          message: otpResult.message,
        });
      }

      return res.status(200).json({
        status: 200,
        message:
          "Your account is not verified. OTP has been re-sent to your email.",
      });
    }

    // 4. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 401,
        message: "The password you entered is incorrect. Please try again.",
      });
    }

    // 5. Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email },
      config.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, email: user.email },
      config.REFRESH_TOKEN_SECRET,
      { expiresIn: "30d" }
    );

    // 6. Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    // 7. Return response
    return res.status(200).json({
      status: 200,
      message: "Login successful",
      data: {
        token: { accessToken, refreshToken },
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phoneNo: user.phoneNo,
          profile: user.profile,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server Error",
      error: error.message,
    });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ message: "No refresh token provided" });

    const user = await User.findOne({ refreshToken });
    if (!user)
      return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err)
        return res
          .status(403)
          .json({ message: "Invalid or expired refresh token" });

      const accessToken = generateAccessToken(decoded.id, decoded.email);
      res.json({ success: true, message: "data fetched", data: accessToken });
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
    status: 200,
    message: " Profile fetched successfully",
    data: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phoneNo: req.user.phoneNo,
      profile: req.user.profile,
    },
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
