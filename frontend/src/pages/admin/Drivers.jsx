import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Navbar from '../../components/layout/Navbar';
import apiClient from '../../api/client';

const AdminDrivers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminDrivers'],
    queryFn: () => apiClient.get('/admin/drivers'),
  });

  const drivers = data?.data?.data || [];

  const approveMutation = useMutation({
    mutationFn: (driverId) => apiClient.put(`/admin/drivers/${driverId}/approve`),
    onSuccess: () => {
      toast.success('Driver approved!');
      queryClient.invalidateQueries(['adminDrivers']);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: (driverId) => apiClient.put(`/admin/drivers/${driverId}/reject`, { reason: 'Does not meet requirements' }),
    onSuccess: () => {
      toast.success('Driver rejected');
      queryClient.invalidateQueries(['adminDrivers']);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed'),
  });

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'badge-warning',
      APPROVED: 'badge-success',
      REJECTED: 'badge-danger',
      SUSPENDED: 'badge-danger',
    };
    return badges[status] || 'badge-info';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Manage Drivers ({drivers.length})
        </h1>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {drivers.map((driver) => (
              <div key={driver.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-semibold text-sm">
                          {driver.user.firstName[0]}{driver.user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {driver.user.firstName} {driver.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{driver.user.phone}</p>
                      </div>
                      <span className={getStatusBadge(driver.status)}>
                        {driver.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>License: {driver.licenseNumber}</p>
                      <p>Trips: {driver.totalTrips} | Rating: {driver.avgRating}</p>
                      {driver.vehicles.length > 0 && (
                        <p>
                          Vehicle: {driver.vehicles[0].year} {driver.vehicles[0].make} {driver.vehicles[0].model} — {driver.vehicles[0].plateNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  {driver.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveMutation.mutate(driver.id)}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => rejectMutation.mutate(driver.id)}
                        disabled={rejectMutation.isPending}
                        className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
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

export default AdminDrivers;