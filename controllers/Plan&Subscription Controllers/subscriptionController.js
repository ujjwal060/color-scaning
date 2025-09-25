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

// POST /api/payments/create-intent
export const createPaymentIntent = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId=req.user.id

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.activeStatus) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive plan",
      });
    }

    // 💡 check if user already subscribed
    const existing = await Subscription.findOne({ user: userId, isActive: true });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User already has an active subscription",
      });
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.planPrice * 100, // cents
      currency: "usd",
      metadata: { userId, planId },
    });

    res.status(200).json({
  success: true,
  data: {
    clientSecret: paymentIntent.client_secret, 
    paymentIntentId: paymentIntent.id,
  },
});

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create PaymentIntent",
      error: error.message,
    });
  }
};

// 2️⃣ Create Subscription After Payment
export const createSubscriptionAfterPayment = async (req, res) => {
  try {
    const { userId, planId, paymentIntentId } = req.body;

    // Retrieve intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["payment_method", "charges.data.payment_method_details"],
    });

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // Subscription validity
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.validityDuration);

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
        type: charge?.payment_method_details?.type,
        brand: charge?.payment_method_details?.card?.brand,
        last4: charge?.payment_method_details?.card?.last4,
      },
      receiptUrl: charge?.receipt_url,
    });

    res.status(201).json({
      success: true,
      message: "Subscription activated successfully",
      data: { subscription, payment },
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

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription",
        data: null,
      });
    }

    res.json({
      success: true,
      message: "Active subscription fetched",
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      data: null,
      error: error.message,
    });
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
      data: subscriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      data: null,
      error: error.message,
    });
  }
};

// 5️⃣ Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
        data: null,
      });
    }

    subscription.isActive = false;
    subscription.endDate = new Date();
    await subscription.save();

    res.json({
      success: true,
      message: "Subscription canceled successfully",
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      data: null,
      error: error.message,
    });
  }
};

// 6️⃣ Get all users with current plans
export const getAllUsersWithCurrentPlans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({}).skip(skip).limit(limit);
    const userIds = users.map((u) => u._id);

    const subscriptions = await Subscription.find({
      user: { $in: userIds },
      isActive: true,
    })
      .populate("plan", "planName planPrice validityDuration")
      .populate("user", "name email");

    const activeMap = {};
    subscriptions.forEach((sub) => {
      activeMap[sub.user._id] = sub;
    });

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
      data: {
        page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        users: usersWithPlans,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      data: null,
      error: error.message,
    });
  }
};

// 7️⃣ Get all users with subscription history
export const getAllUsersWithSubscriptionHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({}).skip(skip).limit(limit);
    const userIds = users.map((u) => u._id);

    const subscriptions = await Subscription.find({
      user: { $in: userIds },
      isActive: false,
    })
      .populate("plan", "planName planPrice validityDuration")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    const userSubsMap = {};
    subscriptions.forEach((sub) => {
      const userId = sub.user._id.toString();
      if (!userSubsMap[userId]) userSubsMap[userId] = [];
      userSubsMap[userId].push(sub);
    });

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
      data: {
        page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        users: usersWithHistory,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      data: null,
      error: error.message,
    });
  }
};
