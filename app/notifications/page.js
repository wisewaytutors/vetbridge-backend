'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Calendar, PawPrint, ShoppingCart, MessageSquare, Check, X, Clock } from 'lucide-react';
import { auth } from '@/lib/auth';

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadNotifications();
  }, [router]);

  const loadNotifications = async () => {
    // In a real app, you would fetch notifications from API
    // For now, we'll use mock data
    setNotifications([
      {
        id: 1,
        type: 'booking',
        title: 'Booking Confirmed',
        message: 'Your appointment with Dr. Sarah Kimani has been confirmed for tomorrow at 10:00 AM',
        time: '2 hours ago',
        read: false,
      },
      {
        id: 2,
        type: 'pet',
        title: 'Vaccination Reminder',
        message: 'Max is due for vaccination on June 15, 2026',
        time: '1 day ago',
        read: false,
      },
      {
        id: 3,
        type: 'marketplace',
        title: 'Order Delivered',
        message: 'Your order of Premium Dog Food has been delivered',
        time: '2 days ago',
        read: true,
      },
      {
        id: 4,
        type: 'message',
        title: 'New Message',
        message: 'Dr. James Ochieng sent you a message about your pet Bella',
        time: '3 days ago',
        read: true,
      },
    ]);
    setLoading(false);
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-5 h-5" />;
      case 'pet':
        return <PawPrint className="w-5 h-5" />;
      case 'marketplace':
        return <ShoppingCart className="w-5 h-5" />;
      case 'message':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'booking':
        return 'bg-primary-100 text-primary-600';
      case 'pet':
        return 'bg-secondary-100 text-secondary-600';
      case 'marketplace':
        return 'bg-accent-100 text-accent-600';
      case 'message':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">Stay updated with your activity</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No notifications</h2>
            <p className="text-gray-600">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl shadow-sm p-6 border ${
                  !notification.read ? 'border-primary-200 bg-primary-50' : 'border-gray-200'
                } transition`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {notification.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
