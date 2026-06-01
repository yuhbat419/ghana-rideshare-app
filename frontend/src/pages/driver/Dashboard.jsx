import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToggleLeft, ToggleRight, DollarSign, Star, Briefcase } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Navbar from '../../components/layout/Navbar';
import apiClient from '../../api/client';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profileData } = useQuery({
    queryKey: ['driverProfile'],
    queryFn: () => apiClient.get('/drivers/profile'),
  });

  const { data: earningsData } = useQuery({
    queryKey: ['driverEarnings'],
    queryFn: () => apiClient.get('/drivers/earnings'),
  });

  const driver = profileData?.data?.data;
  const earnings = earningsData?.data?.data;

  const toggleMutation = useMutation({
    mutationFn: () => apiClient.put('/drivers/toggle-online', {
      latitude: 5.6037,
      longitude: -0.1870,
    }),
    onSuccess: (data) => {
      toast.success(data.data.message);
      queryClient.invalidateQueries(['driverProfile']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to toggle status');
    },
  });

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'badge-warning',
      APPROVED: 'badge-success',
      REJECTED: 'badge-danger',
      SUSPENDED: 'badge-danger',
    };
    return colors[status] || 'badge-info';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={getStatusColor(driver?.status)}>
              {driver?.status}
            </span>
            {driver?.status === 'PENDING' && (
              <p className="text-sm text-gray-500">Your account is pending admin approval</p>
            )}
          </div>
        </div>

        {/* Online Toggle */}
        {driver?.status === 'APPROVED' && (
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {driver?.isOnline ? '🟢 You are Online' : '🔴 You are Offline'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {driver?.isOnline
                    ? 'You can receive job requests'
                    : 'Toggle to start receiving jobs'}
                </p>
              </div>
              <button
                onClick={() => toggleMutation.mutate()}
                disabled={toggleMutation.isPending}
                className={`p-2 rounded-full transition-colors ${
                  driver?.isOnline ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {driver?.isOnline
                  ? <ToggleRight className="w-12 h-12" />
                  : <ToggleLeft className="w-12 h-12" />
                }
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <Briefcase className="w-6 h-6 text-primary-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{driver?.totalTrips || 0}</div>
            <div className="text-sm text-gray-600">Total Trips</div>
          </div>
          <div className="card text-center">
            <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              GHS {earnings?.totalEarnings || '0.00'}
            </div>
            <div className="text-sm text-gray-600">Total Earned</div>
          </div>
          <div className="card text-center">
            <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {driver?.avgRating || '0.0'}
            </div>
            <div className="text-sm text-gray-600">Rating</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/driver/jobs')}
            className="card text-left hover:border-primary-200 hover:shadow-md transition-all cursor-pointer"
          >
            <Briefcase className="w-8 h-8 text-primary-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Available Jobs</h3>
            <p className="text-sm text-gray-500 mt-1">View and accept ride requests</p>
          </button>
          <button
            onClick={() => navigate('/driver/earnings')}
            className="card text-left hover:border-green-200 hover:shadow-md transition-all cursor-pointer"
          >
            <DollarSign className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900">My Earnings</h3>
            <p className="text-sm text-gray-500 mt-1">View your earnings history</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;