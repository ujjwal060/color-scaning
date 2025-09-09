import authRouter from "./userAuthRoutes.js"
import adminRouter from "./admin.routes.js"
import adminUserRouter from "./adminUserRoutes.js"

import express from "express"
const router=express()
router.use("/auth",authRouter)
router.use("/admin",adminRouter)
router.use("/admin/users",adminUserRouter)

export default router