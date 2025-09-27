import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Container, Form, Alert, Spinner, Table } from 'react-bootstrap';
import { adminAPI, bookingAPI } from '../../services/api';

const CreateBooking = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [seatMap, setSeatMap] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [formData, setFormData] = useState({
    user_id: '',
    showtime_id: '',
    seats: [],
    total_amount: 0,
    payment_method: 'credit_card',
    payment_status: 'completed',
    booking_status: 'confirmed'
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ show: false, variant: '', message: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch users
        const userResponse = await adminAPI.getAdminUsers({ per_page: 100 });
        const usersData = userResponse.data?.data?.data || userResponse.data?.data || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
        
        // Fetch showtimes
        const showtimeResponse = await adminAPI.getAdminShowtimes({ per_page: 100 });
        const showtimesData = showtimeResponse.data?.data?.data || showtimeResponse.data?.data || [];
        setShowtimes(Array.isArray(showtimesData) ? showtimesData : []);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setAlert({ show: true, variant: 'danger', message: 'Failed to load data: ' + (error.response?.data?.message || error.message) });
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleShowtimeChange = async (showtimeId) => {
    setFormData(prev => ({
      ...prev,
      showtime_id: showtimeId
    }));
    
    if (showtimeId) {
      try {
        // Fetch seat map for the selected showtime
        const response = await adminAPI.getShowtimeById(showtimeId);
        const showtimeData = response.data?.data;
        
        if (!showtimeData) {
          throw new Error('Showtime data not found');
        }
        
        // For simplicity, we'll generate a basic seat map
        // In a real application, you would fetch the actual seat map from the API
        const generatedSeatMap = [];
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        
        rows.forEach((row, rowIndex) => {
          for (let i = 1; i <= 10; i++) {
            const seatNumber = `${row}${i}`;
            const seatType = rowIndex < 2 ? 'box' : rowIndex < 5 ? 'platinum' : 'gold';
            generatedSeatMap.push({
              seat: seatNumber,
              status: 'available',
              type: seatType,
              price: seatType === 'box' ? 200000 : seatType === 'platinum' ? 150000 : 100000
            });
          }
        });
        
        setSeatMap(generatedSeatMap);
        setSelectedShowtime(showtimeData);
      } catch (error) {
        console.error('Error fetching showtime details:', error);
        setAlert({ show: true, variant: 'danger', message: 'Failed to load showtime details: ' + (error.response?.data?.message || error.message) });
      }
    } else {
      setSeatMap([]);
      setSelectedShowtime(null);
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.status === 'occupied') return;
    
    const isSelected = selectedSeats.some(s => s.seat === seat.seat);
    
    if (isSelected) {
      // Deselect seat
      setSelectedSeats(prev => prev.filter(s => s.seat !== seat.seat));
    } else {
      // Select seat
      setSelectedSeats(prev => [...prev, seat]);
    }
  };

  const calculateTotalAmount = useCallback(() => {
    return selectedSeats.reduce((total, seat) => total + (seat.price || 0), 0);
  }, [selectedSeats]);

  useEffect(() => {
    const total = calculateTotalAmount();
    setFormData(prev => ({
      ...prev,
      seats: selectedSeats,
      total_amount: total
    }));
  }, [selectedSeats, calculateTotalAmount]);

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
    
    // If showtime changes, fetch seat map
    if (name === 'showtime_id') {
      handleShowtimeChange(value);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.user_id) newErrors.user_id = 'User is required';
    if (!formData.showtime_id) newErrors.showtime_id = 'Showtime is required';
    if (selectedSeats.length === 0) newErrors.seats = 'At least one seat must be selected';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare booking data
      const bookingData = {
        ...formData,
        seats: JSON.stringify(selectedSeats.map(seat => ({
          seat: seat.seat,
          type: seat.type,
          price: seat.price
        })))
      };
      
      await bookingAPI.create(bookingData);
      setAlert({ show: true, variant: 'success', message: 'Booking created successfully!' });
      
      // Redirect to bookings list after a short delay
      setTimeout(() => {
        navigate('/admin/bookings');
      }, 1500);
    } catch (error) {
      console.error('Error creating booking:', error);
      setAlert({ show: true, variant: 'danger', message: error.response?.data?.message || error.message || 'Failed to create booking' });
      setLoading(false);
    }
  };

  const getSeatClass = (seat) => {
    if (seat.status === 'occupied') return 'occupied';
    if (selectedSeats.some(s => s.seat === seat.seat)) return 'selected';
    return 'available';
  };

  if (loading && users.length === 0 && showtimes.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="gold" />
        <p className="mt-2">Loading data...</p>
      </div>
    );
  }

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">Create New Booking</h2>
        <Button variant="secondary" onClick={() => navigate('/admin/bookings')}>
          <i className="bi bi-arrow-left me-1"></i> Back to Bookings
        </Button>
      </div>

      {alert.show && (
        <Alert variant={alert.variant} onClose={() => setAlert({ show: false, variant: '', message: '' })} dismissible>
          {alert.message}
        </Alert>
      )}

      <Card className="bg-dark">
        <Card.Header className="bg-secondary text-white">
          <i className="bi bi-ticket-perforated me-2"></i> Booking Details
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>User <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    isInvalid={!!errors.user_id}
                  >
                    <option value="">Select a user</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.user_id}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Showtime <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="showtime_id"
                    value={formData.showtime_id}
                    onChange={handleChange}
                    isInvalid={!!errors.showtime_id}
                  >
                    <option value="">Select a showtime</option>
                    {showtimes.map(showtime => (
                      <option key={showtime.id} value={showtime.id}>
                        {showtime.movie?.title || 'Unknown Movie'} - {showtime.theater?.name || 'Unknown Theater'} ({showtime.show_date} {showtime.show_time})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.showtime_id}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>
            
            {selectedShowtime && (
              <Card className="bg-secondary mb-3">
                <Card.Header className="bg-dark text-white">
                  <i className="bi bi-info-circle me-2"></i> Showtime Details
                </Card.Header>
                <Card.Body>
                  <div className="row">
                    <div className="col-md-4">
                      <strong>Movie:</strong> {selectedShowtime.movie?.title || 'N/A'}
                    </div>
                    <div className="col-md-4">
                      <strong>Theater:</strong> {selectedShowtime.theater?.name || 'N/A'}
                    </div>
                    <div className="col-md-4">
                      <strong>Date & Time:</strong> {selectedShowtime.show_date || 'N/A'} at {selectedShowtime.show_time || 'N/A'}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}
            
            {seatMap.length > 0 && (
              <Card className="bg-secondary mb-3">
                <Card.Header className="bg-dark text-white">
                  <i className="bi bi-airline-seat-recline-normal me-2"></i> Select Seats
                </Card.Header>
                <Card.Body>
                  <div className="seat-map mb-3">
                    <div className="screen text-center mb-3">
                      <div className="bg-primary text-white py-2 rounded">
                        <i className="bi bi-tv me-2"></i> SCREEN
                      </div>
                    </div>
                    <div className="seat-layout">
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(row => (
                        <div key={row} className="d-flex justify-content-center mb-2">
                          <div className="me-3 fw-bold">{row}</div>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(col => {
                            const seat = seatMap.find(s => s.seat === `${row}${col}`);
                            return seat ? (
                              <div
                                key={seat.seat}
                                className={`seat ${getSeatClass(seat)} me-2`}
                                onClick={() => handleSeatClick(seat)}
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  border: '1px solid #ccc',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: seat.status === 'occupied' ? 'not-allowed' : 'pointer',
                                  backgroundColor: 
                                    seat.status === 'occupied' ? '#6c757d' :
                                    selectedSeats.some(s => s.seat === seat.seat) ? '#007bff' : '#fff',
                                  color: 
                                    seat.status === 'occupied' ? '#fff' :
                                    selectedSeats.some(s => s.seat === seat.seat) ? '#fff' : '#000',
                                  borderRadius: '3px'
                                }}
                              >
                                {col}
                              </div>
                            ) : null;
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="seat-legend mb-3">
                    <div className="d-flex gap-3">
                      <div className="d-flex align-items-center">
                        <div className="me-2" style={{ width: '20px', height: '20px', backgroundColor: '#fff', border: '1px solid #ccc' }}></div>
                        <span>Available</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="me-2" style={{ width: '20px', height: '20px', backgroundColor: '#007bff' }}></div>
                        <span>Selected</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="me-2" style={{ width: '20px', height: '20px', backgroundColor: '#6c757d' }}></div>
                        <span>Occupied</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedSeats.length > 0 && (
                    <div>
                      <h6>Selected Seats: {selectedSeats.length}</h6>
                      <Table striped bordered hover variant="dark" size="sm">
                        <thead>
                          <tr>
                            <th>Seat</th>
                            <th>Type</th>
                            <th>Price (VND)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSeats.map(seat => (
                            <tr key={seat.seat}>
                              <td>{seat.seat}</td>
                              <td>
                                <span className={`badge ${
                                  seat.type === 'gold' ? 'bg-warning text-dark' :
                                  seat.type === 'platinum' ? 'bg-info text-dark' : 'bg-success'
                                }`}>
                                  {seat.type}
                                </span>
                              </td>
                              <td>{(seat.price || 0).toLocaleString('vi-VN')}</td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan="2" className="text-end"><strong>Total:</strong></td>
                            <td>
                              <strong>{calculateTotalAmount().toLocaleString('vi-VN')} VND</strong>
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
            
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Payment Method</Form.Label>
                  <Form.Select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </Form.Select>
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
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
            
            <Form.Group className="mb-3">
              <Form.Label>Booking Status</Form.Label>
              <Form.Select
                name="booking_status"
                value={formData.booking_status}
                onChange={handleChange}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </Form.Select>
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => navigate('/admin/bookings')}>
                <i className="bi bi-x-circle me-1"></i> Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading || selectedSeats.length === 0}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-1"></i> Create Booking
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

export default CreateBooking;