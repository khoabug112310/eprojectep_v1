import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Container, Table, Form, Spinner, Badge } from 'react-bootstrap';
import { adminAPI } from '../../services/api';

const AdminShowtimes = () => {
  const navigate = useNavigate();
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [filters, setFilters] = useState({
    movie_id: '',
    theater_id: '',
    status: '',
    date: ''
  });
  const [sortBy, setSortBy] = useState('show_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const fetchShowtimes = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        page: page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...filters
      };
      
      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await adminAPI.getAdminShowtimes(params);
      const showtimesData = response.data.data?.data || response.data.data || [];
      setShowtimes(showtimesData);
      
      // Handle pagination
      if (response.data.data?.meta) {
        setTotalPages(response.data.data.meta.last_page);
        setCurrentPage(response.data.data.meta.current_page);
      } else if (response.data.data?.current_page) {
        setTotalPages(response.data.data.last_page);
        setCurrentPage(response.data.data.current_page);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching showtimes:', error);
      setLoading(false);
    }
  }, [searchTerm, perPage, sortBy, sortOrder, filters]);

  const fetchFiltersData = useCallback(async () => {
    try {
      // Fetch movies for filter dropdown
      const movieResponse = await adminAPI.getAdminMovies({ per_page: 100 });
      const moviesData = movieResponse.data.data?.data || movieResponse.data.data || [];
      setMovies(moviesData);
      
      // Fetch theaters for filter dropdown
      const theaterResponse = await adminAPI.getAdminTheaters({ per_page: 100 });
      const theatersData = theaterResponse.data.data?.data || theaterResponse.data.data || [];
      setTheaters(theatersData);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  }, []);

  useEffect(() => {
    fetchShowtimes(currentPage);
    fetchFiltersData();
  }, [fetchShowtimes, fetchFiltersData, currentPage]);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1);
      fetchShowtimes(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, perPage, sortBy, sortOrder, filters, fetchShowtimes]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this showtime?')) {
      try {
        await adminAPI.deleteShowtime(id);
        setShowtimes(showtimes.filter(showtime => showtime.id !== id));
        // Refresh the list
        fetchShowtimes(currentPage);
      } catch (error) {
        console.error('Error deleting showtime:', error);
        alert('Failed to delete showtime');
      }
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchShowtimes(page);
    }
  };

  const getSortIcon = (field) => {
    if (sortBy === field) {
      return sortOrder === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  if (loading && showtimes.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="gold" />
        <p className="mt-2">Loading showtimes...</p>
      </div>
    );
  }

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-gold">Manage Showtimes</h2>
        <div className="d-flex gap-2">
          <Button variant="primary" onClick={() => navigate('/admin/showtimes/create')}>
            <i className="bi bi-plus-circle me-1"></i> Add New Showtime
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-dark mb-4">

        <Card.Body>
          <div className="row">
            <div className="col-md-3">
              <Form.Group className="mb-3">
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search showtimes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </div>
            <div className="col-md-2">
              <Form.Group className="mb-3">
                <Form.Label>Movie</Form.Label>
                <Form.Select
                  value={filters.movie_id}
                  onChange={(e) => handleFilterChange('movie_id', e.target.value)}
                >
                  <option value="">All Movies</option>
                  {movies.map(movie => (
                    <option key={movie.id} value={movie.id}>
                      {movie.title}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-2">
              <Form.Group className="mb-3">
                <Form.Label>Theater</Form.Label>
                <Form.Select
                  value={filters.theater_id}
                  onChange={(e) => handleFilterChange('theater_id', e.target.value)}
                >
                  <option value="">All Theaters</option>
                  {theaters.map(theater => (
                    <option key={theater.id} value={theater.id}>
                      {theater.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-2">
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-2">
              <Form.Group className="mb-3">
                <Form.Label>Show Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                />
              </Form.Group>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="bg-dark">
        <Card.Header className="bg-secondary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <span>Showtimes List</span>
            <div>
              <span className="me-4">Total: {showtimes.length} showtimes</span>
              <Form.Select 
                value={perPage} 
                onChange={(e) => {
                  setPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ width: 'auto', display: 'inline-block' }}
              >
                <option value="15">15 per page</option>
                <option value="30">30 per page</option>
                <option value="50">50 per page</option>
              </Form.Select>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover variant="dark" className="mb-0">
            <thead>
              <tr>
                <th onClick={() => handleSort('movie.title')} style={{ cursor: 'pointer' }}>
                  Movie {getSortIcon('movie.title')}
                </th>
                <th onClick={() => handleSort('theater.name')} style={{ cursor: 'pointer' }}>
                  Theater {getSortIcon('theater.name')}
                </th>
                <th onClick={() => handleSort('show_date')} style={{ cursor: 'pointer' }}>
                  Date {getSortIcon('show_date')}
                </th>
                <th onClick={() => handleSort('show_time')} style={{ cursor: 'pointer' }}>
                  Time {getSortIcon('show_time')}
                </th>
                <th>Prices</th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                  Status {getSortIcon('status')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {showtimes.length > 0 ? (
                showtimes.map((showtime) => (
                  <tr key={showtime.id}>
                    <td>
                      <div className="fw-bold">{showtime.movie?.title || 'N/A'}</div>
                      <small className="text-muted">ID: {showtime.id}</small>
                    </td>
                    <td>
                      <div>{showtime.theater?.name || 'N/A'}</div>
                      <small className="text-muted">{showtime.theater?.city || ''}</small>
                    </td>
                    <td>{showtime.show_date}</td>
                    <td>{showtime.show_time}</td>
                    <td>
                      {showtime.prices ? (
                        Object.entries(typeof showtime.prices === 'string' ? JSON.parse(showtime.prices) : showtime.prices || {}).map(([type, price]) => (
                          <div key={type}>
                            <span className="badge bg-secondary me-1">{type}</span> 
                            {parseInt(price).toLocaleString('vi-VN')} VND
                          </div>
                        ))
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      <Badge bg={
                        showtime.status === 'active' ? 'success' :
                        showtime.status === 'inactive' ? 'warning' : 'danger'
                      }>
                        {showtime.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          onClick={() => navigate(`/admin/showtimes/${showtime.id}/edit`)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => handleDelete(showtime.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    {loading ? (
                      <div>
                        <Spinner animation="border" variant="gold" className="me-2" />
                        <span>Loading showtimes...</span>
                      </div>
                    ) : (
                      <div>
                        <i className="bi bi-film display-4 d-block text-muted mb-2"></i>
                        <h5>No showtimes found</h5>
                        <p className="text-muted">Try adjusting your search or filters</p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
        {/* Pagination */}
        {totalPages > 1 && (
          <Card.Footer className="bg-dark border-secondary">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, showtimes.length)} of {showtimes.length} showtimes
              </div>
              <div>
                <Button 
                  variant="outline-light" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="me-2"
                >
                  <i className="bi bi-chevron-left"></i> Previous
                </Button>
                <span className="mx-3">
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline-light" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ms-2"
                >
                  Next <i className="bi bi-chevron-right"></i>
                </Button>
              </div>
            </div>
          </Card.Footer>
        )}
      </Card>
    </Container>
  );
};

export default AdminShowtimes;