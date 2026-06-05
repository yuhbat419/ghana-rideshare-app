import { createBrowserRouter, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyPhone from './pages/auth/VerifyPhone';
import CustomerDashboard from './pages/customer/Dashboard';
import BookRide from './pages/customer/BookRide';
import CustomerHistory from './pages/customer/History';
import DriverDashboard from './pages/driver/Dashboard';
import DriverJobs from './pages/driver/Jobs';
import DriverEarnings from './pages/driver/Earnings';
import AdminDashboard from './pages/admin/Dashboard';
import AdminDrivers from './pages/admin/Drivers';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (user?.role === 'CUSTOMER') return <Navigate to="/customer/dashboard" replace />;
    if (user?.role === 'DRIVER') return <Navigate to="/driver/dashboard" replace />;
    if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
};

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/verify-phone', element: <VerifyPhone /> },
  { path: '/customer/dashboard', element: <ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerDashboard /></ProtectedRoute> },
  { path: '/customer/book', element: <ProtectedRoute allowedRoles={['CUSTOMER']}><BookRide /></ProtectedRoute> },
  { path: '/customer/history', element: <ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerHistory /></ProtectedRoute> },
  { path: '/driver/dashboard', element: <ProtectedRoute allowedRoles={['DRIVER']}><DriverDashboard /></ProtectedRoute> },
  { path: '/driver/jobs', element: <ProtectedRoute allowedRoles={['DRIVER']}><DriverJobs /></ProtectedRoute> },
  { path: '/driver/earnings', element: <ProtectedRoute allowedRoles={['DRIVER']}><DriverEarnings /></ProtectedRoute> },
  { path: '/admin/dashboard', element: <ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute> },
  { path: '/admin/drivers', element: <ProtectedRoute allowedRoles={['ADMIN']}><AdminDrivers /></ProtectedRoute> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default router;