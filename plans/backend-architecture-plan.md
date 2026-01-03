# Backend Microservices Architecture Plan

## Frontend Analysis Summary

### Pages/Screens

- **ProductCatalog**: Browse products with category/search/price filters
- **ProductDetails**: View individual product details
- **Checkout**: Multi-step (shipping → review → payment → complete)
- **OrderTracking**: Real-time order status with history and progress bar
- **AdminDashboard**: Inventory management and order analytics

### Required APIs

- `GET /products` - List products with filters
- `GET /products/:id` - Get single product
- `POST /orders` - Create new order
- `POST /orders/:id/process-payment` - Process payment for order
- `GET /orders/:id` - Get order details
- `GET /notifications` - Get user notifications
- `PUT /notifications/:id/read` - Mark notification as read
- `GET /inventory` - Get inventory data (admin)
- `GET /analytics/orders` - Get order analytics (admin)

### State Transitions

Order lifecycle: CREATED → PAYMENT_PENDING → PAYMENT_SUCCESS/PAYMENT_FAILED → CONFIRMED → DISPATCHED → COMPLETED

### Notification Expectations

- Order status updates
- Payment confirmations
- Dispatch notifications
- Currently implemented with polling (30s for notifications, 10s for order tracking)

## Service Architecture

### Services

- **Order Service** (Port: 3001)
  - Manages orders, status updates
  - APIs: createOrder, processPayment, getOrder
- **Payment Service** (Port: 3002)
  - Handles payment processing
  - No direct APIs (event-driven)
- **Inventory Service** (Port: 3003)
  - Manages products and stock
  - APIs: getProducts, getProduct, getInventory
- **Emailing Service** (Port: 3004)
  - Handles notifications and emails
  - APIs: getNotifications, markAsRead

### Communication Model

- **Frontend ↔ Services**: HTTP REST APIs
- **Services ↔ Services**: Apache Kafka (pub/sub only)

## Event-Driven Flow

```
1. Frontend → Order Service: POST /orders
   → Order Service: Create order (status: CREATED)
   → Publish: ORDER_CREATED

2. Frontend → Order Service: POST /orders/:id/process-payment
   → Order Service: Process payment synchronously
   → If success: Update status to PAYMENT_SUCCESS, Publish PAYMENT_SUCCESS
   → If failed: Update status to PAYMENT_FAILED, Publish PAYMENT_FAILED

3. Inventory Service ← PAYMENT_SUCCESS
   → Deduct stock
   → Publish: INVENTORY_UPDATED

4. Order Service ← INVENTORY_UPDATED
   → Update status to CONFIRMED

5. Emailing Service ← ORDER_CREATED, PAYMENT_SUCCESS, etc.
   → Send notifications

6. Order Service: Manual dispatch trigger (future)
   → Publish: ORDER_DISPATCHED
```

## Kafka Topics & Events

### Topics

- `order-created`
- `payment-success`
- `payment-failed`
- `inventory-updated`
- `order-dispatched`
- `notification-requested`

### Event Schemas

```typescript
// ORDER_CREATED
{
  orderId: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  shippingAddress: ShippingAddress;
}

// PAYMENT_SUCCESS
{
  orderId: string;
}

// PAYMENT_FAILED
{
  orderId: string;
  reason: string;
}

// INVENTORY_UPDATED
{
  orderId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

// NOTIFICATION_REQUESTED
{
  userId: string;
  type: 'ORDER' | 'PAYMENT' | 'DISPATCH';
  title: string;
  message: string;
  orderId?: string;
}
```

## Database Schemas (Prisma)

### Order Service

```prisma
model Order {
  id            String   @id @default(cuid())
  userId        String
  totalAmount   Float
  status        OrderStatus
  paymentStatus PaymentStatus
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  shippingAddress Json
  items         OrderItem[]
  statusHistory OrderStatusHistory[]
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Float
  order     Order   @relation(fields: [orderId], references: [id])
}

model OrderStatusHistory {
  id        String      @id @default(cuid())
  orderId   String
  status    OrderStatus
  message   String
  timestamp DateTime    @default(now())
  order     Order       @relation(fields: [orderId], references: [id])
}
```

### Inventory Service

```prisma
model Product {
  id          String   @id
  name        String
  description String
  price       Float
  stock       Int
  category    String
  imageUrl    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Emailing Service

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  title     String
  message   String
  orderId   String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### Payment Service

```prisma
model Payment {
  id            String        @id @default(cuid())
  orderId       String        @unique
  amount        Float
  status        PaymentStatus
  transactionId String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}
```

## Assumptions & Decisions

1. **Payment Processing**: Since frontend expects synchronous `processPayment`, Order Service handles payment simulation synchronously while publishing events for downstream services.

2. **No Shared Databases**: Each service has its own PostgreSQL database.

3. **Idempotent Consumers**: Kafka consumers will handle duplicate events gracefully.

4. **Error Handling**: Failed payments/inventory updates will trigger appropriate status changes and notifications.

5. **Analytics**: Order analytics aggregated from Order Service database (no separate analytics service).

6. **Real-time Updates**: Current polling implementation maintained; WebSocket could be added later if needed.

7. **Authentication**: Not implemented (assume userId from context).

8. **Stock Management**: Optimistic locking for concurrent inventory updates.

## Implementation Order

1. Set up Kafka infrastructure
2. Create service scaffolding (Node.js + TypeScript + Prisma)
3. Implement Inventory Service (products API)
4. Implement Order Service (order management + Kafka)
5. Implement Payment Service (Kafka consumers)
6. Implement Emailing Service (notifications + Kafka)
7. Test end-to-end flows
8. Add monitoring and health checks
