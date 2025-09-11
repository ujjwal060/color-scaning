import express from "express";
import {
  subscribeAndActivate,
  createSubscriptionAfterPayment,
  getUserSubscription,
  getUserSubscriptions,
  cancelSubscription,
} from "../controllers/Plan&Subscription Controllers/subscriptionController.js";

const router = express.Router();

// Step 1: Create payment intent
router.post("/subscribe", subscribeAndActivate);

// Confirm subscription after successful payment  ****not required in testing according to current flow***
router.post("/confirm", createSubscriptionAfterPayment);

// Get active subscription
router.get("/active/:userId", getUserSubscription);

// Get all subscriptions (history)
router.get("/all/:userId", getUserSubscriptions);

// Cancel a subscription
router.post("/cancel/:subscriptionId", cancelSubscription);

export default router;
