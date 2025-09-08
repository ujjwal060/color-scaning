import express from "express";
import { registerAdmin, adminLogin, forgotPassword, verifyOtp, setPassword } from "../adminController/adminAuth.js";
import { adminAuth } from "../middelwares/auth.middleware.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/register", registerAdmin);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/set-password", adminAuth, setPassword);

export default router;
