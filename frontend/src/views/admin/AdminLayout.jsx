import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

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
              </Nav>
              <Nav>
                <NavDropdown title="Admin" id="admin-dropdown">
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