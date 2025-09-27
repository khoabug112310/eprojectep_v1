import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Badge, Alert, Spinner, Form, Modal } from 'react-bootstrap';
import { movieAPI, reviewAPI } from '../services/api';
import StarRating from '../components/StarRating';

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

// Function to normalize cast data
const normalizeCast = (cast) => {
  if (!cast) return [];

  // If it's already an array, return as is
  if (Array.isArray(cast)) return cast;

  // If it's a string, try to parse as JSON
  if (typeof cast === 'string') {
    try {
      const parsed = JSON.parse(cast);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // If parsing fails, return empty array
      return [];
    }
  }

  // Fallback: return as array with single item
  return [cast];
};

// Function to group showtimes by date and theater
const groupShowtimesByDateAndTheater = (showtimes) => {
  const grouped = {};

  showtimes.forEach(showtime => {
    const date = showtime.show_date;
    const theaterId = showtime.theater?.id;
    const theaterName = showtime.theater?.name || 'Unknown Theater';

    if (!grouped[date]) {
      grouped[date] = {};
    }

    if (!grouped[date][theaterId]) {
      grouped[date][theaterId] = {
        name: theaterName,
        showtimes: []
      };
    }

    grouped[date][theaterId].showtimes.push(showtime);
  });

  return grouped;
};

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [showAd, setShowAd] = useState(true);

  // Rating state
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [movieReviews, setMovieReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Popup rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        // Validate ID format
        if (!id || isNaN(id)) {
          console.error('Invalid movie ID');
          setLoading(false);
          return;
        }

        const movieResponse = await movieAPI.getById(id);
        const showtimesResponse = await movieAPI.getShowtimes(id);

        // Handle movie data
        const movieData = movieResponse.data?.data || movieResponse.data;
        if (movieData) {
          setMovie(movieData);
        } else {
          console.error('Movie data not found in response');
        }

        // Handle showtimes data
        let showtimesData = [];
        if (showtimesResponse.data?.data?.data) {
          // Paginated response
          showtimesData = showtimesResponse.data.data.data;
        } else if (showtimesResponse.data?.data) {
          // Non-paginated response
          showtimesData = showtimesResponse.data.data;
        } else {
          showtimesData = showtimesResponse.data || [];
        }
        setShowtimes(showtimesData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching movie details:', error);
        setLoading(false);
      }
    };

    if (id) {
      fetchMovieDetails();
    } else {
      setLoading(false);
    }
  }, [id]);

  // Fetch now showing movies
  useEffect(() => {
    const fetchNowShowingMovies = async () => {
      try {
        const response = await movieAPI.getAll({ status: 'active' });
        let moviesData = [];

        if (response.data?.data?.data) {
          // Paginated response
          moviesData = response.data.data.data;
        } else if (response.data?.data) {
          // Non-paginated response
          moviesData = response.data.data;
        } else {
          moviesData = response.data || [];
        }

        // Filter out the current movie and limit to 4 movies
        const filteredMovies = moviesData
          .filter(movieItem => movieItem.id !== parseInt(id))
          .slice(0, 4);

        setNowShowingMovies(filteredMovies);
      } catch (error) {
        console.error('Error fetching now showing movies:', error);
      }
    };

    if (id) {
      fetchNowShowingMovies();
    }
  }, [id]);

  // Set the first date as selected by default when showtimes change
  useEffect(() => {
    if (showtimes.length > 0 && selectedDate === null) {
      const groupedShowtimes = groupShowtimesByDateAndTheater(showtimes);
      const sortedDates = Object.keys(groupedShowtimes)
        .sort((a, b) => new Date(a) - new Date(b))
        .filter(date => new Date(date) >= new Date()) // Only future dates
        .slice(0, 7); // Limit to 7 nearest dates

      if (sortedDates.length > 0) {
        setSelectedDate(sortedDates[0]);
      }
    }
  }, [showtimes, selectedDate]);

  // Fetch movie reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const response = await movieAPI.getReviews(id);
        if (response.data.success) {
          // Filter only approved reviews
          const approvedReviews = response.data.data.data.filter(review => review.status === 'approved');
          setMovieReviews(approvedReviews);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };

    if (id) {
      fetchReviews();
    }
  }, [id]);

  // Handle rating submission
  const handleSubmitRating = async (e) => {
    e.preventDefault();

    if (userRating === 0) {
      setRatingError('Please select a rating');
      return;
    }

    setSubmittingRating(true);
    setRatingError('');
    setRatingSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setRatingError('You must be logged in to submit a rating');
        setSubmittingRating(false);
        return;
      }

      const response = await reviewAPI.create(id, {
        rating: userRating,
        comment: ratingComment
      });

      if (response.data.success) {
        setRatingSuccess('Your rating has been submitted successfully! It will be visible after admin approval.');
        setUserRating(0);
        setRatingComment('');

        // Refresh reviews
        const reviewsResponse = await movieAPI.getReviews(id);
        if (reviewsResponse.data.success) {
          const approvedReviews = reviewsResponse.data.data.data.filter(review => review.status === 'approved');
          setMovieReviews(approvedReviews);
        }

        // Close the modal after successful submission
        setShowRatingModal(false);
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setRatingError(error.response.data.message);
      } else {
        setRatingError('Failed to submit rating. Please try again.');
      }
    } finally {
      setSubmittingRating(false);
    }
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

  if (!movie) {
    return (
      <div className="text-center py-5">
        <h3>Movie not found</h3>
        <Button variant="primary" onClick={() => navigate('/movies')}>Back to Movies</Button>
      </div>
    );
  }

  // Normalize genre and cast data
  const genres = normalizeGenre(movie.genre);
  const cast = normalizeCast(movie.cast);

  // Group showtimes by date and theater
  const groupedShowtimes = groupShowtimesByDateAndTheater(showtimes);

  // Get sorted dates and limit to 7 nearest dates
  const sortedDates = Object.keys(groupedShowtimes)
    .sort((a, b) => new Date(a) - new Date(b))
    .filter(date => new Date(date) >= new Date()) // Only future dates
    .slice(0, 7); // Limit to 7 nearest dates

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

  const trailerUrl = getYouTubeEmbedUrl(movie.trailer_url);

  // Check if trailer URL is available
  const hasTrailer = trailerUrl && trailerUrl.trim() !== '';

  return (
    <div>
      {/* Trailer Poster with Play Button */}
      {movie.poster_url && hasTrailer && (
        <div className="mb-4 position-relative" style={{ cursor: 'pointer' }} onClick={() => setShowTrailer(true)}>
          <img
            src={movie.poster_url || "https://placehold.co/300x450/1f1f1f/ffd700?text=Movie+Poster"}
            alt={`${movie.title} Trailer`}
            className="img-fluid rounded"
            style={{
              width: '100%',
              height: '50vh',
              objectFit: 'cover'
            }}
          />
          <div
            className="position-absolute top-50 start-50 translate-middle"
            style={{
              width: '60px',
              height: '60px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              className="bi bi-play-fill text-white"
              viewBox="0 0 16 16"
            >
              <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z" />
            </svg>
          </div>
        </div>
      )}

      {/* Trailer Modal */}
      <Modal show={showTrailer} onHide={() => setShowTrailer(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{movie.title} - Trailer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {trailerUrl && (
            <div className="ratio ratio-16x9">
              <iframe
                src={trailerUrl}
                title={`${movie.title} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <Row>
        <Col md={4}>
          <Card
            className="shadow"
            style={{
              marginTop: '-12.5vh',
              zIndex: 10,
              position: 'relative',
              marginLeft: '15px',
              marginRight: '15px',
              marginBottom: '30px'
            }}
          >
            <Card.Img
              variant="top"
              src={movie.poster_url || "https://placehold.co/300x450/1f1f1f/ffd700?text=Movie+Poster"}
              style={{
                cursor: 'pointer',
                height: '50vh',
                objectFit: 'cover'
              }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          </Card>
        </Col>
        <Col md={8}>
          <h1 className="text-gold">{movie.title}</h1>
          <div className="mb-3">
            <Badge bg="secondary" className="me-2">{movie.language}</Badge>
            <Badge bg="secondary" className="me-2">{movie.age_rating}</Badge>
            <Badge bg="secondary">{movie.duration} min</Badge>
          </div>

          <div className="mb-3">
            <strong>Genre:</strong> {genres.join(', ')}
          </div>

          <div className="mb-3">
            <strong>Director:</strong> {movie.director || 'N/A'}
          </div>

          <div className="mb-3">
            <strong>Cast:</strong> {cast && cast.length > 0 ? cast.map(person => person.name || person).join(', ') : 'N/A'}
          </div>

          <div className="mb-3">
            <strong>Rating:</strong>
            <Button
              variant="link"
              onClick={() => setShowRatingModal(true)}
              className="me-2 p-0 text-gold"
              style={{ border: 'none', textDecoration: 'none' }}
            >
              <i className="bi bi-star"></i>
            </Button>
            <span className="text-gold">{movie.average_rating || 'N/A'}</span>
          </div>



          <Button
            as={Link}
            to={showtimes.length > 0 ? `/booking/seats/${showtimes[0]?.id}` : '#'}
            variant="primary"
            size="lg"
            disabled={showtimes.length === 0}
          >
            {showtimes.length > 0 ? 'Book Tickets' : 'No Showtimes Available'}
          </Button>
        </Col>
      </Row>

      {/* Rating Modal */}
      <Modal show={showRatingModal} onHide={() => setShowRatingModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Rate {movie?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {ratingSuccess && (
            <Alert variant="success" className="mb-3">
              {ratingSuccess}
            </Alert>
          )}
          {ratingError && (
            <Alert variant="danger" className="mb-3">
              {ratingError}
            </Alert>
          )}
          <Form onSubmit={handleSubmitRating}>
            <div className="mb-3">
              <Form.Label>Your Rating</Form.Label>
              <div className="d-flex justify-content-center">
                <StarRating
                  rating={userRating}
                  onRatingChange={setUserRating}
                  size="lg"
                />
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Comment (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share your thoughts about this movie..."
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                onClick={() => setShowRatingModal(false)}
                className="me-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submittingRating}
              >
                {submittingRating ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                    <span className="ms-2">Submitting...</span>
                  </>
                ) : (
                  'Submit Rating'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Movie Content and Now Showing Section */}
      <Row className="mt-4">
        <Col md={8}>
          {/* Movie Synopsis */}
          <h3 className="text-gold mb-3">Description</h3>
          <p className="lead">{movie.synopsis}</p>

          <hr className="my-5" />

          {/* Showtimes */}
          <h3 className="text-gold mb-4">Showtimes</h3>
          {showtimes.length > 0 ? (
            <div>
              {/* Date selection buttons */}
              <div className="d-flex flex-wrap mb-4">
                {sortedDates.map(date => (
                  <Button
                    key={date}
                    variant={selectedDate === date ? "primary" : "outline-primary"}
                    className="me-2 mb-2"
                    onClick={() => setSelectedDate(date)}
                  >
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Button>
                ))}
              </div>

              {/* Show theaters and times only for the selected date */}
              {selectedDate && groupedShowtimes[selectedDate] && (
                <Card className="mb-4">
                  <Card.Header className="bg-dark text-gold">
                    <h5 className="mb-0">
                      {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    {Object.entries(groupedShowtimes[selectedDate]).map(([theaterId, theaterData]) => (
                      <div key={theaterId} className="mb-3 pb-3 border-bottom border-secondary">
                        <h6 className="text-gold">{theaterData.name}</h6>
                        <div>
                          {theaterData.showtimes.map(showtime => (
                            <Button
                              key={showtime.id}
                              as={Link}
                              to={`/booking/seats/${showtime.id}`}
                              variant="outline-primary"
                              size="sm"
                              className="me-2 mb-2"
                            >
                              {showtime.show_time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              )}
            </div>
          ) : (
            <p>No showtimes available for this movie.</p>
          )}
        </Col>

        {/* Now Showing Movies Column */}
        <Col md={4}>
          <h3 className="text-gold mb-3">Now Showing</h3>
          {nowShowingMovies.length > 0 ? (
            <div>
              {nowShowingMovies.map((movieItem) => (
                <Card
                  key={movieItem.id}
                  className="mb-3 shadow-sm"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/movies/${movieItem.id}`)}
                >
                  <Row className="g-0">
                    <Col md={4}>
                      <Card.Img
                        src={movieItem.poster_url || "https://placehold.co/100x150/1f1f1f/ffd700?text=Movie"}
                        alt={movieItem.title}
                        style={{
                          height: '100px',
                          width: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </Col>
                    <Col md={8}>
                      <Card.Body className="p-2">
                        <Card.Title
                          className="mb-1"
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {movieItem.title}
                        </Card.Title>
                      </Card.Body>
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted">No other movies currently showing.</p>
          )}

          {/* Advertisement Section */}
          {showAd && (
            <Alert
              variant="dark"
              className="mt-4 position-relative"
              style={{
                border: '1px solid #ffd700',
                backgroundColor: '#1f1f1f'
              }}
            >
              <div
                className="position-absolute"
                style={{
                  top: '5px',
                  right: '10px',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: '#ffd700'
                }}
                onClick={() => setShowAd(false)}
              >
                &times;
              </div>
              <Alert.Heading className="text-gold">Special Offer!</Alert.Heading>
              <p>Get 20% off on tickets for selected movies this week!</p>
              <div className="d-flex justify-content-center">
                <Button
                  variant="outline-warning"
                  size="sm"
                  onClick={() => navigate('/movies')}
                >
                  Book Now
                </Button>
              </div>
            </Alert>
          )}
        </Col>
      </Row>

      {/* Reviews Section */}
      <Row className="mt-5">
        <Col md={12}>
          <h3 className="text-gold mb-4">User Reviews</h3>

          {/* Existing Reviews */}
          <Card className="bg-dark">
            <Card.Body>
              <h5 className="text-gold mb-3">Community Reviews ({movieReviews.length})</h5>

              {loadingReviews ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="gold" />
                  <p className="mt-2 text-muted">Loading reviews...</p>
                </div>
              ) : movieReviews.length === 0 ? (
                <p className="text-muted">No reviews yet. Be the first to review this movie!</p>
              ) : (
                <div>
                  {movieReviews.map((review) => (
                    <div key={review.id} className="border-bottom border-secondary pb-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <strong>{review.user?.name || 'Anonymous'}</strong>
                          <div className="mt-1">
                            <StarRating rating={review.rating} readonly size="sm" />
                          </div>
                        </div>
                        <small className="text-muted">
                          {new Date(review.created_at).toLocaleDateString()}
                        </small>
                      </div>
                      {review.comment && (
                        <p className="mb-0">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MovieDetail;