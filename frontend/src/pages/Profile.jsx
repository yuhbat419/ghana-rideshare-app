import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Lock, ArrowLeft, Camera } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import useAuthStore from '../store/authStore';
import apiClient from '../api/client';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const { data: profileData } = useQuery({
    queryKey: ['myProfile'],
    queryFn: () => apiClient.get('/auth/me'),
  });

  const profile = profileData?.data?.data;

  const updateMutation = useMutation({
    mutationFn: (data) => apiClient.put('/auth/profile', data),
    onSuccess: (res) => {
      toast.success('Profile updated!');
      updateUser(res.data.data);
      queryClient.invalidateQueries(['myProfile']);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Update failed'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => apiClient.put('/auth/change-password', data),
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to change password'),
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    passwordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const getDashboardLink = () => {
    if (user?.role === 'CUSTOMER') return '/customer/dashboard';
    if (user?.role === 'DRIVER') return '/driver/dashboard';
    if (user?.role === 'ADMIN') return '/admin/dashboard';
    return '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(getDashboardLink())}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Profile Header */}
        <div className="card mb-4 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-primary-700 font-bold text-3xl">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {user?.firstName} {user?.lastName}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{user?.phone}</p>
          <div className="mt-2">
            <span className={`badge-${user?.role === 'DRIVER' ? 'info' : user?.role === 'ADMIN' ? 'warning' : 'success'}`}>
              {user?.role}
            </span>
            {profile?.isVerified && (
              <span className="badge-success ml-2">✓ Verified</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'profile' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            Profile Info
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'password' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            Change Password
          </button>
          {user?.role === 'DRIVER' && (
            <button
              onClick={() => setActiveTab('vehicle')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'vehicle' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              My Vehicle
            </button>
          )}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={user?.phone}
                    className="input-field bg-gray-50 text-gray-500"
                    disabled
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    Cannot change
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn-primary w-full py-3"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={passwordMutation.isPending}
                className="btn-primary w-full py-3"
              >
                {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}

        {/* Vehicle Tab — Driver only */}
        {activeTab === 'vehicle' && user?.role === 'DRIVER' && (
          <DriverVehicleTab />
        )}
      </div>
    </div>
  );
};

const DriverVehicleTab = () => {
  const [form, setForm] = useState({
    make: '',
    model: '',
    year: '',
    plateNumber: '',
    color: '',
    type: 'SEDAN',
  });

  const { data } = useQuery({
    queryKey: ['myVehicles'],
    queryFn: () => apiClient.get('/drivers/vehicles'),
  });

  const vehicles = data?.data?.data || [];

  const addMutation = useMutation({
    mutationFn: (data) => apiClient.post('/drivers/vehicles', data),
    onSuccess: () => {
      toast.success('Vehicle added!');
      setForm({ make: '', model: '', year: '', plateNumber: '', color: '', type: 'SEDAN' });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to add vehicle'),
  });

  return (
    <div className="space-y-4">
      {/* Existing Vehicles */}
      {vehicles.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">My Vehicles</h3>
          {vehicles.map((v) => (
            <div key={v.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-2">
              <div>
                <p className="font-medium text-gray-900">{v.year} {v.make} {v.model}</p>
                <p className="text-sm text-gray-500">{v.plateNumber} • {v.color} • {v.type}</p>
              </div>
              {v.isActive && <span className="badge-success">Active</span>}
            </div>
          ))}
        </div>
      )}

      {/* Add New Vehicle */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Add New Vehicle</h3>
        <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(form); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              <input
                type="text"
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
                placeholder="Toyota"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="Corolla"
                className="input-field"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                placeholder="2020"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
              <input
                type="text"
                value={form.plateNumber}
                onChange={(e) => setForm({ ...form, plateNumber: e.target.value.toUpperCase() })}
                placeholder="GR-1234-20"
                className="input-field"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="White"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="input-field"
              >
                <option value="SEDAN">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="TRICYCLE">Tricycle</option>
                <option value="MINIVAN">Minivan</option>
                <option value="PICKUP">Pickup</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="btn-primary w-full py-3"
          >
            {addMutation.isPending ? 'Adding...' : 'Add Vehicle'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;