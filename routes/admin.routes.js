import express from "express";
import { registerAdmin, adminLogin, forgotPassword, verifyOtp, setPassword } from "../controllers/adminController/adminAuth.js";
import { adminAuth } from "../middelwares/auth.middleware.js";

const router = express.Router();

// ******************** Admin Auth ********************
router.post("/login", adminLogin);
router.post("/register", registerAdmin);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/set-password", adminAuth, setPassword);

export default router;
