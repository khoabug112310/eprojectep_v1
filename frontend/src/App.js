import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import PrintTicket from './views/booking/PrintTicket';
import Header from './components/Header';
import Footer from './components/Footer';
import Theaters from './views/Theaters';
import TheaterDetails from './views/TheaterDetails';
import ShowtimeDetails from './views/ShowtimeDetails';
import ForgotPassword from './views/auth/ForgotPassword';
import AdminRoutes from './views/admin/Routes';
import TestRating from './views/TestRating';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <AuthProvider>
      <div className="App">
        {/* Header for all pages except admin */}
        {!isAdminRoute && location.pathname !== '/print-ticket' && <Header />}
        
        {isAdminRoute ? (
          <Routes>
            <Route path="/admin/*" element={<AdminRoutes />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="*" element={
              <div className="py-4">
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
                  <Route path="/print-ticket" element={<PrintTicket />} />
                  
                  {/* Auth Routes */}
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/auth/register" element={<Register />} />
                  <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                  
                  {/* User Routes */}
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/my-bookings" element={<MyBookings />} />
                  
                  {/* Test Rating Route */}
                  <Route path="/test-rating" element={<TestRating />} />
                  
                  {/* Fallback Route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            } />
          </Routes>
        )}
        
        {/* Footer for all pages except admin and print ticket */}
        {!isAdminRoute && location.pathname !== '/print-ticket' && <Footer />}
      </div>
    </AuthProvider>
  );
}

export default App;