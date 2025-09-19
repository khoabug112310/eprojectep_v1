import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';

const AdminLayout = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and is admin
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      // No token or user data, redirect to admin login
      navigate('/admin/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        // Not an admin, redirect to admin login
        navigate('/admin/login');
        return;
      }
      setUser(parsedUser);
    } catch (e) {
      console.error('Error parsing user data:', e);
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  // Don't render anything while checking authentication
  if (!user) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-gold" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100 bg-dark">
      {/* Admin Header */}
      <header>
        <Navbar bg="dark" variant="dark" expand="lg" className="py-3">
          <Container fluid>
            <Navbar.Brand as={Link} to="/admin" className="fw-bold">
              🎬 CineBook Admin
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="admin-navbar" />
            <Navbar.Collapse id="admin-navbar">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/admin">Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/admin/movies">Movies</Nav.Link>
                <Nav.Link as={Link} to="/admin/theaters">Theaters</Nav.Link>
                <Nav.Link as={Link} to="/admin/showtimes">Showtimes</Nav.Link>
                <Nav.Link as={Link} to="/admin/bookings">Bookings</Nav.Link>
                <Nav.Link as={Link} to="/admin/users">Users</Nav.Link>
              </Nav>
              <Nav>
                <NavDropdown title={user.name || 'Admin'} id="admin-dropdown">
                  <NavDropdown.Item as={Link} to="/admin/profile">
                    Profile
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </header>

      {/* Main Content */}
      <main className="flex-grow-1 py-4">
        <Container fluid>
          <Outlet />
        </Container>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-light py-3 mt-auto">
        <Container fluid>
          <div className="text-center">
            <p className="mb-0">&copy; 2025 CineBook Admin Panel. All rights reserved.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default AdminLayout;