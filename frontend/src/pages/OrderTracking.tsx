import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  Package,
  CreditCard,
  Truck,
  Home,
} from "lucide-react";
import { Order, OrderStatus } from "../types";
import { api } from "../services/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";

const statusConfig: Record<
  OrderStatus,
  { icon: typeof Package; label: string; color: string }
> = {
  CREATED: { icon: Package, label: "Order Created", color: "blue" },
  PAYMENT_PENDING: {
    icon: CreditCard,
    label: "Payment Pending",
    color: "yellow",
  },
  PAYMENT_SUCCESS: {
    icon: CheckCircle,
    label: "Payment Successful",
    color: "green",
  },
  CONFIRMED: { icon: CheckCircle, label: "Order Confirmed", color: "green" },
  DISPATCHED: { icon: Truck, label: "Dispatched", color: "blue" },
  COMPLETED: { icon: Home, label: "Delivered", color: "green" },
  CANCELLED: { icon: Circle, label: "Cancelled", color: "red" },
};

const statusOrder: OrderStatus[] = [
  "CREATED",
  "PAYMENT_PENDING",
  "PAYMENT_SUCCESS",
  "CONFIRMED",
  "DISPATCHED",
  "COMPLETED",
];

export function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrder();
      const interval = setInterval(loadOrder, 10000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) return;

    try {
      setError(null);
      const data = await api.getOrder(orderId);
      if (!data) {
        setError("Order not found");
      } else {
        setOrder(data);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ErrorMessage
          message={error || "Order not found"}
          onRetry={loadOrder}
        />
      </div>
    );
  }

  const currentStatusIndex = statusOrder.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Home
      </button>

      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Tracking
            </h1>
            <p className="text-gray-600">Order ID: {order.id}</p>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              order.status === "COMPLETED"
                ? "bg-green-100 text-green-800"
                : order.status === "CANCELLED"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {statusConfig[order.status].label}
          </div>
        </div>

        <div className="mb-8">
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
              <div
                className="h-full bg-emerald-600 transition-all duration-500"
                style={{
                  width: `${
                    (currentStatusIndex / (statusOrder.length - 1)) * 100
                  }%`,
                }}
              />
            </div>

            <div className="relative flex justify-between">
              {statusOrder.map((status, index) => {
                const config = statusConfig[status];
                const Icon = config.icon;
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return (
                  <div key={status} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                        isCompleted
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-200 text-gray-400"
                      } ${isCurrent ? "ring-4 ring-emerald-200" : ""}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-medium text-center max-w-[80px] ${
                        isCompleted ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Status History
          </h2>
          <div className="space-y-4">
            {order.statusHistory.map((history, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-2 h-2 bg-emerald-600 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {statusConfig[history.status].label}
                  </p>
                  <p className="text-sm text-gray-600">{history.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(history.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Shipping Address
          </h2>
          <div className="text-gray-700 space-y-1">
            <p className="font-medium">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && (
              <p>{order.shippingAddress.addressLine2}</p>
            )}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.zipCode}
            </p>
            <p>{order.shippingAddress.phone}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Order Summary
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.product.id}
                className="flex justify-between text-sm"
              >
                <span className="text-gray-700">
                  {item.product.name} x {item.quantity}
                </span>
                <span className="font-medium text-gray-900">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
              <span>Total</span>
              <span>${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
