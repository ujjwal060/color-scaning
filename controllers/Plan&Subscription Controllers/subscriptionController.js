import Stripe from "stripe";
import Subscription from "../../models/subscriptions.model.js";
import SubscriptionPlan from "../../models/subscriptionPlan.Model.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export const subscribeAndActivate = async (req, res) => {
  try {
    const { userId, planId } = req.body;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.activeStatus) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or inactive plan" });
    }

    const existing = await Subscription.findOne({
      user: userId,
      isActive: true,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User already has an active subscription",
      });
    }

    // Create PaymentIntent and confirm immediately (testing mode)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.planPrice * 100, // in cents
      currency: "usd",
      payment_method: "pm_card_visa", // Stripe test card
      confirm: true, // auto-confirm for testing
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never", // prevent redirect errors
      },
      metadata: { userId, planId },
    });

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
        status: paymentIntent.status,
      });
    }

    // Create subscription in DB
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.validityDuration);

    const subscription = await Subscription.create({
      user: userId,
      plan: plan._id,
      startDate,
      endDate,
      isActive: true,
      stripePaymentIntentId: paymentIntent.id,
    });

    res.status(201).json({
      success: true,
      message: "Subscription activated successfully",
      subscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Subscription creation failed",
      error: error.message,
    });
  }
};
// 2️⃣ Confirm subscription after payment
export const createSubscriptionAfterPayment = async (req, res) => {
  try {
    const { userId, planId, paymentIntentId } = req.body;

    // Validate PaymentIntent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return res
        .status(400)
        .json({ success: false, message: "Payment not completed" });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan)
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.validityDuration);

    const subscription = await Subscription.create({
      user: userId,
      plan: plan._id,
      startDate,
      endDate,
      isActive: true,
      stripePaymentIntentId: paymentIntent.id,
    });

    res.status(201).json({
      success: true,
      message: "Subscription activated successfully",
      subscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Subscription creation failed",
      error: error.message,
    });
  }
};

// 3️⃣ Get active subscription
export const getUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscription = await Subscription.findOne({
      user: userId,
      isActive: true,
    }).populate("plan", "planName planPrice validityDuration");

    if (!subscription)
      return res
        .status(404)
        .json({ success: false, message: "No active subscription" });

    res.json({
      success: true,
      message: "Active subscription fetched",
      subscription,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// 4️⃣ Get all subscriptions (history)
export const getUserSubscriptions = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscriptions = await Subscription.find({ user: userId })
      .populate("plan", "planName planPrice validityDuration")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Subscription history fetched",
      subscriptions,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// 5️⃣ Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription)
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });

    subscription.isActive = false;
    await subscription.save();

    res.json({ success: true, message: "Subscription canceled successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
