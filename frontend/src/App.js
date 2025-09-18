import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Home from './views/Home';
import Movies from './views/Movies';
import MovieDetail from './views/MovieDetail';
import Theaters from './views/Theaters';
import Showtimes from './views/Showtimes';
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
import TestAPI from './views/TestAPI';
import './App.css';

function App() {
  return (
    <Routes>
      {/* Public routes with main layout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="movies" element={<Movies />} />
        <Route path="movies/:id" element={<MovieDetail />} />
        <Route path="theaters" element={<Theaters />} />
        <Route path="showtimes" element={<Showtimes />} />
        <Route path="auth/login" element={<Login />} />
        <Route path="auth/register" element={<Register />} />
        <Route path="profile" element={<Profile />} />
        <Route path="my-bookings" element={<MyBookings />} />
        <Route path="booking/seats/:showtimeId" element={<Seats />} />
        <Route path="booking/checkout" element={<Checkout />} />
        <Route path="booking/confirmation" element={<Confirmation />} />
        <Route path="test-api" element={<TestAPI />} />
      </Route>

      {/* Admin routes with admin layout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="movies" element={<AdminMovies />} />
        <Route path="theaters" element={<AdminTheaters />} />
        <Route path="showtimes" element={<AdminShowtimes />} />
        <Route path="bookings" element={<AdminBookings />} />
      </Route>

      {/* Admin login (outside of admin layout) */}
      <Route path="/admin/login" element={<AdminLogin />} />
    </Routes>
  );
}

export default App;