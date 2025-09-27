import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from 'react-bootstrap';

const MoviePosterWithHover = ({ movie, isComingSoon = false, onTrailerClick }) => {
  const [showOverlay, setShowOverlay] = useState(false);

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

  const genres = normalizeGenre(movie.genre);

  return (
    <Card 
      className="h-100 movie-card position-relative overflow-hidden"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      <div className="position-relative">
        {/* Movie Poster - Clicking anywhere on the poster navigates to movie detail */}
        <Link to={`/movies/${movie.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Card.Img 
            variant="top" 
            src={movie.poster_url || "https://placehold.co/300x450/1f1f1f/ffd700?text=Movie"} 
            style={{ height: '350px', objectFit: 'cover', cursor: 'pointer' }}
          />
        </Link>
        
        {/* Rating Badge */}
        {!isComingSoon ? (
          <Badge bg="gold" className="position-absolute top-0 end-0 m-2">
            ⭐ {movie.average_rating || 'N/A'}
          </Badge>
        ) : (
          <Badge bg="warning" className="position-absolute top-0 end-0 m-2 text-dark">
            Coming Soon
          </Badge>
        )}
        
        {/* Overlay with buttons - Only visible on hover */}
        {showOverlay && (
          <div 
            className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              transition: 'opacity 0.3s ease'
            }}
          >
            <div className="d-flex flex-column gap-2">
              {/* Trailer Button */}
              {movie.trailer_url && movie.trailer_url.trim() !== '' && (
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Call the onTrailerClick function passed from parent
                    if (onTrailerClick) {
                      onTrailerClick(movie);
                    }
                  }}
                >
                  Trailer
                </Button>
              )}
              
              {/* Book Button */}
              <Button 
                as={Link} 
                to={`/movies/${movie.id}`}
                variant="outline-light" 
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Navigate to movie detail page
                  window.location.href = `/movies/${movie.id}`;
                }}
              >
                Book
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Card Body - Also clickable to navigate to movie detail */}
      <Link to={`/movies/${movie.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Card.Body className="d-flex flex-column" style={{ cursor: 'pointer' }}>
          <Card.Title className="fs-6 fw-bold">{movie.title}</Card.Title>
          <div className="mb-2">
            <small className="text-white">
              {genres.slice(0, 2).join(', ')}
            </small>
          </div>
          {!isComingSoon ? (
            <div className="mt-auto">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-gold">{movie.duration} min</span>
                <Button 
                  as={Link} 
                  to={`/movies/${movie.id}`} 
                  variant="outline-primary" 
                  size="sm"
                >
                  Detail
                </Button>
              </div>
            </div>
          ) : (
            <Card.Text className="text-muted small">
              {movie.release_date ? new Date(movie.release_date).toLocaleDateString() : 'TBA'}
            </Card.Text>
          )}
        </Card.Body>
      </Link>
    </Card>
  );
};  

export default MoviePosterWithHover;