import express from "express";
import {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  deletePlan,
} from "../controllers/Plan&Subscription Controllers/PlanControllers.js";
import { adminAuth } from "../middelwares/auth.middleware.js";

const router = express.Router();

router.post("/",adminAuth, createPlan);
router.get("/",adminAuth, getPlans);
router.get("/:id",adminAuth, getPlanById);
router.put("/:id",adminAuth, updatePlan);
router.delete("/:id",adminAuth, deletePlan);

export default router;
