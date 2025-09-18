import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Container, Table, Form, InputGroup } from 'react-bootstrap';
import { adminAPI } from '../../services/api';

const AdminShowtimes = () => {
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchShowtimes = async () => {
      try {
        const response = await adminAPI.getAdminShowtimes();
        // Handle paginated response correctly
        const showtimesData = response.data.data?.data || response.data.data || [];
        setShowtimes(showtimesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching showtimes:', error);
        setLoading(false);
      }
    };

    fetchShowtimes();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this showtime?')) {
      try {
        await adminAPI.deleteShowtime(id);
        setShowtimes(showtimes.filter(showtime => showtime.id !== id));
      } catch (error) {
        console.error('Error deleting showtime:', error);
        alert('Failed to delete showtime');
      }
    }
  };

  const filteredShowtimes = showtimes.filter(showtime => 
    showtime.movie?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    showtime.theater?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h2 className="text-gold">Manage Showtimes</h2>
        <div className="d-flex gap-2">
          <Form className="w-300px">
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search showtimes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Form>
          <Button variant="primary" as={Link} to="/admin/showtimes/create">
            Add New Showtime
          </Button>
        </div>
      </div>

      <Card className="bg-dark">
        <Card.Body>
          <Table responsive hover variant="dark">
            <thead>
              <tr>
                <th>Movie</th>
                <th>Theater</th>
                <th>Date</th>
                <th>Time</th>
                <th>Prices</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShowtimes.map((showtime) => (
                <tr key={showtime.id}>
                  <td>{showtime.movie?.title}</td>
                  <td>{showtime.theater?.name}</td>
                  <td>{showtime.show_date}</td>
                  <td>{showtime.show_time}</td>
                  <td>
                    {showtime.prices ? (
                      Object.entries(JSON.parse(showtime.prices) || {}).map(([type, price]) => (
                        <div key={type}>{type}: {parseInt(price).toLocaleString()} VND</div>
                      ))
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>{showtime.status}</td>
                  <td>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      as={Link} 
                      to={`/admin/showtimes/${showtime.id}/edit`}
                      className="me-2"
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={() => handleDelete(showtime.id)}
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

export default AdminShowtimes;