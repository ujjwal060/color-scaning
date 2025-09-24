import SubscriptionPlan from "../../models/subscriptionPlan.Model.js";

// Create a new plan
export const createPlan = async (req, res) => {
  try {
    const { planName, billingCycle, planPrice } = req.body;

    // Validate billingCycle
    const allowedCycles = ["Monthly", "Quarterly", "Yearly"];
    if (!allowedCycles.includes(billingCycle)) {
      return res.status(400).json({
        success: false,
        message: "Invalid billingCycle. Must be Monthly, Quarterly, or Yearly",
      });
    }

    const existing = await SubscriptionPlan.findOne({ planName });
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Plan already exists" });

    const plan = await SubscriptionPlan.create({
      planName,
      billingCycle,
      planPrice,
    });

    res.status(201).json({
      success: true,
      message: "Plan created successfully",
      data: plan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all active plans
export const getActivePlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ activeStatus: true }).sort({
      planPrice: 1,
    });

    res.json({
      success: true,
      message: "Active plans fetched successfully",
      data: plans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all plans with pagination
export const getAllPlans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // sorting params
    const sortBy = req.query.sortBy || "createdAt"; // default: createdAt
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1; // default: desc

    // only allow valid sort fields
    const validSortFields = [
      "planName",
      "planPrice",
      "validityDuration",
      "createdAt",
    ];
    const sortField = validSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const plans = await SubscriptionPlan.find()
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    const totalPlans = await SubscriptionPlan.countDocuments();

    res.json({
      success: true,
      message: "Plans fetched successfully",
      data: {
        page,
        totalPages: Math.ceil(totalPlans / limit),
        totalPlans,
        sortBy: sortField,
        sortOrder: sortOrder === 1 ? "asc" : "desc",
        plans,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get a single plan
export const getPlanById = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan)
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });

    res.json({
      success: true,
      message: "Plan fetched successfully",
      data: plan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update plan
export const updatePlan = async (req, res) => {
  try {
    const { billingCycle } = req.body;

    if (billingCycle) {
      const allowedCycles = ["Monthly", "Quarterly", "Yearly"];
      if (!allowedCycles.includes(billingCycle)) {
        return res.status(400).json({
          success: false,
          message: "Invalid billingCycle. Must be Monthly, Quarterly, or Yearly",
        });
      }
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    if (!plan)
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });

    res.json({
      success: true,
      message: "Plan updated successfully",
      data: plan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete plan
export const deletePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan)
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });

    res.json({
      success: true,
      message: "Plan deleted successfully",
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
