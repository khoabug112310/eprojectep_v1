import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import MainLayout from './components/MainLayout';
import Home from './views/Home';
import Movies from './views/Movies';
import MovieDetail from './views/MovieDetail';
import Profile from './views/Profile';
import MyBookings from './views/MyBookings';
import Login from './views/auth/Login';
import Register from './views/auth/Register';
import Seats from './views/booking/Seats';
import Checkout from './views/booking/Checkout';
import Confirmation from './views/booking/Confirmation';
import AdminLogin from './views/admin/AdminLogin';
import AdminLayout from './views/admin/AdminLayout';
import Dashboard from './views/admin/Dashboard';
import AdminMovies from './views/admin/Movies';
import AdminTheaters from './views/admin/Theaters';
import AdminShowtimes from './views/admin/Showtimes';
import AdminBookings from './views/admin/Bookings';
import EditMovie from './views/admin/EditMovie';
import EditTheater from './views/admin/EditTheater';
import EditShowtime from './views/admin/EditShowtime';
import AdminUsers from './views/admin/Users';
import EditUser from './views/admin/EditUser';
import TestAPI from './views/TestAPI';
import NavbarComponent from './components/Navbar';
import Footer from './components/Footer';
import Theaters from './views/Theaters';
import TheaterDetails from './views/TheaterDetails';
import ShowtimeDetails from './views/ShowtimeDetails';
import ForgotPassword from './views/auth/ForgotPassword';
import AdminRoutes from './views/admin/Routes';
import './App.css';

// Protected route component for admin
const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  
  if (!token || !userData) {
    return <Navigate to="/admin/login" replace />;
  }
  
  try {
    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
      return <Navigate to="/admin/login" replace />;
    }
  } catch (e) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <div className="App">
      <NavbarComponent />
      <Container fluid className="py-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/theaters" element={<Theaters />} />
          <Route path="/theaters/:id" element={<TheaterDetails />} />
          <Route path="/showtimes/:id" element={<ShowtimeDetails />} />
          
          {/* Booking Routes */}
          <Route path="/booking/seats" element={<Seats />} />
          <Route path="/booking/seats/:id" element={<Seats />} />
          <Route path="/booking/checkout" element={<Checkout />} />
          <Route path="/booking/confirmation" element={<Confirmation />} />
          
          {/* Auth Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          
          {/* User Routes */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          
          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminRoutes />} />
          
          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
      <Footer />
    </div>
  );
}

export default App;