import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
    },
    otp: {
      type: String,
    },
    role: {
      type: String,
      enum: "Admin",
    },
    refreshToken: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", AdminSchema);
export default Admin;
