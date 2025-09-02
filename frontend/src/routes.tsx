import { lazy } from 'react'

export const routes = [
  {
    path: "/",
    component: lazy(() => import("./views/Home")),
  },
  {
    path: "/movies",
    component: lazy(() => import("./views/Movies")),
  },
  {
    path: "/movies/:id",
    component: lazy(() => import("./views/MovieDetail")),
  },
  {
    path: "/theaters",
    component: lazy(() => import("./views/Theaters")),
  },
  {
    path: "/showtimes",
    component: lazy(() => import("./views/Showtimes")),
  },
  {
    path: "/login",
    component: lazy(() => import("./views/auth/Login")),
  },
  {
    path: "/register",
    component: lazy(() => import("./views/auth/Register")),
  },
  {
    path: "/forgot-password",
    component: lazy(() => import("./views/auth/ForgotPassword")),
  },
  {
    path: "/reset-password",
    component: lazy(() => import("./views/auth/ResetPassword")),
  },
  {
    path: "/profile",
    component: lazy(() => import("./views/Profile")),
  },
  {
    path: "/my-bookings",
    component: lazy(() => import("./views/MyBookings")),
  },
  {
    path: "/booking/showtimes/:movieId",
    component: lazy(() => import("./views/booking/Showtimes")),
  },
  {
    path: "/booking/seats/:showtimeId",
    component: lazy(() => import("./views/booking/Seats")),
  },
  {
    path: "/booking/checkout",
    component: lazy(() => import("./views/booking/Checkout")),
  },
  {
    path: "/booking/confirmation",
    component: lazy(() => import("./views/booking/Confirmation")),
  },
  {
    path: "/ticket/:bookingId",
    component: lazy(() => import("./views/booking/TicketPage")),
  },
  {
    path: "/about",
    component: lazy(() => import("./views/About")),
  },
  {
    path: "/contact",
    component: lazy(() => import("./views/Contact")),
  },
  {
    path: "/help",
    component: lazy(() => import("./views/Help")),
  },
  {
    path: "/privacy",
    component: lazy(() => import("./views/Privacy")),
  },
  {
    path: "/terms",
    component: lazy(() => import("./views/Terms")),
  },
  {
    path: "/sitemap",
    component: lazy(() => import("./views/Sitemap")),
  },
  {
    path: "/admin/login",
    component: lazy(() => import("./views/admin/AdminLogin")),
  },
  {
    path: "/admin",
    component: lazy(() => import("./views/admin/AdminLayout")),
  },
  // 404 route - must be last
  {
    path: "*",
    component: lazy(() => import("./views/NotFound")),
  },
] 