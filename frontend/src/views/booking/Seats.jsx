import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Container, Alert, Badge } from 'react-bootstrap';
import { showtimeAPI } from '../../services/api';

const Seats = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const [showtime, setShowtime] = useState(null);
  const [seatMap, setSeatMap] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSeatMap = async () => {
      try {
        const response = await showtimeAPI.getSeats(showtimeId);
        const data = response.data.data || response.data;
        setShowtime(data.showtime);
        // seat_map is an array of seat objects, not grouped by type
        setSeatMap(data.seat_map || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to load seat map');
        setLoading(false);
      }
    };

    if (showtimeId) {
      fetchSeatMap();
    }
  }, [showtimeId]);

  const handleSeatClick = (seatObj) => {
    // Check if seat is available
    if (seatObj.status !== 'available') {
      return; // Can't select occupied or locked seats
    }

    // Toggle seat selection
    const isSelected = selectedSeats.some(s => s.seat === seatObj.seat);
    
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.seat !== seatObj.seat));
    } else {
      setSelectedSeats([
        ...selectedSeats,
        { 
          seat: seatObj.seat, 
          type: seatObj.type, 
          price: seatObj.price 
        }
      ]);
    }
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }

    // Store selected seats in localStorage for the next step
    localStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));
    localStorage.setItem('showtimeId', showtimeId);
    
    // Navigate to checkout
    navigate('/booking/checkout');
  };

  const calculateTotal = () => {
    return selectedSeats.reduce((total, seat) => total + (seat.price || 0), 0);
  };

  // Group seats by type for display
  const groupSeatsByType = (seats) => {
    return seats.reduce((groups, seat) => {
      if (!groups[seat.type]) {
        groups[seat.type] = [];
      }
      groups[seat.type].push(seat);
      return groups;
    }, {});
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-gold" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  // Group seats by type for display
  const seatsByType = groupSeatsByType(seatMap);

  return (
    <Container>
      <h2 className="text-gold mb-4">Select Seats</h2>
      
      {showtime && (
        <Card className="bg-dark mb-4">
          <Card.Body>
            <Card.Title>{showtime.movie?.title}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
              {showtime.theater?.name}
            </Card.Subtitle>
            <Card.Text>
              <strong>Date:</strong> {showtime.show_date}<br />
              <strong>Time:</strong> {showtime.show_time}
            </Card.Text>
          </Card.Body>
        </Card>
      )}

      <div className="text-center mb-4">
        <div className="screen bg-gold text-dark fw-bold py-2 mb-4 rounded">
          SCREEN
        </div>
        
        {Object.entries(seatsByType).map(([type, seats]) => {
          // Get price from first seat of this type
          const price = seats.length > 0 ? seats[0].price : 0;
          return (
            <div key={type} className="mb-5">
              <h5 className="text-capitalize mb-3">{type} - {parseInt(price).toLocaleString()} VND</h5>
              <div className="d-flex flex-wrap justify-content-center gap-2">
                {seats.map(seatObj => {
                  const isSelected = selectedSeats.some(s => s.seat === seatObj.seat);
                  const isOccupied = seatObj.status !== 'available';
                  return (
                    <Button
                      key={seatObj.seat}
                      variant={isSelected ? "primary" : isOccupied ? "secondary" : "outline-light"}
                      onClick={() => handleSeatClick(seatObj)}
                      className="seat-btn"
                      style={{ width: '50px', height: '50px' }}
                      disabled={isOccupied}
                    >
                      {seatObj.seat}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        <div className="mt-4">
          <div className="legend d-flex justify-content-center gap-4">
            <div className="d-flex align-items-center">
              <div className="seat-example bg-light border border-dark me-2" style={{ width: '30px', height: '30px' }}></div>
              <span>Available</span>
            </div>
            <div className="d-flex align-items-center">
              <div className="seat-example bg-primary border border-dark me-2" style={{ width: '30px', height: '30px' }}></div>
              <span>Selected</span>
            </div>
            <div className="d-flex align-items-center">
              <div className="seat-example bg-secondary border border-dark me-2" style={{ width: '30px', height: '30px' }}></div>
              <span>Occupied</span>
            </div>
          </div>
        </div>
      </div>

      {selectedSeats.length > 0 && (
        <Card className="bg-dark mb-4">
          <Card.Body>
            <Card.Title>Selected Seats</Card.Title>
            <div className="d-flex flex-wrap gap-2 mb-3">
              {selectedSeats.map((seat, index) => (
                <Badge key={index} bg="primary" className="fs-6">
                  {seat.seat} ({seat.type})
                </Badge>
              ))}
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Total: {calculateTotal().toLocaleString()} VND</strong>
              </div>
              <Button variant="primary" onClick={handleContinue}>
                Continue to Checkout
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {error && <Alert variant="danger">{error}</Alert>}
    </Container>
  );
};

export default Seats;