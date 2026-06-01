import { useNavigate } from 'react-router-dom';
import { Users, Car, Briefcase, DollarSign, UserCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../../components/layout/Navbar';
import apiClient from '../../api/client';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const { data: statsData } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => apiClient.get('/admin/stats'),
  });

  const stats = statsData?.data?.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform overview and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalCustomers || 0}</p>
                <p className="text-sm text-gray-600">Customers</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalDrivers || 0}</p>
                <p className="text-sm text-gray-600">Drivers</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats?.pendingApprovals || 0}</p>
                <p className="text-sm text-gray-600">Pending Approvals</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalJobs || 0}</p>
                <p className="text-sm text-gray-600">Total Jobs</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats?.completedJobs || 0}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  GHS {parseFloat(stats?.totalRevenue || 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/admin/drivers')}
            className="card text-left hover:border-primary-200 hover:shadow-md transition-all cursor-pointer"
          >
            <Car className="w-8 h-8 text-primary-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Manage Drivers</h3>
            <p className="text-sm text-gray-500 mt-1">
              Approve, reject, or suspend drivers
              {stats?.pendingApprovals > 0 && (
                <span className="ml-2 badge-warning">
                  {stats.pendingApprovals} pending
                </span>
              )}
            </p>
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="card text-left hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
          >
            <Users className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Manage Users</h3>
            <p className="text-sm text-gray-500 mt-1">View and manage all platform users</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;