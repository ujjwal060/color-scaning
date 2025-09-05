import express from "express";
import { adminLogin } from "../adminController/adminAuth.js";

const router = express.Router();

router.post("/admin-login", adminLogin);

export default router;
