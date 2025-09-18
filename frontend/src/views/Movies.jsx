import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Row, Col, Form, InputGroup } from 'react-bootstrap';
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

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await movieAPI.getAll();
        // Handle paginated response correctly
        const moviesData = response.data.data?.data || response.data.data || [];
        setMovies(moviesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching movies:', error);
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const filteredMovies = movies.filter(movie => {
    const genres = normalizeGenre(movie.genre);
    return movie.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           genres.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-gold" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">Movies</h2>
        <Form className="w-50">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Form>
      </div>

      <Row>
        {filteredMovies.length > 0 ? (
          filteredMovies.map((movie) => {
            const genres = normalizeGenre(movie.genre);
            return (
              <Col key={movie.id} md={6} lg={4} xl={3} className="mb-4">
                <Card className="h-100">
                  <Card.Img 
                    variant="top" 
                    src={movie.poster_url || "https://placehold.co/300x450/1f1f1f/ffd700?text=Movie+Poster"} 
                    style={{ height: '350px', objectFit: 'cover' }}
                  />
                  <Card.Body className="d-flex flex-column">
                    <Card.Title>{movie.title}</Card.Title>
                    <Card.Text className="text-muted">
                      {genres.join(', ')} | {movie.duration} min
                    </Card.Text>
                    <div className="d-flex justify-content-between align-items-center mt-auto">
                      <span className="text-gold">⭐ {movie.average_rating || 'N/A'}</span>
                      <Button as={Link} to={`/movies/${movie.id}`} variant="outline-primary" size="sm">
                        Book Now
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })
        ) : (
          <Col>
            <p>No movies found.</p>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default Movies;