import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Star, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Navbar from '../../components/layout/Navbar';
import apiClient from '../../api/client';

const TripStatus = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['tripStatus', jobId],
    queryFn: () => apiClient.get(`/jobs/${jobId}`),
    refetchInterval: 8000,
  });

  const job = data?.data?.data;

  useEffect(() => {
    if (job?.status === 'COMPLETED' && !rated) {
      setShowRating(true);
    }
  }, [job?.status, rated]);

  const cancelMutation = useMutation({
    mutationFn: () => apiClient.put(`/jobs/${jobId}/cancel`, { reason: 'Customer cancelled' }),
    onSuccess: () => {
      toast.success('Ride cancelled');
      navigate('/customer/dashboard');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Cannot cancel'),
  });

  const rateMutation = useMutation({
    mutationFn: () => apiClient.post(`/jobs/${jobId}/rate`, { score: rating, comment }),
    onSuccess: () => {
      toast.success('Thanks for your rating!');
      setRated(true);
      setShowRating(false);
      navigate('/customer/dashboard');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Rating failed'),
  });

  const getStatusInfo = (status) => {
    const info = {
      PENDING: {
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: <Clock className="w-8 h-8 text-yellow-500" />,
        title: 'Finding your driver...',
        desc: 'We are looking for a driver near you',
      },
      ASSIGNED: {
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: <MapPin className="w-8 h-8 text-blue-500" />,
        title: 'Driver is on the way!',
        desc: 'Your driver is heading to your pickup location',
      },
      IN_PROGRESS: {
        color: 'text-primary-600',
        bg: 'bg-primary-50',
        border: 'border-primary-200',
        icon: <div className="text-3xl">🚗</div>,
        title: 'Trip in progress',
        desc: 'You are on your way to your destination',
      },
      COMPLETED: {
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: <CheckCircle className="w-8 h-8 text-green-500" />,
        title: 'Trip completed!',
        desc: 'You have arrived at your destination',
      },
      CANCELLED: {
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <XCircle className="w-8 h-8 text-red-500" />,
        title: 'Trip cancelled',
        desc: 'This trip was cancelled',
      },
    };
    return info[status] || info.PENDING;
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(job.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Status Card */}
        <div className={`card mb-4 border-2 ${statusInfo.border} ${statusInfo.bg}`}>
          <div className="text-center mb-4">
            <div className="flex justify-center mb-3">{statusInfo.icon}</div>
            <h2 className={`text-xl font-bold ${statusInfo.color}`}>{statusInfo.title}</h2>
            <p className="text-gray-600 text-sm mt-1">{statusInfo.desc}</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6 px-4">
            {['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].map((step, index) => {
              const steps = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];
              const currentIndex = steps.indexOf(job.status);
              const isCompleted = index <= currentIndex;
              const labels = ['Finding', 'Driver coming', 'In ride', 'Done'];
              return (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCompleted ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 text-center">{labels[index]}</span>
                  {index < 3 && (
                    <div className={`absolute h-0.5 w-full ${isCompleted ? 'bg-primary-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Trip Details */}
        <div className="card mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">Trip Details</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="text-xs text-gray-500">Pickup</p>
                <p className="text-sm font-medium text-gray-900">{job.pickupAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="text-xs text-gray-500">Dropoff</p>
                <p className="text-sm font-medium text-gray-900">{job.dropoffAddress}</p>
              </div>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">Distance</span>
              <span className="text-sm font-medium">{job.distanceKm} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Estimated Price</span>
              <span className="text-lg font-bold text-green-600">GHS {job.estimatedPrice}</span>
            </div>
            {job.finalPrice && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Final Price</span>
                <span className="text-lg font-bold text-green-700">GHS {job.finalPrice}</span>
              </div>
            )}
          </div>
        </div>

        {/* Driver Info */}
        {job.driver && (
          <div className="card mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Your Driver</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-bold text-lg">
                    {job.driver.user?.firstName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {job.driver.user?.firstName} {job.driver.user?.lastName}
                  </p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs text-gray-500">{job.driver.avgRating || '0.0'}</span>
                  </div>
                </div>
              </div>
              <a
                href={`tel:${job.driver.user?.phone}`}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
              >
                <Phone className="w-4 h-4" />
                Call
              </a>
            </div>
            {job.vehicle && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
                <span className="text-gray-500">Vehicle</span>
                <span className="font-medium">
                  {job.vehicle.color} {job.vehicle.make} {job.vehicle.model} — {job.vehicle.plateNumber}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Cancel Button */}
        {['PENDING', 'ASSIGNED'].includes(job.status) && (
          <button
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="btn-danger w-full mb-4"
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Ride'}
          </button>
        )}

        {/* Rating Modal */}
        {showRating && (
          <div className="card border-2 border-yellow-200 bg-yellow-50">
            <h3 className="font-semibold text-gray-900 mb-1">Rate your trip</h3>
            <p className="text-sm text-gray-600 mb-4">How was your experience with {job.driver?.user?.firstName}?</p>
            <div className="flex gap-2 mb-4 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="text-3xl transition-transform hover:scale-110"
                >
                  <Star className={`w-8 h-8 ${star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment (optional)"
              className="input-field mb-3"
              rows={2}
            />
            <button
              onClick={() => rateMutation.mutate()}
              disabled={rating === 0 || rateMutation.isPending}
              className="btn-primary w-full"
            >
              {rateMutation.isPending ? 'Submitting...' : 'Submit Rating'}
            </button>
            <button
              onClick={() => { setShowRating(false); navigate('/customer/dashboard'); }}
              className="btn-secondary w-full mt-2"
            >
              Skip for now
            </button>
          </div>
        )}

        <button
          onClick={() => navigate('/customer/dashboard')}
          className="btn-secondary w-full mt-2"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default TripStatus;