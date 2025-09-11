import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 🔹 Pre-validate hook: auto-calc endDate from plan.validityDuration
subscriptionSchema.pre("validate", async function (next) {
  if (this.isNew && this.plan) {
    const Plan = mongoose.model("SubscriptionPlan");
    const planDetails = await Plan.findById(this.plan);

    if (planDetails) {
      const end = new Date(this.startDate);
      end.setDate(end.getDate() + planDetails.validityDuration);
      this.endDate = end;
    }
  }
  next();
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
