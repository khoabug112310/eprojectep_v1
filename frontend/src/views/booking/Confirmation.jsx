import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { bookingAPI } from '../../services/api';

const Confirmation = () => {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
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

  // Function to generate QR code URL using QR server API
  const generateQRCodeURL = (bookingCode) => {
    if (!bookingCode) return '';
    const size = '200x200';
    const data = encodeURIComponent(bookingCode);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${data}`;
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
        // Ticket data is available but not used in this component
        console.log('Ticket data received:', ticketResponse.data.data);
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
    // Save booking data to localStorage for the print page
    localStorage.setItem('printBooking', JSON.stringify(booking));
    // Navigate to the print page
    navigate('/print-ticket', { state: { booking } });
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

  // QR code container styles
  const qrCodeContainerStyle = {
    border: '2px solid #ffc107',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    padding: '15px',
    borderRadius: '8px',
    display: 'inline-block'
  };

  // QR code text styles
  const qrCodeTextStyle = {
    color: '#212529',
    fontWeight: 'bold',
    marginTop: '10px',
    marginBottom: '0'
  };

  // QR code small text styles
  const qrCodeSmallTextStyle = {
    color: '#6c757d',
    fontSize: '0.875em',
    marginBottom: '0'
  };

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
                        ) : (
                          <div style={qrCodeContainerStyle}>
                            <img 
                              src={generateQRCodeURL(booking.booking_code)} 
                              alt="QR Code" 
                              className="img-fluid"
                              style={{ maxWidth: '200px', height: 'auto' }}
                            />
                            <p style={qrCodeTextStyle}>Scan at theater entrance</p>
                            <p style={qrCodeSmallTextStyle}>Booking Code: {booking.booking_code}</p>
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
      
      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide elements that shouldn't be printed */
          .no-print, .btn, .alert, .navbar, .footer, .d-flex {
            display: none !important;
          }
          
          /* Ensure the ticket takes up the full page */
          body, html {
            margin: 0;
            padding: 0;
            background: white !important;
            color: black !important;
          }
          
          /* Make the container full width for printing */
          .container {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Ensure the card is visible and properly styled for printing */
          .card {
            border: 1px solid #000 !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
          
          /* Ensure text is black for better printing */
          .text-gold, .text-success, .text-muted, p, h1, h2, h3, h4, h5, h6 {
            color: black !important;
          }
          
          /* Make QR code container visible */
          [style*="background-color"] {
            background-color: white !important;
            border: 1px solid black !important;
          }
          
          /* Ensure images are printed */
          img {
            display: block !important;
            max-width: 100% !important;
            height: auto !important;
          }
          
          /* Center the ticket content */
          .text-center {
            text-align: center !important;
          }
          
          /* Add some padding for better print layout */
          .card-body {
            padding: 20px !important;
          }
          
          /* Ensure rows and columns work for print */
          .row {
            display: flex !important;
            flex-wrap: wrap !important;
          }
          
          .col-md-6, .col-md-8 {
            flex: 0 0 50% !important;
            max-width: 50% !important;
          }
        }
      `}</style>
    </Container>
  );
};

export default Confirmation;