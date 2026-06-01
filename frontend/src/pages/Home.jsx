import { Link } from 'react-router-dom';
import { Car, Shield, Star, Phone } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Home = () => {
  const { isAuthenticated, user } = useAuthStore();

  const getDashboardLink = () => {
    if (!isAuthenticated) return '/login';
    if (user?.role === 'CUSTOMER') return '/customer/dashboard';
    if (user?.role === 'DRIVER') return '/driver/dashboard';
    if (user?.role === 'ADMIN') return '/admin/dashboard';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">RideGhana</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to={getDashboardLink()} className="btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Your Ride, <br />
            <span className="text-primary-200">Anytime in Ghana</span>
          </h1>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Safe, affordable rides across Accra and beyond. 
            Pay with Mobile Money, card, or cash.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-50 transition-colors"
            >
              Book a Ride
            </Link>
            <Link
              to="/register?role=DRIVER"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-colors"
            >
              Become a Driver
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose RideGhana?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Verified Drivers</h3>
              <p className="text-gray-600">Every driver is background-checked and verified before they can drive.</p>
            </div>
            <div className="card text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Mobile Money</h3>
              <p className="text-gray-600">Pay with MTN MoMo, Vodafone Cash, AirtelTigo, or cash.</p>
            </div>
            <div className="card text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Rated Rides</h3>
              <p className="text-gray-600">Rate your driver after every trip to maintain quality standards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-ghana-black text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to ride?</h2>
        <p className="text-gray-400 mb-8">Join thousands of Ghanaians already using RideGhana</p>
        <Link to="/register" className="bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-colors">
          Create Free Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-6 text-center">
        <p>© 2026 RideGhana. Built for Ghana 🇬🇭</p>
      </footer>
    </div>
  );
};

export default Home;