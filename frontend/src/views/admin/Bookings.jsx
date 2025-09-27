import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Container, Table, Form, Spinner, Badge } from 'react-bootstrap';
import { adminAPI } from '../../services/api';

const AdminBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    from_date: '',
    to_date: ''
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const fetchBookings = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        page: page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...filters
      };
      
      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await adminAPI.getAdminBookings(params);
      const bookingsData = response.data.data?.data || response.data.data || [];
      setBookings(bookingsData);
      
      // Handle pagination
      if (response.data.data?.meta) {
        setTotalPages(response.data.data.meta.last_page);
        setCurrentPage(response.data.data.meta.current_page);
      } else if (response.data.data?.current_page) {
        setTotalPages(response.data.data.last_page);
        setCurrentPage(response.data.data.current_page);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  }, [searchTerm, perPage, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchBookings(currentPage);
  }, [fetchBookings, currentPage]);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1);
      fetchBookings(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, perPage, sortBy, sortOrder, filters, fetchBookings]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await adminAPI.deleteBooking(id);
        setBookings(bookings.filter(booking => booking.id !== id));
        // Refresh the list
        fetchBookings(currentPage);
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Failed to delete booking');
      }
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchBookings(page);
    }
  };

  const getSortIcon = (field) => {
    if (sortBy === field) {
      return sortOrder === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="gold" />
        <p className="mt-2">Loading bookings...</p>
      </div>
    );
  }

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">Manage Bookings</h2>
        <div className="d-flex gap-2">

        </div>
      </div>

      {/* Filters */}
      <Card className="bg-dark mb-4">
        <Card.Body>
          <div className="row">
            <div className="col-md-3">
              <Form.Group className="mb-3">
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </div>
            <div className="col-md-2">
              <Form.Group className="mb-3">
                <Form.Label>Booking Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-2">
              <Form.Group className="mb-3">
                <Form.Label>Payment Status</Form.Label>
                <Form.Select
                  value={filters.payment_status}
                  onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                >
                  <option value="">All Payment Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-2">
              <Form.Group className="mb-3">
                <Form.Label>From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.from_date}
                  onChange={(e) => handleFilterChange('from_date', e.target.value)}
                />
              </Form.Group>
            </div>
            <div className="col-md-2">
              <Form.Group className="mb-3">
                <Form.Label>To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.to_date}
                  onChange={(e) => handleFilterChange('to_date', e.target.value)}
                />
              </Form.Group>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="bg-dark">
        <Card.Header className="bg-secondary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <span>Bookings List</span>
            <div>
              <span className="me-4">Total: {bookings.length} bookings</span>
              <Form.Select 
                value={perPage} 
                onChange={(e) => {
                  setPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ width: 'auto', display: 'inline-block' }}
              >
                <option value="15">15 per page</option>
                <option value="30">30 per page</option>
                <option value="50">50 per page</option>
              </Form.Select>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover variant="dark" className="mb-0">
            <thead>
              <tr>
                <th onClick={() => handleSort('booking_code')} style={{ cursor: 'pointer' }}>
                  Booking Code {getSortIcon('booking_code')}
                </th>
                <th onClick={() => handleSort('movie.title')} style={{ cursor: 'pointer' }}>
                  Movie {getSortIcon('movie.title')}
                </th>
                <th onClick={() => handleSort('theater.name')} style={{ cursor: 'pointer' }}>
                  Theater {getSortIcon('theater.name')}
                </th>
                <th onClick={() => handleSort('user.name')} style={{ cursor: 'pointer' }}>
                  User {getSortIcon('user.name')}
                </th>
                <th onClick={() => handleSort('showtime.show_date')} style={{ cursor: 'pointer' }}>
                  Date/Time {getSortIcon('showtime.show_date')}
                </th>
                <th>Seats</th>
                <th onClick={() => handleSort('total_amount')} style={{ cursor: 'pointer' }}>
                  Amount {getSortIcon('total_amount')}
                </th>
                <th onClick={() => handleSort('booking_status')} style={{ cursor: 'pointer' }}>
                  Booking Status {getSortIcon('booking_status')}
                </th>
                <th onClick={() => handleSort('payment_status')} style={{ cursor: 'pointer' }}>
                  Payment Status {getSortIcon('payment_status')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <div className="fw-bold">{booking.booking_code}</div>
                      <small className="text-muted">ID: {booking.id}</small>
                    </td>
                    <td>{booking.showtime?.movie?.title || 'N/A'}</td>
                    <td>{booking.showtime?.theater?.name || 'N/A'}</td>
                    <td>
                      <div>{booking.user?.name || 'N/A'}</div>
                      <small className="text-muted">{booking.user?.email || ''}</small>
                    </td>
                    <td>
                      <div>{booking.showtime?.show_date || 'N/A'}</div>
                      <small className="text-muted">{booking.showtime?.show_time || ''}</small>
                    </td>
                    <td>
                      <span className="badge bg-primary">
                        {Array.isArray(booking.seats) ? booking.seats.length : 0} seats
                      </span>
                    </td>
                    <td>{(booking.total_amount || 0).toLocaleString('vi-VN')} VND</td>
                    <td>
                      <Badge bg={
                        booking.booking_status === 'confirmed' || booking.booking_status === 'completed' ? 'success' :
                        booking.booking_status === 'cancelled' ? 'danger' : 'warning'
                      }>
                        {booking.booking_status}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={
                        booking.payment_status === 'completed' ? 'success' :
                        booking.payment_status === 'failed' ? 'danger' : 'warning'
                      }>
                        {booking.payment_status}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          onClick={() => navigate(`/admin/bookings/${booking.id}/edit`)}
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => handleDelete(booking.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-5">
                    {loading ? (
                      <div>
                        <Spinner animation="border" variant="gold" className="me-2" />
                        <span>Loading bookings...</span>
                      </div>
                    ) : (
                      <div>
                        <i className="bi bi-ticket-perforated display-4 d-block text-muted mb-2"></i>
                        <h5>No bookings found</h5>
                        <p className="text-muted">Try adjusting your search or filters</p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
        {/* Pagination */}
        {totalPages > 1 && (
          <Card.Footer className="bg-dark border-secondary">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, bookings.length)} of {bookings.length} bookings
              </div>
              <div>
                <Button 
                  variant="outline-light" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="me-2"
                >
                  <i className="bi bi-chevron-left"></i> Previous
                </Button>
                <span className="mx-3">
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline-light" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ms-2"
                >
                  Next <i className="bi bi-chevron-right"></i>
                </Button>
              </div>
            </div>
          </Card.Footer>
        )}
      </Card>
    </Container>
  );
};

export default AdminBookings;