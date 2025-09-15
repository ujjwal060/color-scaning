import User from "../models/userModels.js";
import Subscription from "../models/subscriptions.model.js";
import SubscriptionPlan from "../models/subscriptionPlan.Model.js";

export const getDashboardData = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Total Users
    const totalUsers = await User.countDocuments();

    // 2. Users with Active Subscriptions
    const activeSubsUsers = await Subscription.distinct("user", {
      isActive: true,
    });
    const usersWithActiveSubs = activeSubsUsers.length;

    // 3. Total Revenue
    const totalRevenueData = await Subscription.aggregate([
      {
        $lookup: {
          from: "subscriptionplans",
          localField: "plan",
          foreignField: "_id",
          as: "planDetails",
        },
      },
      { $unwind: "$planDetails" },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$planDetails.planPrice" },
        },
      },
    ]);
    const totalRevenue = totalRevenueData[0]?.totalRevenue || 0;

    // 4. Today's Revenue
    const todayRevenueData = await Subscription.aggregate([
      {
        $match: {
          startDate: { $gte: todayStart, $lte: todayEnd },
        },
      },
      {
        $lookup: {
          from: "subscriptionplans",
          localField: "plan",
          foreignField: "_id",
          as: "planDetails",
        },
      },
      { $unwind: "$planDetails" },
      {
        $group: {
          _id: null,
          todaysRevenue: { $sum: "$planDetails.planPrice" },
        },
      },
    ]);
    const todaysRevenue = todayRevenueData[0]?.todaysRevenue || 0;

    // 5. Last 5 Subscriptions → only select necessary fields
    const lastFiveSubs = await Subscription.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email") // only get name + email
      .populate("plan", "planName planPrice ") // only get name + price
      .lean();

    // 6. Plan-wise Subscription Data
    const planWiseData = await Subscription.aggregate([
      {
        $lookup: {
          from: "subscriptionplans",
          localField: "plan",
          foreignField: "_id",
          as: "planDetails",
        },
      },
      { $unwind: "$planDetails" },
      {
        $group: {
          _id: "$planDetails.planName",
          count: { $sum: 1 },
          revenue: { $sum: "$planDetails.planPrice" },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        usersWithActiveSubs,
        totalRevenue,
        todaysRevenue,
        lastFiveSubs,
        planWiseData,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
