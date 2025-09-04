import authRouter from "./userAuthRoutes.js"
import express from "express"
const router=express()
router.use("/auth",authRouter)
export default router