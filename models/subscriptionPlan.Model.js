import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    validityDuration: {
      type: Number, // in days (e.g., 30, 180, 365)
      required: true,
    },
    planPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    activeStatus: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const SubscriptionPlan =
  mongoose.models.SubscriptionPlan ||
  mongoose.model("SubscriptionPlan", planSchema);

export default SubscriptionPlan;
