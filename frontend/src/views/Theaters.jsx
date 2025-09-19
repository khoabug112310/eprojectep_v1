import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Container, Row, Col, Form, InputGroup } from 'react-bootstrap';
import { theaterAPI } from '../services/api';

const Theaters = () => {
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTheaters = async () => {
      try {
        const response = await theaterAPI.getAll();
        // Handle paginated response correctly
        const theatersData = response.data.data?.data || response.data.data || [];
        setTheaters(theatersData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching theaters:', error);
        setLoading(false);
      }
    };

    fetchTheaters();
  }, []);

  const filteredTheaters = theaters.filter(theater => 
    theater.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theater.city?.toLowerCase().includes(searchTerm.toLowerCase())
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
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">Our Theaters</h2>
        <Form className="w-300px">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search theaters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Form>
      </div>

      <Row>
        {filteredTheaters.map((theater) => (
          <Col md={6} lg={4} className="mb-4" key={theater.id}>
            <Card className="bg-dark h-100">
              <Card.Body>
                <Card.Title className="text-gold">{theater.name}</Card.Title>
                <Card.Text>
                  <strong>City:</strong> {theater.city}<br />
                  <strong>Address:</strong> {theater.address}<br />
                  <strong>Total Seats:</strong> {theater.total_seats}
                </Card.Text>
                <Button 
                  variant="primary" 
                  as={Link} 
                  to={`/theaters/${theater.id}`}
                >
                  View Details
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Theaters;