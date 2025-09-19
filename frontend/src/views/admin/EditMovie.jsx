import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Container, Form, Alert } from 'react-bootstrap';
import { adminAPI } from '../../services/api';

const EditMovie = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    synopsis: '',
    duration: '',
    genre: '',
    language: '',
    age_rating: '',
    release_date: '',
    poster_url: '',
    trailer_url: '',
    director: '',
    cast: '',
    status: 'active'
  });

  // Debugging: Log the route parameters
  useEffect(() => {
    console.log('Route parameters:', { id });
  }, [id]);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        console.log('Fetching movie with ID:', id);
        const response = await adminAPI.getMovieById(id);
        console.log('API Response:', response);
        const movie = response.data.data || response.data;
        
        // Convert arrays to comma-separated strings for form inputs
        const genreString = Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre || '';
        const castString = Array.isArray(movie.cast) ? movie.cast.join(', ') : movie.cast || '';
        
        setFormData({
          title: movie.title || '',
          synopsis: movie.synopsis || '',
          duration: movie.duration || '',
          genre: genreString,
          language: movie.language || '',
          age_rating: movie.age_rating || '',
          release_date: movie.release_date || '',
          poster_url: movie.poster_url || '',
          trailer_url: movie.trailer_url || '',
          director: movie.director || '',
          cast: castString,
          status: movie.status || 'active'
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching movie:', err);
        setError('Failed to load movie data');
        setLoading(false);
      }
    };

    if (id) {
      fetchMovie();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        duration: parseInt(formData.duration) || 0
      };

      await adminAPI.updateMovie(id, submitData);
      setSuccess('Movie updated successfully!');
      setTimeout(() => {
        navigate('/admin/movies');
      }, 2000);
    } catch (err) {
      console.error('Error updating movie:', err);
      setError(err.response?.data?.message || 'Failed to update movie');
    } finally {
      setSaving(false);
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

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">Edit Movie (ID: {id})</h2>
        <Button variant="secondary" onClick={() => navigate('/admin/movies')}>
          Back to Movies
        </Button>
      </div>

      <Card className="bg-dark">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Synopsis</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="synopsis"
                value={formData.synopsis}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Duration (minutes)</Form.Label>
              <Form.Control
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Genre (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                placeholder="Action, Comedy, Drama"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Language</Form.Label>
              <Form.Control
                type="text"
                name="language"
                value={formData.language}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Age Rating</Form.Label>
              <Form.Select
                name="age_rating"
                value={formData.age_rating}
                onChange={handleChange}
              >
                <option value="">Select Rating</option>
                <option value="G">G</option>
                <option value="PG">PG</option>
                <option value="PG-13">PG-13</option>
                <option value="R">R</option>
                <option value="NC-17">NC-17</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Release Date</Form.Label>
              <Form.Control
                type="date"
                name="release_date"
                value={formData.release_date}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Poster URL</Form.Label>
              <Form.Control
                type="text"
                name="poster_url"
                value={formData.poster_url}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Trailer URL</Form.Label>
              <Form.Control
                type="text"
                name="trailer_url"
                value={formData.trailer_url}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Director</Form.Label>
              <Form.Control
                type="text"
                name="director"
                value={formData.director}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Cast (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                name="cast"
                value={formData.cast}
                onChange={handleChange}
                placeholder="Actor 1, Actor 2, Actor 3"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="coming_soon">Coming Soon</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/admin/movies')}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Update Movie'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EditMovie;