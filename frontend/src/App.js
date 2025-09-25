import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Container } from 'react-bootstrap';
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
import Header from './components/Header';
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
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isHomeRoute = location.pathname === '/';

  return (
    <div className="App">
      {/* Header for all pages except admin */}
      {!isAdminRoute && <Header />}
      
      {isAdminRoute ? (
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={
            <Container fluid className="py-4">
              <Routes>
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
                
                {/* Fallback Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Container>
          } />
        </Routes>
      )}
      
      {/* Footer for all pages except admin */}
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default App;