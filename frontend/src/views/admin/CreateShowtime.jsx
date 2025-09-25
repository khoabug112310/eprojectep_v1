import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Container, Form, Alert, Spinner } from 'react-bootstrap';
import { adminAPI } from '../../services/api';

const CreateShowtime = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [formData, setFormData] = useState({
    movie_id: '',
    theater_id: '',
    show_date: '',
    show_time: '',
    prices: {
      gold: 100000,
      platinum: 150000,
      box: 200000
    },
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ show: false, variant: '', message: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch movies
        const movieResponse = await adminAPI.getAdminMovies({ per_page: 100 });
        const moviesData = movieResponse.data?.data?.data || movieResponse.data?.data || [];
        setMovies(Array.isArray(moviesData) ? moviesData : []);
        
        // Fetch theaters
        const theaterResponse = await adminAPI.getAdminTheaters({ per_page: 100 });
        const theatersData = theaterResponse.data?.data?.data || theaterResponse.data?.data || [];
        setTheaters(Array.isArray(theatersData) ? theatersData : []);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setAlert({ show: true, variant: 'danger', message: 'Failed to load movies and theaters: ' + (error.response?.data?.message || error.message) });
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePriceChange = (type, value) => {
    setFormData(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [type]: parseInt(value) || 0
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.movie_id) newErrors.movie_id = 'Movie is required';
    if (!formData.theater_id) newErrors.theater_id = 'Theater is required';
    if (!formData.show_date) newErrors.show_date = 'Show date is required';
    if (!formData.show_time) newErrors.show_time = 'Show time is required';
    
    // Validate date is not in the past
    if (formData.show_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(formData.show_date);
      if (selectedDate < today) {
        newErrors.show_date = 'Show date cannot be in the past';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      // Convert prices to JSON string as expected by backend
      // Ensure date is in correct format
      const submitData = {
        ...formData,
        show_date: formData.show_date, // Already in YYYY-MM-DD format from input
        show_time: formData.show_time, // Already in HH:MM format from input
        prices: JSON.stringify(formData.prices)
      };
      
      await adminAPI.createShowtime(submitData);
      setAlert({ show: true, variant: 'success', message: 'Showtime created successfully!' });
      
      // Redirect to showtimes list after a short delay
      setTimeout(() => {
        navigate('/admin/showtimes');
      }, 1500);
    } catch (error) {
      console.error('Error creating showtime:', error);
      setAlert({ show: true, variant: 'danger', message: error.response?.data?.message || error.message || 'Failed to create showtime' });
      setLoading(false);
    }
  };

  if (loading && movies.length === 0 && theaters.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="gold" />
        <p className="mt-2">Loading data...</p>
      </div>
    );
  }

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">Create New Showtime</h2>
        <Button variant="secondary" onClick={() => navigate('/admin/showtimes')}>
          <i className="bi bi-arrow-left me-1"></i> Back to Showtimes
        </Button>
      </div>

      {alert.show && (
        <Alert variant={alert.variant} onClose={() => setAlert({ show: false, variant: '', message: '' })} dismissible>
          {alert.message}
        </Alert>
      )}

      <Card className="bg-dark">
        <Card.Header className="bg-secondary text-white">
          <i className="bi bi-film me-2"></i> Showtime Details
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Movie <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="movie_id"
                    value={formData.movie_id}
                    onChange={handleChange}
                    isInvalid={!!errors.movie_id}
                  >
                    <option value="">Select a movie</option>
                    {movies.map(movie => (
                      <option key={movie.id} value={movie.id}>
                        {movie.title}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.movie_id}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Theater <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="theater_id"
                    value={formData.theater_id}
                    onChange={handleChange}
                    isInvalid={!!errors.theater_id}
                  >
                    <option value="">Select a theater</option>
                    {theaters.map(theater => (
                      <option key={theater.id} value={theater.id}>
                        {theater.name} ({theater.city})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.theater_id}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Show Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="show_date"
                    value={formData.show_date}
                    onChange={handleChange}
                    isInvalid={!!errors.show_date}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <Form.Text className="text-muted">
                    Select a date for the showtime
                  </Form.Text>
                  <Form.Control.Feedback type="invalid">
                    {errors.show_date}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Show Time <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="time"
                    name="show_time"
                    value={formData.show_time}
                    onChange={handleChange}
                    isInvalid={!!errors.show_time}
                  />
                  <Form.Text className="text-muted">
                    Select the time for the show (24-hour format)
                  </Form.Text>
                  <Form.Control.Feedback type="invalid">
                    {errors.show_time}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>
            
            <Card className="bg-secondary mb-3">
              <Card.Header className="bg-dark text-white">
                <i className="bi bi-currency-dollar me-2"></i> Ticket Prices (VND)
              </Card.Header>
              <Card.Body>
                <div className="row">
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Gold <span className="badge bg-warning text-dark">Regular</span></Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.prices.gold}
                        onChange={(e) => handlePriceChange('gold', e.target.value)}
                        min="0"
                        step="1000"
                      />
                      <Form.Text className="text-muted">
                        Standard seating area
                      </Form.Text>
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Platinum <span className="badge bg-info text-dark">Premium</span></Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.prices.platinum}
                        onChange={(e) => handlePriceChange('platinum', e.target.value)}
                        min="0"
                        step="1000"
                      />
                      <Form.Text className="text-muted">
                        Premium seating area
                      </Form.Text>
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Box <span className="badge bg-success">VIP</span></Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.prices.box}
                        onChange={(e) => handlePriceChange('box', e.target.value)}
                        min="0"
                        step="1000"
                      />
                      <Form.Text className="text-muted">
                        VIP box seating area
                      </Form.Text>
                    </Form.Group>
                  </div>
                </div>
              </Card.Body>
            </Card>
            
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Set the current status of this showtime
              </Form.Text>
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => navigate('/admin/showtimes')}>
                <i className="bi bi-x-circle me-1"></i> Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-1"></i> Create Showtime
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateShowtime;