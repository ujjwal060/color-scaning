import cron from "node-cron";
import Subscription from "../models/subscriptions.model.js";

cron.schedule("0 0 * * *", async () => {
  try {
    console.log("🔄 Running subscription cleanup job...");

    const now = new Date();

    const result = await Subscription.updateMany(
      { endDate: { $lt: now }, isActive: true },
      { $set: { isActive: false } }
    );

    console.log(`✅ Expired subscriptions deactivated: ${result.modifiedCount}`);
  } catch (err) {
    console.error("❌ Error in subscription cleanup job:", err);
  }
},);
