import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },
    stripePaymentIntentId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, required: true },
    paymentMethod: {
      type: mongoose.Schema.Types.Mixed,
    },
    receiptUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
