import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { bookingAPI } from '../../services/api';

const Confirmation = () => {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const bookingId = localStorage.getItem('bookingId');
        if (!bookingId) {
          navigate('/movies');
          return;
        }

        const response = await bookingAPI.getById(bookingId);
        const bookingData = response.data.data || response.data;
        setBooking(bookingData);
        
        // Fetch ticket data which includes QR code
        fetchTicketData(bookingId);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Failed to load booking details');
        setLoading(false);
      }
    };

    fetchBooking();
  }, [navigate]);

  const fetchTicketData = async (bookingId) => {
    setTicketLoading(true);
    try {
      const ticketResponse = await bookingAPI.getTicket(bookingId);
      if (ticketResponse.data.success) {
        setTicketData(ticketResponse.data.data);
      } else {
        console.warn('Ticket not ready yet:', ticketResponse.data.message);
      }
    } catch (ticketError) {
      console.warn('Failed to fetch ticket data:', ticketError);
    } finally {
      setTicketLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="gold" />
        <p className="mt-2">Loading booking details...</p>
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
            <h3 className="text-success">Booking Completed!</h3>
            <p>Your tickets have been booked and confirmed successfully.</p>
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
                          <p><strong>Movie:</strong> {booking.showtime?.movie?.title}</p>
                          <p><strong>Theater:</strong> {booking.showtime?.theater?.name}</p>
                          <p><strong>Date:</strong> {booking.showtime?.show_date && new Date(booking.showtime.show_date).toLocaleDateString('en-GB')}</p>
                          <p><strong>Time:</strong> {booking.showtime && calculateShowtime(booking.showtime)}</p>
                        </Col>
                        <Col md={6}>
                          <p><strong>Seats:</strong> {booking.seats?.map(seat => seat.seat).join(', ')}</p>
                          <p><strong>Total Amount:</strong> {booking.total_amount?.toLocaleString()} VND</p>
                          <p><strong>Status:</strong> 
                            <span className="text-success"> BOOKED</span>
                          </p>
                        </Col>
                      </Row>
                      
                      <div className="text-center mt-4">
                        {ticketLoading ? (
                          <div>
                            <Spinner animation="border" size="sm" />
                            <p>Generating QR code...</p>
                          </div>
                        ) : ticketData && ticketData.qr_code_url ? (
                          <div>
                            <img 
                              src={ticketData.qr_code_url} 
                              alt="QR Code" 
                              className="img-fluid"
                              style={{ maxWidth: '200px', height: 'auto' }}
                            />
                            <p className="mt-2">Scan at theater entrance</p>
                          </div>
                        ) : (
                          <div className="qr-code-placeholder bg-light text-dark p-3 d-inline-block">
                            <p className="mb-0">QR CODE PLACEHOLDER</p>
                            <p className="mb-0">Scan at theater entrance</p>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => fetchTicketData(booking.id)}
                            >
                              Refresh QR Code
                            </Button>
                          </div>
                        )}
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