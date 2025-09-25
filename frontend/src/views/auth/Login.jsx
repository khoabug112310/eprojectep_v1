import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Container, Form, Alert, Spinner } from 'react-bootstrap';
import { authAPI } from '../../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();

  // Clear messages after 5 seconds
  const clearMessages = () => {
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 5000);
  };

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle field blur for validation
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  // Validate individual fields
  const validateField = (field) => {
    const errors = { ...validationErrors };
    
    switch (field) {
      case 'email':
        if (!email) {
          errors.email = 'Email is required';
        } else if (!validateEmail(email)) {
          errors.email = 'Please enter a valid email address';
        } else {
          delete errors.email;
        }
        break;
      case 'password':
        if (!password) {
          errors.password = 'Password is required';
        } else if (password.length < 6) {
          errors.password = 'Password must be at least 6 characters';
        } else {
          delete errors.password;
        }
        break;
      default:
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate entire form
  const validateForm = () => {
    const isEmailValid = validateField('email');
    const isPasswordValid = validateField('password');
    setTouched({ email: true, password: true });
    return isEmailValid && isPasswordValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      setError('Please fix the errors below before submitting.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data.data || response.data;
      
      // Store token and user data in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Show success message
      setSuccess(`Welcome back, ${user.name}! Redirecting...`);
      
      // Redirect based on user role after short delay
      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }, 1500);
      
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle different types of errors
      if (err.response?.status === 401) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.response?.status === 422) {
        // Handle validation errors
        const errors = err.response.data.errors || {};
        setValidationErrors(errors);
        setError('Please fix the validation errors below.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
      
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="w-100" style={{ maxWidth: '400px' }}>
        <Card className="bg-dark">
          <Card.Body>
            <h2 className="text-center mb-4 text-gold">Login to Your Account</h2>
            
            {/* Success Message */}
            {success && <Alert variant="success">{success}</Alert>}
            
            {/* Error Message */}
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form onSubmit={handleSubmit}>
              <Form.Group id="email" className="mb-3">
                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  isInvalid={touched.email && validationErrors.email}
                  placeholder="Enter your email address"
                  className="bg-dark text-white border-secondary"
                />
                <Form.Text className="text-muted">
                  We'll never share your email with anyone else.
                </Form.Text>
                <Form.Control.Feedback type="invalid">
                  {validationErrors.email}
                </Form.Control.Feedback>
              </Form.Group>
              
              <Form.Group id="password" className="mb-3">
                <Form.Label>Password <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  isInvalid={touched.password && validationErrors.password}
                  placeholder="Enter your password"
                  className="bg-dark text-white border-secondary"
                />
                <Form.Text className="text-muted">
                  Password must be at least 6 characters long.
                </Form.Text>
                <Form.Control.Feedback type="invalid">
                  {validationErrors.password}
                </Form.Control.Feedback>
              </Form.Group>
              
              <Button 
                disabled={loading} 
                className="w-100 mb-3" 
                type="submit" 
                variant="primary"
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                    <span className="ms-2">Logging in...</span>
                  </>
                ) : 'Login'}
              </Button>
            </Form>
            <div className="text-center mt-3">
              <Link to="/auth/forgot-password">Forgot Password?</Link>
            </div>
            <div className="text-center mt-2">
              Do not have an account? <Link to="/auth/register">Sign Up</Link>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Login;