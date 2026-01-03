import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import {
  CartItem,
  Notification,
  Product,
  User,
  PaymentDetails,
} from "../types";
import { api } from "../services/api";

interface AppContextType {
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Payment Details
  paymentDetails: PaymentDetails | null;
  savePaymentDetails: (details: PaymentDetails) => void;
  clearPaymentDetails: () => void;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  refreshNotifications: () => void;

  // User/Auth
  user: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem("token");
    if (token) {
      verifyToken();
      // Load payment details from sessionStorage
      const savedPaymentDetails = sessionStorage.getItem("paymentDetails");
      if (savedPaymentDetails) {
        try {
          setPaymentDetails(JSON.parse(savedPaymentDetails));
        } catch (error) {
          console.error("Failed to parse payment details:", error);
          sessionStorage.removeItem("paymentDetails");
        }
      }
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load notifications if user is logged in
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const addToCart = (product: Product, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const savePaymentDetails = (details: PaymentDetails) => {
    setPaymentDetails(details);
    sessionStorage.setItem("paymentDetails", JSON.stringify(details));
  };

  const clearPaymentDetails = () => {
    setPaymentDetails(null);
    sessionStorage.removeItem("paymentDetails");
  };

  const markAsRead = async (notificationId: string) => {
    await api.markNotificationAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const verifyToken = async () => {
    try {
      const userData = await api.verifyToken();
      setUser(userData);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
      }
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem("token", token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    setNotifications([]);
    clearCart();
    clearPaymentDetails();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        paymentDetails,
        savePaymentDetails,
        clearPaymentDetails,
        notifications,
        unreadCount,
        markAsRead,
        refreshNotifications: loadNotifications,
        user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
