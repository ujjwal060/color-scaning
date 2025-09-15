import authRouter from "./userAuthRoutes.js"
import adminRouter from "./admin.routes.js"
import adminUserRouter from "./adminUserRoutes.js"
import planRoutes from "./planRoutes.js"
import subscriptionRoutes from "./subscriptionRoutes.js"
import paymentRoute from "./paymentRoute.js"
import {getDashboardData} from "../controllers/dashboardData.js"

import express from "express"
import { adminAuth, protect } from "../middelwares/auth.middleware.js"
const router=express()
router.use("/auth",authRouter)
router.use("/admin",adminRouter)
router.use("/admin/users",adminUserRouter)
router.use("/plan",planRoutes)
router.use("/subscription",subscriptionRoutes)
router.use("/payments",adminAuth,paymentRoute)
router.use("/dashboard",adminAuth,getDashboardData)

export default router