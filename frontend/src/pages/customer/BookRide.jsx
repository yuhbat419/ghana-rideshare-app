import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Navigation, Clock, DollarSign, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import toast from 'react-hot-toast';
import Navbar from '../../components/layout/Navbar';
import apiClient from '../../api/client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to update map center
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 14);
  }, [center, map]);
  return null;
};

// Address search using OpenStreetMap Nominatim (free, no API key)
const AddressSearch = ({ label, placeholder, onSelect, icon }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);

  const search = async (text) => {
    if (text.length < 3) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text + ' Ghana')}&format=json&limit=5&countrycodes=gh`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await response.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => search(value), 500);
  };

  const handleSelect = (item) => {
    setQuery(item.display_name.split(',').slice(0, 2).join(','));
    setSuggestions([]);
    onSelect({
      address: item.display_name.split(',').slice(0, 3).join(','),
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    });
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="input-field pl-10"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
      </div>
      {loading && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 p-3 text-sm text-gray-500">
          Searching...
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
          {suggestions.map((item) => (
            <button
              key={item.place_id}
              onClick={() => handleSelect(item)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0 flex items-start gap-2"
            >
              <MapPin className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{item.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const calculateFare = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return { distKm: distKm.toFixed(2), price: Math.max(5 + distKm * 3.5, 8).toFixed(2) };
};

const BookRide = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [notes, setNotes] = useState('');
  const [mapCenter, setMapCenter] = useState(null);
const [locationLoading, setLocationLoading] = useState(true);
  const [fare, setFare] = useState(null);

  // Auto-detect location
  useEffect(() => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude: lat, longitude: lng } = position.coords;
      setMapCenter([lat, lng]);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          const address = data.display_name?.split(',').slice(0, 3).join(',') || 'My Location';
          setPickup({ address, lat, lng });
          toast.success('📍 Pickup location detected!');
        } catch {
          setPickup({ address: 'My Location', lat, lng });
        }
      },
      () => {}
    );
  }, []);

  const handlePickupSelect = (data) => {
    setPickup(data);
    setMapCenter([data.lat, data.lng]);
    if (dropoff) {
      setFare(calculateFare(data.lat, data.lng, dropoff.lat, dropoff.lng));
    }
  };

  const handleDropoffSelect = (data) => {
    setDropoff(data);
    if (pickup) {
      setFare(calculateFare(pickup.lat, pickup.lng, data.lat, data.lng));
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setMapCenter([lat, lng]);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          const address = data.display_name?.split(',').slice(0, 3).join(',') || 'My Location';
          setPickup({ address, lat, lng });
          if (dropoff) setFare(calculateFare(lat, lng, dropoff.lat, dropoff.lng));
          toast.success('Location updated!');
        } catch {
          setPickup({ address: 'My Location', lat, lng });
        }
      },
      () => toast.error('Could not get location')
    );
  };

  const handleSubmit = async () => {
    if (!pickup) { toast.error('Please enter a pickup location'); return; }
    if (!dropoff) { toast.error('Please enter a dropoff location'); return; }
    setLoading(true);
    try {
      const response = await apiClient.post('/jobs', {
        pickupAddress: pickup.address,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffAddress: dropoff.address,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        notes,
      });
      toast.success(`🚗 Ride booked! Price: GHS ${response.data.data.estimatedPrice}`);
      navigate('/customer/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const routeLine = pickup && dropoff
    ? [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]
    : null;

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

        <div className="card mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Book a Ride</h1>

          <div className="space-y-4 mb-6">
            <div className="flex gap-3">
              <div className="flex flex-col items-center pt-8">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="w-0.5 h-12 bg-gray-300 my-1"></div>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              <div className="flex-1 space-y-3">
                <AddressSearch
                  label="Pickup Location"
                  placeholder="Where are you? e.g. Accra Mall"
                  onSelect={handlePickupSelect}
                  icon={<div className="w-2 h-2 bg-green-500 rounded-full" />}
                />
                <button
                  onClick={useMyLocation}
                  className="flex items-center gap-1 text-primary-600 text-sm font-medium hover:underline"
                >
                  <Navigation className="w-4 h-4" />
                  Use my current location
                </button>
                <AddressSearch
                  label="Dropoff Location"
                  placeholder="Where to? e.g. Kotoka Airport"
                  onSelect={handleDropoffSelect}
                  icon={<div className="w-2 h-2 bg-red-500 rounded-full" />}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any instructions for the driver..."
                className="input-field"
              />
            </div>
          </div>

          {/* Map */}
          <div className="mb-4 rounded-xl overflow-hidden" style={{ height: '280px' }}>
           <MapContainer
  center={mapCenter || [5.6037, -0.1870]}
  zoom={14}
  style={{ height: '100%', width: '100%' }}
>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© OpenStreetMap'
              />
              <MapUpdater center={mapCenter} />
              {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={greenIcon} />}
              {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} icon={redIcon} />}
              {routeLine && <Polyline positions={routeLine} color="#ea580c" weight={4} />}
            </MapContainer>
          </div>

          {/* Price estimate */}
          {fare && (
            <div className="bg-green-50 rounded-xl p-4 mb-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">Distance: {fare.distKm} km</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-lg font-bold text-green-700">GHS {fare.price}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !pickup || !dropoff}
            className="btn-primary w-full py-4 text-base"
          >
            {loading ? 'Booking your ride...' : '🚗 Book Ride'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookRide;