import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Container, Form, Alert } from 'react-bootstrap';
import { adminAPI } from '../../services/api';

const EditShowtime = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [formData, setFormData] = useState({
    movie_id: '',
    theater_id: '',
    show_date: '',
    show_time: '',
    prices: '',
    status: 'active'
  });

  useEffect(() => {
    // Fetch movies and theaters for dropdowns
    const fetchOptions = async () => {
      try {
        const [moviesRes, theatersRes] = await Promise.all([
          adminAPI.getAdminMovies(),
          adminAPI.getAdminTheaters()
        ]);
        
        setMovies(moviesRes.data.data?.data || moviesRes.data.data || []);
        setTheaters(theatersRes.data.data?.data || theatersRes.data.data || []);
      } catch (err) {
        console.error('Error fetching options:', err);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchShowtime = async () => {
      try {
        const response = await adminAPI.getShowtimeById(id);
        const showtime = response.data.data || response.data;
        
        // Parse prices if it's a JSON string
        let pricesString = '';
        if (showtime.prices) {
          try {
            const pricesObj = JSON.parse(showtime.prices);
            pricesString = Object.entries(pricesObj)
              .map(([type, price]) => `${type}:${price}`)
              .join(',');
          } catch (e) {
            pricesString = showtime.prices;
          }
        }
        
        setFormData({
          movie_id: showtime.movie_id || '',
          theater_id: showtime.theater_id || '',
          show_date: showtime.show_date || '',
          show_time: showtime.show_time || '',
          prices: pricesString,
          status: showtime.status || 'active'
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching showtime:', err);
        setError('Failed to load showtime data');
        setLoading(false);
      }
    };

    if (id && movies.length > 0 && theaters.length > 0) {
      fetchShowtime();
    }
  }, [id, movies.length, theaters.length]);

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
      const submitData = { ...formData };
      
      // Convert prices string to JSON object
      if (formData.prices) {
        const pricesObj = {};
        formData.prices.split(',').forEach(priceEntry => {
          const [type, price] = priceEntry.split(':');
          if (type && price) {
            pricesObj[type.trim()] = parseInt(price.trim());
          }
        });
        submitData.prices = JSON.stringify(pricesObj);
      }

      await adminAPI.updateShowtime(id, submitData);
      setSuccess('Showtime updated successfully!');
      setTimeout(() => {
        navigate('/admin/showtimes');
      }, 2000);
    } catch (err) {
      console.error('Error updating showtime:', err);
      setError(err.response?.data?.message || 'Failed to update showtime');
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
        <h2 className="text-gold">Edit Showtime</h2>
        <Button variant="secondary" onClick={() => navigate('/admin/showtimes')}>
          Back to Showtimes
        </Button>
      </div>

      <Card className="bg-dark">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Movie</Form.Label>
              <Form.Select
                name="movie_id"
                value={formData.movie_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Movie</option>
                {movies.map(movie => (
                  <option key={movie.id} value={movie.id}>
                    {movie.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Theater</Form.Label>
              <Form.Select
                name="theater_id"
                value={formData.theater_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Theater</option>
                {theaters.map(theater => (
                  <option key={theater.id} value={theater.id}>
                    {theater.name} ({theater.city})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Show Date</Form.Label>
              <Form.Control
                type="date"
                name="show_date"
                value={formData.show_date}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Show Time</Form.Label>
              <Form.Control
                type="time"
                name="show_time"
                value={formData.show_time}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Prices (format: adult:100000,child:50000)</Form.Label>
              <Form.Control
                type="text"
                name="prices"
                value={formData.prices}
                onChange={handleChange}
                placeholder="adult:100000,child:50000,student:70000"
              />
              <Form.Text className="text-muted">
                Enter price types and values separated by commas. Example: adult:100000,child:50000
              </Form.Text>
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
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/admin/showtimes')}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Update Showtime'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EditShowtime;