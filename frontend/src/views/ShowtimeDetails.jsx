import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button, Card, Container, Row, Col, Badge } from 'react-bootstrap';
import { showtimeAPI } from '../services/api';

const ShowtimeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showtime, setShowtime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShowtimeDetails = async () => {
      try {
        const response = await showtimeAPI.getById(id);
        setShowtime(response.data.data || response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching showtime details:', error);
        setLoading(false);
      }
    };

    if (id) {
      fetchShowtimeDetails();
    }
  }, [id]);

  const handleBookTickets = () => {
    navigate(`/booking/seats/${id}`);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-gold" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!showtime) {
    return (
      <Container>
        <div className="text-center py-5">
          <h3>Showtime not found</h3>
          <Button variant="primary" as={Link} to="/">Back to Home</Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">Showtime Details</h2>
        <Button variant="primary" as={Link} to="/">Back to Home</Button>
      </div>

      <Card className="bg-dark mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <h4 className="text-gold">Movie Information</h4>
              {showtime.movie && (
                <>
                  <p><strong>Title:</strong> {showtime.movie.title}</p>
                  <p><strong>Duration:</strong> {showtime.movie.duration} minutes</p>
                </>
              )}
            </Col>
            <Col md={6}>
              <h4 className="text-gold">Showtime Information</h4>
              {showtime.theater && (
                <p><strong>Theater:</strong> {showtime.theater.name}</p>
              )}
              <p><strong>Date:</strong> {showtime.show_date && new Date(showtime.show_date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {showtime.show_time}</p>
              <p><strong>Status:</strong> 
                <Badge className="ms-2" bg={
                  showtime.status === 'active' ? 'success' :
                  showtime.status === 'inactive' ? 'danger' : 'warning'
                }>
                  {showtime.status}
                </Badge>
              </p>
            </Col>
          </Row>
          
          <div className="mt-4">
            <Button variant="gold" size="lg" onClick={handleBookTickets}>
              Book Tickets
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ShowtimeDetails;