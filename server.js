import express from "express";
import routes from "./routes/index.routes.js";
import { loadConfig } from "./config/loadConfig.js";
import connectToDB from "./config/db.js";
import cors from "cors";
import "./controllers/subscriptionCleanup.js"

const app = express();
const config = await loadConfig();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

connectToDB();

app.listen(config.PORT, () => {
    console.log(`Server is up and running at PORT: ${config.PORT}`);
});
