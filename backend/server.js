import express from "express";
import cors from "cors";
import dns from "dns";
import "dotenv/config";

import connectDb from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";

import authRouter from "./routes/authRouter.js";
import profileRouter from "./routes/profileRouter.js";
import postRouter from "./routes/postRouter.js";

const app = express();

const PORT = process.env.PORT || 5000;

// DNS configuration
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.status(200).send("TasbirGunj API is working ✅");
});

app.use("/api/user", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/post", postRouter);
// Start server
const startServer = async () => {
  try {
    await connectDb();
    connectCloudinary();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
