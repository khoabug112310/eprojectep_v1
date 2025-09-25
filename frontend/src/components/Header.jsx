import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Container, Row, Col, Navbar, Nav, NavDropdown, Form, FormControl } from 'react-bootstrap';

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
      <Navbar bg="dark" variant="dark" expand="lg" className="py-2">
        <Container>
          {/* Logo */}
          <Navbar.Brand as={Link} to="/" className="fw-bold me-3">
            <img 
              src="./image/Gemini_Generated_Image_a55g0ka55g0ka55g.png" 
              alt="CineBook" 
              width="120" 
              height="60" 
              className="d-inline-block align-top" 
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
                <NavDropdown title={user.name || 'User'} id="user-dropdown">
                  <NavDropdown.Item as={Link} to="/profile">
                    <i className="bi bi-person me-2"></i>Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/my-bookings">
                    <i className="bi bi-ticket-perforated me-2"></i>My Bookings
                  </NavDropdown.Item>
                  {user.role === 'admin' && (
                    <NavDropdown.Item as={Link} to="/admin">
                      <i className="bi bi-gear me-2"></i>Admin Panel
                    </NavDropdown.Item>
                  )}
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>Logout
                  </NavDropdown.Item>
                </NavDropdown>
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
      
      {/* Secondary Filter Bar */}
      <div className="bg-secondary py-2">
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <small className="text-light me-2">Quick Filters:</small>
                <Button 
                  as={Link} 
                  to="/movies?status=now-showing" 
                  variant="outline-light" 
                  size="sm"
                  className="py-1 px-2"
                >
                  Now Showing
                </Button>
                <Button 
                  as={Link} 
                  to="/movies?status=coming-soon" 
                  variant="outline-light" 
                  size="sm"
                  className="py-1 px-2"
                >
                  Coming Soon
                </Button>
                <Button 
                  as={Link} 
                  to="/movies?discount=true" 
                  variant="outline-warning" 
                  size="sm"
                  className="py-1 px-2"
                >
                  Special Offers
                </Button>
                <Button 
                  as={Link} 
                  to="/movies?time=today" 
                  variant="outline-info" 
                  size="sm"
                  className="py-1 px-2"
                >
                  Today's Shows
                </Button>
              </div>
            </Col>
            <Col md={4} className="text-end">
              <small className="text-light me-2">Sort by:</small>
              <Form.Select 
                size="sm" 
                style={{ width: 'auto', display: 'inline-block' }}
                onChange={(e) => {
                  if (e.target.value) {
                    navigate(`/movies?sort=${e.target.value}`);
                  }
                }}
              >
                <option value="">Choose...</option>
                <option value="title">Title A-Z</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Latest Release</option>
                <option value="popularity">Most Popular</option>
                <option value="duration">Duration</option>
              </Form.Select>
            </Col>
          </Row>
        </Container>
      </div>
    </header>
  );
};

export default Header;