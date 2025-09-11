import authRouter from "./userAuthRoutes.js"
import adminRouter from "./admin.routes.js"
import adminUserRouter from "./adminUserRoutes.js"
import planRoutes from "./planRoutes.js"
import subscriptionRoutes from "./subscriptionRoutes.js"

import express from "express"
import { protect } from "../middelwares/auth.middleware.js"
const router=express()
router.use("/auth",authRouter)
router.use("/admin",adminRouter)
router.use("/admin/users",adminUserRouter)
router.use("/plan",protect,planRoutes)
router.use("/subscription",protect,subscriptionRoutes)

export default router