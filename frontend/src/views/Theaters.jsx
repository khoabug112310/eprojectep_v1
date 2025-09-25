import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, Container, Row, Col, Form, InputGroup, Badge } from 'react-bootstrap';
import { theaterAPI } from '../services/api';

const Theaters = () => {
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get filter values from URL parameters
  const urlCity = searchParams.get('city') || '';
  const urlSearch = searchParams.get('search') || '';

  useEffect(() => {
    // Set search term from URL parameter if exists
    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
  }, [urlSearch]);

  useEffect(() => {
    const fetchTheaters = async () => {
      try {
        // Pass parameters to the API call
        const params = {};
        if (urlCity) params.city = urlCity;
        
        const response = await theaterAPI.getAll(params);
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
  }, [urlCity]);

  const filteredTheaters = theaters.filter(theater => {
    let matchesFilter = true;
    
    // Search filter (from URL or local input)
    const searchQuery = urlSearch || searchTerm;
    if (searchQuery) {
      const matchesSearch = theater.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           theater.city?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) matchesFilter = false;
    }
    
    // City filter
    if (urlCity) {
      const matchesCity = theater.city?.toLowerCase().includes(urlCity.toLowerCase().replace('-', ' '));
      if (!matchesCity) matchesFilter = false;
    }
    
    return matchesFilter;
  });
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ ...Object.fromEntries(searchParams), search: searchTerm.trim() });
    } else {
      const newParams = Object.fromEntries(searchParams);
      delete newParams.search;
      setSearchParams(newParams);
    }
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setSearchParams({});
  };
  
  const getActiveFiltersDisplay = () => {
    const filters = [];
    if (urlSearch) filters.push(`Search: "${urlSearch}"`);
    if (urlCity) filters.push(`City: ${urlCity.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
    return filters;
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

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">Our Theaters {getActiveFiltersDisplay().length > 0 && `(${filteredTheaters.length} results)`}</h2>
        <Form className="w-300px" onSubmit={handleSearchSubmit}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search theaters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline-primary" type="submit">
              <i className="bi bi-search"></i>
            </Button>
          </InputGroup>
        </Form>
      </div>
      
      {/* Active Filters Display */}
      {getActiveFiltersDisplay().length > 0 && (
        <div className="mb-4">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="text-muted">Active filters:</span>
            {getActiveFiltersDisplay().map((filter, index) => (
              <Badge key={index} bg="primary" className="me-1">
                {filter}
              </Badge>
            ))}
            <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
              <i className="bi bi-x-circle me-1"></i>Clear All
            </Button>
          </div>
        </div>
      )}

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