import express from "express";
import {
  getAllUsers,
  deleteUser
} from "../controllers/adminController/userController.js";

import { protect } from "../middelwares/auth.middleware.js";

const router = express.Router();    
router.post("/getUsers", protect, getAllUsers);
router.delete("/deleteUser/:id", protect, deleteUser);

export default router;
