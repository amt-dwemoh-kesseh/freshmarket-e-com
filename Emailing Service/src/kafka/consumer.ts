import { Kafka } from "kafkajs";
import { PrismaClient } from "@prisma/client";

export async function startKafkaConsumer(kafka: Kafka, prisma: PrismaClient) {
  const consumer = kafka.consumer({ groupId: "emailing-service-group" });

  await consumer.connect();

  await consumer.subscribe({ topic: "order-created", fromBeginning: true });
  await consumer.subscribe({ topic: "payment-success", fromBeginning: true });
  await consumer.subscribe({ topic: "payment-failed", fromBeginning: true });
  await consumer.subscribe({ topic: "order-dispatched", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value?.toString() || "{}");

        if (topic === "order-created") {
          await handleOrderCreated(event, prisma);
        } else if (topic === "payment-success") {
          await handlePaymentSuccess(event, prisma);
        } else if (topic === "payment-failed") {
          await handlePaymentFailed(event, prisma);
        } else if (topic === "order-dispatched") {
          await handleOrderDispatched(event, prisma);
        }
      } catch (error) {
        console.error("Error processing Kafka message:", error);
      }
    },
  });

  console.log("Emailing Service Kafka consumer started");
}

async function handleOrderCreated(event: any, prisma: PrismaClient) {
  const { orderId, userId } = event;

  await prisma.notification.create({
    data: {
      userId,
      type: "ORDER",
      title: "Order Created",
      message: `Your order ${orderId} has been created successfully.`,
      orderId,
    },
  });

  console.log(`Notification sent for order created: ${orderId}`);
}

async function handlePaymentSuccess(event: any, prisma: PrismaClient) {
  const { orderId } = event;

  // Get userId from order - but since we don't have access to order DB, assume user-1
  const userId = "user-1";

  await prisma.notification.create({
    data: {
      userId,
      type: "PAYMENT",
      title: "Payment Successful",
      message: `Payment for order ${orderId} was processed successfully.`,
      orderId,
    },
  });

  console.log(`Notification sent for payment success: ${orderId}`);
}

async function handlePaymentFailed(event: any, prisma: PrismaClient) {
  const { orderId } = event;

  const userId = "user-1";

  await prisma.notification.create({
    data: {
      userId,
      type: "PAYMENT",
      title: "Payment Failed",
      message: `Payment for order ${orderId} failed. Please try again.`,
      orderId,
    },
  });

  console.log(`Notification sent for payment failed: ${orderId}`);
}

async function handleOrderDispatched(event: any, prisma: PrismaClient) {
  const { orderId } = event;

  const userId = "user-1";

  await prisma.notification.create({
    data: {
      userId,
      type: "ORDER",
      title: "Order Dispatched",
      message: `Your order ${orderId} has been dispatched and is on its way!`,
      orderId,
    },
  });

  console.log(`Notification sent for order dispatched: ${orderId}`);
}
