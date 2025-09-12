
import express from "express";
import { getUserPayments ,getAllPayments} from "../controllers/Plan&Subscription Controllers/paymentController.js";

const router = express.Router();

router.get("/payment", getAllPayments);  // ✅ new route
router.get("/:userId", getUserPayments);  // ✅ new route
export default router;
