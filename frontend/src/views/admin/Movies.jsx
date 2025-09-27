import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Container, Table, Form, InputGroup, Badge, Modal, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { adminAPI } from '../../services/api';

// Function to normalize genre data
const normalizeGenre = (genre) => {
  if (!genre) return [];
  
  // If it's already an array, return as is
  if (Array.isArray(genre)) return genre;
  
  // If it's a string, try to parse as JSON first
  if (typeof genre === 'string') {
    try {
      const parsed = JSON.parse(genre);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // If JSON parsing fails, split by comma
      return genre.split(',').map(g => g.trim()).filter(g => g);
    }
  }
  
  // Fallback: return as array with single item
  return [String(genre)];
};

const AdminMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMovieId, setDeleteMovieId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);

  // Rating management state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieReviews, setMovieReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  // Get unique genres for filter dropdown
  const getUniqueGenres = () => {
    const allGenres = movies.flatMap(movie => {
      const genres = normalizeGenre(movie.genre);
      return genres;
    });
    return [...new Set(allGenres)].sort();
  };

  const fetchMovies = useCallback(async () => {
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
      if (filterGenre) params.genre = filterGenre;
      if (searchTerm) params.search = searchTerm;
      
      console.log('Fetching movies with params:', params);
      const response = await adminAPI.getAdminMovies(params);
      console.log('Movies response:', response.data);
      
      // Handle paginated response correctly
      const moviesData = response.data.data?.data || response.data.data || [];
      const pagination = response.data.data || {};
      
      setMovies(moviesData);
      setTotalPages(pagination.last_page || 1);
      setTotalMovies(pagination.total || moviesData.length);
      
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError('Failed to load movies. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, filterStatus, filterGenre, searchTerm]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchMovies();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStatus, filterGenre, fetchMovies]);

  const handleDelete = (id) => {
    setDeleteMovieId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteMovieId) return;
    
    setDeleteLoading(true);
    try {
      await adminAPI.deleteMovie(deleteMovieId);
      setMovies(movies.filter(movie => movie.id !== deleteMovieId));
      setShowDeleteModal(false);
      setDeleteMovieId(null);
      // Refresh data to update pagination
      fetchMovies();
    } catch (error) {
      console.error('Error deleting movie:', error);
      setError('Failed to delete movie. Please try again.');
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

  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || movie.status === filterStatus;
    const matchesGenre = !filterGenre || normalizeGenre(movie.genre).includes(filterGenre);
    
    return matchesSearch && matchesStatus && matchesGenre;
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

  // Fetch reviews for a specific movie
  const fetchMovieReviews = async (movieId) => {
    try {
      setReviewsLoading(true);
      setReviewsError('');
      // Use admin API to get all reviews for the movie, not just public ones
      const response = await adminAPI.getAdminReviews({ movie_id: movieId });
      if (response.data.success) {
        // Handle paginated response correctly
        const reviewsData = response.data.data?.data || response.data.data || [];
        setMovieReviews(reviewsData);
      }
    } catch (error) {
      console.error('Error fetching movie reviews:', error);
      setReviewsError('Failed to load reviews. Please try again.');
    } finally {
      setReviewsLoading(false);
    }
  };

  // Open rating modal for a movie
  const openRatingModal = async (movie) => {
    setSelectedMovie(movie);
    setShowRatingModal(true);
    await fetchMovieReviews(movie.id);
  };

  // Close rating modal
  const closeRatingModal = () => {
    setShowRatingModal(false);
    setSelectedMovie(null);
    setMovieReviews([]);
  };

  // Approve a review
  const approveReview = async (reviewId) => {
    try {
      await adminAPI.approveReview(reviewId);
      // Refresh reviews
      if (selectedMovie) {
        await fetchMovieReviews(selectedMovie.id);
      }
      // Refresh main movie list to update average rating
      fetchMovies();
    } catch (error) {
      console.error('Error approving review:', error);
      setReviewsError('Failed to approve review. Please try again.');
    }
  };

  // Reject a review
  const rejectReview = async (reviewId) => {
    try {
      await adminAPI.rejectReview(reviewId);
      // Refresh reviews
      if (selectedMovie) {
        await fetchMovieReviews(selectedMovie.id);
      }
      // Refresh main movie list to update average rating
      fetchMovies();
    } catch (error) {
      console.error('Error rejecting review:', error);
      setReviewsError('Failed to reject review. Please try again.');
    }
  };

  // Delete a review
  const deleteReview = async (reviewId) => {
    try {
      await adminAPI.deleteReview(reviewId);
      // Refresh reviews
      if (selectedMovie) {
        await fetchMovieReviews(selectedMovie.id);
      }
      // Refresh main movie list to update average rating
      fetchMovies();
    } catch (error) {
      console.error('Error deleting review:', error);
      setReviewsError('Failed to delete review. Please try again.');
    }
  };

  return (
    <Container fluid>
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-gold mb-1">Manage Movies</h2>
          <p className="text-muted mb-0">Total: {totalMovies} movies</p>
        </div>
        <Button variant="primary" as={Link} to="/admin/movies/create">
          <i className="bi bi-plus-circle me-2"></i>
          Add New Movie
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="bg-dark mb-4">
        <Card.Body className="py-3">
          <Row className="g-3">
            <Col md={4}>
              <Form.Label className="text-muted small">Search Movies</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-secondary border-secondary">
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-dark border-secondary text-white"
                />
              </InputGroup>
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
                <option value="coming_soon">Coming Soon</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Col>
            
            <Col md={2}>
              <Form.Label className="text-muted small">Genre</Form.Label>
              <Form.Select
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="bg-dark border-secondary text-white"
              >
                <option value="">All Genres</option>
                {getUniqueGenres().map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
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
                <option value="title">Title</option>
                <option value="release_date">Release Date</option>
                <option value="duration">Duration</option>
                <option value="average_rating">Rating</option>
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

      {/* Movies Table */}
      <Card className="bg-dark">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="gold" />
              <p className="mt-2 text-muted">Loading movies...</p>
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-film display-1 text-muted"></i>
              <h4 className="text-muted mt-3">No Movies Found</h4>
              <p className="text-muted">Try adjusting your filters or add a new movie.</p>
              <Button variant="primary" as={Link} to="/admin/movies/create">
                Add New Movie
              </Button>
            </div>
          ) : (
            <>
              <Table responsive hover variant="dark">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Poster</th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('title')}
                    >
                      Title 
                      {sortBy === 'title' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th>Genre</th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('duration')}
                    >
                      Duration 
                      {sortBy === 'duration' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('average_rating')}
                    >
                      Rating 
                      {sortBy === 'average_rating' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th>Status</th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('release_date')}
                    >
                      Release Date 
                      {sortBy === 'release_date' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    
                    <th style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovies.map((movie) => {
                    const genres = normalizeGenre(movie.genre);
                    return (
                      <tr key={movie.id}>
                        <td>
                          <img 
                            src={movie.poster_url || "https://placehold.co/50x75/1f1f1f/ffd700?text=No+Image"} 
                            alt={movie.title} 
                            width="50" 
                            height="75"
                            style={{ objectFit: 'cover', borderRadius: '4px' }}
                            onError={(e) => {
                              e.target.src = "https://placehold.co/50x75/1f1f1f/ffd700?text=No+Image";
                            }}
                          />
                        </td>
                        <td>
                          <div>
                            <strong>{movie.title}</strong>
                            {movie.director && (
                              <div className="text-muted small">By {movie.director}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {genres.slice(0, 2).map((genre, index) => (
                              <Badge key={index} bg="secondary" className="small">
                                {genre}
                              </Badge>
                            ))}
                            {genres.length > 2 && (
                              <Badge bg="dark" className="small">+{genres.length - 2}</Badge>
                            )}
                          </div>
                        </td>
                        <td>{movie.duration} min</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-star-fill text-warning me-1"></i>
                            {movie.average_rating || 'N/A'}
                          </div>
                        </td>
                        <td>
                          <Badge bg={
                            movie.status === 'active' ? 'success' :
                            movie.status === 'inactive' ? 'danger' : 'warning'
                          }>
                            {movie.status === 'active' ? 'Active' :
                             movie.status === 'inactive' ? 'Inactive' : 'Coming Soon'}
                          </Badge>
                        </td>
                        <td>
                          <small className="text-muted">
                            {movie.release_date ? new Date(movie.release_date).toLocaleDateString() : 'N/A'}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              as={Link} 
                              to={`/admin/movies/${movie.id}/edit`}
                              title="Edit Movie"
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDelete(movie.id)}
                              title="Delete Movie"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                            <Button 
                              variant="outline-secondary" 
                              size="sm" 
                              onClick={() => openRatingModal(movie)}
                              title="Manage Ratings"
                            >
                              <i className="bi bi-star-fill"></i>
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

      {/* Rating Management Modal */}
      <Modal show={showRatingModal} onHide={closeRatingModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Manage Reviews for "{selectedMovie?.title}"
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {reviewsError && (
            <Alert variant="danger" className="mb-3">
              {reviewsError}
            </Alert>
          )}
          
          {reviewsLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="gold" />
              <p className="mt-2">Loading reviews...</p>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <strong>Movie Rating:</strong> 
                <span className="ms-2">
                  {selectedMovie?.average_rating || 'N/A'} 
                  <i className="bi bi-star-fill text-warning ms-1"></i>
                </span>
                <span className="ms-3">
                  ({selectedMovie?.total_reviews || 0} reviews)
                </span>
              </div>
              
              {movieReviews.length === 0 ? (
                <p className="text-muted">No reviews found for this movie.</p>
              ) : (
                <div className="table-responsive">
                  <Table hover className="table-dark">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Rating</th>
                        <th>Comment</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movieReviews.map((review) => (
                        <tr key={review.id}>
                          <td>{review.user?.name || 'N/A'}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-star-fill text-warning me-1"></i>
                              {review.rating}
                            </div>
                          </td>
                          <td style={{ maxWidth: '200px' }}>
                            <div className="text-truncate" title={review.comment || ''}>
                              {review.comment || 'No comment'}
                            </div>
                          </td>
                          <td>
                            <Badge 
                              bg={
                                review.status === 'approved' ? 'success' :
                                review.status === 'pending' ? 'warning' :
                                'danger'
                              }
                            >
                              {review.status}
                            </Badge>
                          </td>
                          <td>
                            {new Date(review.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            {review.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="success"
                                  className="me-1"
                                  onClick={() => approveReview(review.id)}
                                >
                                  <i className="bi bi-check"></i>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => rejectReview(review.id)}
                                >
                                  <i className="bi bi-x"></i>
                                </Button>
                              </>
                            )}
                            {review.status !== 'pending' && (
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => deleteReview(review.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeRatingModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this movie? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminMovies;