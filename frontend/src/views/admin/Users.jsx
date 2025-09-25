import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Container, Table, Form, InputGroup, Badge, Modal, Row, Col, Spinner, Alert, Pagination } from 'react-bootstrap';
import { adminAPI } from '../../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form states
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    status: 'active',
    password: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch users with debounced search
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: currentPage,
        per_page: 10,
        sort_by: sortBy,
        sort_order: sortOrder
      };
      
      if (filterRole) params.role = filterRole;
      if (filterStatus) params.status = filterStatus;
      if (searchTerm) params.search = searchTerm;
      
      const response = await adminAPI.getAdminUsers(params);
      
      // Handle paginated response correctly
      const usersData = response.data.data?.data || response.data.data || [];
      const pagination = response.data.data || {};
      
      setUsers(usersData);
      setTotalPages(pagination.last_page || 1);
      setTotalUsers(pagination.total || usersData.length);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, filterRole, filterStatus, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, sortBy, sortOrder]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStatus, filterRole]);

  // Handle sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle delete user
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      await adminAPI.deleteUser(selectedUser.id);
      setUsers(users.filter(user => user.id !== selectedUser.id));
      setShowDeleteModal(false);
      setSelectedUser(null);
      setSuccess('User deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      // Refresh data to update pagination
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle account status toggle
  const toggleUserStatus = async (user) => {
    setActionLoading(true);
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await adminAPI.updateUser(user.id, { status: newStatus });
      
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      ));
      
      setSuccess(`User ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Failed to update user status. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordResetClick = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const confirmPasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match!');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long!');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setActionLoading(true);
    try {
      await adminAPI.updateUser(selectedUser.id, { password: newPassword });
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password reset successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Failed to reset password. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle create user
  const handleCreateClick = () => {
    setUserForm({
      name: '',
      email: '',
      phone: '',
      role: 'user',
      status: 'active',
      password: ''
    });
    setShowCreateModal(true);
  };

  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      setError('Please fill in all required fields!');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await adminAPI.createUser(userForm);
      setShowCreateModal(false);
      setSuccess('User created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.response?.data?.message || 'Failed to create user. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle edit user
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'user',
      status: user.status || 'active',
      password: '' // Always empty for edit
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!userForm.name || !userForm.email) {
      setError('Please fill in all required fields!');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setActionLoading(true);
    try {
      // Only include password if it's provided
      const updateData = { ...userForm };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      await adminAPI.updateUser(selectedUser.id, updateData);
      setShowEditModal(false);
      setSelectedUser(null);
      setSuccess('User updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.response?.data?.message || 'Failed to update user. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    const matchesStatus = !filterStatus || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
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
          <h2 className="text-gold mb-1">Manage Users</h2>
          <p className="text-muted mb-0">Total: {totalUsers} users</p>
        </div>
        <Button variant="primary" onClick={handleCreateClick}>
          <i className="bi bi-person-plus me-2"></i>
          Add New User
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="bg-dark mb-4">
        <Card.Body className="py-3">
          <Row className="g-3">
            <Col md={4}>
              <Form.Label className="text-muted small">Search Users</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-secondary border-secondary">
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-dark border-secondary text-white"
                />
              </InputGroup>
            </Col>
            
            <Col md={2}>
              <Form.Label className="text-muted small">Role</Form.Label>
              <Form.Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-dark border-secondary text-white"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
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
                <option value="email">Email</option>
                <option value="role">Role</option>
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

      {/* Success/Error Alerts */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-4">
          <i className="bi bi-check-circle me-2"></i>
          {success}
        </Alert>
      )}

      {/* Users Table */}
      <Card className="bg-dark">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="gold" />
              <p className="mt-2 text-muted">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people display-1 text-muted"></i>
              <h4 className="text-muted mt-3">No Users Found</h4>
              <p className="text-muted">Try adjusting your filters or add a new user.</p>
              <Button variant="primary" onClick={handleCreateClick}>
                Add New User
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
                      onClick={() => handleSort('email')}
                    >
                      Email 
                      {sortBy === 'email' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th>Phone</th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('role')}
                    >
                      Role 
                      {sortBy === 'role' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th>Status</th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('created_at')}
                    >
                      Created At 
                      {sortBy === 'created_at' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th style={{ width: '250px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div>
                          <strong>{user.name}</strong>
                          <div className="text-muted small">
                            ID: {user.id}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-envelope text-info me-2"></i>
                          {user.email}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-telephone text-success me-2"></i>
                          {user.phone || <span className="text-muted">N/A</span>}
                        </div>
                      </td>
                      <td>
                        <Badge bg={
                          user.role === 'admin' ? 'primary' :
                          user.role === 'user' ? 'secondary' : 'info'
                        }>
                          <i className={`bi bi-${user.role === 'admin' ? 'shield-check' : 'person'} me-1`}></i>
                          {user.role}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={
                          user.status === 'active' ? 'success' : 'danger'
                        }>
                          <i className={`bi bi-${user.status === 'active' ? 'check-circle' : 'x-circle'} me-1`}></i>
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(user.created_at).toLocaleDateString('vi-VN')}
                        </small>
                      </td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => handleEditClick(user)}
                            title="Edit User"
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button 
                            variant={user.status === 'active' ? 'outline-warning' : 'outline-success'}
                            size="sm" 
                            onClick={() => toggleUserStatus(user)}
                            disabled={actionLoading}
                            title={user.status === 'active' ? 'Disable Account' : 'Enable Account'}
                          >
                            <i className={`bi bi-${user.status === 'active' ? 'ban' : 'check-circle'}`}></i>
                          </Button>
                          <Button 
                            variant="outline-info" 
                            size="sm" 
                            onClick={() => handlePasswordResetClick(user)}
                            title="Reset Password"
                          >
                            <i className="bi bi-key"></i>
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => handleDeleteClick(user)}
                            disabled={user.role === 'admin' || actionLoading}
                            title="Delete User"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
          <p>Are you sure you want to delete user <strong>{selectedUser?.name}</strong>?</p>
          <p className="text-warning small">
            <i className="bi bi-info-circle me-1"></i>
            This action cannot be undone. All user data and bookings will be affected.
          </p>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Deleting...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>
                Delete User
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Password Reset Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-info">
            <i className="bi bi-key me-2"></i>
            Reset Password for {selectedUser?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>New Password *</Form.Label>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="bg-dark border-secondary text-white"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password *</Form.Label>
              <Form.Control
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bg-dark border-secondary text-white"
              />
            </Form.Group>
            <Alert variant="info" className="small">
              <i className="bi bi-info-circle me-1"></i>
              The user will be able to login with this new password immediately.
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button 
            variant="secondary" 
            onClick={() => setShowPasswordModal(false)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="info" 
            onClick={confirmPasswordReset}
            disabled={actionLoading || !newPassword || !confirmPassword}
          >
            {actionLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Resetting...
              </>
            ) : (
              <>
                <i className="bi bi-key me-2"></i>
                Reset Password
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create User Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-success">
            <i className="bi bi-person-plus me-2"></i>
            Create New User
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark">
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    placeholder="Enter full name"
                    className="bg-dark border-secondary text-white"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    placeholder="Enter email address"
                    className="bg-dark border-secondary text-white"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                    placeholder="Enter phone number"
                    className="bg-dark border-secondary text-white"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <Form.Control
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    placeholder="Enter password (min 6 characters)"
                    className="bg-dark border-secondary text-white"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role *</Form.Label>
                  <Form.Select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    className="bg-dark border-secondary text-white"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <Form.Select
                    value={userForm.status}
                    onChange={(e) => setUserForm({...userForm, status: e.target.value})}
                    className="bg-dark border-secondary text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button 
            variant="secondary" 
            onClick={() => setShowCreateModal(false)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={handleCreateUser}
            disabled={actionLoading || !userForm.name || !userForm.email || !userForm.password}
          >
            {actionLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating...
              </>
            ) : (
              <>
                <i className="bi bi-person-plus me-2"></i>
                Create User
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-primary">
            <i className="bi bi-pencil me-2"></i>
            Edit User: {selectedUser?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark">
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    placeholder="Enter full name"
                    className="bg-dark border-secondary text-white"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    placeholder="Enter email address"
                    className="bg-dark border-secondary text-white"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                    placeholder="Enter phone number"
                    className="bg-dark border-secondary text-white"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>New Password (optional)</Form.Label>
                  <Form.Control
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    placeholder="Leave empty to keep current password"
                    className="bg-dark border-secondary text-white"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role *</Form.Label>
                  <Form.Select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    className="bg-dark border-secondary text-white"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <Form.Select
                    value={userForm.status}
                    onChange={(e) => setUserForm({...userForm, status: e.target.value})}
                    className="bg-dark border-secondary text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Alert variant="info" className="small">
              <i className="bi bi-info-circle me-1"></i>
              Only fill in the password field if you want to change the user's password.
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button 
            variant="secondary" 
            onClick={() => setShowEditModal(false)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateUser}
            disabled={actionLoading || !userForm.name || !userForm.email}
          >
            {actionLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Updating...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Update User
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminUsers;