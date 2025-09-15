import express from "express";
import {
  signup,
  verifySignupOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfileImage,
  refreshAccessToken
} from "../controllers/userController/userAuth.js";
import { protect } from "../middelwares/auth.middleware.js";
import uploadToS3  from "../config/uploadToS3.js";

const router = express.Router();

router.post("/signup/request-otp",uploadToS3, signup);  
router.post("/signup/verify-otp", verifySignupOtp);    
router.put("/update-profile",protect,uploadToS3, updateProfileImage);    

router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);

router.post("/forgot-password", forgotPassword);       // send OTP
router.post("/reset-password", resetPassword);         // verify OTP + reset

router.get("/profile", protect, getProfile);

export default router;
