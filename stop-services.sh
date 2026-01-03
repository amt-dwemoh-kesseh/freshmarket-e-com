#!/bin/bash

echo "========================================"
echo "Stopping FreshMart E-commerce Services"
echo "========================================"

echo ""
echo "Stopping all Node.js processes..."
if [ -f .service_pids ]; then
    while read pid; do
        if kill -0 $pid 2>/dev/null; then
            echo "Stopping process $pid"
            kill $pid
        fi
    done < .service_pids
    rm -f .service_pids
else
    # Fallback: kill all npm processes
    pkill -f "npm run dev" || true
fi

echo ""
echo "Stopping Docker containers..."
cd "Event Broker Service"
if command -v docker-compose &> /dev/null; then
    docker-compose down
else
    docker compose down
fi
cd ..

echo ""
echo "========================================"
echo "All services stopped successfully!"
echo "========================================"