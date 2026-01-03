import { Router } from "express";
import { prisma, kafka } from "../server";
import { publishEvent } from "../kafka/producer";

const router = Router();

// Middleware to extract user from request (assuming auth middleware sets req.user)
const getUserId = (req: any): string => {
  // If auth middleware is used, get from req.user
  if (req.user && req.user.userId) {
    return req.user.userId;
  }
  // Fallback for development/testing
  return "user-1";
};

// POST /orders - Create new order
router.post("/", async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    const userId = getUserId(req);

    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.product.price * item.quantity,
      0
    );

    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        status: "CREATED",
        paymentStatus: "PENDING",
        shippingAddress,
        items: {
          create: items.map((item: any) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
        statusHistory: {
          create: {
            status: "CREATED",
            message: "Order has been created",
          },
        },
      },
      include: {
        items: {
          include: {
            order: false, // Avoid circular
          },
        },
        statusHistory: true,
      },
    });

    // Publish ORDER_CREATED event
    await publishEvent(kafka, "order-created", {
      orderId: order.id,
      userId: order.userId,
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
    });

    res.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /orders/:id/process-payment - Process payment
router.post("/:id/process-payment", async (req, res) => {
  try {
    const { id } = req.params;

    // Simulate payment processing
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      // Get order with items to include in event
      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true },
      });

      // Update order status
      await prisma.order.update({
        where: { id },
        data: {
          status: "PAYMENT_SUCCESS",
          paymentStatus: "SUCCESS",
          statusHistory: {
            create: {
              status: "PAYMENT_SUCCESS",
              message: "Payment completed successfully",
            },
          },
        },
      });

      // Publish PAYMENT_SUCCESS with items for inventory update
      await publishEvent(kafka, "payment-success", {
        orderId: id,
        items:
          order?.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })) || [],
      });
    } else {
      // Update order status
      await prisma.order.update({
        where: { id },
        data: {
          status: "PAYMENT_FAILED",
          paymentStatus: "FAILED",
          statusHistory: {
            create: {
              status: "PAYMENT_FAILED",
              message: "Payment failed. Please try again.",
            },
          },
        },
      });

      // Publish PAYMENT_FAILED
      await publishEvent(kafka, "payment-failed", {
        orderId: id,
        reason: "Payment processing failed",
      });
    }

    res.json({
      success,
      message: success
        ? "Payment processed successfully"
        : "Payment failed. Please try again.",
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /orders/:id - Get order details
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Transform to match frontend types
    const transformedOrder = {
      id: order.id,
      userId: order.userId,
      items: order.items.map((item) => ({
        product: {
          id: item.productId,
          // TODO: Fetch product details from Inventory Service
          name: "Product Name", // Placeholder
          price: item.price,
        },
        quantity: item.quantity,
      })),
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      shippingAddress: order.shippingAddress,
      paymentStatus: order.paymentStatus,
      statusHistory: order.statusHistory.map((h) => ({
        status: h.status,
        timestamp: h.timestamp.toISOString(),
        message: h.message,
      })),
    };

    res.json(transformedOrder);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /orders - Get all orders (for admin)
router.get("/", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        statusHistory: {
          orderBy: { timestamp: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to match frontend types
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      userId: order.userId,
      items: order.items.map((item) => ({
        product: {
          id: item.productId,
          name: "Product Name", // Placeholder - frontend should fetch product details
          price: item.price,
        },
        quantity: item.quantity,
      })),
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      shippingAddress: order.shippingAddress,
      paymentStatus: order.paymentStatus,
      statusHistory: order.statusHistory.map((h) => ({
        status: h.status,
        timestamp: h.timestamp.toISOString(),
        message: h.message,
      })),
    }));

    res.json(transformedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /orders/:id/dispatch - Mark order as dispatched
router.patch("/:id/dispatch", async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, courier } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: "DISPATCHED",
        statusHistory: {
          create: {
            status: "DISPATCHED",
            message: `Order dispatched${courier ? ` via ${courier}` : ""}${
              trackingNumber ? ` (Tracking: ${trackingNumber})` : ""
            }`,
          },
        },
      },
      include: {
        items: true,
        statusHistory: true,
      },
    });

    // Publish order-dispatched event
    await publishEvent(kafka, "order-dispatched", {
      orderId: id,
      trackingNumber,
      courier,
    });

    res.json(order);
  } catch (error) {
    console.error("Error dispatching order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /orders/:id/deliver - Mark order as delivered
router.patch("/:id/deliver", async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: "COMPLETED",
        statusHistory: {
          create: {
            status: "COMPLETED",
            message: "Order delivered and completed successfully",
          },
        },
      },
      include: {
        items: true,
        statusHistory: true,
      },
    });

    // Publish order-completed event
    await publishEvent(kafka, "order-completed", {
      orderId: id,
      completedAt: new Date().toISOString(),
    });

    res.json(order);
  } catch (error) {
    console.error("Error delivering order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /analytics/orders - Get order analytics for admin
router.get("/analytics/orders", async (req, res) => {
  try {
    // Get total orders
    const totalOrders = await prisma.order.count();

    // Get successful orders (status COMPLETED)
    const successfulOrders = await prisma.order.count({
      where: { status: "COMPLETED" },
    });

    // Get failed payments (status PAYMENT_FAILED or CANCELLED)
    const failedPayments = await prisma.order.count({
      where: {
        OR: [{ status: "PAYMENT_FAILED" }, { status: "CANCELLED" }],
      },
    });

    // Get pending orders (status CREATED or PAYMENT_PENDING)
    const pendingOrders = await prisma.order.count({
      where: {
        OR: [{ status: "CREATED" }, { status: "PAYMENT_PENDING" }],
      },
    });

    // Calculate today's revenue (sum of totalAmount for COMPLETED orders today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const revenueResult = await prisma.order.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const revenueToday = revenueResult._sum.totalAmount || 0;

    // Calculate total revenue from all completed orders
    const totalRevenueResult = await prisma.order.aggregate({
      where: {
        status: "COMPLETED",
      },
      _sum: {
        totalAmount: true,
      },
    });

    const totalRevenue = totalRevenueResult._sum.totalAmount || 0;

    // Fetch total products count from Inventory Service
    let totalProducts = 0;
    try {
      const inventoryResponse = await fetch("http://localhost:3003/products");
      if (inventoryResponse.ok) {
        const products = (await inventoryResponse.json()) as any[];
        totalProducts = products.length;
      }
    } catch (error) {
      console.error("Failed to fetch products count:", error);
    }

    res.json({
      totalOrders,
      successfulOrders,
      failedPayments,
      pendingOrders,
      revenueToday,
      totalRevenue,
      totalProducts,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
