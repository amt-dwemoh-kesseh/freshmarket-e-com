# FreshMart E-commerce Services

## 🚀 Quick Start Scripts

### Windows (Git Bash / MINGW)
```bash
# Start all services
./start-services.sh

# Stop all services
./stop-services.sh
```

### Windows (Command Prompt)
```cmd
# Start all services
start-all-services.bat

# Stop all services
stop-all-services.bat
```

### Linux/Mac (Shell Scripts)
```bash
# Make scripts executable (first time only)
chmod +x start-all-services.sh
chmod +x stop-all-services.sh

# Start all services
./start-all-services.sh

# Stop all services
./stop-all-services.sh
```

## 📋 Service Architecture

### Startup Order
1. **Event Broker Service** (Kafka) - Message queue
2. **Auth Service** (Port 3005) - User authentication
3. **Inventory Service** (Port 3003) - Product management
4. **Order Service** (Port 3001) - Order processing
5. **Payment Service** (Port 3002) - Payment processing
6. **Emailing Service** (Port 3004) - Notifications
7. **Frontend** (Port 5174) - React application

### Service URLs
- **Frontend**: http://localhost:5174
- **Auth Service**: http://localhost:3005
- **Inventory Service**: http://localhost:3003
- **Order Service**: http://localhost:3001
- **Payment Service**: http://localhost:3002
- **Emailing Service**: http://localhost:3004
- **Kafka UI**: http://localhost:8080

## 🔧 Manual Startup (Alternative)

If you prefer to start services individually:

```bash
# Terminal 1: Kafka
cd "Event Broker Service"
docker-compose up

# Terminal 2: Auth Service
cd "Auth Service"
npm run dev

# Terminal 3: Inventory Service
cd "Inventory Service"
npm run dev

# Terminal 4: Order Service
cd "Order Service"
npm run dev

# Terminal 5: Payment Service
cd "Payment Service"
npm run dev

# Terminal 6: Emailing Service
cd "Emailing Service"
npm run dev

# Terminal 7: Frontend
cd frontend
npm run dev
```

## 🧪 Testing the Image Upload Feature

### Using Postman

#### Test File Upload
```
POST http://localhost:3003/admin/products
Content-Type: multipart/form-data

Form Data:
- name: "Fresh Bananas"
- price: "1.99"
- stock: "50"
- category: "Fruits"
- image: [Select file from computer]
```

#### Test URL Upload
```
POST http://localhost:3003/admin/products
Content-Type: multipart/form-data

Form Data:
- name: "Premium Coffee"
- price: "12.99"
- stock: "25"
- category: "Beverages"
- imageUrl: "https://example.com/image.jpg"
```

## 📁 Project Structure

```
freshmart-ecommerce/
├── Auth Service/           # User authentication
├── Inventory Service/      # Product & inventory management
├── Order Service/          # Order processing
├── Payment Service/        # Payment processing
├── Emailing Service/       # Email notifications
├── Event Broker Service/   # Kafka message broker
├── frontend/               # React application
├── start-all-services.bat  # Windows startup script
├── stop-all-services.bat   # Windows shutdown script
├── start-all-services.sh   # Linux/Mac startup script
└── stop-all-services.sh    # Linux/Mac shutdown script
```

## 🔑 Environment Variables

Each service has its own `.env` file with required configuration:

- **Database URLs**
- **Kafka broker URLs**
- **JWT secrets**
- **Cloudinary credentials** (Inventory Service)
- **Email service credentials** (Emailing Service)

## 🐛 Troubleshooting

### Services Won't Start
1. Ensure all dependencies are installed: `npm install` in each service
2. Check that ports are available (3001-3005, 5174, 8080)
3. Verify Docker is running for Kafka
4. Check `.env` files have correct values

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Verify `DATABASE_URL` in each service's `.env`
3. Run `npx prisma migrate dev` if needed

### Kafka Connection Issues
1. Ensure Docker containers are running
2. Check `KAFKA_BROKERS` in `.env` files
3. Verify topic creation in Kafka logs

## 📞 Support

For issues with specific services, check the individual service README files or logs in the terminal windows.