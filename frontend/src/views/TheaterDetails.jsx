import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Card, Container, Row, Col, Badge } from 'react-bootstrap';
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

const TheaterDetails = () => {
  const { id } = useParams();
  const [theater, setTheater] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTheaterDetails = async () => {
      try {
        const response = await theaterAPI.getById(id);
        setTheater(response.data.data || response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching theater details:', error);
        setLoading(false);
      }
    };

    if (id) {
      fetchTheaterDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-gold" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!theater) {
    return (
      <Container>
        <div className="text-center py-5">
          <h3>Theater not found</h3>
          <Button variant="primary" as={Link} to="/theaters">Back to Theaters</Button>
        </div>
      </Container>
    );
  }

  const facilities = normalizeFacilities(theater.facilities);

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">{theater.name}</h2>
        <Button variant="primary" as={Link} to="/theaters">Back to Theaters</Button>
      </div>

      <Card className="bg-dark mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <h4 className="text-gold">Theater Information</h4>
              <p><strong>City:</strong> {theater.city}</p>
              <p><strong>Address:</strong> {theater.address}</p>
              <p><strong>Total Seats:</strong> {theater.total_seats}</p>
              <p><strong>Status:</strong> 
                <Badge className="ms-2" bg={
                  theater.status === 'active' ? 'success' :
                  theater.status === 'inactive' ? 'danger' : 'warning'
                }>
                  {theater.status}
                </Badge>
              </p>
              
              {facilities.length > 0 && (
                <div>
                  <strong>Facilities:</strong>
                  <div className="mt-2">
                    {facilities.map((facility, index) => (
                      <Badge key={index} bg="secondary" className="me-1 mb-1">
                        {facility}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TheaterDetails;