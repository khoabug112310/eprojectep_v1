import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, Container, Row, Col, Alert, Spinner, Modal, Form } from 'react-bootstrap';
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
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [userDiscountCodes] = useState([
    { code: 'WELCOME10', value: 10, type: 'percentage', description: '10% off for new users' },
    { code: 'SAVE20', value: 20, type: 'percentage', description: '20% off' },
    { code: 'NEW10K', value: 10000, type: 'fixed', description: '10,000 VND off' },
    { code: 'SAVE20K', value: 20000, type: 'fixed', description: '20,000 VND off' }
  ]);
  const [showSuccess, setShowSuccess] = useState(false);

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

  // Function to apply discount code
  const applyDiscount = () => {
    if (!discountCode.trim()) {
      setError('Please enter a discount code');
      return;
    }
    
    const code = userDiscountCodes.find(c => c.code === discountCode.toUpperCase());
    if (code) {
      setAppliedDiscount(code);
      setError('');
    } else {
      setError('Invalid discount code');
    }
  };

  // Function to remove applied discount
  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
  };

  // Calculate total amount with discount
  const calculateTotalAmount = () => {
    if (!booking || !booking.total_amount) return 0;
    
    let total = booking.total_amount;
    
    if (appliedDiscount) {
      if (appliedDiscount.type === 'percentage') {
        total = total - (total * appliedDiscount.value / 100);
      } else {
        total = total - appliedDiscount.value;
      }
    }
    
    return Math.max(0, total); // Ensure total doesn't go below 0
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Simulate payment processing - just show success message and navigate
      setShowSuccess(true);
      
      // Store booking ID in localStorage for confirmation page
      localStorage.setItem('bookingId', booking.id);
      
      // Navigate to confirmation page after a short delay
      setTimeout(() => {
        navigate('/booking/confirmation');
      }, 2000);
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

  const totalAmount = calculateTotalAmount();
  const discountAmount = booking.total_amount - totalAmount;

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
                  <span><strong>Subtotal:</strong></span>
                  <span>{booking.total_amount?.toLocaleString()} VND</span>
                </div>
                {appliedDiscount && (
                  <div className="d-flex justify-content-between">
                    <span><strong>Discount ({appliedDiscount.code}):</strong></span>
                    <span className="text-success">-{discountAmount.toLocaleString()} VND</span>
                  </div>
                )}
                <div className="d-flex justify-content-between mt-2">
                  <span><strong>Total Amount:</strong></span>
                  <span className="text-gold h5">{totalAmount.toLocaleString()} VND</span>
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
              
              {showSuccess && (
                <Alert variant="success" className="mb-3">
                  Payment processed successfully! Redirecting to confirmation...
                </Alert>
              )}
              
              {/* Payment Method Selection */}
              <Form.Group className="mb-3">
                <Form.Label><strong>Payment Method</strong></Form.Label>
                <Form.Select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={loading}
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="e_wallet">E-Wallet</option>
                </Form.Select>
              </Form.Group>
              
              {/* Discount Code Section */}
              <Form.Group className="mb-3">
                <Form.Label><strong>Discount Code</strong></Form.Label>
                {appliedDiscount ? (
                  <div className="d-flex justify-content-between align-items-center bg-light p-2 rounded">
                    <div>
                      <div><strong>{appliedDiscount.code}</strong></div>
                      <div className="small text-muted">{appliedDiscount.description}</div>
                    </div>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={removeDiscount}
                      disabled={loading}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="d-flex mb-2">
                      <Form.Control
                        type="text"
                        placeholder="Enter discount code"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        disabled={loading}
                      />
                      <Button 
                        variant="outline-light" 
                        className="ms-2"
                        onClick={applyDiscount}
                        disabled={loading}
                      >
                        Apply
                      </Button>
                    </div>
                    
                    {/* User's available discount codes */}
                    {userDiscountCodes.length > 0 && (
                      <div className="mt-2">
                        <small className="text-muted">Your discount codes:</small>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          {userDiscountCodes.map((code, index) => (
                            <Button
                              key={index}
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => {
                                setDiscountCode(code.code);
                                setAppliedDiscount(code);
                              }}
                              disabled={loading}
                            >
                              {code.code}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Form.Group>
              
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
                disabled={loading}
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