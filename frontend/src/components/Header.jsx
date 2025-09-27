import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Container, Navbar, Nav, NavDropdown, Form, FormControl, Badge } from 'react-bootstrap';

const Header = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
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
    <header className="bg-dark border-bottom border-secondary sticky-top">
      <Navbar bg="dark" variant="dark" expand="lg" className="py-2 shadow">
        <Container>
          {/* Logo */}
          <Navbar.Brand as={Link} to="/home" className="fw-bold me-3 d-flex align-items-center">
            <img 
              src="/image/Gemini_Generated_Image_a55g0ka55g0ka55g.png" 
              alt="CineBook" 
              style={{ width: '120px', height: '30px', objectFit: 'contain' }}
            />
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="home-navbar" />
          <Navbar.Collapse id="home-navbar">
            {/* Navigation Menu - Left aligned next to logo */}
            <Nav className="me-auto">
              {/* Movie Types Filter - Shows movies by actual genre */}
              <NavDropdown title="Movie Types" id="movie-types-dropdown" className="me-2">
                <NavDropdown.Item as={Link} to="/movies?genre=action">Action</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/movies?genre=comedy">Comedy</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/movies?genre=drama">Drama</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/movies?genre=horror">Horror</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/movies?genre=sci-fi">Sci-Fi</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/movies?genre=romance">Romance</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/movies?genre=thriller">Thriller</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/movies?genre=animation">Animation</NavDropdown.Item>
              </NavDropdown>
              
              {/* Showtime Filter - Shows movies by actual time slots */}
              <NavDropdown title="Showtimes" id="showtimes-dropdown" className="me-2">
                <NavDropdown.Item as={Link} to="/movies?showtime=morning">Morning (9AM-12PM)</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/movies?showtime=afternoon">Afternoon (12PM-5PM)</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/movies?showtime=evening">Evening (5PM-9PM)</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/movies?showtime=night">Night (9PM+)</NavDropdown.Item>
              </NavDropdown>
              
              {/* Theater Filter - Shows movies by actual theaters/cities */}
              <NavDropdown title="Theaters" id="theaters-dropdown" className="me-2">
                <NavDropdown.Item as={Link} to="/theaters?city=hanoi">Hanoi</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/theaters?city=ho-chi-minh">Ho Chi Minh City</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/theaters?city=da-nang">Da Nang</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/theaters?city=can-tho">Can Tho</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/theaters?city=hue">Hue</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/theaters?city=nha-trang">Nha Trang</NavDropdown.Item>
              </NavDropdown>
              
              {/* New Releases - Show recent movies (last 10 added) */}
              <Nav.Link as={Link} to="/movies?sort=newest" className="me-2">New Releases</Nav.Link>
              
              {/* Top Rated - Show highly rated movies (top 10 by rating) */}
              <Nav.Link as={Link} to="/movies?sort=rating" className="me-2">Top Rated</Nav.Link>
            </Nav>
            
            {/* Search Bar - Left side next to navigation */}
            <Form className="d-flex me-3" style={{ maxWidth: '300px' }} onSubmit={handleSearch}>
              <FormControl
                type="search"
                placeholder="Search movies..."
                className="me-2"
                aria-label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="sm"
                style={{ height: '40px' }}
              />
              <Button 
                variant="outline-warning" 
                type="submit"
                size="sm"
                style={{ 
                  height: '40px',
                  backgroundColor: '#000000',
                  color: '#FFD700',
                  borderColor: '#FFD700'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(to right, #FFD700, #FFA500)';
                  e.target.style.color = '#000000';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#000000';
                  e.target.style.color = '#FFD700';
                }}
              >
                <i className="bi bi-search"></i>
              </Button>
            </Form>
            
            {/* User Authentication Section */}
            <Nav>
              {user ? (
                <>
                  {/* Notifications for logged in users */}
                  <Nav.Link as={Link} to="/notifications" className="position-relative mx-2">
                    <i className="bi bi-bell"></i>
                    <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle p-1">
                      <span className="visually-hidden">3 new notifications</span>
                    </Badge>
                  </Nav.Link>
                  
                  <NavDropdown 
                    title={
                      <div className="d-flex align-items-center">
                        <i className="bi bi-person-circle me-2"></i>
                        <span>{user.name || 'User'}</span>
                      </div>
                    } 
                    id="user-dropdown"
                    align="end"
                  >
                    <NavDropdown.Header>
                      <div className="text-center">
                        <i className="bi bi-person-circle fs-1 mb-2"></i>
                        <div className="fw-bold">{user.name || 'User'}</div>
                        <div className="small text-muted">{user.email || 'user@example.com'}</div>
                      </div>
                    </NavDropdown.Header>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/profile" className="d-flex align-items-center">
                      <i className="bi bi-person me-2"></i> Profile
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/my-bookings" className="d-flex align-items-center">
                      <i className="bi bi-ticket-perforated me-2"></i> My Bookings
                    </NavDropdown.Item>
                    {user.role === 'admin' && (
                      <NavDropdown.Item as={Link} to="/admin" className="d-flex align-items-center">
                        <i className="bi bi-gear me-2"></i> Admin Panel
                      </NavDropdown.Item>
                    )}
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout} className="d-flex align-items-center text-danger">
                      <i className="bi bi-box-arrow-right me-2"></i> Logout
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/auth/login" className="me-2">
                    <i className="bi bi-box-arrow-in-right me-1"></i>Login
                  </Nav.Link>
                  <Nav.Link as={Link} to="/auth/register">
                    <i className="bi bi-person-plus me-1"></i>Sign Up
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;