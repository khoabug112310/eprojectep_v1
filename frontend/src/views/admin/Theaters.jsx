import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Container, Table, Form, InputGroup, Badge } from 'react-bootstrap';
import { adminAPI } from '../../services/api';

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

const AdminTheaters = () => {
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTheaters = async () => {
      try {
        const response = await adminAPI.getAdminTheaters();
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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this theater?')) {
      try {
        await adminAPI.deleteTheater(id);
        setTheaters(theaters.filter(theater => theater.id !== id));
      } catch (error) {
        console.error('Error deleting theater:', error);
        alert('Failed to delete theater');
      }
    }
  };

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
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">Manage Theaters</h2>
        <div className="d-flex gap-2">
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
          <Button variant="primary" as={Link} to="/admin/theaters/create">
            Add New Theater
          </Button>
        </div>
      </div>

      <Card className="bg-dark">
        <Card.Body>
          <Table responsive hover variant="dark">
            <thead>
              <tr>
                <th>Name</th>
                <th>City</th>
                <th>Address</th>
                <th>Total Seats</th>
                <th>Facilities</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTheaters.map((theater) => {
                const facilities = normalizeFacilities(theater.facilities);
                return (
                  <tr key={theater.id}>
                    <td>{theater.name}</td>
                    <td>{theater.city}</td>
                    <td>{theater.address}</td>
                    <td>{theater.total_seats}</td>
                    <td>
                      {facilities.map((facility, index) => (
                        <Badge key={index} bg="secondary" className="me-1">
                          {facility}
                        </Badge>
                      ))}
                    </td>
                    <td>
                      <Badge bg={
                        theater.status === 'active' ? 'success' :
                        theater.status === 'inactive' ? 'danger' : 'warning'
                      }>
                        {theater.status}
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        as={Link} 
                        to={`/admin/theaters/${theater.id}/edit`}
                        className="me-2"
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={() => handleDelete(theater.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminTheaters;