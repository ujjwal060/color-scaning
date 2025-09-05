import express from "express";
import {
  signup,
  verifySignupOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile
} from "../userController/userAuth.js";
import { protect } from "../middelwares/auth.middleware.js";
import uploadToS3  from "../config/uploadToS3.js";

const router = express.Router();

router.post("/signup/request-otp",uploadToS3, signup);  // step 1
router.post("/signup/verify-otp", verifySignupOtp);    // step 2

router.post("/login", loginUser);

router.post("/forgot-password", forgotPassword);       // send OTP
router.post("/reset-password", resetPassword);         // verify OTP + reset

router.get("/profile", protect, getProfile);

export default router;
