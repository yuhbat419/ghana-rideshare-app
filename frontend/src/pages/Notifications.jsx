import { useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, CheckCheck, Car, DollarSign, UserCheck, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import apiClient from '../api/client';

const getNotificationIcon = (type) => {
  const icons = {
    JOB_ASSIGNED: <Car className="w-5 h-5 text-blue-600" />,
    JOB_CANCELLED: <AlertCircle className="w-5 h-5 text-red-600" />,
    DRIVER_ARRIVED: <Car className="w-5 h-5 text-green-600" />,
    TRIP_STARTED: <Car className="w-5 h-5 text-primary-600" />,
    TRIP_COMPLETED: <CheckCheck className="w-5 h-5 text-green-600" />,
    PAYMENT_SUCCESS: <DollarSign className="w-5 h-5 text-green-600" />,
    PAYMENT_FAILED: <DollarSign className="w-5 h-5 text-red-600" />,
    DOCUMENT_APPROVED: <UserCheck className="w-5 h-5 text-green-600" />,
    DOCUMENT_REJECTED: <AlertCircle className="w-5 h-5 text-red-600" />,
    ACCOUNT_APPROVED: <UserCheck className="w-5 h-5 text-green-600" />,
    ACCOUNT_SUSPENDED: <AlertCircle className="w-5 h-5 text-red-600" />,
  };
  return icons[type] || <Bell className="w-5 h-5 text-gray-600" />;
};

const getNotificationBg = (type) => {
  const bgs = {
    JOB_ASSIGNED: 'bg-blue-100',
    JOB_CANCELLED: 'bg-red-100',
    DRIVER_ARRIVED: 'bg-green-100',
    TRIP_STARTED: 'bg-primary-100',
    TRIP_COMPLETED: 'bg-green-100',
    PAYMENT_SUCCESS: 'bg-green-100',
    PAYMENT_FAILED: 'bg-red-100',
    DOCUMENT_APPROVED: 'bg-green-100',
    DOCUMENT_REJECTED: 'bg-red-100',
    ACCOUNT_APPROVED: 'bg-green-100',
    ACCOUNT_SUSPENDED: 'bg-red-100',
  };
  return bgs[type] || 'bg-gray-100';
};

const Notifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/notifications'),
    refetchInterval: 15000,
  });

  const notifications = data?.data?.data || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient.put('/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('All notifications marked as read');
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => apiClient.put(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              className="text-sm text-primary-600 font-medium hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="card text-center py-16">
            <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500">No notifications yet</h3>
            <p className="text-sm text-gray-400 mt-1">
              You'll be notified about your rides and account updates
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.isRead && markReadMutation.mutate(notification.id)}
                className={`card cursor-pointer transition-all hover:shadow-md ${
                  !notification.isRead ? 'border-l-4 border-l-primary-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationBg(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;