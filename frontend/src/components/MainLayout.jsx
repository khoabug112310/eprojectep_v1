import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Navbar, Container, Nav } from 'react-bootstrap';

const MainLayout = () => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-dark">
      {/* Header */}
      <header>
        <Navbar bg="dark" variant="dark" expand="lg" className="py-3">
          <Container>
            <Navbar.Brand as={Link} to="/" className="fw-bold">
              🎬 CineBook
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="main-navbar" />
            <Navbar.Collapse id="main-navbar">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/movies">Movies</Nav.Link>
                <Nav.Link as={Link} to="/showtimes">Showtimes</Nav.Link>
                <Nav.Link as={Link} to="/theaters">Theaters</Nav.Link>
              </Nav>
              <Nav>
                <Nav.Link as={Link} to="/auth/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/auth/register">Sign Up</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </header>

      {/* Main Content */}
      <main className="flex-grow-1 py-4">
        <Container>
          <Outlet />
        </Container>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-light py-4 mt-auto">
        <Container>
          <div className="row">
            <div className="col-md-4 mb-4 mb-md-0">
              <h5 className="text-gold">CineBook</h5>
              <p>Your ultimate cinema experience</p>
            </div>
            <div className="col-md-4 mb-4 mb-md-0">
              <h5>Navigation</h5>
              <ul className="list-unstyled">
                <li><Nav.Link as={Link} to="/" className="text-light p-0">Home</Nav.Link></li>
                <li><Nav.Link as={Link} to="/movies" className="text-light p-0">Movies</Nav.Link></li>
                <li><Nav.Link as={Link} to="/showtimes" className="text-light p-0">Showtimes</Nav.Link></li>
                <li><Nav.Link as={Link} to="/theaters" className="text-light p-0">Theaters</Nav.Link></li>
              </ul>
            </div>
            <div className="col-md-4">
              <h5>Contact</h5>
              <p>Email: info@cinebook.com</p>
              <p>Phone: +1 (555) 123-4567</p>
            </div>
          </div>
          <hr className="my-4" />
          <div className="text-center">
            <p>&copy; 2025 CineBook. All rights reserved.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default MainLayout;