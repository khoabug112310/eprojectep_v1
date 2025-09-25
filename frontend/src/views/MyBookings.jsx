import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Container, Row, Col, Badge, Alert, Spinner, Modal, Form, InputGroup, Pagination } from 'react-bootstrap';
import { bookingAPI } from '../services/api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const bookingsPerPage = 6;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await bookingAPI.getUserBookings();
        // For paginated responses, the actual data is in response.data.data.data
        const bookingsData = response.data.data?.data || response.data.data || [];
        const sortedBookings = Array.isArray(bookingsData) ? 
          bookingsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [];
        setBookings(sortedBookings);
        setFilteredBookings(sortedBookings);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. Please try again.');
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Filter bookings based on search term and status
  useEffect(() => {
    let filtered = bookings;
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => 
        booking.booking_status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.movie?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.theater?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.booking_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [bookings, searchTerm, statusFilter]);

  // Calculate showtime with end time based on movie duration
  const calculateShowtime = (showtime) => {
    if (!showtime || !showtime.show_time || !showtime.movie?.duration) return showtime?.show_time || '';
    
    try {
      const [hours, minutes] = showtime.show_time.split(':').map(Number);
      const startTime = new Date();
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime.getTime() + showtime.movie.duration * 60000);
      
      const formatTime = (date) => {
        return date.toTimeString().slice(0, 5);
      };
      
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    } catch (error) {
      return showtime.show_time;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    setCancelLoading(true);
    try {
      await bookingAPI.cancelBooking(selectedBooking.id);
      
      // Update local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === selectedBooking.id 
            ? { ...booking, booking_status: 'cancelled' }
            : booking
        )
      );
      
      setShowCancelModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setError('Failed to cancel booking. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Check if booking can be cancelled (e.g., not past showtime)
  const canCancelBooking = (booking) => {
    if (booking.booking_status === 'cancelled' || booking.booking_status === 'completed') {
      return false;
    }
    
    // Check if showtime is in the future
    if (booking.showtime?.show_date && booking.showtime?.show_time) {
      const showtimeDate = new Date(booking.showtime.show_date + ' ' + booking.showtime.show_time);
      const now = new Date();
      return showtimeDate > now;
    }
    
    return true;
  };

  // Pagination logic
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <Spinner animation="border" variant="gold" />
          <p className="mt-2 text-gold">Loading your bookings...</p>
        </div>
      </Container>
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold mb-0">My Bookings</h2>
        <Button as={Link} to="/movies" variant="outline-gold">
          <i className="bi bi-plus-circle me-2"></i>
          Book New Movie
        </Button>
      </div>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {/* Search and Filter Section */}
      <Card className="bg-dark mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-secondary border-gold">
                  <i className="bi bi-search text-gold"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by movie title, theater, or booking code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-secondary text-white border-gold"
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-secondary text-white border-gold"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <div className="text-center">
                <small className="text-muted">
                  {filteredBookings.length} of {bookings.length} bookings
                </small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {filteredBookings.length === 0 ? (
        <Card className="bg-dark text-center py-5">
          <Card.Body>
            {searchTerm || statusFilter !== 'all' ? (
              <>
                <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
                <h4 className="mt-3 text-muted">No bookings found</h4>
                <p className="text-muted">No bookings match your search criteria. Try adjusting your filters.</p>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <i className="bi bi-ticket-perforated text-muted" style={{ fontSize: '3rem' }}></i>
                <h4 className="mt-3 text-muted">No bookings yet</h4>
                <p className="text-muted">You haven't made any movie bookings yet. Start by booking your first movie!</p>
                <Button as={Link} to="/movies" variant="primary" size="lg">
                  <i className="bi bi-film me-2"></i>
                  Browse Movies
                </Button>
              </>
            )}
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row>
            {currentBookings.map((booking) => (
              <Col key={booking.id} lg={6} className="mb-4">
                <Card className="h-100 bg-dark border-secondary">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="flex-grow-1">
                        <Card.Title className="text-gold h5 mb-1">
                          {booking.movie?.title || 'Movie Title'}
                        </Card.Title>
                        <Card.Subtitle className="text-muted small">
                          <i className="bi bi-geo-alt me-1"></i>
                          {booking.theater?.name || 'Theater Name'}
                        </Card.Subtitle>
                      </div>
                      <Badge bg={getStatusColor(booking.booking_status)} className="ms-2">
                        {booking.booking_status?.toUpperCase() || 'CONFIRMED'}
                      </Badge>
                    </div>
                    
                    <div className="booking-details mb-3">
                      <div className="row text-sm">
                        <div className="col-12 mb-2">
                          <strong className="text-gold">Showtime:</strong>
                          <br />
                          <span className="text-white">
                            {formatDate(booking.showtime?.show_date)} at {calculateShowtime(booking.showtime) || booking.showtime?.show_time}
                          </span>
                        </div>
                        
                        <div className="col-12 mb-2">
                          <strong className="text-gold">Seats:</strong>
                          <br />
                          <div className="d-flex flex-wrap gap-1 mt-1">
                            {booking.seats?.map((seat, index) => (
                              <Badge key={index} bg="secondary" className="small">
                                {seat.seat} ({seat.type})
                              </Badge>
                            )) || <span className="text-muted">N/A</span>}
                          </div>
                        </div>
                        
                        <div className="col-6 mb-2">
                          <strong className="text-gold">Total:</strong>
                          <br />
                          <span className="text-success h6 mb-0">
                            {((booking.total_amount || 0) / 25000).toLocaleString('en-US', {style: 'currency', currency: 'USD'})}
                          </span>
                        </div>
                        
                        <div className="col-6 mb-2">
                          <strong className="text-gold">Code:</strong>
                          <br />
                          <code className="text-warning">{booking.booking_code || 'N/A'}</code>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="d-flex gap-2">
                        <Button 
                          as={Link} 
                          to={`/booking/confirmation?bookingId=${booking.id}`} 
                          variant="outline-primary" 
                          size="sm"
                          className="flex-grow-1"
                        >
                          <i className="bi bi-eye me-1"></i>
                          View Details
                        </Button>
                        
                        {canCancelBooking(booking) && (
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowCancelModal(true);
                            }}
                          >
                            <i className="bi bi-x-circle me-1"></i>
                            Cancel
                          </Button>
                        )}
                        
                        {booking.booking_status === 'completed' && (
                          <Button 
                            variant="outline-warning" 
                            size="sm"
                            onClick={() => navigate(`/movies/${booking.movie?.id}#reviews`)}
                          >
                            <i className="bi bi-star me-1"></i>
                            Review
                          </Button>
                        )}
                      </div>
                      
                      <div className="text-center mt-2">
                        <small className="text-muted">
                          Booked on {formatDate(booking.created_at)}
                        </small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First 
                  onClick={() => paginate(1)} 
                  disabled={currentPage === 1}
                />
                <Pagination.Prev 
                  onClick={() => paginate(currentPage - 1)} 
                  disabled={currentPage === 1}
                />
                
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <Pagination.Item
                        key={pageNum}
                        active={pageNum === currentPage}
                        onClick={() => paginate(pageNum)}
                      >
                        {pageNum}
                      </Pagination.Item>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return <Pagination.Ellipsis key={pageNum} />;
                  }
                  return null;
                })}
                
                <Pagination.Next 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last 
                  onClick={() => paginate(totalPages)} 
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
      
      {/* Cancel Booking Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-gold">Cancel Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark">
          <div className="text-center">
            <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '3rem' }}></i>
            <h5 className="mt-3 text-white">Are you sure you want to cancel this booking?</h5>
            {selectedBooking && (
              <div className="mt-3 p-3 bg-secondary rounded">
                <strong className="text-gold">{selectedBooking.movie?.title}</strong>
                <br />
                <small className="text-muted">
                  {formatDate(selectedBooking.showtime?.show_date)} at {selectedBooking.showtime?.show_time}
                </small>
                <br />
                <small className="text-muted">
                  Seats: {selectedBooking.seats?.map(seat => seat.seat).join(', ')}
                </small>
              </div>
            )}
            <p className="text-muted mt-3 mb-0">
              This action cannot be undone. Please check the cancellation policy for refund details.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button 
            variant="secondary" 
            onClick={() => setShowCancelModal(false)}
            disabled={cancelLoading}
          >
            Keep Booking
          </Button>
          <Button 
            variant="danger" 
            onClick={handleCancelBooking}
            disabled={cancelLoading}
          >
            {cancelLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Cancelling...
              </>
            ) : (
              <>
                <i className="bi bi-x-circle me-2"></i>
                Cancel Booking
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MyBookings;