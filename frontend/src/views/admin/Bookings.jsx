import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Container, Table, Form, InputGroup, Badge } from 'react-bootstrap';
import { adminAPI } from '../../services/api';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await adminAPI.getAdminBookings();
        // Handle paginated response correctly
        const bookingsData = response.data.data?.data || response.data.data || [];
        setBookings(bookingsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await adminAPI.deleteBooking(id);
        setBookings(bookings.filter(booking => booking.id !== id));
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Failed to delete booking');
      }
    }
  };

  const filteredBookings = bookings.filter(booking => 
    booking.movie?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.booking_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-gold" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">Manage Bookings</h2>
        <div className="d-flex gap-2">
          <Form className="w-300px">
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Form>
        </div>
      </div>

      <Card className="bg-dark">
        <Card.Body>
          <Table responsive hover variant="dark">
            <thead>
              <tr>
                <th>Booking Code</th>
                <th>Movie</th>
                <th>Theater</th>
                <th>User</th>
                <th>Date/Time</th>
                <th>Seats</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.booking_code}</td>
                  <td>{booking.movie?.title}</td>
                  <td>{booking.theater?.name}</td>
                  <td>{booking.user?.name}</td>
                  <td>
                    {booking.showtime?.show_date} at {booking.showtime?.show_time}
                  </td>
                  <td>{booking.seats?.length || 0} seats</td>
                  <td>{booking.total_amount?.toLocaleString() || 0} VND</td>
                  <td>
                    <Badge bg={
                      booking.booking_status === 'confirmed' || booking.booking_status === 'completed' ? 'success' :
                      booking.booking_status === 'cancelled' ? 'danger' : 'warning'
                    }>
                      {booking.booking_status}
                    </Badge>
                  </td>
                  <td>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      as={Link} 
                      to={`/admin/bookings/${booking.id}/edit`}
                      className="me-2"
                    >
                      View
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={() => handleDelete(booking.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminBookings;