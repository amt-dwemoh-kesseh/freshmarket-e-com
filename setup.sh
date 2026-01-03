#!/bin/bash

echo "=========================================="
echo "Setting up E-Commerce Microservices"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm first."
    exit 1
fi

echo "✅ All prerequisites are installed"
echo ""

# Pull Kafka Docker images
echo "=========================================="
echo "Pulling Kafka Docker images..."
echo "=========================================="
cd "Event Broker Service" || exit 1
docker-compose pull
if [ $? -eq 0 ]; then
    echo "✅ Kafka Docker images pulled successfully"
else
    echo "❌ Failed to pull Kafka Docker images"
    exit 1
fi
cd ..
echo ""

# Install dependencies for all services
SERVICES=("Auth Service" "Emailing Service" "Inventory Service" "Order Service" "Payment Service" "frontend")

for service in "${SERVICES[@]}"; do
    echo "=========================================="
    echo "Installing dependencies for $service..."
    echo "=========================================="
    
    if [ -d "$service" ]; then
        cd "$service" || exit 1
        
        if [ -f "package.json" ]; then
            npm install
            if [ $? -eq 0 ]; then
                echo "✅ Dependencies installed for $service"
            else
                echo "❌ Failed to install dependencies for $service"
                exit 1
            fi
        else
            echo "⚠️  No package.json found in $service"
        fi
        
        cd ..
    else
        echo "⚠️  Directory $service not found"
    fi
    echo ""
done

echo "=========================================="
echo "✅ Setup completed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Configure .env files for each service"
echo "2. Start Kafka: cd 'Event Broker Service' && docker-compose up -d"
echo "3. Run database migrations for each service"
echo "4. Start all services using ./start-services.sh"
echo ""
