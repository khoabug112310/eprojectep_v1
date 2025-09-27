import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Container, Form, Alert, Row, Col } from 'react-bootstrap';
import { adminAPI } from '../../services/api';

const EditTheater = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreateMode, setIsCreateMode] = useState(!id);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    total_seats: '',
    facilities: '',
    status: 'active'
  });

  const fetchTheater = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    if (id) {
      // Edit mode
      setIsCreateMode(false);
      fetchTheater();
    } else {
      // Create mode
      setIsCreateMode(true);
      setLoading(false);
    }
  }, [id, fetchTheater]);

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

      if (isCreateMode) {
        console.log('Creating theater with data:', submitData);
        await adminAPI.createTheater(submitData);
        setSuccess('Theater created successfully!');
      } else {
        console.log('Updating theater with data:', submitData);
        await adminAPI.updateTheater(id, submitData);
        setSuccess('Theater updated successfully!');
      }
      
      setTimeout(() => {
        navigate('/admin/theaters');
      }, 2000);
    } catch (err) {
      console.error(`Error ${isCreateMode ? 'creating' : 'updating'} theater:`, err);
      if (err.response?.data?.errors) {
        // Handle validation errors
        const errors = Object.values(err.response.data.errors).flat();
        setError(errors.join(', '));
      } else {
        setError(err.response?.data?.message || `Failed to ${isCreateMode ? 'create' : 'update'} theater`);
      }
    } finally {
      setSaving(false);
    }
  };

  // Predefined cities in Vietnam
  const vietnameseCities = [
    'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
    'Biên Hòa', 'Huế', 'Nha Trang', 'Buôn Ma Thuột', 'Quy Nhon',
    'Vũng Tàu', 'Nam Định', 'Phan Thiết', 'Long Xuyên', 'Hạ Long',
    'Thái Nguyên', 'Thanh Hóa', 'Rạch Giá', 'Cà Mau', 'Pleiku'
  ];

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
        <h2 className="text-gold">
          {isCreateMode ? 'Create New Theater' : `Edit Theater (ID: ${id})`}
        </h2>
        <Button variant="secondary" onClick={() => navigate('/admin/theaters')}>
          Back to Theaters
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
                  <Form.Label>Theater Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter theater name"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City *</Form.Label>
                      <Form.Select
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select City</option>
                        {vietnameseCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Total Seats *</Form.Label>
                      <Form.Control
                        type="number"
                        name="total_seats"
                        value={formData.total_seats}
                        onChange={handleChange}
                        required
                        min="1"
                        placeholder="150"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Address *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder="Enter full address including street, district, ward..."
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Facilities (comma-separated)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="facilities"
                    value={formData.facilities}
                    onChange={handleChange}
                    placeholder="WiFi miễn phí, Bãi đỗ xe, Quầy bán đồ ăn, Máy lạnh..."
                  />
                  <Form.Text className="text-muted">
                    Separate multiple facilities with commas. Leave empty if none.
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
                    <option value="active">Active - Operating</option>
                    <option value="inactive">Inactive - Closed</option>
                  </Form.Select>
                </Form.Group>

                {/* Theater Information Card */}
                <Card className="bg-secondary mb-3">
                  <Card.Header>
                    <h6 className="mb-0 text-info">
                      <i className="bi bi-info-circle me-2"></i>
                      Theater Information
                    </h6>
                  </Card.Header>
                  <Card.Body className="py-2">
                    <div className="mb-2">
                      <strong>Name:</strong> 
                      <span className="text-muted ms-1">
                        {formData.name || 'Not specified'}
                      </span>
                    </div>
                    <div className="mb-2">
                      <strong>Location:</strong> 
                      <span className="text-muted ms-1">
                        {formData.city || 'Not specified'}
                      </span>
                    </div>
                    <div className="mb-2">
                      <strong>Capacity:</strong> 
                      <span className="text-muted ms-1">
                        {formData.total_seats ? `${formData.total_seats} seats` : 'Not specified'}
                      </span>
                    </div>
                    <div className="mb-0">
                      <strong>Status:</strong> 
                      <span className={`ms-1 ${formData.status === 'active' ? 'text-success' : 'text-danger'}`}>
                        {formData.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </Card.Body>
                </Card>

                {/* Tips Card */}
                <Card className="bg-secondary">
                  <Card.Header>
                    <h6 className="mb-0 text-warning">
                      <i className="bi bi-lightbulb me-2"></i>
                      Tips
                    </h6>
                  </Card.Header>
                  <Card.Body className="py-2">
                    <small className="text-muted">
                      <ul className="ps-3 mb-0">
                        <li>Choose a descriptive theater name</li>
                        <li>Provide complete address for easy location</li>
                        <li>List all available facilities</li>
                        <li>Set realistic seat capacity</li>
                      </ul>
                    </small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <hr className="my-4" />

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/admin/theaters')}
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
                    {isCreateMode ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    <i className={`bi bi-${isCreateMode ? 'building-add' : 'check-circle'} me-2`}></i>
                    {isCreateMode ? 'Create Theater' : 'Update Theater'}
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

export default EditTheater;