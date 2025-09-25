import express from "express";
import {
  createSubscriptionAfterPayment,
  getUserSubscription,
  getUserSubscriptions,
  cancelSubscription,getAllUsersWithCurrentPlans,getAllUsersWithSubscriptionHistory,
  createPaymentIntent
} from "../controllers/Plan&Subscription Controllers/subscriptionController.js";
import { protect } from "../middelwares/auth.middleware.js";

const router = express.Router();

// Step 1: Create payment intent
router.post("/create-intent",protect, createPaymentIntent);

// Step 2: Activate subscription after successful payment
router.post("/activate",protect, createSubscriptionAfterPayment);

// Get active subscription
router.get("/active/:userId", getUserSubscription);

// Get all subscriptions (history)
router.get("/all/:userId", getUserSubscriptions);

// Cancel a subscription
router.post("/cancel/:subscriptionId", cancelSubscription);
router.get("/user-active-plan", getAllUsersWithCurrentPlans);
router.get("/user-plan-history", getAllUsersWithSubscriptionHistory);

export default router;
