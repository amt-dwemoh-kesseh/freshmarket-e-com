import { Kafka, Consumer } from "kafkajs";
import { PrismaClient } from "@prisma/client";

export async function startKafkaConsumer(kafka: Kafka, prisma: PrismaClient) {
  const consumer = kafka.consumer({ groupId: "inventory-service-group" });

  await consumer.connect();

  await consumer.subscribe({ topic: "payment-success", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value?.toString() || "{}");

        if (topic === "payment-success") {
          await handlePaymentSuccess(event, prisma);
        }
      } catch (error) {
        console.error("Error processing Kafka message:", error);
      }
    },
  });

  console.log("Inventory Service Kafka consumer started");
}

async function handlePaymentSuccess(event: any, prisma: PrismaClient) {
  const { orderId, items } = event;

  // Check if items are provided in the event
  if (!items || !Array.isArray(items)) {
    console.error(
      `No items found in payment-success event for order ${orderId}`
    );
    return;
  }

  // Deduct stock and increment soldCount for each item
  for (const item of items) {
    try {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          soldCount: { increment: item.quantity },
        },
      });
    } catch (error) {
      console.error(
        `Failed to update stock for product ${item.productId}:`,
        error
      );
    }
  }

  // Publish inventory-updated event
  // TODO: Implement producer

  console.log(`Stock updated for order ${orderId}`);
}
