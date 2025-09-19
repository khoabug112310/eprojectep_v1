import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
    <Routes>
      {/* Public routes with main layout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="movies" element={<Movies />} />
        <Route path="movies/:id" element={<MovieDetail />} />
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
        <Route index element={
          <ProtectedAdminRoute>
            <Dashboard />
          </ProtectedAdminRoute>
        } />
        <Route path="movies" element={
          <ProtectedAdminRoute>
            <AdminMovies />
          </ProtectedAdminRoute>
        } />
        <Route path="movies/:id/edit" element={
          <ProtectedAdminRoute>
            <EditMovie />
          </ProtectedAdminRoute>
        } />
        <Route path="theaters" element={
          <ProtectedAdminRoute>
            <AdminTheaters />
          </ProtectedAdminRoute>
        } />
        <Route path="theaters/:id/edit" element={
          <ProtectedAdminRoute>
            <EditTheater />
          </ProtectedAdminRoute>
        } />
        <Route path="showtimes" element={
          <ProtectedAdminRoute>
            <AdminShowtimes />
          </ProtectedAdminRoute>
        } />
        <Route path="showtimes/:id/edit" element={
          <ProtectedAdminRoute>
            <EditShowtime />
          </ProtectedAdminRoute>
        } />
        <Route path="bookings" element={
          <ProtectedAdminRoute>
            <AdminBookings />
          </ProtectedAdminRoute>
        } />
        <Route path="users" element={
          <ProtectedAdminRoute>
            <AdminUsers />
          </ProtectedAdminRoute>
        } />
        <Route path="users/:id/edit" element={
          <ProtectedAdminRoute>
            <EditUser />
          </ProtectedAdminRoute>
        } />
      </Route>

      {/* Admin login (outside of admin layout) */}
      <Route path="/admin/login" element={<AdminLogin />} />
    </Routes>
  );
}

export default App;