import paymentModel from "../../models/paymentModel.js";

export const getUserPayments = async (req, res) => {
  try {
    const { userId } = req.params;

    const payments = await paymentModel.find({ user: userId })
      .populate("plan", "planName planPrice validityDuration")
      .populate("subscription", "_id startDate endDate isActive")
      .sort({ createdAt: -1 });

    if (!payments.length) {
      return res.status(404).json({
        success: false,
        message: "No payments found for this user",
      });
    }

    res.json({
      success: true,
      message: "User payment history fetched",
      payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user payments",
      error: error.message,
    });
  }
};
export const getAllPayments = async (req, res) => {
  try {

    const payments = await paymentModel.find()
      .populate("plan", "planName planPrice validityDuration")
      .populate("subscription", "_id startDate endDate isActive")
      .sort({ createdAt: -1 });

    if (!payments.length) {
      return res.status(404).json({
        success: false,
        message: "No payments found ",
      });
    }

    res.json({
      success: true,
      message: " payment history fetched",
      payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user payments",
      error: error.message,
    });
  }
};
