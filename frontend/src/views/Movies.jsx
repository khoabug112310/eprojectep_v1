import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, Row, Col, Badge, Container } from 'react-bootstrap';
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
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get filter values from URL parameters
  const urlSearch = searchParams.get('search') || '';
  const urlGenre = searchParams.get('genre') || '';
  const urlSort = searchParams.get('sort') || '';
  const urlStatus = searchParams.get('status') || '';

  useEffect(() => {
    // Set search term from URL parameter if exists
    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
  }, [urlSearch]);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        // Pass parameters to the API call
        const params = {};
        if (urlGenre) params.genre = urlGenre;
        if (urlStatus) params.status = urlStatus;
        
        const response = await movieAPI.getAll(params);
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
  }, [urlGenre, urlStatus]);

  const filteredMovies = movies.filter(movie => {
    const genres = normalizeGenre(movie.genre);
    let matchesFilter = true;
    
    // Search filter (from URL or local input)
    const searchQuery = urlSearch || searchTerm;
    if (searchQuery) {
      const matchesSearch = movie.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) matchesFilter = false;
    }
    
    // Genre filter
    if (urlGenre) {
      const matchesGenre = genres.some(g => g.toLowerCase().includes(urlGenre.toLowerCase()));
      if (!matchesGenre) matchesFilter = false;
    }
    
    // Status filter (now showing, coming soon)
    if (urlStatus) {
      if (urlStatus === 'now-showing') {
        // Assume movies without release_date or with past release_date are now showing
        const releaseDate = new Date(movie.release_date);
        const now = new Date();
        if (movie.release_date && releaseDate > now) matchesFilter = false;
      } else if (urlStatus === 'coming-soon') {
        // Movies with future release_date are coming soon
        const releaseDate = new Date(movie.release_date);
        const now = new Date();
        if (!movie.release_date || releaseDate <= now) matchesFilter = false;
      }
    }
    
    return matchesFilter;
  });
  
  // Sort filtered movies
  const sortedMovies = [...filteredMovies];
  if (urlSort) {
    switch (urlSort) {
      case 'title':
        sortedMovies.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'rating':
        // Top rated - sort by average rating descending, limit to 10
        sortedMovies.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case 'newest':
        // New releases - sort by release date descending, limit to 10
        sortedMovies.sort((a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0));
        break;
      case 'popularity':
        sortedMovies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      case 'duration':
        sortedMovies.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
      default:
        break;
    }
  }
  
  // Apply limits for specific sorts
  let displayMovies = sortedMovies;
  if (urlSort === 'rating' || urlSort === 'newest') {
    displayMovies = sortedMovies.slice(0, 10);
  }
  
  const clearFilters = () => {
    setSearchTerm('');
    setSearchParams({});
  };
  
  const getActiveFiltersDisplay = () => {
    const filters = [];
    if (urlSearch) filters.push(`Search: "${urlSearch}"`);
    if (urlGenre) filters.push(`Genre: ${urlGenre}`);
    if (urlSort) filters.push(`Sort: ${urlSort}`);
    if (urlStatus) filters.push(`Status: ${urlStatus}`);
    return filters;
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

  return (
    <Container>
      {/* Page Header without Search */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">Movies {getActiveFiltersDisplay().length > 0 && `(${displayMovies.length} results)`}</h2>
      </div>
      
      {/* Active Filters Display */}
      {getActiveFiltersDisplay().length > 0 && (
        <div className="mb-4">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="text-muted">Active filters:</span>
            {getActiveFiltersDisplay().map((filter, index) => (
              <Badge key={index} bg="primary" className="me-1">
                {filter}
              </Badge>
            ))}
            <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
              <i className="bi bi-x-circle me-1"></i>Clear All
            </Button>
          </div>
        </div>
      )}

      <Row>
        {displayMovies.length > 0 ? (
          displayMovies.map((movie) => {
            const genres = normalizeGenre(movie.genre);
            return (
              <Col key={movie.id} md={6} lg={4} xl={3} className="mb-4">
                <Card className="h-100">
                  {/* Make the entire card image clickable to go to movie detail */}
                  <Link to={`/movies/${movie.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Card.Img 
                      variant="top" 
                      src={movie.poster_url || "https://placehold.co/300x450/1f1f1f/ffd700?text=Movie+Poster"} 
                      style={{ height: '350px', objectFit: 'cover', cursor: 'pointer' }}
                    />
                  </Link>
                  <Card.Body className="d-flex flex-column">
                    <Card.Title>{movie.title}</Card.Title>
                    <Card.Text className="text-muted">
                      {genres.join(', ')} | {movie.duration} min
                    </Card.Text>
                    <div className="d-flex justify-content-between align-items-center mt-auto">
                      <span className="text-gold">⭐ {movie.average_rating || 'N/A'}</span>
                      <Button as={Link} to={`/movies/${movie.id}`} variant="outline-primary" size="sm">
                        View Details
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
    </Container>
  );
};

export default Movies;