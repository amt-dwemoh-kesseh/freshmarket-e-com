import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { ShoppingCart } from "./components/ShoppingCart";
import { NotificationCenter } from "./components/NotificationCenter";
import { ProductCatalog } from "./pages/ProductCatalog";
import { ProductDetails } from "./pages/ProductDetails";
import { Checkout } from "./pages/Checkout";
import { OrderTracking } from "./pages/OrderTracking";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Notification } from "./types";
import { LoadingSpinner } from "./components/LoadingSpinner";

function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { user } = useApp();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const handleNotificationClick = (notification: Notification) => {
    if (notification.orderId) {
      // Navigate to order tracking
      window.location.href = `/orders/${notification.orderId}`;
    }
  };

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header
          onCartClick={() => setIsCartOpen(true)}
          onNotificationClick={() => setIsNotificationOpen(true)}
        />

        <Routes>
          {/* Shop Routes (accessible by both customers and admins) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProductCatalog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:id"
            element={
              <ProtectedRoute>
                <ProductDetails />
              </ProtectedRoute>
            }
          />

          {/* Customer-only Routes */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute>
                <OrderTracking />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirects */}
          <Route
            path="*"
            element={
              <Navigate to={user.role === "ADMIN" ? "/admin" : "/"} replace />
            }
          />
        </Routes>

        {/* Modals */}
        <ShoppingCart
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onCheckout={() => {
            setIsCartOpen(false);
            window.location.href = "/checkout";
          }}
        />

        <NotificationCenter
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          onNotificationClick={handleNotificationClick}
        />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
