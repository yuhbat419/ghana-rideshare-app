import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Star, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../../components/layout/Navbar';
import useAuthStore from '../../store/authStore';
import apiClient from '../../api/client';

const CustomerDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: jobsData } = useQuery({
    queryKey: ['customerJobs'],
    queryFn: () => apiClient.get('/jobs?limit=5'),
  });

  const jobs = jobsData?.data?.data || [];

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'badge-warning',
      ASSIGNED: 'badge-info',
      IN_PROGRESS: 'badge-info',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-danger',
    };
    return badges[status] || 'badge-info';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Good day, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Where are you going today?</p>
        </div>

        {/* Book Ride CTA */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-8">
          <h2 className="text-xl font-semibold mb-2">Need a ride?</h2>
          <p className="text-primary-100 mb-4">Book a safe and affordable ride in seconds</p>
          <button
            onClick={() => navigate('/customer/book')}
            className="bg-white text-primary-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-primary-50 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Book a Ride
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary-600">
              {jobs.filter(j => j.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Rides</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600">
              GHS {jobs
                .filter(j => j.status === 'COMPLETED')
                .reduce((sum, j) => sum + parseFloat(j.finalPrice || 0), 0)
                .toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Spent</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {jobs.filter(j => j.status === 'PENDING' || j.status === 'ASSIGNED' || j.status === 'IN_PROGRESS').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Active Rides</div>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Trips</h3>
            <button
              onClick={() => navigate('/customer/history')}
              className="text-primary-600 text-sm font-medium hover:underline"
            >
              View all
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No trips yet</p>
              <button
                onClick={() => navigate('/customer/book')}
                className="btn-primary mt-4"
              >
                Book your first ride
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
  key={job.id}
  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
  onClick={() => navigate(`/customer/trip/${job.id}`)}
>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mt-1">
                      <MapPin className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {job.pickupAddress}
                      </p>
                      <p className="text-xs text-gray-500">→ {job.dropoffAddress}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={getStatusBadge(job.status)}>
                      {job.status}
                    </span>
                    {job.finalPrice && (
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        GHS {job.finalPrice}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;