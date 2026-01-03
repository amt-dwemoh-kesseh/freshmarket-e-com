import {
  Product,
  Order,
  Notification,
  InventoryItem,
  OrderAnalytics,
  ShippingAddress,
  CartItem,
  User,
  AuthResponse,
} from "../types";

const API_BASE_INVENTORY = "http://localhost:3003";
const API_BASE_ORDER = "http://localhost:3001";
const API_BASE_EMAILING = "http://localhost:3004";
const API_BASE_AUTH =
  import.meta.env.VITE_AUTH_SERVICE_URL || "http://localhost:3005";

export const api = {
  async getProducts(filters?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<Product[]> {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== "all")
      params.append("category", filters.category);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.minPrice !== undefined)
      params.append("minPrice", filters.minPrice.toString());
    if (filters?.maxPrice !== undefined)
      params.append("maxPrice", filters.maxPrice.toString());

    const response = await fetch(`${API_BASE_INVENTORY}/products?${params}`);
    if (!response.ok) throw new Error("Failed to fetch products");
    return response.json();
  },

  async getProduct(id: string): Promise<Product | null> {
    const response = await fetch(`${API_BASE_INVENTORY}/products/${id}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Failed to fetch product");
    return response.json();
  },

  async createOrder(
    items: CartItem[],
    shippingAddress: ShippingAddress
  ): Promise<Order> {
    const response = await fetch(`${API_BASE_ORDER}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, shippingAddress }),
    });
    if (!response.ok) throw new Error("Failed to create order");
    return response.json();
  },

  async processPayment(
    orderId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(
      `${API_BASE_ORDER}/orders/${orderId}/process-payment`,
      {
        method: "POST",
      }
    );
    if (!response.ok) throw new Error("Failed to process payment");
    return response.json();
  },

  async getOrder(orderId: string): Promise<Order | null> {
    const response = await fetch(`${API_BASE_ORDER}/orders/${orderId}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Failed to fetch order");
    const data = await response.json();

    // Transform backend response to match frontend types
    return {
      ...data,
      items: data.items.map((item: any) => ({
        product: {
          id: item.productId,
          name: "Product Name", // TODO: Fetch from inventory service
          price: item.price,
        },
        quantity: item.quantity,
      })),
    };
  },

  async getAllOrders(): Promise<Order[]> {
    const response = await fetch(`${API_BASE_ORDER}/orders`);
    if (!response.ok) throw new Error("Failed to fetch orders");
    return response.json();
  },

  async dispatchOrder(
    orderId: string,
    trackingNumber?: string,
    courier?: string
  ): Promise<Order> {
    const response = await fetch(
      `${API_BASE_ORDER}/orders/${orderId}/dispatch`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber, courier }),
      }
    );
    if (!response.ok) throw new Error("Failed to dispatch order");
    return response.json();
  },

  async deliverOrder(orderId: string): Promise<Order> {
    const response = await fetch(
      `${API_BASE_ORDER}/orders/${orderId}/deliver`,
      {
        method: "PATCH",
      }
    );
    if (!response.ok) throw new Error("Failed to deliver order");
    return response.json();
  },

  async getNotifications(): Promise<Notification[]> {
    const response = await fetch(`${API_BASE_EMAILING}/notifications`);
    if (!response.ok) throw new Error("Failed to fetch notifications");
    return response.json();
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_EMAILING}/notifications/${notificationId}/read`,
      {
        method: "PUT",
      }
    );
    if (!response.ok) throw new Error("Failed to mark notification as read");
  },

  async getInventory(): Promise<InventoryItem[]> {
    const response = await fetch(`${API_BASE_INVENTORY}/inventory`);
    if (!response.ok) throw new Error("Failed to fetch inventory");
    return response.json();
  },

  async getOrderAnalytics(): Promise<OrderAnalytics> {
    const response = await fetch(`${API_BASE_ORDER}/orders/analytics/orders`);
    if (!response.ok) throw new Error("Failed to fetch analytics");
    return response.json();
  },

  // Auth functions
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role?: string
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_AUTH}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, firstName, lastName, role }),
    });
    if (!response.ok) throw new Error("Registration failed");
    return response.json();
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_AUTH}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error("Login failed");
    return response.json();
  },

  async verifyToken(): Promise<User> {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_AUTH}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Token verification failed");
    const data = await response.json();
    return data.user;
  },
};
