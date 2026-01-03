import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth";

const app = express();
const port = process.env.PORT || 3005;

const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "auth-service" });
});

app.listen(port, () => {
  console.log(`Auth Service listening on port ${port}`);
});

export { prisma };
