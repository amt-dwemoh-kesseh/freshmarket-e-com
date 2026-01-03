#!/bin/bash

echo "========================================"
echo "Starting FreshMart E-commerce Services"
echo "========================================"

# Function to start service in background
start_service() {
    local service_name=$1
    local service_dir=$2

    echo ""
    echo "Starting $service_name..."
    echo "================================"

    cd "$service_dir"
    npm run dev &

    # Store PID for later cleanup
    echo $! >> ../.service_pids

    cd ..
    sleep 3
}

# Clean up any existing PID file
rm -f .service_pids

echo ""
echo "Step 1: Starting Event Broker Service (Kafka)..."
echo "================================================"
cd "Event Broker Service"
# Use docker-compose or docker compose depending on version
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi
cd ..

echo "Waiting for Kafka to be ready..."
sleep 15

# Start all Node.js services
start_service "Auth Service" "Auth Service"
start_service "Inventory Service" "Inventory Service"
start_service "Order Service" "Order Service"
start_service "Payment Service" "Payment Service"
start_service "Emailing Service" "Emailing Service"

echo ""
echo "Step 7: Starting Frontend..."
echo "==========================="
cd frontend
npm run dev &
echo $! >> ../.service_pids
cd ..

echo ""
echo "========================================"
echo "All services started successfully!"
echo "========================================"
echo ""
echo "Service URLs:"
echo "- Frontend:     http://localhost:5174"
echo "- Auth Service: http://localhost:3005"
echo "- Inventory:    http://localhost:3003"
echo "- Order:        http://localhost:3001"
echo "- Payment:      http://localhost:3002"
echo "- Emailing:     http://localhost:3004"
echo "- Kafka UI:     http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all background processes
wait