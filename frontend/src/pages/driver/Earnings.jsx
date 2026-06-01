import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../../components/layout/Navbar';
import apiClient from '../../api/client';

const DriverEarnings = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['driverEarnings'],
    queryFn: () => apiClient.get('/drivers/earnings'),
  });

  const earnings = data?.data?.data;
  const transactions = earnings?.transactions || [];

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

        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Earnings</h1>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="card text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-600">
              GHS {earnings?.totalEarnings || '0.00'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Earnings</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-600">
              {earnings?.totalTrips || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Completed Trips</div>
          </div>
        </div>

        {/* Transactions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No earnings yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t.job?.pickupAddress?.split(',')[0]} → {t.job?.dropoffAddress?.split(',')[0]}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(t.job?.completedAt).toLocaleDateString('en-GH')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-green-600">
                      +GHS {parseFloat(t.driverPayout).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      of GHS {parseFloat(t.amount).toFixed(2)}
                    </p>
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

export default DriverEarnings;