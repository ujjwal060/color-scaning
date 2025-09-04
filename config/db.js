import mongoose from "mongoose";
import { loadConfig } from "../config/loadConfig.js";

const config = await loadConfig();

const connectToDB = async () => {
  try {
    const connection = await mongoose.connect(config.DB_URI);
    console.log("✅ MongoDB connected successfully",);
  } catch (error) {
    console.error(" Error while connecting to DB:", error.message);
    process.exit(1); 
  }
};

export default connectToDB;
