import { X, Bell, CheckCircle, CreditCard, Truck, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Notification } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick: (notification: Notification) => void;
}

const notificationIcons = {
  ORDER: Package,
  PAYMENT: CreditCard,
  DISPATCH: Truck,
  GENERAL: Bell,
};

export function NotificationCenter({ isOpen, onClose, onNotificationClick }: NotificationCenterProps) {
  const { notifications, markAsRead } = useApp();

  if (!isOpen) return null;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    onNotificationClick(notification);
    onClose();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <Bell className="w-24 h-24 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">No notifications</p>
            <p className="text-gray-400 text-sm text-center">
              You're all caught up! Check back later for updates.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {notifications.map(notification => {
              const Icon = notificationIcons[notification.type];
              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      notification.type === 'PAYMENT' ? 'bg-green-100 text-green-600' :
                      notification.type === 'DISPATCH' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{notification.title}</p>
                        {!notification.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-400">{formatTimestamp(notification.createdAt)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
