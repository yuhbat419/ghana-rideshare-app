import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../../components/layout/Navbar';
import apiClient from '../../api/client';

const CustomerHistory = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['allCustomerJobs'],
    queryFn: () => apiClient.get('/jobs?limit=50'),
  });

  const jobs = data?.data?.data || [];

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
        <button
          onClick={() => navigate('/customer/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Trip History</h1>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="card text-center py-12">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No trips yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={getStatusBadge(job.status)}>{job.status}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(job.createdAt).toLocaleDateString('en-GH', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-gray-700">{job.pickupAddress}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-gray-700">{job.dropoffAddress}</p>
                      </div>
                    </div>
                    {job.driver && (
                      <p className="text-xs text-gray-500 mt-2">
                        Driver: {job.driver.user?.firstName} {job.driver.user?.lastName}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    {job.finalPrice && (
                      <p className="text-lg font-bold text-gray-900">
                        GHS {job.finalPrice}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">{job.distanceKm} km</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerHistory;