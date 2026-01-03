import {
  ShoppingCart,
  Bell,
  Store,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useNavigate, useLocation } from "react-router-dom";

interface HeaderProps {
  onCartClick: () => void;
  onNotificationClick: () => void;
}

export function Header({ onCartClick, onNotificationClick }: HeaderProps) {
  const { cart, unreadCount, user, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleViewSwitch = () => {
    if (location.pathname === "/admin") {
      navigate("/");
    } else {
      navigate("/admin");
    }
  };

  const handleLogoClick = () => {
    if (user?.role === "ADMIN") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Store className="w-8 h-8 text-emerald-600" />
            <span className="text-xl font-bold text-gray-900">KessehMart</span>
          </button>

          <div className="flex items-center gap-6">
            {user && (
              <>
                {user.role === "ADMIN" && (
                  <button
                    onClick={handleViewSwitch}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {location.pathname === "/admin" ? "Shop View" : "Admin View"}
                  </button>
                )}

                {user.role === "CUSTOMER" && (
                  <>
                    <button
                      onClick={onNotificationClick}
                      className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Bell className="w-6 h-6" />
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={onCartClick}
                      className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ShoppingCart className="w-6 h-6" />
                      {cartItemCount > 0 && (
                        <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-emerald-600 rounded-full">
                          {cartItemCount}
                        </span>
                      )}
                    </button>
                  </>
                )}

                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
