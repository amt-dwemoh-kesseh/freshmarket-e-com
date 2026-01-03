import { Kafka } from "kafkajs";

export async function publishEvent(kafka: Kafka, topic: string, message: any) {
  const producer = kafka.producer();

  await producer.connect();

  await producer.send({
    topic,
    messages: [
      {
        value: JSON.stringify(message),
      },
    ],
  });

  await producer.disconnect();
}
