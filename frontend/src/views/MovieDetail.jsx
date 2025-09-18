import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Card, Row, Col, Badge } from 'react-bootstrap';
import { movieAPI } from '../services/api';

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

const MovieDetail = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const movieResponse = await movieAPI.getById(id);
        const showtimesResponse = await movieAPI.getShowtimes(id);
        
        setMovie(movieResponse.data.data || movieResponse.data);
        // Handle paginated response for showtimes
        const showtimesData = showtimesResponse.data.data?.data || showtimesResponse.data.data || [];
        setShowtimes(showtimesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching movie details:', error);
        setLoading(false);
      }
    };

    if (id) {
      fetchMovieDetails();
    }
  }, [id]);

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
        <Link to="/movies" className="btn btn-primary">Back to Movies</Link>
      </div>
    );
  }

  // Normalize genre and cast data
  const genres = normalizeGenre(movie.genre);
  const cast = normalizeCast(movie.cast);

  return (
    <div>
      <Row>
        <Col md={4}>
          <Card>
            <Card.Img 
              variant="top" 
              src={movie.poster_url || "https://placehold.co/300x450/1f1f1f/ffd700?text=Movie+Poster"} 
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
          <p className="lead">{movie.synopsis}</p>
          
          <div className="mb-3">
            <strong>Genre:</strong> {genres.join(', ')}
          </div>
          
          <div className="mb-3">
            <strong>Director:</strong> {movie.director}
          </div>
          
          <div className="mb-3">
            <strong>Cast:</strong> {cast.map(person => person.name || person).join(', ')}
          </div>
          
          <div className="mb-3">
            <strong>Rating:</strong> <span className="text-gold">⭐ {movie.average_rating || 'N/A'}</span>
          </div>
          
          <Button as={Link} to={`/booking/seats/${showtimes[0]?.id || 'sample'}`} variant="primary" size="lg">
            Book Tickets
          </Button>
        </Col>
      </Row>

      <hr className="my-5" />

      <h3 className="text-gold mb-4">Showtimes</h3>
      {showtimes.length > 0 ? (
        <Row>
          {showtimes.map((showtime) => (
            <Col key={showtime.id} md={6} lg={4} className="mb-3">
              <Card>
                <Card.Body>
                  <Card.Title>{showtime.theater?.name}</Card.Title>
                  <Card.Text>
                    <strong>Date:</strong> {showtime.show_date}<br />
                    <strong>Time:</strong> {showtime.show_time}<br />
                    <strong>Available Seats:</strong> {showtime.available_seats?.length || 'N/A'}
                  </Card.Text>
                  <Button 
                    as={Link} 
                    to={`/booking/seats/${showtime.id}`} 
                    variant="outline-primary" 
                    size="sm"
                  >
                    Select Seats
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <p>No showtimes available for this movie.</p>
      )}
    </div>
  );
};

export default MovieDetail;