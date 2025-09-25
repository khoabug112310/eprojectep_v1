import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminLogin from './AdminLogin';
import Dashboard from './Dashboard';
import AdminMovies from './Movies';
import AdminTheaters from './Theaters';
import AdminShowtimes from './Showtimes';
import AdminBookings from './Bookings';
import AdminUsers from './Users';
import CreateMovie from './CreateMovie';
import CreateTheater from './CreateTheater';
import CreateShowtime from './CreateShowtime';
import CreateBooking from './CreateBooking';
import EditMovie from './EditMovie';
import EditTheater from './EditTheater';
import EditShowtime from './EditShowtime';
import EditBooking from './EditBooking';
import EditUser from './EditUser';
import AdminProfile from './Profile';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="movies" element={<AdminMovies />} />
        <Route path="movies/create" element={<CreateMovie />} />
        <Route path="movies/:id/edit" element={<EditMovie />} />
        <Route path="theaters" element={<AdminTheaters />} />
        <Route path="theaters/create" element={<CreateTheater />} />
        <Route path="theaters/:id/edit" element={<EditTheater />} />
        <Route path="showtimes" element={<AdminShowtimes />} />
        <Route path="showtimes/create" element={<CreateShowtime />} />
        <Route path="showtimes/:id/edit" element={<EditShowtime />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="bookings/create" element={<CreateBooking />} />
        <Route path="bookings/:id/edit" element={<EditBooking />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/create" element={<EditUser />} />
        <Route path="users/:id/edit" element={<EditUser />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default AdminRoutes;