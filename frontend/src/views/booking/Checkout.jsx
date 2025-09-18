import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Container, Row, Col, Form } from 'react-bootstrap';
import { bookingAPI, authAPI } from '../../services/api';

const Checkout = () => {
  const navigate = useNavigate();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showtimeId, setShowtimeId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get selected seats and showtime from localStorage
    const storedSeats = localStorage.getItem('selectedSeats');
    const storedShowtimeId = localStorage.getItem('showtimeId');
    
    if (storedSeats && storedShowtimeId) {
      setSelectedSeats(JSON.parse(storedSeats));
      setShowtimeId(storedShowtimeId);
    } else {
      navigate('/movies');
    }
    
    // Get user profile if logged in
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await authAPI.getProfile();
          const userData = response.data.data || response.data;
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || ''
          });
        }
      } catch (err) {
        console.log('User not logged in or profile fetch failed');
      }
    };
    
    fetchUserProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateTotal = () => {
    return selectedSeats.reduce((total, seat) => total + (seat.price || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookingData = {
        showtime_id: showtimeId,
        seats: selectedSeats,
        payment_method: paymentMethod
      };

      const response = await bookingAPI.create(bookingData);
      const booking = response.data.data || response.data;
      
      // Store booking ID for confirmation page
      localStorage.setItem('bookingId', booking.id);
      
      // Navigate to confirmation page
      navigate('/booking/confirmation');
    } catch (err) {
      alert(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h2 className="text-gold mb-4">Checkout</h2>
      
      <Row>
        <Col md={8}>
          <Card className="bg-dark mb-4">
            <Card.Body>
              <Card.Title>Personal Information</Card.Title>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Card.Title className="mt-4">Payment Method</Card.Title>
                <div className="mb-3">
                  <Form.Check
                    type="radio"
                    id="credit_card"
                    name="paymentMethod"
                    label="Credit Card"
                    value="credit_card"
                    checked={paymentMethod === 'credit_card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mb-2"
                  />
                  <Form.Check
                    type="radio"
                    id="paypal"
                    name="paymentMethod"
                    label="PayPal"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mb-2"
                  />
                  <Form.Check
                    type="radio"
                    id="bank_transfer"
                    name="paymentMethod"
                    label="Bank Transfer"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                </div>
                
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? 'Processing...' : `Pay ${calculateTotal().toLocaleString()} VND`}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="bg-dark">
            <Card.Body>
              <Card.Title>Order Summary</Card.Title>
              <div className="mb-3">
                <strong>Selected Seats:</strong>
                <div className="mt-2">
                  {selectedSeats.map((seat, index) => (
                    <div key={index} className="d-flex justify-content-between">
                      <span>{seat.seat} ({seat.type})</span>
                      <span>{seat.price?.toLocaleString()} VND</span>
                    </div>
                  ))}
                </div>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <strong>Total:</strong>
                <strong>{calculateTotal().toLocaleString()} VND</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Checkout;