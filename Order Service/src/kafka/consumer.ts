import { Kafka } from "kafkajs";
import { PrismaClient } from "@prisma/client";

export async function startKafkaConsumer(kafka: Kafka, prisma: PrismaClient) {
  const consumer = kafka.consumer({ groupId: "order-service-group" });

  await consumer.connect();

  await consumer.subscribe({ topic: "payment-success", fromBeginning: true });
  await consumer.subscribe({ topic: "payment-failed", fromBeginning: true });
  await consumer.subscribe({ topic: "inventory-updated", fromBeginning: true });
  await consumer.subscribe({ topic: "order-dispatched", fromBeginning: true });
  await consumer.subscribe({ topic: "order-completed", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value?.toString() || "{}");

        if (topic === "payment-success") {
          await handlePaymentSuccess(event, prisma);
        } else if (topic === "payment-failed") {
          await handlePaymentFailed(event, prisma);
        } else if (topic === "inventory-updated") {
          await handleInventoryUpdated(event, prisma);
        } else if (topic === "order-dispatched") {
          console.log(`Order ${event.orderId} dispatched`);
        } else if (topic === "order-completed") {
          console.log(`Order ${event.orderId} completed`);
        }
      } catch (error) {
        console.error("Error processing Kafka message:", error);
      }
    },
  });

  console.log("Order Service Kafka consumer started");
}

async function handlePaymentSuccess(event: any, prisma: PrismaClient) {
  const { orderId } = event;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "CONFIRMED",
      statusHistory: {
        create: {
          status: "CONFIRMED",
          message: "Order confirmed and being prepared",
        },
      },
    },
  });

  console.log(`Order ${orderId} confirmed`);
}

async function handlePaymentFailed(event: any, prisma: PrismaClient) {
  const { orderId, reason } = event;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      statusHistory: {
        create: {
          status: "CANCELLED",
          message: `Order cancelled: ${reason}`,
        },
      },
    },
  });

  console.log(`Order ${orderId} cancelled due to payment failure`);
}

async function handleInventoryUpdated(event: any, prisma: PrismaClient) {
  const { orderId } = event;

  // Could update status to DISPATCHED here, but for now, keep as CONFIRMED
  // Manual dispatch later

  console.log(`Inventory updated for order ${orderId}`);
}
