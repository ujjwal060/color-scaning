import SubscriptionPlan from "../../models/subscriptionPlan.Model.js";

// Create a new plan
export const createPlan = async (req, res) => {
  try {
    const { planName, validityDuration, planPrice } = req.body;

    const existing = await SubscriptionPlan.findOne({ planName });
    if (existing)
      return res.status(400).json({ success: false, message: "Plan already exists" });

    const plan = await SubscriptionPlan.create({ planName, validityDuration, planPrice });
    res.status(201).json({ success: true, message: "Plan created successfully", plan });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all plans
export const getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ activeStatus: true }).sort({ planPrice: 1 });
    res.json({ success: true, message: "Plans fetched successfully", plans });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get a single plan
export const getPlanById = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan)
      return res.status(404).json({ success: false, message: "Plan not found" });

    res.json({ success: true, message: "Plan fetched successfully", plan });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Update plan
export const updatePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan)
      return res.status(404).json({ success: false, message: "Plan not found" });

    res.json({ success: true, message: "Plan updated successfully", plan });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete plan
export const deletePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan)
      return res.status(404).json({ success: false, message: "Plan not found" });

    res.json({ success: true, message: "Plan deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
