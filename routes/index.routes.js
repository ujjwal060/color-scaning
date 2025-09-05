import authRouter from "./userAuthRoutes.js"
import adminRouter from "./admin.routes.js"
import express from "express"
const router=express()
router.use("/auth",authRouter)
router.use("/admin",adminRouter)
export default router