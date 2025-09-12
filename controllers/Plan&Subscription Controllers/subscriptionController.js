import Stripe from "stripe";
import Subscription from "../../models/subscriptions.model.js";
import SubscriptionPlan from "../../models/subscriptionPlan.Model.js";
import User from "../../models/userModels.js";
import Payment from "../../models/paymentModel.js"; // ✅ import payment model
import { loadConfig } from "../../config/loadConfig.js";

const config = await loadConfig();

const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// 1️⃣ Subscribe & Activate
export const subscribeAndActivate = async (req, res) => {
  try {
    console.log(config.STRIPE_SECRET_KEY, "secret");
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

    // Create PaymentIntent (Stripe test mode)
    // Create PaymentIntent (Stripe test mode)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.planPrice * 100, // cents
      currency: "usd",
      payment_method: "pm_card_visa", // test card
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: { userId, planId },
      expand: ["charges.data.payment_method_details"], // ✅ put it here
    });

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
        status: paymentIntent.status,
      });
    }

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

    const charge = paymentIntent.charges?.data[0];

    const payment = await Payment.create({
      user: userId,
      subscription: subscription._id,
      plan: plan._id,
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      paymentMethod: {
        id: paymentIntent.payment_method,
        type: charge?.payment_method_details?.type || null,
        brand: charge?.payment_method_details?.card?.brand || null,
        last4: charge?.payment_method_details?.card?.last4 || null,
      },
      receiptUrl: charge?.receipt_url || null,
    });

    res.status(201).json({
      success: true,
      message: "Subscription activated successfully",
      subscription,
      payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Subscription creation failed",
      error: error.message,
    });
  }
};

export const createSubscriptionAfterPayment = async (req, res) => {
  try {
    const { userId, planId, paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId,
      { expand: ["payment_method"] }
    );
    if (paymentIntent.status !== "succeeded") {
      return res
        .status(400)
        .json({ success: false, message: "Payment not completed" });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    }

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

    const charge = paymentIntent.charges?.data[0];
    const payment = await Payment.create({
      user: userId,
      subscription: subscription._id,
      plan: plan._id,
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      paymentMethod: {
        id: paymentIntent.payment_method,
        type: charge?.payment_method_details?.type,
        brand: charge?.payment_method_details?.card?.brand,
        last4: charge?.payment_method_details?.card?.last4,
      },
      receiptUrl: charge?.receipt_url,
    });

    res.status(201).json({
      success: true,
      message: "Subscription activated successfully",
      subscription,
      payment,
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

export const getAllUsersWithCurrentPlans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch paginated users
    const users = await User.find({}).skip(skip).limit(limit);

    // Fetch active subscriptions for these users
    const userIds = users.map((u) => u._id);
    const subscriptions = await Subscription.find({
      user: { $in: userIds },
      isActive: true,
    })
      .populate("plan", "planName planPrice validityDuration")
      .populate("user", "name email");

    // Map subscriptions by userId
    const activeMap = {};
    subscriptions.forEach((sub) => {
      activeMap[sub.user._id] = sub;
    });

    // Attach active subscription to each user
    const usersWithPlans = users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      activeSubscription: activeMap[user._id] || null,
    }));

    const totalUsers = await User.countDocuments({});

    res.json({
      success: true,
      message: "Users with active subscriptions fetched",
      page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
      users: usersWithPlans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getAllUsersWithSubscriptionHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch paginated users
    const users = await User.find({}).skip(skip).limit(limit);

    const userIds = users.map((u) => u._id);

    // Fetch all subscriptions for these users
    const subscriptions = await Subscription.find({
      user: { $in: userIds },
      isActive: false,
    })
      .populate("plan", "planName planPrice validityDuration")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    // Group subscriptions by user
    const userSubsMap = {};
    subscriptions.forEach((sub) => {
      const userId = sub.user._id.toString();
      if (!userSubsMap[userId]) userSubsMap[userId] = [];
      userSubsMap[userId].push(sub);
    });

    // Attach subscription history to each user
    const usersWithHistory = users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      subscriptions: userSubsMap[user._id] || [],
    }));

    const totalUsers = await User.countDocuments({});

    res.json({
      success: true,
      message: "Users with subscription history fetched",
      page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
      users: usersWithHistory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
