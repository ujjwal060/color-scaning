import express from "express";
import {
  getAllUsers,
} from "../adminController/userController.js";

import { protect } from "../middelwares/auth.middleware.js";

const router = express.Router();    
router.post("/getUsers", protect, getAllUsers);

export default router;
