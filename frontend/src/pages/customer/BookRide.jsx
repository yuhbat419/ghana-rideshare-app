import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/layout/Navbar';
import apiClient from '../../api/client';

const BookRide = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    pickupAddress: '',
    pickupLat: '',
    pickupLng: '',
    dropoffAddress: '',
    dropoffLat: '',
    dropoffLng: '',
    notes: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm({
          ...form,
          pickupLat: position.coords.latitude,
          pickupLng: position.coords.longitude,
          pickupAddress: `My Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`,
        });
        toast.success('Location detected!');
      },
      () => toast.error('Could not get location')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.pickupLat || !form.pickupLng) {
      toast.error('Please enter pickup coordinates');
      return;
    }
    if (!form.dropoffLat || !form.dropoffLng) {
      toast.error('Please enter dropoff coordinates');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/jobs', form);
      const job = response.data.data;
      toast.success(`Ride booked! Estimated price: GHS ${job.estimatedPrice}`);
      navigate('/customer/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/customer/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Book a Ride</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Pickup */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Location
              </label>
              <input
                type="text"
                name="pickupAddress"
                value={form.pickupAddress}
                onChange={handleChange}
                placeholder="e.g. Accra Mall, Spintex Road"
                className="input-field mb-2"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  name="pickupLat"
                  value={form.pickupLat}
                  onChange={handleChange}
                  placeholder="Latitude e.g. 5.6037"
                  className="input-field"
                  step="any"
                  required
                />
                <input
                  type="number"
                  name="pickupLng"
                  value={form.pickupLng}
                  onChange={handleChange}
                  placeholder="Longitude e.g. -0.1870"
                  className="input-field"
                  step="any"
                  required
                />
              </div>
              <button
                type="button"
                onClick={useMyLocation}
                className="mt-2 flex items-center gap-1 text-primary-600 text-sm font-medium hover:underline"
              >
                <Navigation className="w-4 h-4" />
                Use my current location
              </button>
            </div>

            {/* Dropoff */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dropoff Location
              </label>
              <input
                type="text"
                name="dropoffAddress"
                value={form.dropoffAddress}
                onChange={handleChange}
                placeholder="e.g. Kotoka International Airport"
                className="input-field mb-2"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  name="dropoffLat"
                  value={form.dropoffLat}
                  onChange={handleChange}
                  placeholder="Latitude e.g. 5.6052"
                  className="input-field"
                  step="any"
                  required
                />
                <input
                  type="number"
                  name="dropoffLng"
                  value={form.dropoffLng}
                  onChange={handleChange}
                  placeholder="Longitude e.g. -0.1668"
                  className="input-field"
                  step="any"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Any special instructions for the driver..."
                className="input-field"
                rows={3}
              />
            </div>

            {/* Price Info */}
            <div className="bg-primary-50 rounded-lg p-4">
              <p className="text-sm text-primary-800">
                💡 Price is calculated as: <strong>GHS 5 base fare + GHS 3.50/km</strong>. 
                Minimum fare is GHS 8.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? 'Booking...' : 'Book Ride'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookRide;