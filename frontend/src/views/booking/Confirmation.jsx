import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Container, Row, Col, Alert } from 'react-bootstrap';
import { bookingAPI } from '../../services/api';

const Confirmation = () => {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const bookingId = localStorage.getItem('bookingId');
        if (!bookingId) {
          navigate('/movies');
          return;
        }

        const response = await bookingAPI.getById(bookingId);
        setBooking(response.data.data || response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load booking details');
        setLoading(false);
      }
    };

    fetchBooking();
  }, [navigate]);

  const handlePrint = () => {
    window.print();
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

  if (error) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="text-gold mb-4">Booking Confirmation</h2>
      
      <Card className="bg-dark mb-4">
        <Card.Body>
          <div className="text-center mb-4">
            <div className="text-success">
              <h1>✓</h1>
            </div>
            <h3 className="text-success">Booking Successful!</h3>
            <p>Your tickets have been booked successfully.</p>
          </div>
          
          {booking && (
            <div>
              <Row>
                <Col md={8} className="mx-auto">
                  <Card className="bg-secondary border-gold">
                    <Card.Body>
                      <div className="text-center mb-4">
                        <h4 className="text-gold">E-Ticket</h4>
                        <p className="text-muted">Booking Code: {booking.booking_code}</p>
                      </div>
                      
                      <Row>
                        <Col md={6}>
                          <p><strong>Movie:</strong> {booking.movie?.title}</p>
                          <p><strong>Theater:</strong> {booking.theater?.name}</p>
                          <p><strong>Date:</strong> {booking.showtime?.show_date}</p>
                          <p><strong>Time:</strong> {booking.showtime?.show_time}</p>
                        </Col>
                        <Col md={6}>
                          <p><strong>Seats:</strong> {booking.seats?.map(seat => seat.seat).join(', ')}</p>
                          <p><strong>Total Amount:</strong> {booking.total_amount?.toLocaleString()} VND</p>
                          <p><strong>Status:</strong> 
                            <span className="text-success"> {booking.booking_status?.toUpperCase()}</span>
                          </p>
                        </Col>
                      </Row>
                      
                      <div className="text-center mt-4">
                        <div className="qr-code-placeholder bg-light text-dark p-3 d-inline-block">
                          <p className="mb-0">QR CODE PLACEHOLDER</p>
                          <p className="mb-0">Scan at theater entrance</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <div className="d-flex justify-content-center gap-3 mt-4">
                <Button variant="primary" onClick={handlePrint}>
                  Print Ticket
                </Button>
                <Button variant="outline-primary" onClick={() => navigate('/')}>
                  Back to Home
                </Button>
                <Button variant="outline-primary" onClick={() => navigate('/my-bookings')}>
                  My Bookings
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
      
      <Alert variant="info">
        <strong>Important:</strong> Please arrive at least 30 minutes before the showtime. 
        Bring this e-ticket or have the booking code ready for entry.
      </Alert>
    </Container>
  );
};

export default Confirmation;