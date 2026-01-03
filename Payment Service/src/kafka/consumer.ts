import { Kafka } from "kafkajs";
import { PrismaClient } from "@prisma/client";
import { publishEvent } from "./producer";

export async function startKafkaConsumer(kafka: Kafka, prisma: PrismaClient) {
  const consumer = kafka.consumer({ groupId: "payment-service-group" });

  await consumer.connect();

  await consumer.subscribe({ topic: "order-created", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value?.toString() || "{}");

        if (topic === "order-created") {
          await handleOrderCreated(event, prisma, kafka);
        }
      } catch (error) {
        console.error("Error processing Kafka message:", error);
      }
    },
  });

  console.log("Payment Service Kafka consumer started");
}

async function handleOrderCreated(
  event: any,
  prisma: PrismaClient,
  kafka: Kafka
) {
  const { orderId, userId, items, totalAmount } = event;

  // Create payment record
  await prisma.payment.create({
    data: {
      orderId,
      amount: totalAmount,
      status: "PENDING",
    },
  });

  // Simulate payment processing
  const success = Math.random() > 0.1; // 90% success rate

  if (success) {
    // Update payment status
    await prisma.payment.update({
      where: { orderId },
      data: {
        status: "SUCCESS",
        transactionId: `txn_${Date.now()}`,
      },
    });

    // Publish PAYMENT_SUCCESS
    await publishEvent(kafka, "payment-success", { orderId });
    console.log(`Payment successful for order ${orderId}`);
  } else {
    // Update payment status
    await prisma.payment.update({
      where: { orderId },
      data: {
        status: "FAILED",
      },
    });

    // Publish PAYMENT_FAILED
    await publishEvent(kafka, "payment-failed", {
      orderId,
      reason: "Payment processing failed",
    });
    console.log(`Payment failed for order ${orderId}`);
  }
}
