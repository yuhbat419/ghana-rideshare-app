import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, CheckCircle, Play, Flag } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Navbar from '../../components/layout/Navbar';
import apiClient from '../../api/client';

const DriverJobs = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: availableData, isLoading: loadingAvailable } = useQuery({
    queryKey: ['availableJobs'],
    queryFn: () => apiClient.get('/jobs/available'),
    refetchInterval: 15000,
  });

  const { data: currentJobData } = useQuery({
    queryKey: ['currentJob'],
    queryFn: () => apiClient.get('/drivers/active-job'),
    refetchInterval: 10000,
  });

  const availableJobs = availableData?.data?.data || [];
  const activeJob = currentJobData?.data?.data;

  const acceptMutation = useMutation({
    mutationFn: (jobId) => apiClient.put(`/jobs/${jobId}/accept`),
    onSuccess: () => {
      toast.success('Job accepted!');
      queryClient.invalidateQueries(['availableJobs']);
      queryClient.invalidateQueries(['currentJob']);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to accept'),
  });

  const startMutation = useMutation({
    mutationFn: (jobId) => apiClient.put(`/jobs/${jobId}/start`),
    onSuccess: () => {
      toast.success('Trip started!');
      queryClient.invalidateQueries(['currentJob']);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to start'),
  });

  const completeMutation = useMutation({
    mutationFn: (jobId) => apiClient.put(`/jobs/${jobId}/complete`),
    onSuccess: () => {
      toast.success('Trip completed! Payment recorded.');
      queryClient.invalidateQueries(['currentJob']);
      queryClient.invalidateQueries(['availableJobs']);
      queryClient.invalidateQueries(['driverEarnings']);
      queryClient.invalidateQueries(['driverProfile']);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to complete'),
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

        {/* Active Job */}
        {activeJob && (
          <div className="card mb-6 border-2 border-primary-200 bg-primary-50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-gray-900">
                {activeJob.status === 'ASSIGNED' ? 'Active Job — Head to pickup' : 'Trip in Progress'}
              </h3>
              <span className={activeJob.status === 'ASSIGNED' ? 'badge-warning' : 'badge-info'}>
                {activeJob.status}
              </span>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">{activeJob.pickupAddress}</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">{activeJob.dropoffAddress}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Customer: {activeJob.customer?.firstName} {activeJob.customer?.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  Phone: {activeJob.customer?.phone}
                </p>
                <p className="text-lg font-bold text-green-600 mt-1">
                  GHS {activeJob.estimatedPrice}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {activeJob.status === 'ASSIGNED' && (
                  <button
                    onClick={() => startMutation.mutate(activeJob.id)}
                    disabled={startMutation.isPending}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    {startMutation.isPending ? 'Starting...' : 'Start Trip'}
                  </button>
                )}
                {activeJob.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => completeMutation.mutate(activeJob.id)}
                    disabled={completeMutation.isPending}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    {completeMutation.isPending ? 'Completing...' : 'Complete Trip'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Available Jobs */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Available Jobs</h1>
          <span className="badge-info">{availableJobs.length} available</span>
        </div>

        {loadingAvailable ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : availableJobs.length === 0 ? (
          <div className="card text-center py-12">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No available jobs right now</p>
            <p className="text-sm text-gray-400 mt-1">Page refreshes every 15 seconds</p>
          </div>
        ) : (
          <div className="space-y-4">
            {availableJobs.map((job) => (
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
                        <span className="italic">"{job.notes}"</span>
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