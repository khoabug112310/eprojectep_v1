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
        const data = response.data.data || response.data;
        
        // Ensure data structure is correct
        setStats({
          revenue: {
            today: data.revenue?.today || 0,
            this_week: data.revenue?.this_week || 0,
            this_month: data.revenue?.this_month || 0
          },
          bookings: {
            today: data.bookings?.today || 0,
            this_week: data.bookings?.this_week || 0,
            this_month: data.bookings?.this_month || 0
          },
          popular_movies: Array.isArray(data.popular_movies) ? data.popular_movies : [],
          theater_performance: Array.isArray(data.theater_performance) ? data.theater_performance : []
        });
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

  // Helper function to get max value safely
  const getMaxValue = (array, property) => {
    if (!array || array.length === 0) return 1;
    const values = array.map(item => item[property] || 0).filter(val => !isNaN(val));
    return values.length > 0 ? Math.max(...values) : 1;
  };

  const maxMovieBookings = getMaxValue(stats.popular_movies, 'bookings');
  const maxTheaterRevenue = getMaxValue(stats.theater_performance, 'revenue');

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
                {(stats.revenue.today || 0).toLocaleString()} VND
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="bg-dark text-white">
            <Card.Body>
              <Card.Title>Weekly Revenue</Card.Title>
              <Card.Text className="display-6 text-gold">
                {(stats.revenue.this_week || 0).toLocaleString()} VND
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="bg-dark text-white">
            <Card.Body>
              <Card.Title>Monthly Revenue</Card.Title>
              <Card.Text className="display-6 text-gold">
                {(stats.revenue.this_month || 0).toLocaleString()} VND
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
              {stats.popular_movies && stats.popular_movies.length > 0 ? (
                stats.popular_movies.slice(0, 5).map((movie, index) => (
                  <div key={index} className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>{movie.title}</span>
                      <span>{movie.bookings || 0} bookings</span>
                    </div>
                    <ProgressBar 
                      now={((movie.bookings || 0) / maxMovieBookings) * 100} 
                      variant="gold"
                      className="mt-1"
                    />
                  </div>
                ))
              ) : (
                <p>No popular movies data available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        {/* Theater Performance */}
        <Col md={6}>
          <Card className="bg-dark text-white">
            <Card.Body>
              <Card.Title>Theater Performance</Card.Title>
              {stats.theater_performance && stats.theater_performance.length > 0 ? (
                stats.theater_performance.slice(0, 5).map((theater, index) => (
                  <div key={index} className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>{theater.name}</span>
                      <span>{(theater.revenue || 0).toLocaleString()} VND</span>
                    </div>
                    <ProgressBar 
                      now={((theater.revenue || 0) / maxTheaterRevenue) * 100} 
                      variant="gold"
                      className="mt-1"
                    />
                  </div>
                ))
              ) : (
                <p>No theater performance data available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;