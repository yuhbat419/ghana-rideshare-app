import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Car } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/auth.api';

const VerifyPhone = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.verifyPhone({ phone, otp });
      toast.success('Phone verified! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center mx-auto">
            <Car className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Verify your phone</h1>
          <p className="text-gray-600 mt-2">
            Enter the 6-digit code sent to <strong>{phone}</strong>
          </p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                className="input-field text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="btn-primary w-full py-3"
            >
              {loading ? 'Verifying...' : 'Verify Phone'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Didn't receive the code?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-primary-600 font-medium hover:underline"
            >
              Try again
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyPhone;