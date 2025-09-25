import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Container, Form, Alert, Spinner } from 'react-bootstrap';
import { authAPI } from '../../services/api';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
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

  // Validate phone format (Vietnam phone numbers)
  const validatePhone = (phone) => {
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    return phoneRegex.test(phone);
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
      case 'name':
        if (!name) {
          errors.name = 'Full name is required';
        } else if (name.length < 2) {
          errors.name = 'Name must be at least 2 characters';
        } else {
          delete errors.name;
        }
        break;
      case 'email':
        if (!email) {
          errors.email = 'Email is required';
        } else if (!validateEmail(email)) {
          errors.email = 'Please enter a valid email address';
        } else {
          delete errors.email;
        }
        break;
      case 'phone':
        if (!phone) {
          errors.phone = 'Phone number is required';
        } else if (!validatePhone(phone)) {
          errors.phone = 'Please enter a valid Vietnamese phone number';
        } else {
          delete errors.phone;
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
      case 'passwordConfirmation':
        if (!passwordConfirmation) {
          errors.passwordConfirmation = 'Please confirm your password';
        } else if (password !== passwordConfirmation) {
          errors.passwordConfirmation = 'Passwords do not match';
        } else {
          delete errors.passwordConfirmation;
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
    const isNameValid = validateField('name');
    const isEmailValid = validateField('email');
    const isPhoneValid = validateField('phone');
    const isPasswordValid = validateField('password');
    const isPasswordConfirmationValid = validateField('passwordConfirmation');
    setTouched({ name: true, email: true, phone: true, password: true, passwordConfirmation: true });
    return isNameValid && isEmailValid && isPhoneValid && isPasswordValid && isPasswordConfirmationValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      setError('Please fix the errors below before submitting.');
      clearMessages();
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.register({ 
        name, 
        email, 
        phone, 
        password,
        password_confirmation: passwordConfirmation
      });
      
      const { token, user } = response.data.data || response.data;
      
      // Store token and user data in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Show success message
      setSuccess('Registration successful! Welcome to CineBook.');
      
      // Redirect to home page after short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle different types of errors
      if (err.response?.status === 422) {
        // Handle validation errors
        const errors = err.response.data.errors || {};
        setValidationErrors(errors);
        setError('Please fix the validation errors below.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.');
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
            <h2 className="text-center mb-4 text-gold">Create Your Account</h2>
            
            {/* Success Message */}
            {success && <Alert variant="success">{success}</Alert>}
            
            {/* Error Message */}
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form onSubmit={handleSubmit}>
              <Form.Group id="name" className="mb-3">
                <Form.Label>Full Name <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => handleBlur('name')}
                  isInvalid={touched.name && validationErrors.name}
                  placeholder="Enter your full name"
                  className="bg-dark text-white border-secondary"
                />
                <Form.Text className="text-muted">
                  Please enter your full name as it appears on your ID.
                </Form.Text>
                <Form.Control.Feedback type="invalid">
                  {validationErrors.name}
                </Form.Control.Feedback>
              </Form.Group>
              
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
                  We'll send a confirmation email to this address.
                </Form.Text>
                <Form.Control.Feedback type="invalid">
                  {validationErrors.email}
                </Form.Control.Feedback>
              </Form.Group>
              
              <Form.Group id="phone" className="mb-3">
                <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  isInvalid={touched.phone && validationErrors.phone}
                  placeholder="Enter your phone number (e.g., 0987654321)"
                  className="bg-dark text-white border-secondary"
                />
                <Form.Text className="text-muted">
                  Vietnamese phone numbers only (10 digits starting with 0).
                </Form.Text>
                <Form.Control.Feedback type="invalid">
                  {validationErrors.phone}
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
                  placeholder="Create a strong password"
                  className="bg-dark text-white border-secondary"
                />
                <Form.Text className="text-muted">
                  Must be at least 6 characters long.
                </Form.Text>
                <Form.Control.Feedback type="invalid">
                  {validationErrors.password}
                </Form.Control.Feedback>
              </Form.Group>
              
              <Form.Group id="passwordConfirmation" className="mb-3">
                <Form.Label>Confirm Password <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  onBlur={() => handleBlur('passwordConfirmation')}
                  isInvalid={touched.passwordConfirmation && validationErrors.passwordConfirmation}
                  placeholder="Re-enter your password"
                  className="bg-dark text-white border-secondary"
                />
                <Form.Text className="text-muted">
                  Passwords must match exactly.
                </Form.Text>
                <Form.Control.Feedback type="invalid">
                  {validationErrors.passwordConfirmation}
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
                    <span className="ms-2">Creating Account...</span>
                  </>
                ) : 'Create Account'}
              </Button>
            </Form>
            <div className="text-center mt-3">
              Already have an account? <Link to="/auth/login">Login</Link>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Register;