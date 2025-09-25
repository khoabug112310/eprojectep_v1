import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar, NavDropdown, Badge } from 'react-bootstrap';

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
        <Navbar bg="dark" variant="dark" expand="lg" className="py-3 shadow">
          <Container fluid>
            <Navbar.Brand as={Link} to="/admin" className="fw-bold d-flex align-items-center">
              <i className="bi bi-film me-2 text-gold"></i>
              <span className="text-gold">CineBook</span>
              <Badge bg="gold" className="ms-2">ADMIN</Badge>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="admin-navbar" />
            <Navbar.Collapse id="admin-navbar">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/admin" className="d-flex align-items-center">
                  <i className="bi bi-speedometer2 me-1"></i> Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/movies" className="d-flex align-items-center">
                  <i className="bi bi-camera-reels me-1"></i> Movies
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/theaters" className="d-flex align-items-center">
                  <i className="bi bi-building me-1"></i> Theaters
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/showtimes" className="d-flex align-items-center">
                  <i className="bi bi-clock me-1"></i> Showtimes
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/bookings" className="d-flex align-items-center">
                  <i className="bi bi-ticket-perforated me-1"></i> Bookings
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/users" className="d-flex align-items-center">
                  <i className="bi bi-people me-1"></i> Users
                </Nav.Link>
              </Nav>
              <Nav>
                {/* Notifications */}
                <Nav.Link as={Link} to="/admin/notifications" className="position-relative mx-2">
                  <i className="bi bi-bell"></i>
                  <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle p-1">
                    <span className="visually-hidden">3 new notifications</span>
                  </Badge>
                </Nav.Link>
                
                {/* Settings */}
                <Nav.Link as={Link} to="/admin/settings" className="mx-2">
                  <i className="bi bi-gear"></i>
                </Nav.Link>
                
                {/* User Profile Dropdown */}
                <NavDropdown 
                  title={
                    <div className="d-flex align-items-center">
                      <i className="bi bi-person-circle me-2"></i>
                      <span>{user.name || 'Admin'}</span>
                    </div>
                  } 
                  id="admin-dropdown"
                  align="end"
                >
                  <NavDropdown.Header>
                    <div className="text-center">
                      <i className="bi bi-person-circle fs-1 mb-2"></i>
                      <div className="fw-bold">{user.name || 'Admin User'}</div>
                      <div className="small text-muted">{user.email || 'admin@example.com'}</div>
                    </div>
                  </NavDropdown.Header>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={Link} to="/admin/profile" className="d-flex align-items-center">
                    <i className="bi bi-person me-2"></i> Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/settings" className="d-flex align-items-center">
                    <i className="bi bi-gear me-2"></i> Settings
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout} className="d-flex align-items-center text-danger">
                    <i className="bi bi-box-arrow-right me-2"></i> Logout
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
      <footer className="bg-secondary text-light py-3 mt-auto">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <p className="mb-0">&copy; 2025 CineBook Admin Panel. All rights reserved.</p>
            </div>
            <div className="d-none d-md-block">
              <span className="badge bg-dark">Version 1.0.0</span>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default AdminLayout;