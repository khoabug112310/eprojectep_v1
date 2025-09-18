import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Container, Row, Col, Badge, Alert } from 'react-bootstrap';
import { bookingAPI } from '../services/api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await bookingAPI.getUserBookings();
        setBookings(response.data.data || response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load bookings');
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

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
      <h2 className="text-gold mb-4">My Bookings</h2>
      
      {bookings.length === 0 ? (
        <Card className="bg-dark">
          <Card.Body>
            <p>You have not made any bookings yet.</p>
            <Button as={Link} to="/movies" variant="primary">
              Book a Movie
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {bookings.map((booking) => (
            <Col key={booking.id} md={6} className="mb-4">
              <Card className="h-100 bg-dark">
                <Card.Body>
                  <Card.Title className="text-gold">
                    {booking.movie?.title || 'Movie Title'}
                  </Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {booking.theater?.name || 'Theater Name'}
                  </Card.Subtitle>
                  
                  <Card.Text>
                    <strong>Showtime:</strong> {booking.showtime?.show_date} at {booking.showtime?.show_time}<br />
                    <strong>Seats:</strong> {booking.seats?.map(seat => seat.seat).join(', ') || 'N/A'}<br />
                    <strong>Total Amount:</strong> {(booking.total_amount || 0).toLocaleString()} VND<br />
                    <strong>Booking Code:</strong> {booking.booking_code || 'N/A'}
                  </Card.Text>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <Badge bg={
                      booking.booking_status === 'confirmed' ? 'success' :
                      booking.booking_status === 'cancelled' ? 'danger' : 'warning'
                    }>
                      {booking.booking_status?.toUpperCase() || 'CONFIRMED'}
                    </Badge>
                    
                    <Button 
                      as={Link} 
                      to={`/booking/confirmation?bookingId=${booking.id}`} 
                      variant="outline-primary" 
                      size="sm"
                    >
                      View Details
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default MyBookings;