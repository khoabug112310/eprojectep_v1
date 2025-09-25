import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Container, Form, Alert, Row, Col } from 'react-bootstrap';
import { adminAPI } from '../../services/api';

const CreateMovie = () => {
  const navigate = useNavigate();
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

      console.log('Creating movie with data:', submitData);
      const response = await adminAPI.createMovie(submitData);
      console.log('Create movie response:', response);
      
      setSuccess('Movie created successfully!');
      setTimeout(() => {
        navigate('/admin/movies');
      }, 2000);
    } catch (err) {
      console.error('Error creating movie:', err);
      if (err.response?.data?.errors) {
        // Handle validation errors
        const errors = Object.values(err.response.data.errors).flat();
        setError(errors.join(', '));
      } else {
        setError(err.response?.data?.message || 'Failed to create movie');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">Create New Movie</h2>
        <Button variant="secondary" onClick={() => navigate('/admin/movies')}>
          Back to Movies
        </Button>
      </div>

      <Card className="bg-dark">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Title *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter movie title"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Synopsis *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="synopsis"
                    value={formData.synopsis}
                    onChange={handleChange}
                    required
                    placeholder="Enter movie synopsis"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Duration (minutes) *</Form.Label>
                      <Form.Control
                        type="number"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        required
                        min="1"
                        placeholder="120"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Language *</Form.Label>
                      <Form.Control
                        type="text"
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        required
                        placeholder="English, Vietnamese, etc."
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Genre (comma-separated) *</Form.Label>
                  <Form.Control
                    type="text"
                    name="genre"
                    value={formData.genre}
                    onChange={handleChange}
                    placeholder="Action, Comedy, Drama"
                    required
                  />
                  <Form.Text className="text-muted">
                    Separate multiple genres with commas
                  </Form.Text>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Age Rating</Form.Label>
                      <Form.Select
                        name="age_rating"
                        value={formData.age_rating}
                        onChange={handleChange}
                      >
                        <option value="">Select Rating</option>
                        <option value="G">G - General Audiences</option>
                        <option value="PG">PG - Parental Guidance</option>
                        <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                        <option value="R">R - Restricted</option>
                        <option value="NC-17">NC-17 - Adults Only</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Release Date *</Form.Label>
                      <Form.Control
                        type="date"
                        name="release_date"
                        value={formData.release_date}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Director</Form.Label>
                  <Form.Control
                    type="text"
                    name="director"
                    value={formData.director}
                    onChange={handleChange}
                    placeholder="Director name"
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
                  <Form.Text className="text-muted">
                    Separate multiple actors with commas
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="active">Active - Now Showing</option>
                    <option value="coming_soon">Coming Soon</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Poster URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="poster_url"
                    value={formData.poster_url}
                    onChange={handleChange}
                    placeholder="https://example.com/poster.jpg"
                  />
                  <Form.Text className="text-muted">
                    URL to movie poster image
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Trailer URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="trailer_url"
                    value={formData.trailer_url}
                    onChange={handleChange}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <Form.Text className="text-muted">
                    YouTube or other video platform URL
                  </Form.Text>
                </Form.Group>

                {/* Preview Section */}
                {formData.poster_url && (
                  <div className="mb-3">
                    <Form.Label>Poster Preview</Form.Label>
                    <div className="text-center">
                      <img 
                        src={formData.poster_url} 
                        alt="Poster preview" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '200px', 
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </Col>
            </Row>

            <hr className="my-4" />

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/admin/movies')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating...
                  </>
                ) : (
                  'Create Movie'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateMovie;