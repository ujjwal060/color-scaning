import express from "express";
import {
  createPlan,
  getActivePlans,getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
} from "../controllers/Plan&Subscription Controllers/PlanControllers.js";
import { adminAuth } from "../middelwares/auth.middleware.js";

const router = express.Router();

router.post("/",adminAuth, createPlan);
router.get("/active", getActivePlans);
router.get("/all", getAllPlans);
router.get("/:id",adminAuth, getPlanById);
router.put("/:id",adminAuth, updatePlan);
router.delete("/:id",adminAuth, deletePlan);

export default router;
