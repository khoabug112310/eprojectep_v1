import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import StarRating from '../components/StarRating';
import { reviewAPI } from '../services/api';

const TestRating = () => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      // Using movie ID 1 for testing
      const response = await reviewAPI.create(1, {
        rating: rating,
        comment: comment
      });
      
      if (response.data.success) {
        setSuccess('Rating submitted successfully!');
        setRating(0);
        setComment('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="bg-dark">
            <Card.Body>
              <h3 className="text-gold mb-4">Test Movie Rating</h3>
              
              {success && <Alert variant="success">{success}</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Rating</Form.Label>
                  <div>
                    <StarRating 
                      rating={rating} 
                      onRatingChange={setRating} 
                      size="lg"
                    />
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Comment</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts..."
                  />
                </Form.Group>
                
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={loading || rating === 0}
                >
                  {loading ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TestRating;