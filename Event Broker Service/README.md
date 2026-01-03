# Event Broker Service - Apache Kafka (KRaft Mode)

This directory contains the Docker setup for Apache Kafka in KRaft mode (without Zookeeper) as the event broker for the microservices architecture.

## Setup

1. Ensure Docker and Docker Compose are installed.

2. Start the Kafka broker:

   ```bash
   docker-compose up -d
   ```

3. Verify Kafka is running:
   ```bash
   docker-compose ps
   ```

## Configuration

- **Kafka**: Port 9092 (external)
- **Controller**: Port 9093 (internal)
- **JMX**: Port 9101 for monitoring
- **Mode**: KRaft (Kafka without Zookeeper)

## Topics

The microservices will create the following topics automatically:

- `order-created`
- `payment-success`
- `payment-failed`
- `inventory-updated`
- `order-dispatched`
- `notification-requested`

## Stopping

To stop the broker:

```bash
docker-compose down
```

To stop and remove volumes:

```bash
docker-compose down -v
```
