import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, Container, Row, Col, Alert, Spinner, Modal } from 'react-bootstrap';
import { bookingAPI } from '../../services/api';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingData } = location.state || {};
  
  const [booking] = useState(bookingData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    if (!bookingData) {
      navigate('/movies');
    }
  }, [bookingData, navigate]);

  // Function to calculate showtime with end time based on movie duration
  const calculateShowtime = (showtime) => {
    if (!showtime || !showtime.show_time || !showtime.movie?.duration) return showtime?.show_time || '';
    
    try {
      // Parse the show time
      const [hours, minutes] = showtime.show_time.split(':').map(Number);
      const startTime = new Date();
      startTime.setHours(hours, minutes, 0, 0);
      
      // Calculate end time by adding movie duration (in minutes)
      const endTime = new Date(startTime.getTime() + showtime.movie.duration * 60000);
      
      // Format times
      const formatTime = (date) => {
        return date.toTimeString().slice(0, 5); // HH:MM format
      };
      
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    } catch (error) {
      // Fallback to just showing the start time if calculation fails
      return showtime.show_time;
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    
    try {
      const paymentData = {
        payment_method: 'credit_card', // Default for now
        // In a real app, you would collect card details here
      };
      
      const response = await bookingAPI.processPayment(booking.id, paymentData);
      
      if (response.data.success) {
        // Store booking ID in localStorage for confirmation page
        localStorage.setItem('bookingId', booking.id);
        // Navigate to confirmation page
        navigate('/booking/confirmation');
      }
    } catch (err) {
      console.error('Payment error:', err);
      
      // Handle 404 error specifically for seat availability issues
      if (err.response && err.response.status === 404) {
        setModalMessage('Some seats are no longer available. Please go back and select different seats.');
        setShowErrorModal(true);
      } else if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Payment failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    // Navigate back to seat selection with the same showtime
    navigate('/booking/seats', { 
      state: { 
        showtimeId: booking.showtime_id,
        movie: booking.showtime?.movie,
        theater: booking.showtime?.theater,
        showtime: booking.showtime
      } 
    });
  };

  if (!booking) {
    return (
      <Container>
        <Alert variant="danger">Invalid booking data</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="text-gold mb-4">Checkout</h2>
      
      <Row>
        <Col md={8}>
          <Card className="bg-dark mb-4">
            <Card.Body>
              <h4 className="text-gold mb-4">Booking Summary</h4>
              
              <div className="mb-4">
                <h5 className="text-gold">Movie Details</h5>
                <p><strong>Title:</strong> {booking.showtime?.movie?.title}</p>
                <p><strong>Theater:</strong> {booking.showtime?.theater?.name}</p>
                <p><strong>Date:</strong> {booking.showtime?.show_date && new Date(booking.showtime.show_date).toLocaleDateString('en-GB')}</p>
                <p><strong>Time:</strong> {booking.showtime && calculateShowtime(booking.showtime)}</p>
              </div>
              
              <div className="mb-4">
                <h5 className="text-gold">Selected Seats</h5>
                <div className="d-flex flex-wrap gap-2">
                  {booking.seats?.map((seat, index) => (
                    <span key={index} className="badge bg-secondary me-1">
                      {seat.seat} ({seat.type})
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="text-gold">Payment Details</h5>
                <div className="d-flex justify-content-between">
                  <span><strong>Total Amount:</strong></span>
                  <span className="text-gold">{booking.total_amount?.toLocaleString()} VND</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="bg-dark sticky-top" style={{ top: '20px' }}>
            <Card.Body>
              <h4 className="text-gold mb-4">Payment</h4>
              
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}
              
              <div className="mb-3">
                <p><strong>Payment Method:</strong> Credit Card</p>
                {/* In a real app, you would have a form for card details */}
              </div>
              
              <Button 
                variant="gold" 
                className="w-100 mb-2"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    /> Processing...
                  </>
                ) : (
                  'Pay Now'
                )}
              </Button>
              
              <Button 
                variant="outline-light" 
                className="w-100"
                onClick={handleGoBack}
              >
                Back to Seat Selection
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Error Modal for Seat Availability Issues */}
      <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Seat Not Available</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{modalMessage}</p>
          <p className="text-muted">Please select different seats to continue with your booking.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowErrorModal(false)}>
            Close
          </Button>
          <Button variant="gold" onClick={() => {
            setShowErrorModal(false);
            handleGoBack();
          }}>
            Select New Seats
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Checkout;