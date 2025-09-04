import express from "express"
import routes from "./routes/index.routes.js"
import { loadConfig } from "./config/loadConfig.js"
import connectToDB from "./config/db.js"
const app=express()
const config =await loadConfig()

app.use(express.json())
app.use("/api",routes)
connectToDB()
app.listen(config.PORT,()=>{
    console.log(`serveer is up and running at PORT: ${config.PORT}`)
})