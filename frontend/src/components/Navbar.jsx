import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Container, Nav, NavDropdown, Form, FormControl, Button } from 'react-bootstrap';
import './MainLayout.css'; // Import the CSS file

const NavbarComponent = () => {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="py-2">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          <img src="./image/Gemini_Generated_Image_a55g0ka55g0ka55g.png" alt="CineBook" width="140" height="80" className="d-inline-block align-top me-2" />
          
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          {/* Navigation items moved to the left, next to logo */}
          <Nav className="me-auto">
            <NavDropdown title="Movie Types" id="movie-types-dropdown">
              <NavDropdown.Item as={Link} to="/movies?type=action">Action</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/movies?type=comedy">Comedy</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/movies?type=drama">Drama</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/movies?type=horror">Horror</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/movies?type=sci-fi">Sci-Fi</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/movies?type=romance">Romance</NavDropdown.Item>
            </NavDropdown>
            
            <NavDropdown title="Showtimes" id="showtimes-dropdown">
              <NavDropdown.Item as={Link} to="/movies?showtime=morning">Morning (9AM-12PM)</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/movies?showtime=afternoon">Afternoon (12PM-5PM)</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/movies?showtime=evening">Evening (5PM-9PM)</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/movies?showtime=night">Night (9PM+)</NavDropdown.Item>
            </NavDropdown>
            
            <NavDropdown title="Theaters" id="theaters-dropdown">
              <NavDropdown.Item as={Link} to="/theaters?city=hanoi">Hanoi</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/theaters?city=ho-chi-minh">Ho Chi Minh City</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/theaters?city=da-nang">Da Nang</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/theaters?city=can-tho">Can Tho</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/theaters?city=hue">Hue</NavDropdown.Item>
            </NavDropdown>
            
            <Nav.Link as={Link} to="/movies?sort=popularity">Popular</Nav.Link>
            <Nav.Link as={Link} to="/movies?sort=newest">New Releases</Nav.Link>
            <Nav.Link as={Link} to="/movies?sort=rating">Top Rated</Nav.Link>
          </Nav>
          
          {/* Search bar moved to the left, next to login */}
          <Form className="d-flex me-3" style={{ maxWidth: '300px' }} onSubmit={handleSearch}>
            <FormControl
              type="search"
              placeholder="Search movies..."
              className="me-2"
              aria-label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="sm"
            />
            <Button 
              variant="outline-gold" 
              type="submit"
              size="sm"
              className="btn-search"
            >
              Search
            </Button>
          </Form>
          
          {/* User authentication section */}
          <Nav>
            {user ? (
              <NavDropdown title={user.name || 'User'} id="user-dropdown">
                <NavDropdown.Item as={Link} to="/profile">
                  Profile
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/my-bookings">
                  My Bookings
                </NavDropdown.Item>
                {user.role === 'admin' && (
                  <NavDropdown.Item as={Link} to="/admin">
                    Admin Panel
                  </NavDropdown.Item>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/auth/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/auth/register">Sign Up</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;