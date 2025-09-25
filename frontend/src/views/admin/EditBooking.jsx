import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button, Card, Container, Form, Alert, Spinner, Badge, Table } from 'react-bootstrap';
import { adminAPI } from '../../services/api';

const EditBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [booking, setBooking] = useState(null);
  const [formData, setFormData] = useState({
    booking_status: '',
    payment_status: ''
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ show: false, variant: '', message: '' });

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        if (!id) {
          throw new Error('Booking ID is required');
        }
        
        const response = await adminAPI.getBookingById(id);
        const bookingData = response.data?.data;
        
        if (!bookingData) {
          throw new Error('Booking data not found');
        }
        
        setBooking(bookingData);
        
        setFormData({
          booking_status: bookingData.booking_status || '',
          payment_status: bookingData.payment_status || ''
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching booking:', error);
        setAlert({ show: true, variant: 'danger', message: 'Failed to load booking data: ' + (error.response?.data?.message || error.message) });
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setUpdating(true);
      const response = await adminAPI.updateBooking(id, formData);
      setAlert({ show: true, variant: 'success', message: 'Booking updated successfully!' });
      
      // Navigate back to the previous page after successful update
      if (response.data?.success) {
        // Wait a moment to show the success message before navigating
        setTimeout(() => {
          // If there's a return URL in the state, go back to it
          // Otherwise, go back to the previous page
          if (location.state?.from) {
            navigate(location.state.from);
          } else {
            navigate(-1); // Go back to previous page
          }
        }, 1500);
      }
      
      // Refresh booking data
      const refreshResponse = await adminAPI.getBookingById(id);
      const refreshedBooking = refreshResponse.data?.data;
      if (refreshedBooking) {
        setBooking(refreshedBooking);
      }
      
      setUpdating(false);
    } catch (error) {
      console.error('Error updating booking:', error);
      setAlert({ show: true, variant: 'danger', message: error.response?.data?.message || error.message || 'Failed to update booking' });
      setUpdating(false);
    }
  };

  // Helper function to parse seat data
  const parseSeats = (seats) => {
    if (!seats) return [];
    
    // If it's already an array, return it
    if (Array.isArray(seats)) {
      return seats;
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof seats === 'string') {
      try {
        const parsed = JSON.parse(seats);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Failed to parse seats data', e);
        return [];
      }
    }
    
    return [];
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="gold" />
        <p className="mt-2">Loading booking data...</p>
      </div>
    );
  }

  // Parse seats for display
  const bookingSeats = booking ? parseSeats(booking.seats) : [];

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">Edit Booking</h2>
        <Button variant="secondary" onClick={() => navigate('/admin/bookings')}>
          <i className="bi bi-arrow-left me-1"></i> Back to Bookings
        </Button>
      </div>

      {alert.show && (
        <Alert variant={alert.variant} onClose={() => setAlert({ show: false, variant: '', message: '' })} dismissible>
          {alert.message}
        </Alert>
      )}

      {booking && (
        <div className="row mb-4">
          <div className="col-md-6">
            <Card className="bg-dark">
              <Card.Header className="bg-secondary text-white">
                <i className="bi bi-info-circle me-2"></i> Booking Information
              </Card.Header>
              <Card.Body>
                <Table responsive variant="dark" size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Booking Code:</strong></td>
                      <td>{booking.booking_code || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td><strong>User:</strong></td>
                      <td>{booking.user?.name || 'N/A'} ({booking.user?.email || 'N/A'})</td>
                    </tr>
                    <tr>
                      <td><strong>Movie:</strong></td>
                      <td>{booking.showtime?.movie?.title || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td><strong>Theater:</strong></td>
                      <td>{booking.showtime?.theater?.name || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td><strong>Show Date:</strong></td>
                      <td>{booking.showtime?.show_date || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td><strong>Show Time:</strong></td>
                      <td>{booking.showtime?.show_time || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td><strong>Total Amount:</strong></td>
                      <td>{(booking.total_amount || 0).toLocaleString('vi-VN')} VND</td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </div>
          
          <div className="col-md-6">
            <Card className="bg-dark">
              <Card.Header className="bg-secondary text-white">
                <i className="bi bi-flag me-2"></i> Status Information
              </Card.Header>
              <Card.Body>
                <Table responsive variant="dark" size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Booking Status:</strong></td>
                      <td>
                        <Badge bg={
                          booking.booking_status === 'confirmed' || booking.booking_status === 'completed' ? 'success' :
                          booking.booking_status === 'cancelled' ? 'danger' : 'warning'
                        }>
                          {booking.booking_status || 'N/A'}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Payment Status:</strong></td>
                      <td>
                        <Badge bg={
                          booking.payment_status === 'completed' ? 'success' :
                          booking.payment_status === 'failed' ? 'danger' : 'warning'
                        }>
                          {booking.payment_status || 'N/A'}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Seat Count:</strong></td>
                      <td>
                        <span className="badge bg-primary">
                          {bookingSeats.length} seat{bookingSeats.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Booked At:</strong></td>
                      <td>{booking.created_at ? new Date(booking.created_at).toLocaleString() : 'N/A'}</td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      <Card className="bg-dark">
        <Card.Header className="bg-secondary text-white">
          <i className="bi bi-pencil me-2"></i> Update Booking Status
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Booking Status</Form.Label>
                  <Form.Select
                    name="booking_status"
                    value={formData.booking_status}
                    onChange={handleChange}
                  >
                    <option value="">Select status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Current status: <Badge bg={
                      booking?.booking_status === 'confirmed' || booking?.booking_status === 'completed' ? 'success' :
                      booking?.booking_status === 'cancelled' ? 'danger' : 'warning'
                    }>{booking?.booking_status || 'N/A'}</Badge>
                  </Form.Text>
                </Form.Group>
              </div>
              
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Payment Status</Form.Label>
                  <Form.Select
                    name="payment_status"
                    value={formData.payment_status}
                    onChange={handleChange}
                  >
                    <option value="">Select status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Current status: <Badge bg={
                      booking?.payment_status === 'completed' ? 'success' :
                      booking?.payment_status === 'failed' ? 'danger' : 'warning'
                    }>{booking?.payment_status || 'N/A'}</Badge>
                  </Form.Text>
                </Form.Group>
              </div>
            </div>
            
            {bookingSeats.length > 0 && (
              <Card className="bg-secondary mb-3">
                <Card.Header className="bg-dark text-white">
                  <i className="bi bi-airline-seat-recline-normal me-2"></i> Selected Seats
                </Card.Header>
                <Card.Body>
                  <Table striped bordered hover variant="dark" size="sm">
                    <thead>
                      <tr>
                        <th>Seat Number</th>
                        <th>Type</th>
                        <th>Price (VND)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingSeats.length > 0 ? (
                        bookingSeats.map((seat, index) => {
                          // Handle both string and object formats
                          const seatData = typeof seat === 'string' ? { seat: seat } : seat;
                          return (
                            <tr key={index}>
                              <td>{seatData.seat || 'N/A'}</td>
                              <td>
                                <span className={`badge ${
                                  seatData.type === 'gold' ? 'bg-warning text-dark' :
                                  seatData.type === 'platinum' ? 'bg-info text-dark' : 
                                  seatData.type === 'box' ? 'bg-success' : 'bg-secondary'
                                }`}>
                                  {seatData.type || 'N/A'}
                                </span>
                              </td>
                              <td>{seatData.price ? parseInt(seatData.price).toLocaleString('vi-VN') : 'N/A'}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="3">No seat data available</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}
            
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => navigate('/admin/bookings')}>
                <i className="bi bi-x-circle me-1"></i> Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-1"></i> Update Booking
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

export default EditBooking;