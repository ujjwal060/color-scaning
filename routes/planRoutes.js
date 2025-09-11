import express from "express";
import {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  deletePlan,
} from "../controllers/Plan&Subscription Controllers/PlanControllers.js";

const router = express.Router();

router.post("/", createPlan);
router.get("/", getPlans);
router.get("/:id", getPlanById);
router.put("/:id", updatePlan);
router.delete("/:id", deletePlan);

export default router;
