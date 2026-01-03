import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { Kafka } from "kafkajs";
import orderRoutes from "./routes/orders";
import { startKafkaConsumer } from "./kafka/consumer";

const app = express();
const port = process.env.PORT || 3001;

const prisma = new PrismaClient();

const kafka = new Kafka({
  clientId: "order-service",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
});

app.use(cors());
app.use(express.json());

// Routes
app.use("/orders", orderRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "order-service" });
});

// Start server
app.listen(port, async () => {
  console.log(`Order Service listening on port ${port}`);

  // Create topics after server starts
  const admin = kafka.admin();
  await admin.connect();

  const topics = [
    { topic: "order-created", numPartitions: 1, replicationFactor: 1 },
    { topic: "payment-success", numPartitions: 1, replicationFactor: 1 },
    { topic: "payment-failed", numPartitions: 1, replicationFactor: 1 },
    { topic: "inventory-updated", numPartitions: 1, replicationFactor: 1 },
    { topic: "order-dispatched", numPartitions: 1, replicationFactor: 1 },
    { topic: "order-completed", numPartitions: 1, replicationFactor: 1 },
    { topic: "notification-requested", numPartitions: 1, replicationFactor: 1 },
  ];

  await admin.createTopics({
    topics,
    waitForLeaders: true,
  });

  await admin.disconnect();

  // Start Kafka consumer
  startKafkaConsumer(kafka, prisma);
});

export { prisma, kafka };
