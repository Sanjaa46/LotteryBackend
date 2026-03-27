import express from "express";
import authRoutes from "./routes/auth";

const app = express()
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/auth", authRoutes);

app.get('/health', (req, res) => {
    res.send({
        status: 'ok'
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
})