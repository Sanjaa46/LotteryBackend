import "./loadEnv.js";
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js"
import apiRoutes from "./routes/api.js";
import helmet from 'helmet';
import { limiter } from "./middleware/rateLimiter.js";

const app = express()
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());
app.use(limiter);
app.use(cookieParser());
app.set('trust proxy', 1);
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", apiRoutes);

app.get('/test', async (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
})