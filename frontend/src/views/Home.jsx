import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Container, Row, Col, Carousel, Badge } from 'react-bootstrap';
import { movieAPI, theaterAPI } from '../services/api';

// Function to normalize genre data
const normalizeGenre = (genre) => {
  if (!genre) return [];
  
  // If it's already an array, return as is
  if (Array.isArray(genre)) return genre;
  
  // If it's a string, try to parse as JSON first
  if (typeof genre === 'string') {
    try {
      const parsed = JSON.parse(genre);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // If JSON parsing fails, split by comma
      return genre.split(',').map(g => g.trim()).filter(g => g);
    }
  }
  
  // Fallback: return as array with single item
  return [String(genre)];
};

// Function to normalize facilities data
const normalizeFacilities = (facilities) => {
  if (!facilities) return [];
  
  // If it's already an array, return as is
  if (Array.isArray(facilities)) return facilities;
  
  // If it's a string, try to parse as JSON
  if (typeof facilities === 'string') {
    try {
      const parsed = JSON.parse(facilities);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // If JSON parsing fails, split by comma
      return facilities.split(',').map(f => f.trim()).filter(f => f);
    }
  }
  
  // Fallback: return as array with single item
  return [String(facilities)];
};

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesResponse, theatersResponse] = await Promise.all([
          movieAPI.getAll(),
          theaterAPI.getAll()
        ]);
        
        const moviesData = moviesResponse.data.data?.data || moviesResponse.data.data || [];
        const theatersData = theatersResponse.data.data?.data || theatersResponse.data.data || [];
        
        setMovies(moviesData);
        setTheaters(theatersData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data: ' + err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get featured movies (first 5)
  const featuredMovies = movies.slice(0, 5);
  
  // Get now showing movies (next 8)
  const nowShowing = movies.slice(5, 13);
  
  // Get coming soon movies (next 8)
  const comingSoon = movies.slice(13, 21);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-gold" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section with Featured Movies Carousel */}
      <section className="hero-section mb-5">
        <Carousel indicators={true} controls={true} interval={5000} pause={false}>
          {featuredMovies.map((movie) => {
            const genres = normalizeGenre(movie.genre);
            return (
              <Carousel.Item key={movie.id}>
                <div 
                  className="d-flex align-items-center hero-slide" 
                  style={{ 
                    minHeight: '70vh',
                    background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${movie.poster_url || "https://placehold.co/1200x600/1f1f1f/ffd700?text=Featured+Movie"})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <Container>
                    <Row>
                      <Col md={6}>
                        <div className="hero-content text-white">
                          <h1 className="display-4 fw-bold text-gold">{movie.title}</h1>
                          <div className="mb-3">
                            {genres.map((genre, index) => (
                              <Badge key={index} bg="secondary" className="me-2">{genre}</Badge>
                            ))}
                            <Badge bg="secondary" className="me-2">{movie.language}</Badge>
                            <Badge bg="secondary">{movie.duration} min</Badge>
                          </div>
                          <p className="lead">{movie.synopsis?.substring(0, 200) || 'No description available'}...</p>
                          <div className="mt-4">
                            <Button 
                              as={Link} 
                              to={`/movies/${movie.id}`} 
                              variant="primary" 
                              size="lg" 
                              className="me-3"
                            >
                              View Details
                            </Button>
                            <Button 
                              as={Link} 
                              to={`/movies/${movie.id}`} 
                              variant="outline-light" 
                              size="lg"
                            >
                              Book Tickets
                            </Button>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Container>
                </div>
              </Carousel.Item>
            );
          })}
        </Carousel>
      </section>

      {/* Quick Booking Section */}
      <Container className="mb-5">
        <Card className="bg-dark border-gold">
          <Card.Body>
            <h2 className="text-gold text-center mb-4">Quick Booking</h2>
            <Row className="align-items-center">
              <Col md={3} className="mb-3 mb-md-0">
                <div className="d-flex align-items-center">
                  <i className="bi bi-film text-gold me-2 fs-4"></i>
                  <div>
                    <h5 className="text-white mb-0">Find Movies</h5>
                    <p className="text-muted mb-0">Browse our collection</p>
                  </div>
                </div>
              </Col>
              <Col md={3} className="mb-3 mb-md-0">
                <div className="d-flex align-items-center">
                  <i className="bi bi-geo-alt text-gold me-2 fs-4"></i>
                  <div>
                    <h5 className="text-white mb-0">Choose Theater</h5>
                    <p className="text-muted mb-0">Select your location</p>
                  </div>
                </div>
              </Col>
              <Col md={3} className="mb-3 mb-md-0">
                <div className="d-flex align-items-center">
                  <i className="bi bi-calendar-check text-gold me-2 fs-4"></i>
                  <div>
                    <h5 className="text-white mb-0">Pick Time</h5>
                    <p className="text-muted mb-0">Select showtime</p>
                  </div>
                </div>
              </Col>
              <Col md={3} className="text-center">
                <Button as={Link} to="/movies" variant="primary" size="lg">
                  Book Now
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>

      {/* Now Showing Section */}
      <Container className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-gold">Now Showing</h2>
          <Button as={Link} to="/movies" variant="outline-primary">
            View All Movies
          </Button>
        </div>
        
        <Row>
          {nowShowing.map((movie) => {
            const genres = normalizeGenre(movie.genre);
            return (
              <Col key={movie.id} md={6} lg={3} className="mb-4">
                <Card className="h-100 movie-card">
                  <div className="position-relative">
                    {/* Make the movie poster clickable to go to movie detail page */}
                    <Link to={`/movies/${movie.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <Card.Img 
                        variant="top" 
                        src={movie.poster_url || "https://placehold.co/300x450/1f1f1f/ffd700?text=Movie"} 
                        style={{ height: '350px', objectFit: 'cover', cursor: 'pointer' }}
                      />
                    </Link>
                    <Badge bg="gold" className="position-absolute top-0 end-0 m-2">
                      ⭐ {movie.average_rating || 'N/A'}
                    </Badge>
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="fs-6 fw-bold">{movie.title}</Card.Title>
                    <div className="mb-2">
                      <small className="text-muted">
                        {genres.slice(0, 2).join(', ')}
                      </small>
                    </div>
                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-gold">{movie.duration} min</span>
                        <Button 
                          as={Link} 
                          to={`/movies/${movie.id}`} 
                          variant="outline-primary" 
                          size="sm"
                        >
                          Book
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>

      {/* Coming Soon Section */}
      <Container className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-gold">Coming Soon</h2>
          <Button as={Link} to="/movies?status=coming_soon" variant="outline-primary">
            View All Upcoming
          </Button>
        </div>
        
        <Row>
          {comingSoon.map((movie) => {
            const genres = normalizeGenre(movie.genre);
            return (
              <Col key={movie.id} md={6} lg={3} className="mb-4">
                <Card className="h-100 movie-card">
                  <div className="position-relative">
                    {/* Make the movie poster clickable to go to movie detail page */}
                    <Link to={`/movies/${movie.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <Card.Img 
                        variant="top" 
                        src={movie.poster_url || "https://placehold.co/300x450/1f1f1f/ffd700?text=Coming+Soon"} 
                        style={{ height: '350px', objectFit: 'cover', cursor: 'pointer' }}
                      />
                    </Link>
                    <Badge bg="warning" className="position-absolute top-0 end-0 m-2 text-dark">
                      Coming Soon
                    </Badge>
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="fs-6 fw-bold">{movie.title}</Card.Title>
                    <div className="mb-2">
                      <small className="text-muted">
                        {genres.slice(0, 2).join(', ')}
                      </small>
                    </div>
                    <Card.Text className="text-muted small">
                      {movie.release_date ? new Date(movie.release_date).toLocaleDateString() : 'TBA'}
                    </Card.Text>
                    <div className="mt-auto">
                      <Button 
                        as={Link} 
                        to={`/movies/${movie.id}`} 
                        variant="outline-primary" 
                        size="sm"
                      >
                        Details
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>

      {/* Theaters Section */}
      <Container className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-gold">Our Theaters</h2>
          <Button as={Link} to="/theaters" variant="outline-primary">
            View All Theaters
          </Button>
        </div>
        
        <Row>
          {theaters.slice(0, 4).map((theater) => {
            const facilities = normalizeFacilities(theater.facilities);
            return (
              <Col key={theater.id} md={6} lg={3} className="mb-4">
                <Card className="h-100">
                  <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center me-3" 
                           style={{ width: '50px', height: '50px' }}>
                        <i className="bi bi-building text-gold fs-4"></i>
                      </div>
                      <Card.Title className="text-gold mb-0">{theater.name}</Card.Title>
                    </div>
                    <Card.Text>
                      <strong>Location:</strong> {theater.city}<br />
                      <strong>Address:</strong> {theater.address?.substring(0, 30)}...
                    </Card.Text>
                    <div className="mb-3">
                      <strong>Facilities:</strong>
                      <div>
                        {facilities.slice(0, 3).map((facility, index) => (
                          <Badge key={index} bg="secondary" className="me-1 mt-1">
                            {facility}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button as={Link} to={`/theaters/${theater.id}`} variant="outline-primary" size="sm" className="w-100">
                      View Details
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>

      {/* Promotions Section */}
      <section className="promotions-section py-5">
        <Container>
          <h2 className="text-gold text-center mb-4">Special Offers & Promotions</h2>
          <p className="text-center text-gray mb-5">Enjoy exclusive deals and discounts on your movie experience</p>
          <Row>
            <Col md={4} className="mb-4">
              <Card className="h-100 bg-dark border-gold">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <div className="bg-gold rounded-circle d-inline-flex align-items-center justify-content-center" 
                         style={{ width: '70px', height: '70px' }}>
                      <i className="bi bi-people text-dark fs-2"></i>
                    </div>
                  </div>
                  <h3 className="text-gold">Family Pack</h3>
                  <p className="text-gray">Book 4 tickets and get 1 free for select movies. Perfect for family outings!</p>
                  <Button as={Link} to="/movies" variant="primary">Learn More</Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100 bg-dark border-gold">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <div className="bg-gold rounded-circle d-inline-flex align-items-center justify-content-center" 
                         style={{ width: '70px', height: '70px' }}>
                      <i className="bi bi-mortarboard text-dark fs-2"></i>
                    </div>
                  </div>
                  <h3 className="text-gold">Student Discount</h3>
                  <p className="text-gray">20% off for students with valid ID. Show your student card at the counter.</p>
                  <Button as={Link} to="/movies" variant="primary">Learn More</Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100 bg-dark border-gold">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <div className="bg-gold rounded-circle d-inline-flex align-items-center justify-content-center" 
                         style={{ width: '70px', height: '70px' }}>
                      <i className="bi bi-sunrise text-dark fs-2"></i>
                    </div>
                  </div>
                  <h3 className="text-gold">Early Bird</h3>
                  <p className="text-gray">15% off for shows before 12 PM. Catch the early show and save!</p>
                  <Button as={Link} to="/movies" variant="primary">Learn More</Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* How It Works Section */}
      <Container className="mb-5">
        <h2 className="text-gold text-center mb-5">How It Works</h2>
        <Row>
          <Col md={3} className="text-center mb-4">
            <div className="bg-dark rounded-circle d-inline-flex align-items-center justify-content-center mb-3 mx-auto" 
                 style={{ width: '80px', height: '80px' }}>
              <span className="text-gold fs-3">1</span>
            </div>
            <h4 className="text-white">Choose Movie</h4>
            <p className="text-gray">Browse our collection and select the movie you want to watch</p>
          </Col>
          <Col md={3} className="text-center mb-4">
            <div className="bg-dark rounded-circle d-inline-flex align-items-center justify-content-center mb-3 mx-auto" 
                 style={{ width: '80px', height: '80px' }}>
              <span className="text-gold fs-3">2</span>
            </div>
            <h4 className="text-white">Select Showtime</h4>
            <p className="text-gray">Pick your preferred date, time, and theater location</p>
          </Col>
          <Col md={3} className="text-center mb-4">
            <div className="bg-dark rounded-circle d-inline-flex align-items-center justify-content-center mb-3 mx-auto" 
                 style={{ width: '80px', height: '80px' }}>
              <span className="text-gold fs-3">3</span>
            </div>
            <h4 className="text-white">Pick Seats</h4>
            <p className="text-gray">Choose your favorite seats from our interactive seat map</p>
          </Col>
          <Col md={3} className="text-center mb-4">
            <div className="bg-dark rounded-circle d-inline-flex align-items-center justify-content-center mb-3 mx-auto" 
                 style={{ width: '80px', height: '80px' }}>
              <span className="text-gold fs-3">4</span>
            </div>
            <h4 className="text-white">Enjoy Movie</h4>
            <p className="text-gray">Receive your e-ticket and enjoy your movie experience</p>
          </Col>
        </Row>
      </Container>

      {/* Testimonials Section */}
      <section className="py-5 bg-dark">
        <Container>
          <h2 className="text-gold text-center mb-5">What Our Customers Say</h2>
          <Row>
            <Col md={4} className="mb-4">
              <Card className="h-100 bg-secondary">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-dark rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style={{ width: '50px', height: '50px' }}>
                      <span className="text-gold">JD</span>
                    </div>
                    <div>
                      <h5 className="text-white mb-0">John Doe</h5>
                      <div className="text-gold">
                        {'★'.repeat(5)}
                      </div>
                    </div>
                  </div>
                  <Card.Text className="text-gray">
                    "The booking process was so smooth and easy. I love the seat selection feature!"
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100 bg-secondary">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-dark rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style={{ width: '50px', height: '50px' }}>
                      <span className="text-gold">MS</span>
                    </div>
                    <div>
                      <h5 className="text-white mb-0">Mary Smith</h5>
                      <div className="text-gold">
                        {'★'.repeat(4)}
                      </div>
                    </div>
                  </div>
                  <Card.Text className="text-gray">
                    "Great movie selection and the theaters are always clean and comfortable."
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100 bg-secondary">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-dark rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style={{ width: '50px', height: '50px' }}>
                      <span className="text-gold">RP</span>
                    </div>
                    <div>
                      <h5 className="text-white mb-0">Robert Park</h5>
                      <div className="text-gold">
                        {'★'.repeat(5)}
                      </div>
                    </div>
                  </div>
                  <Card.Text className="text-gray">
                    "The early bird discount saved me money and the staff were very helpful."
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home;