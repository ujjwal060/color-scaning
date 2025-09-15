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

      switch (planDetails.billingCycle) {
        case "Monthly":
          end.setMonth(end.getMonth() + 1); // add 1 month
          break;
        case "Quarterly":
          end.setMonth(end.getMonth() + 3); // add 3 months
          break;
        case "Yearly":
          end.setFullYear(end.getFullYear() + 1); // add 1 year
          break;
      }

      this.endDate = end;
    }
  }
  next();
});


const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
