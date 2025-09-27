import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Container, Table, Form, InputGroup, Badge, Modal, Row, Col, Spinner, Alert } from 'react-bootstrap';
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
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTheaterId, setDeleteTheaterId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTheaters, setTotalTheaters] = useState(0);

  // Get unique cities for filter dropdown
  const getUniqueCities = () => {
    const allCities = theaters.map(theater => theater.city).filter(city => city);
    return [...new Set(allCities)].sort();
  };

  const fetchTheaters = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: currentPage,
        per_page: 10,
        sort_by: sortBy,
        sort_order: sortOrder
      };
      
      if (filterStatus) params.status = filterStatus;
      if (filterCity) params.city = filterCity;
      if (searchTerm) params.search = searchTerm;
      
      const response = await adminAPI.getAdminTheaters(params);
      
      // Handle paginated response correctly
      const theatersData = response.data.data?.data || response.data.data || [];
      const pagination = response.data.data || {};
      
      setTheaters(theatersData);
      setTotalPages(pagination.last_page || 1);
      setTotalTheaters(pagination.total || theatersData.length);
      
    } catch (error) {
      console.error('Error fetching theaters:', error);
      setError('Failed to load theaters. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, filterStatus, filterCity, searchTerm]);

  useEffect(() => {
    fetchTheaters();
  }, [currentPage, sortBy, sortOrder, fetchTheaters]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchTheaters();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStatus, filterCity, fetchTheaters]);

  const handleDelete = (id) => {
    setDeleteTheaterId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTheaterId) return;
    
    setDeleteLoading(true);
    try {
      await adminAPI.deleteTheater(deleteTheaterId);
      setTheaters(theaters.filter(theater => theater.id !== deleteTheaterId));
      setShowDeleteModal(false);
      setDeleteTheaterId(null);
      // Refresh data to update pagination
      fetchTheaters();
    } catch (error) {
      console.error('Error deleting theater:', error);
      setError('Failed to delete theater. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const filteredTheaters = theaters.filter(theater => {
    const matchesSearch = theater.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         theater.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         theater.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || theater.status === filterStatus;
    const matchesCity = !filterCity || theater.city === filterCity;
    
    return matchesSearch && matchesStatus && matchesCity;
  });

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
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-gold mb-1">Manage Theaters</h2>
          <p className="text-muted mb-0">Total: {totalTheaters} theaters</p>
        </div>
        <Button variant="primary" as={Link} to="/admin/theaters/create">
          <i className="bi bi-plus-circle me-2"></i>
          Add New Theater
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="bg-dark mb-4">
        <Card.Body className="py-3">
          <Row className="g-3">
            <Col md={4}>
              <Form.Label className="text-muted small">Search Theaters</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-secondary border-secondary">
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name, city, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-dark border-secondary text-white"
                />
              </InputGroup>
            </Col>
            
            <Col md={2}>
              <Form.Label className="text-muted small">City</Form.Label>
              <Form.Select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="bg-dark border-secondary text-white"
              >
                <option value="">All Cities</option>
                {getUniqueCities().map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </Form.Select>
            </Col>
            
            <Col md={2}>
              <Form.Label className="text-muted small">Status</Form.Label>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-dark border-secondary text-white"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Col>
            
            <Col md={2}>
              <Form.Label className="text-muted small">Sort By</Form.Label>
              <Form.Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-dark border-secondary text-white"
              >
                <option value="created_at">Date Created</option>
                <option value="name">Name</option>
                <option value="city">City</option>
                <option value="total_seats">Total Seats</option>
              </Form.Select>
            </Col>
            
            <Col md={2}>
              <Form.Label className="text-muted small">Order</Form.Label>
              <Form.Select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-dark border-secondary text-white"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Theaters Table */}
      <Card className="bg-dark">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="gold" />
              <p className="mt-2 text-muted">Loading theaters...</p>
            </div>
          ) : filteredTheaters.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-building display-1 text-muted"></i>
              <h4 className="text-muted mt-3">No Theaters Found</h4>
              <p className="text-muted">Try adjusting your filters or add a new theater.</p>
              <Button variant="primary" as={Link} to="/admin/theaters/create">
                Add New Theater
              </Button>
            </div>
          ) : (
            <>
              <Table responsive hover variant="dark">
                <thead>
                  <tr>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('name')}
                    >
                      Name 
                      {sortBy === 'name' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('city')}
                    >
                      City 
                      {sortBy === 'city' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th>Address</th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('total_seats')}
                    >
                      Total Seats 
                      {sortBy === 'total_seats' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th>Facilities</th>
                    <th>Status</th>
                    <th style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTheaters.map((theater) => {
                    const facilities = normalizeFacilities(theater.facilities);
                    return (
                      <tr key={theater.id}>
                        <td>
                          <div>
                            <strong>{theater.name}</strong>
                            <div className="text-muted small">
                              ID: {theater.id}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-geo-alt text-info me-2"></i>
                            {theater.city}
                          </div>
                        </td>
                        <td>
                          <small className="text-muted" title={theater.address}>
                            {theater.address ? (
                              theater.address.length > 50 
                                ? `${theater.address.substring(0, 50)}...` 
                                : theater.address
                            ) : (
                              <span className="text-danger">No address</span>
                            )}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-people text-warning me-2"></i>
                            <strong>{theater.total_seats || 'N/A'}</strong>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {facilities.slice(0, 3).map((facility, index) => (
                              <Badge key={index} bg="secondary" className="small">
                                {facility}
                              </Badge>
                            ))}
                            {facilities.length > 3 && (
                              <Badge bg="dark" className="small">+{facilities.length - 3}</Badge>
                            )}
                            {facilities.length === 0 && (
                              <span className="text-muted small">None listed</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge bg={
                            theater.status === 'active' ? 'success' : 'danger'
                          }>
                            <i className={`bi bi-${theater.status === 'active' ? 'check-circle' : 'x-circle'} me-1`}></i>
                            {theater.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              as={Link} 
                              to={`/admin/theaters/${theater.id}/edit`}
                              title="Edit Theater"
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDelete(theater.id)}
                              title="Delete Theater"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted small">
                    Showing page {currentPage} of {totalPages}
                  </div>
                  <div className="d-flex gap-1">
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </Button>
                    
                    {[...Array(Math.min(5, totalPages))].map((_, index) => {
                      const page = Math.max(1, currentPage - 2) + index;
                      if (page > totalPages) return null;
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'primary' : 'outline-secondary'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark">
          <p>Are you sure you want to delete this theater?</p>
          <p className="text-warning small">
            <i className="bi bi-info-circle me-1"></i>
            This action cannot be undone. All associated showtimes and bookings will be affected.
          </p>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Deleting...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>
                Delete Theater
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminTheaters;