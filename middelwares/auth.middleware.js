import jwt from "jsonwebtoken";
import User from "../models/userModels.js";
import Admin from "../models/adminModel.js";
import { loadConfig } from "../config/loadConfig.js";

const config = await loadConfig();

/**
 * Middleware for normal users
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token" });
};

/**
 * Middleware for admins only
 */
export const adminAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET);

      const admin = await Admin.findById(decoded.id).select("-password");
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      req.admin = admin;
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token" });
};
