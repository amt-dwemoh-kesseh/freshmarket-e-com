export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  shippingAddress: ShippingAddress;
  paymentStatus: PaymentStatus;
  statusHistory: OrderStatusHistory[];
}

export type OrderStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUCCESS'
  | 'CONFIRMED'
  | 'DISPATCHED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  message: string;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export interface PaymentDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'ORDER' | 'PAYMENT' | 'DISPATCH' | 'GENERAL';
  title: string;
  message: string;
  orderId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  productName: string;
  stock: number;
  soldCount: number;
  lowStockThreshold: number;
  category: string;
}

export interface OrderAnalytics {
  totalOrders: number;
  successfulOrders: number;
  failedPayments: number;
  pendingOrders: number;
  revenueToday: number;
  totalRevenue: number;
  totalProducts: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface AuthResponse {
  user: User;
  token: string;
}
