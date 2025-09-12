import express from "express";
import {
  getAllUsers,
  deleteUser
} from "../controllers/adminController/userController.js";

import { adminAuth, protect } from "../middelwares/auth.middleware.js";

const router = express.Router();    
router.post("/getUsers", adminAuth, getAllUsers);
router.delete("/deleteUser/:id", adminAuth, deleteUser);

export default router;
