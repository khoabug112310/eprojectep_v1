import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Container, Row, Col, Carousel, Badge, Form, Alert, Modal } from 'react-bootstrap';
import { movieAPI, theaterAPI } from '../services/api';
import HomeFooter from '../components/HomeFooter';
import MoviePosterWithHover from '../components/MoviePosterWithHover';

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
  const [isQuickBookingVisible, setIsQuickBookingVisible] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerMovie, setTrailerMovie] = useState(null);
  
  // Quick booking state
  const [selectedMovie, setSelectedMovie] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTheater, setSelectedTheater] = useState('');
  const [selectedShowtime, setSelectedShowtime] = useState('');
  const [availableShowtimes, setAvailableShowtimes] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTheaters, setAvailableTheaters] = useState([]);
  const [theaterShowtimes, setTheaterShowtimes] = useState([]);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [quickBookingError, setQuickBookingError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesResponse, theatersResponse] = await Promise.all([
          movieAPI.getAll(),
          theaterAPI.getAll()
        ]);
        
        const moviesData = moviesResponse.data.data?.data || moviesResponse.data.data || [];
        const theatersData = theatersResponse.data.data?.data || theatersResponse.data.data || [];
        
        console.log('Movies data:', moviesData);
        console.log('Theaters data:', theatersData);
        
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

  // Handle scroll to hide/show quick booking
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Hide quick booking when scrolled down more than half viewport height
      if (scrollY > windowHeight * 0.5) {
        setIsQuickBookingVisible(false);
      } else {
        setIsQuickBookingVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Get featured movies (first 5)
  const featuredMovies = movies.slice(0, 5);
  
  // Get now showing movies (next 8)
  const nowShowing = movies.slice(5, 13);
  
  // Get coming soon movies (next 8)
  const comingSoon = movies.slice(13, 21);

  // Generate next 7 days from today
  const getNext7Days = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      dates.push(dateStr);
    }
    console.log('Generated next 7 days:', dates);
    return dates;
  };

  // Fetch showtimes and available dates when movie is selected
  useEffect(() => {
    const fetchShowtimes = async () => {
      if (selectedMovie) {
        setLoadingShowtimes(true);
        console.log('Fetching showtimes for movie:', selectedMovie);
        try {
          // Fetch showtimes for the selected movie
          const response = await movieAPI.getShowtimes(selectedMovie);
          console.log('Showtimes response:', response);
          console.log('Raw response data:', response.data);
          let showtimesData = [];
          
          if (response.data?.data?.data) {
            showtimesData = response.data.data.data;
            console.log('Using paginated data path');
          } else if (response.data?.data) {
            showtimesData = response.data.data;
            console.log('Using non-paginated data path');
          } else {
            showtimesData = response.data || [];
            console.log('Using fallback data path');
          }
          
          console.log('Processed showtimes data:', showtimesData);
          console.log('Showtimes data length:', showtimesData.length);
          
          // Get next 7 days starting from today
          const next7Days = getNext7Days();
          console.log('Next 7 days:', next7Days);
          
          // Log all showtime dates to debug
          const allShowtimeDates = showtimesData.map(s => s.show_date.split('T')[0]);
          console.log('All showtime dates from API:', allShowtimeDates);
          
          // Filter showtimes for the next 7 days only
          const futureShowtimes = showtimesData.filter(showtime => {
            // Convert ISO date to YYYY-MM-DD format for comparison
            const showtimeDate = showtime.show_date.split('T')[0]; // Extract date part from ISO string
            return next7Days.includes(showtimeDate);
          });
          
          console.log('Filtered showtimes for next 7 days:', futureShowtimes);
          setAvailableShowtimes(futureShowtimes);
          
          // Extract unique dates from filtered showtimes, maintain order of next 7 days
          const showtimeDates = [...new Set(futureShowtimes.map(showtime => showtime.show_date.split('T')[0]))];
          const availableDatesInOrder = next7Days.filter(date => showtimeDates.includes(date));
          
          console.log('Available dates in order:', availableDatesInOrder);
          setAvailableDates(availableDatesInOrder);
          
        } catch (error) {
          console.error('Error fetching showtimes:', error);
          setAvailableShowtimes([]);
          setAvailableDates([]);
        } finally {
          setLoadingShowtimes(false);
        }
      } else {
        setAvailableShowtimes([]);
        setAvailableDates([]);
        setAvailableTheaters([]);
        setTheaterShowtimes([]);
        setSelectedDate('');
        setSelectedTheater('');
        setSelectedShowtime('');
      }
    };
    
    fetchShowtimes();
  }, [selectedMovie]);

  // Filter theaters when date is selected
  useEffect(() => {
    if (selectedDate && availableShowtimes.length > 0) {
      console.log('Filtering theaters for date:', selectedDate);
      
      // Filter showtimes by selected date
      const dateShowtimes = availableShowtimes.filter(showtime => 
        showtime.show_date.split('T')[0] === selectedDate // Handle ISO date format
      );
      
      console.log('Showtimes for selected date:', dateShowtimes);
      
      // Extract unique theaters for that date
      const uniqueTheaters = [];
      const theaterIds = new Set();
      
      dateShowtimes.forEach(showtime => {
        if (showtime.theater && !theaterIds.has(showtime.theater.id)) {
          theaterIds.add(showtime.theater.id);
          uniqueTheaters.push(showtime.theater);
        }
      });
      
      console.log('Available theaters:', uniqueTheaters);
      setAvailableTheaters(uniqueTheaters);
    } else {
      setAvailableTheaters([]);
      setTheaterShowtimes([]);
      setSelectedTheater('');
      setSelectedShowtime('');
    }
  }, [selectedDate, availableShowtimes]);

  // Filter showtimes for selected theater and date
  useEffect(() => {
    if (selectedTheater && selectedDate && availableShowtimes.length > 0) {
      console.log('Filtering showtimes for theater ID:', selectedTheater, '(type:', typeof selectedTheater, ') and date:', selectedDate);
      console.log('Available showtimes sample:', availableShowtimes[0]);
      
      // Filter showtimes for the selected theater and date
      const theaterTimes = availableShowtimes.filter(showtime => {
        const matchesTheater = parseInt(showtime.theater_id) === parseInt(selectedTheater);
        const matchesDate = showtime.show_date.split('T')[0] === selectedDate;
        console.log(`Showtime ${showtime.id}: theater_id=${showtime.theater_id} (${typeof showtime.theater_id}), selected=${selectedTheater} (${typeof selectedTheater}), matches theater=${matchesTheater}, matches date=${matchesDate}`);
        return matchesTheater && matchesDate;
      });
      
      console.log('Filtered theater times:', theaterTimes);
      setTheaterShowtimes(theaterTimes);
    } else {
      setTheaterShowtimes([]);
      setSelectedShowtime('');
    }
  }, [selectedTheater, selectedDate, availableShowtimes]);

  // Reset selections when dependencies change
  useEffect(() => {
    setSelectedDate('');
    setSelectedTheater('');
    setSelectedShowtime('');
  }, [selectedMovie]);
  
  useEffect(() => {
    setSelectedTheater('');
    setSelectedShowtime('');
  }, [selectedDate]);
  
  useEffect(() => {
    setSelectedShowtime('');
  }, [selectedTheater]);

  // Handle quick booking form submission
  const handleQuickBooking = () => {
    setQuickBookingError('');
    
    if (!selectedMovie) {
      setQuickBookingError('Please select a movie');
      return;
    }
    
    if (!selectedDate) {
      setQuickBookingError('Please select a date');
      return;
    }
    
    if (!selectedTheater) {
      setQuickBookingError('Please select a theater');
      return;
    }
    
    if (!selectedShowtime) {
      setQuickBookingError('Please select a showtime');
      return;
    }
    
    // Navigate directly to seat selection page
    navigate(`/booking/seats/${selectedShowtime}`);
  };

  // Format date display
  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format showtime display
  const formatTimeDisplay = (showtime) => {
    return showtime.show_time;
  };

  // Convert YouTube URL to embed format
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;

    // If it's already an embed URL, return as is
    if (url.includes('/embed/')) {
      return url;
    }

    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
      // Convert to embed URL with autoplay and sound enabled
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=0`;
    }

    return null;
  };

  // Handle trailer button click
  const handleTrailerClick = (movie) => {
    setTrailerMovie(movie);
    setShowTrailer(true);
  };

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
        <style>
          {`
            .hero-carousel .carousel-control-prev,
            .hero-carousel .carousel-control-next {
              width: 40px;
              height: 40px;
              top: 50%;
              transform: translateY(-50%);
              opacity: 0.7;
              border-radius: 50%;
              background-color: rgba(0, 0, 0, 0.5);
            }
            .hero-carousel .carousel-control-prev {
              left: 10px;
            }
            .hero-carousel .carousel-control-next {
              right: 10px;
            }
            .hero-carousel .carousel-control-prev-icon,
            .hero-carousel .carousel-control-next-icon {
              width: 20px;
              height: 20px;
            }
            .hero-carousel .carousel-control-prev:hover,
            .hero-carousel .carousel-control-next:hover {
              opacity: 1;
            }
          `}
        </style>
        <Carousel indicators={true} controls={true} interval={5000} pause={false} className="hero-carousel">
          {featuredMovies.map((movie) => {
            const genres = normalizeGenre(movie.genre);
            return (
              <Carousel.Item key={movie.id}>
                <div 
                  className="d-flex align-items-center hero-slide" 
                  style={{ 
                    minHeight: '55vh',
                    maxHeight: '55vh',
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
                          <div className="mt-4 d-flex flex-wrap gap-2">
                            <Button 
                              as={Link} 
                              to={`/movies/${movie.id}`} 
                              variant="primary" 
                              size="lg" 
                              className="px-4 py-2"
                              style={{ minWidth: '150px', fontWeight: '600' }}
                            >
                              View Details
                            </Button>
                            <Button 
                              as={Link} 
                              to={`/movies/${movie.id}`} 
                              variant="outline-light" 
                              size="lg"
                              className="px-4 py-2"
                              style={{ minWidth: '150px', fontWeight: '600' }}
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
      {isQuickBookingVisible && (
        <Container className="mb-5">
          <Card className="bg-dark border-gold" style={{
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
            opacity: isQuickBookingVisible ? 1 : 0,
            transform: isQuickBookingVisible ? 'translateY(0)' : 'translateY(-20px)'
          }}>
          <Card.Body>
            <h2 className="text-gold text-center mb-4">Quick Booking</h2>
            
            {quickBookingError && (
              <Alert variant="danger" className="mb-3">
                {quickBookingError}
              </Alert>
            )}
            
            <Row className="align-items-end">
              <Col lg={2} md={3} className="mb-3">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-film text-gold me-2 fs-5"></i>
                  <label className="text-white fw-semibold">Movie</label>
                </div>
                <Form.Select 
                  value={selectedMovie} 
                  onChange={(e) => setSelectedMovie(e.target.value)}
                  className="bg-secondary text-white border-gold"
                  size="sm"
                >
                  <option value="">Choose Movie...</option>
                  {movies.filter(movie => movie.status === 'active').map((movie) => (
                    <option key={movie.id} value={movie.id}>
                      {movie.title}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              
              <Col lg={2} md={3} className="mb-3">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-calendar3 text-gold me-2 fs-5"></i>
                  <label className="text-white fw-semibold">Date</label>
                </div>
                <Form.Select 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-secondary text-white border-gold"
                  size="sm"
                  disabled={!selectedMovie || loadingShowtimes}
                >
                  <option value="">
                    {loadingShowtimes ? 'Loading...' : 
                     !selectedMovie ? 'Select movie first' : 
                     availableDates.length === 0 ? 'No dates available' : 
                     'Choose Date...'}
                  </option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {formatDateDisplay(date)}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              
              <Col lg={2} md={3} className="mb-3">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-geo-alt text-gold me-2 fs-5"></i>
                  <label className="text-white fw-semibold">Theater</label>
                </div>
                <Form.Select 
                  value={selectedTheater} 
                  onChange={(e) => setSelectedTheater(e.target.value)}
                  className="bg-secondary text-white border-gold"
                  size="sm"
                  disabled={!selectedDate}
                >
                  <option value="">
                    {!selectedDate ? 'Select date first' : 
                     availableTheaters.length === 0 ? 'No theaters available' : 
                     'Choose Theater...'}
                  </option>
                  {availableTheaters.map((theater) => (
                    <option key={theater.id} value={theater.id}>
                      {theater.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              
              <Col lg={2} md={3} className="mb-3">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-clock text-gold me-2 fs-5"></i>
                  <label className="text-white fw-semibold">Time</label>
                </div>
                <Form.Select 
                  value={selectedShowtime} 
                  onChange={(e) => setSelectedShowtime(e.target.value)}
                  className="bg-secondary text-white border-gold"
                  size="sm"
                  disabled={!selectedTheater}
                >
                  <option value="">
                    {!selectedTheater ? 'Select theater first' : 
                     theaterShowtimes.length === 0 ? 'No times available' : 
                     'Choose Time...'}
                  </option>
                  {theaterShowtimes.map((showtime) => (
                    <option key={showtime.id} value={showtime.id}>
                      {formatTimeDisplay(showtime)}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              
              <Col lg={4} md={12} className="text-center mb-3">
                <Button 
                  onClick={handleQuickBooking}
                  variant="primary" 
                  size="lg" 
                  className="w-100"
                  disabled={!selectedMovie || !selectedDate || !selectedTheater || !selectedShowtime}
                >
                  <i className="bi bi-ticket-perforated me-2"></i>
                  Book Now
                </Button>
                {loadingShowtimes && (
                  <div className="mt-2">
                    <div className="spinner-border spinner-border-sm text-gold" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}
              </Col>
            </Row>
            
            {/* Alternative actions */}
            <Row className="mt-3">
              <Col className="text-center">
                <small className="text-muted">Or browse by: </small>
                <Button as={Link} to="/movies" variant="link" size="sm" className="text-gold p-1">
                  All Movies
                </Button>
                <span className="text-muted">|</span>
                <Button as={Link} to="/theaters" variant="link" size="sm" className="text-gold p-1">
                  All Theaters
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
      )}

      {/* Now Showing Section */}
      <Container className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-gold">Now Showing</h2>
          <Button as={Link} to="/movies" variant="outline-primary">
            View All Movies
          </Button>
        </div>
        
        <Row>
          {nowShowing.map((movie) => (
            <Col key={movie.id} md={6} lg={3} className="mb-4">
              <MoviePosterWithHover 
                movie={movie} 
                onTrailerClick={handleTrailerClick}
              />
            </Col>
          ))}
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
          {comingSoon.map((movie) => (
            <Col key={movie.id} md={6} lg={3} className="mb-4">
              <MoviePosterWithHover 
                movie={movie} 
                isComingSoon={true}
                onTrailerClick={handleTrailerClick}
              />
            </Col>
          ))}
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

      {/* Trailer Modal */}
      <Modal show={showTrailer} onHide={() => setShowTrailer(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{trailerMovie?.title} - Trailer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {trailerMovie && trailerMovie.trailer_url && (
            <div className="ratio ratio-16x9">
              <iframe
                src={getYouTubeEmbedUrl(trailerMovie.trailer_url)}
                title={`${trailerMovie.title} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Home Footer Sections */}
      <HomeFooter />
    </div>
  );
};

export default Home;