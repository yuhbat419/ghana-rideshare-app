import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Navbar from '../../components/layout/Navbar';
import apiClient from '../../api/client';

const DriverJobs = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['availableJobs'],
    queryFn: () => apiClient.get('/jobs/available'),
    refetchInterval: 15000,
  });

  const jobs = data?.data?.data || [];

  const acceptMutation = useMutation({
    mutationFn: (jobId) => apiClient.put(`/jobs/${jobId}/accept`),
    onSuccess: () => {
      toast.success('Job accepted successfully!');
      queryClient.invalidateQueries(['availableJobs']);
      navigate('/driver/dashboard');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to accept job');
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/driver/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Available Jobs</h1>
          <span className="badge-info">{jobs.length} available</span>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="card text-center py-12">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No available jobs right now</p>
            <p className="text-sm text-gray-400 mt-1">Check back in a few minutes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="space-y-2 mb-3">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm font-medium text-gray-700">{job.pickupAddress}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm font-medium text-gray-700">{job.dropoffAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{job.distanceKm} km</span>
                      <span>•</span>
                      <span>Customer: {job.customer?.firstName}</span>
                      {job.notes && (
                        <>
                          <span>•</span>
                          <span className="italic">"{job.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xl font-bold text-green-600">
                      GHS {job.estimatedPrice}
                    </p>
                    <button
                      onClick={() => acceptMutation.mutate(job.id)}
                      disabled={acceptMutation.isPending}
                      className="mt-2 flex items-center gap-1 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept
                    </button>
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

export default DriverJobs;