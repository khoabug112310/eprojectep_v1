import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Row, Col, Form, InputGroup } from 'react-bootstrap';
import { showtimeAPI } from '../services/api';

const Showtimes = () => {
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchShowtimes = async () => {
      try {
        const response = await showtimeAPI.getAll();
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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">Showtimes</h2>
        <Form className="w-50">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search showtimes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Form>
      </div>

      <Row>
        {filteredShowtimes.length > 0 ? (
          filteredShowtimes.map((showtime) => (
            <Col key={showtime.id} md={6} lg={4} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title className="text-gold">{showtime.movie?.title}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">{showtime.theater?.name}</Card.Subtitle>
                  <Card.Text>
                    <strong>Date:</strong> {showtime.show_date}<br />
                    <strong>Time:</strong> {showtime.show_time}<br />
                    <strong>Available Seats:</strong> {showtime.available_seats?.length || 'N/A'}
                  </Card.Text>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="text-gold">
                      {showtime.prices ? (
                        Object.entries(JSON.parse(showtime.prices) || {}).map(([type, price]) => (
                          <div key={type}>{type}: {parseInt(price).toLocaleString()} VND</div>
                        ))
                      ) : (
                        'N/A'
                      )}
                    </span>
                    <Button 
                      as={Link} 
                      to={`/booking/seats/${showtime.id}`} 
                      variant="outline-primary" 
                      size="sm"
                    >
                      Book Now
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col>
            <p>No showtimes found.</p>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default Showtimes;