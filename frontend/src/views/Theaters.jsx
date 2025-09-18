import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, InputGroup, Badge } from 'react-bootstrap';
import { theaterAPI } from '../services/api';

// Function to normalize facilities data
const normalizeFacilities = (facilities) => {
  if (!facilities) return [];
  
  // If it's already an array, return as is
  if (Array.isArray(facilities)) return facilities;
  
  // If it's a string, try to parse as JSON
  if (typeof facilities === 'string') {
    try {
      const parsed = JSON.parse(facilities);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // If JSON parsing fails, split by comma
      return facilities.split(',').map(f => f.trim()).filter(f => f);
    }
  }
  
  // Fallback: return as array with single item
  return [String(facilities)];
};

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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">Theaters</h2>
        <Form className="w-50">
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
        {filteredTheaters.length > 0 ? (
          filteredTheaters.map((theater) => {
            const facilities = normalizeFacilities(theater.facilities);
            return (
              <Col key={theater.id} md={6} lg={4} className="mb-4">
                <Card className="h-100">
                  <Card.Body>
                    <Card.Title className="text-gold">{theater.name}</Card.Title>
                    <Card.Text>
                      <strong>Address:</strong> {theater.address}<br />
                      <strong>City:</strong> {theater.city}<br />
                      <strong>Total Seats:</strong> {theater.total_seats}
                    </Card.Text>
                    <div className="mt-3">
                      <strong>Facilities:</strong>
                      <div>
                        {facilities.map((facility, index) => (
                          <Badge key={index} bg="secondary" className="me-1">
                            {facility}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })
        ) : (
          <Col>
            <p>No theaters found.</p>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default Theaters;