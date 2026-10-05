import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDb from "./config/db.js";
import dns from "dns";
import authRouter from "./routes/authRouter.js";
const app = express();

dns.setServers(["0.0.0.0", "8.8.8.8"]);
app.use(express.json());
app.use(cors());

try {
  connectDb();
} catch (error) {
  console.log(error);
}

app.get("/", (req, res) => {
  res.send("Api is working ✅");
});
app.use("/api/user", authRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
