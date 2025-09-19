import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Container, Form, Alert } from 'react-bootstrap';
import { adminAPI } from '../../services/api';

const EditTheater = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    total_seats: '',
    facilities: '',
    status: 'active'
  });

  useEffect(() => {
    const fetchTheater = async () => {
      try {
        const response = await adminAPI.getTheaterById(id);
        const theater = response.data.data || response.data;
        
        // Convert facilities array to comma-separated string
        const facilitiesString = Array.isArray(theater.facilities) 
          ? theater.facilities.join(', ') 
          : theater.facilities || '';
        
        setFormData({
          name: theater.name || '',
          city: theater.city || '',
          address: theater.address || '',
          total_seats: theater.total_seats || '',
          facilities: facilitiesString,
          status: theater.status || 'active'
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching theater:', err);
        setError('Failed to load theater data');
        setLoading(false);
      }
    };

    if (id) {
      fetchTheater();
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
        total_seats: parseInt(formData.total_seats) || 0
      };

      await adminAPI.updateTheater(id, submitData);
      setSuccess('Theater updated successfully!');
      setTimeout(() => {
        navigate('/admin/theaters');
      }, 2000);
    } catch (err) {
      console.error('Error updating theater:', err);
      setError(err.response?.data?.message || 'Failed to update theater');
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
        <h2 className="text-gold">Edit Theater</h2>
        <Button variant="secondary" onClick={() => navigate('/admin/theaters')}>
          Back to Theaters
        </Button>
      </div>

      <Card className="bg-dark">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
              <Form.Control
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Total Seats</Form.Label>
              <Form.Control
                type="number"
                name="total_seats"
                value={formData.total_seats}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Facilities (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                name="facilities"
                value={formData.facilities}
                onChange={handleChange}
                placeholder="WiFi, Parking, Snack Bar"
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
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/admin/theaters')}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Update Theater'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EditTheater;