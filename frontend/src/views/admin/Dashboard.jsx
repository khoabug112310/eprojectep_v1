import React, { useState, useEffect } from 'react';
import { Card, Container, Row, Col, ProgressBar } from 'react-bootstrap';
import { adminAPI } from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    revenue: { today: 0, this_week: 0, this_month: 0 },
    bookings: { today: 0, this_week: 0, this_month: 0 },
    popular_movies: [],
    theater_performance: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await adminAPI.getDashboardStats();
        setStats(response.data.data || response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

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
      <h2 className="text-gold mb-4">Admin Dashboard</h2>
      
      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="bg-dark text-white">
            <Card.Body>
              <Card.Title>Today&#39;s Revenue</Card.Title>
              <Card.Text className="display-6 text-gold">
                {stats.revenue.today?.toLocaleString() || 0} VND
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="bg-dark text-white">
            <Card.Body>
              <Card.Title>Weekly Revenue</Card.Title>
              <Card.Text className="display-6 text-gold">
                {stats.revenue.this_week?.toLocaleString() || 0} VND
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="bg-dark text-white">
            <Card.Body>
              <Card.Title>Monthly Revenue</Card.Title>
              <Card.Text className="display-6 text-gold">
                {stats.revenue.this_month?.toLocaleString() || 0} VND
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={4}>
          <Card className="bg-dark text-white">
            <Card.Body>
              <Card.Title>Today&#39;s Bookings</Card.Title>
              <Card.Text className="display-6 text-gold">
                {stats.bookings.today || 0}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="bg-dark text-white">
            <Card.Body>
              <Card.Title>Weekly Bookings</Card.Title>
              <Card.Text className="display-6 text-gold">
                {stats.bookings.this_week || 0}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="bg-dark text-white">
            <Card.Body>
              <Card.Title>Monthly Bookings</Card.Title>
              <Card.Text className="display-6 text-gold">
                {stats.bookings.this_month || 0}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Popular Movies */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="bg-dark text-white">
            <Card.Body>
              <Card.Title>Popular Movies</Card.Title>
              {stats.popular_movies?.slice(0, 5).map((movie, index) => (
                <div key={index} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>{movie.title}</span>
                    <span>{movie.bookings} bookings</span>
                  </div>
                  <ProgressBar 
                    now={(movie.bookings / Math.max(...stats.popular_movies.map(m => m.bookings))) * 100} 
                    variant="gold"
                    className="mt-1"
                  />
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
        
        {/* Theater Performance */}
        <Col md={6}>
          <Card className="bg-dark text-white">
            <Card.Body>
              <Card.Title>Theater Performance</Card.Title>
              {stats.theater_performance?.slice(0, 5).map((theater, index) => (
                <div key={index} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>{theater.name}</span>
                    <span>{theater.revenue?.toLocaleString() || 0} VND</span>
                  </div>
                  <ProgressBar 
                    now={(theater.revenue / Math.max(...stats.theater_performance.map(t => t.revenue))) * 100} 
                    variant="gold"
                    className="mt-1"
                  />
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;