import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Container, Table, Form, InputGroup, Badge } from 'react-bootstrap';
import { adminAPI } from '../../services/api';

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

const AdminMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await adminAPI.getAdminMovies();
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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await adminAPI.deleteMovie(id);
        setMovies(movies.filter(movie => movie.id !== id));
      } catch (error) {
        console.error('Error deleting movie:', error);
        alert('Failed to delete movie');
      }
    }
  };

  const filteredMovies = movies.filter(movie => 
    movie.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">Manage Movies</h2>
        <div className="d-flex gap-2">
          <Form className="w-300px">
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search movies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Form>
          <Button variant="primary" as={Link} to="/admin/movies/create">
            Add New Movie
          </Button>
        </div>
      </div>

      <Card className="bg-dark">
        <Card.Body>
          <Table responsive hover variant="dark">
            <thead>
              <tr>
                <th>Poster</th>
                <th>Title</th>
                <th>Genre</th>
                <th>Duration</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovies.map((movie) => {
                const genres = normalizeGenre(movie.genre);
                return (
                  <tr key={movie.id}>
                    <td>
                      <img 
                        src={movie.poster_url || "https://placehold.co/50x75/1f1f1f/ffd700?text=Poster"} 
                        alt={movie.title} 
                        width="50" 
                        height="75"
                      />
                    </td>
                    <td>{movie.title}</td>
                    <td>{genres.join(', ')}</td>
                    <td>{movie.duration} min</td>
                    <td>⭐ {movie.average_rating || 'N/A'}</td>
                    <td>
                      <Badge bg={
                        movie.status === 'active' ? 'success' :
                        movie.status === 'inactive' ? 'danger' : 'warning'
                      }>
                        {movie.status}
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        as={Link} 
                        to={`/admin/movies/${movie.id}/edit`}
                        className="me-2"
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={() => handleDelete(movie.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminMovies;