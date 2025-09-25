import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button, Card, Container, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { showtimeAPI, bookingAPI } from '../../services/api';
import { normalizeFacilities } from '../../utils/helpers';

const Seats = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: urlShowtimeId } = useParams(); // Get showtimeId from URL params
  const { showtimeId: stateShowtimeId, showtime: passedShowtime } = location.state || {};
  
  // Use URL param first, then state, then null
  const showtimeId = urlShowtimeId || stateShowtimeId;
  
  const [showtime, setShowtime] = useState(passedShowtime);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');  
  const [lockError, setLockError] = useState('');
  const [lockLoading, setLockLoading] = useState(false);
  const [otherShowtimes, setOtherShowtimes] = useState([]);
  const [showtimesLoading, setShowtimesLoading] = useState(false);
  const refreshIntervalRef = useRef(null); // Use ref instead of state for interval

  console.log('Seats component rendered with showtimeId:', showtimeId);

  // Function to calculate showtime with end time based on movie duration
  const calculateShowtime = (showtime) => {
    if (!showtime || !showtime.show_time || !showtime.movie?.duration) return showtime?.show_time || '';
    
    try {
      // Parse the show time
      const [hours, minutes] = showtime.show_time.split(':').map(Number);
      const startTime = new Date();
      startTime.setHours(hours, minutes, 0, 0);
      
      // Calculate end time by adding movie duration (in minutes)
      const endTime = new Date(startTime.getTime() + showtime.movie.duration * 60000);
      
      // Format times
      const formatTime = (date) => {
        return date.toTimeString().slice(0, 5); // HH:MM format
      };
      
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    } catch (error) {
      // Fallback to just showing the start time if calculation fails
      return showtime.show_time;
    }
  };

  // Fetch other showtimes for the same movie at the same theater
  const fetchOtherShowtimes = useCallback(async (showtimeData = null) => {
    const currentShowtime = showtimeData || showtime;
    if (!currentShowtime?.movie_id || !currentShowtime?.theater_id) return;
    
    console.log('Fetching other showtimes for:', {
      movie_id: currentShowtime.movie_id,
      theater_id: currentShowtime.theater_id,
      show_date: currentShowtime.show_date,
      current_showtime_id: showtimeId
    });
    
    setShowtimesLoading(true);
    try {
      // Extract date part from show_date (handle both YYYY-MM-DD and YYYY-MM-DD HH:MM:SS formats)
      const showDate = currentShowtime.show_date?.split('T')[0] || currentShowtime.show_date?.split(' ')[0];
      
      // Get all showtimes for the movie at the same theater
      const response = await showtimeAPI.getAll({
        movie_id: currentShowtime.movie_id,
        theater_id: currentShowtime.theater_id,
        show_date: showDate
      });
      
      console.log('Showtimes API response:', response.data);
      
      if (response.data.success) {
        let showtimesData = response.data.data?.data || response.data.data || [];
        
        console.log('All showtimes for movie:', showtimesData);
        
        // Filter out current showtime and only show other times
        const otherTimes = showtimesData.filter(st => {
          const isSameDate = (st.show_date?.split('T')[0] || st.show_date?.split(' ')[0]) === showDate;
          const isDifferentShowtime = st.id !== parseInt(showtimeId);
          
          console.log(`Showtime ${st.id}: same_date=${isSameDate}, different_id=${isDifferentShowtime}`);
          
          return isSameDate && isDifferentShowtime;
        });
        
        console.log('Filtered other showtimes:', otherTimes);
        
        // Sort by show time
        otherTimes.sort((a, b) => {
          const timeA = a.show_time.replace(':', '');
          const timeB = b.show_time.replace(':', '');
          return timeA.localeCompare(timeB);
        });
        
        setOtherShowtimes(otherTimes);
      }
    } catch (error) {
      console.error('Error fetching other showtimes:', error);
    } finally {
      setShowtimesLoading(false);
    }
  }, [showtime?.movie_id, showtime?.theater_id, showtime?.show_date, showtimeId]);

  // Fetch seat data
  const fetchSeats = useCallback(async () => {
    const currentShowtimeId = showtimeId;
    if (!currentShowtimeId) return;
    
    try {
      const response = await showtimeAPI.getSeats(currentShowtimeId);
      console.log('API Response:', response);
      
      if (response.data.success) {
        // Log the seat data structure for debugging
        console.log('Seat data received:', response.data.data);
        
        // Ensure seat_map exists and is an array
        let seatMap = response.data.data.seat_map || [];
        console.log('Initial seat map:', seatMap);
        
        // Handle case where seat_map might be an object instead of array
        if (!Array.isArray(seatMap) && typeof seatMap === 'object' && seatMap !== null) {
          // Convert object to array
          seatMap = Object.values(seatMap);
          console.log('Converted seat map from object to array:', seatMap);
        }
        
        // Add row information if missing and ensure all required properties
        const processedSeats = seatMap.map((seat, index) => {
          // Handle case where seat might be missing required properties
          const seatWithDefaults = {
            id: seat.id || index,
            seat: seat.seat || seat.name || `Seat-${index}`,
            row: seat.row || null,
            type: seat.type || 'gold', // Default to gold if not specified
            status: seat.status || 'available', // Default to available if not specified
            price: seat.price || 0, // Default to 0 if not specified
            ...seat
          };
          
          // Ensure status is one of the expected values
          if (!['available', 'occupied', 'locked'].includes(seatWithDefaults.status)) {
            seatWithDefaults.status = 'available';
          }
          
          // Ensure type is one of the expected values
          if (!['box', 'platinum', 'gold'].includes(seatWithDefaults.type)) {
            seatWithDefaults.type = 'gold';
          }
          
          if (!seatWithDefaults.row && seatWithDefaults.seat) {
            // Extract row from seat identifier (e.g., "A1" -> row "A")
            const rowMatch = seatWithDefaults.seat.match(/^([A-Z]+|\d+)/);
            seatWithDefaults.row = rowMatch ? rowMatch[1] : 'Unknown';
          }
          
          return seatWithDefaults;
        });
        
        console.log('Processed seats:', processedSeats);
        
        // Update seats state
        setSeats(processedSeats);
        setShowtime(response.data.data.showtime);
        
        // Fetch other showtimes with the fresh showtime data
        fetchOtherShowtimes(response.data.data.showtime);
        
        // Update selected seats based on new data
        setSelectedSeats(prevSelectedSeats => {
          return prevSelectedSeats.filter(selectedSeat => {
            const seat = processedSeats.find(s => s.seat === selectedSeat.seat);
            return seat && seat.status !== 'occupied';
          });
        });
      } else {
        setError('Failed to load seat data');
      }
    } catch (err) {
      console.error('Error fetching seats:', err);
      setError('Failed to load seat data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showtimeId]); // Dependencies are correct

  // Create a stable reference for fetchSeats to prevent infinite re-renders
  const stableFetchSeats = useCallback(() => {
    fetchSeats();
  }, [fetchSeats]);

  // Refresh seat status periodically
  useEffect(() => {
    console.log('useEffect triggered with showtimeId:', showtimeId);
    
    if (!showtimeId) {
      console.log('No showtimeId, returning');
      return;
    }
    
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      console.log('Clearing existing interval');
      clearInterval(refreshIntervalRef.current);
    }
    
    // Reset state when showtimeId changes
    setSeats([]);
    setSelectedSeats([]);
    setLoading(true);
    setError('');
    
    // Fetch seats immediately
    console.log('Fetching seats immediately');
    fetchSeats();
    
    // Set up interval for real-time updates (every 5 seconds as per requirement)
    console.log('Setting up interval for real-time updates');
    refreshIntervalRef.current = setInterval(() => {
      console.log('Interval triggered, fetching seats');
      fetchSeats();
    }, 5000);
    
    // Clean up interval on unmount or when showtimeId changes
    return () => {
      console.log('Cleaning up interval');
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [showtimeId, fetchSeats]); // Dependencies are correct

  // Lock selected seats
  const lockSelectedSeats = async () => {
    const currentShowtimeId = showtimeId;
    if (selectedSeats.length === 0) {
      setLockError('Please select at least one seat');
      return;
    }
    
    setLockLoading(true);
    setLockError('');
    
    try {
      const seatCodes = selectedSeats.map(seat => seat.seat);
      const response = await showtimeAPI.lockSeats(currentShowtimeId, { seats: seatCodes });
      
      if (response.data.success) {
        // Seats locked successfully, proceed to checkout
        const bookingData = {
          showtime_id: currentShowtimeId,
          seats: selectedSeats,
          total_amount: selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0),
          payment_method: 'credit_card'
        };
        
        // Create booking
        const bookingResponse = await bookingAPI.create(bookingData);
        
        if (bookingResponse.data.success) {
          // Navigate to checkout with booking data
          navigate('/booking/checkout', { 
            state: { 
              bookingData: bookingResponse.data.data,
              movie: showtime?.movie,
              theater: showtime?.theater,
              showtime: showtime
            } 
          });
        } else {
          setLockError(bookingResponse.data.message || 'Failed to create booking');
        }
      } else {
        setLockError(response.data.message || 'Failed to lock seats. Please try again.');
        // Refresh seat data to get updated status
        fetchSeats();
      }
    } catch (err) {
      console.error('Error locking seats:', err);
      setLockError('Failed to lock seats. Please try again.');
    } finally {
      setLockLoading(false);
    }
  };

  // Handle seat click
  const handleSeatClick = (seat) => {
    console.log('Seat clicked:', seat);
    // Don't allow selection of occupied or locked seats
    if (seat.status === 'occupied' || seat.status === 'locked') {
      console.log('Seat is not available for selection');
      return;
    }
    
    const isSelected = selectedSeats.some(selectedSeat => selectedSeat.seat === seat.seat);
    console.log('Is seat selected:', isSelected);
    
    if (isSelected) {
      // Deselect seat
      console.log('Deselecting seat:', seat.seat);
      setSelectedSeats(prevSelectedSeats => 
        prevSelectedSeats.filter(selectedSeat => selectedSeat.seat !== seat.seat)
      );
    } else {
      // Select seat - create a copy to avoid mutation
      console.log('Selecting seat:', seat.seat);
      setSelectedSeats(prevSelectedSeats => [...prevSelectedSeats, {...seat}]);
    }
  };

  // Get seat button class based on status and type
  const getSeatButtonClass = (seat) => {
    console.log('Getting class for seat:', seat);
    const baseClasses = 'btn seat-btn me-2 mb-2';
    
    // Determine seat status class
    if (seat.status === 'occupied') {
      console.log('Seat is occupied');
      return `${baseClasses} btn-secondary disabled`;
    } else if (seat.status === 'locked') {
      console.log('Seat is locked');
      return `${baseClasses} btn-warning disabled`; // Yellow for locked by others
    } else if (selectedSeats.some(selectedSeat => selectedSeat.seat === seat.seat)) {
      console.log('Seat is selected');
      return `${baseClasses} btn-primary`; // Blue for selected
    } else {
      // Available seats - color by type
      console.log('Seat is available, type:', seat.type);
      switch (seat.type) {
        case 'box':
          return `${baseClasses} btn-outline-warning`; // Yellow border for box seats
        case 'platinum':
          return `${baseClasses} btn-outline-info`; // Blue border for platinum seats
        case 'gold':
        default:
          return `${baseClasses} btn-outline-light`; // White border for gold seats
      }
    }
  };

  if (!showtimeId) {
    console.log('No showtimeId, showing invalid selection message');
    return (
      <Container>
        <Alert variant="danger">Invalid showtime selection</Alert>
      </Container>
    );
  }

  console.log('Rendering Seats component with:', { showtimeId, showtime, seats, selectedSeats, loading, error });

  // Group seats by row for proper display
  const groupSeatsByRow = (seats) => {
    // Log seats for debugging
    console.log('Grouping seats by row:', seats);
    
    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      console.log('No seats to group by row');
      return {};
    }
    
    const rows = {};
    seats.forEach(seat => {
      // Ensure seat has required properties
      if (!seat.row) {
        // Try to extract row from seat identifier
        const rowMatch = seat.seat ? seat.seat.match(/^([A-Z]+|\d+)/) : null;
        seat.row = rowMatch ? rowMatch[1] : 'Unknown';
      }
      
      if (!rows[seat.row]) {
        rows[seat.row] = [];
      }
      rows[seat.row].push({...seat}); // Create a copy to avoid mutation
    });
    
    console.log('Rows before sorting:', rows);
    
    // Sort rows and seats within each row
    Object.keys(rows).forEach(row => {
      rows[row].sort((a, b) => {
        // Extract numeric part from seat number for proper sorting
        const numA = parseInt(a.seat.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.seat.replace(/\D/g, '')) || 0;
        return numA - numB;
      });
    });
    
    // Sort rows alphabetically/numerically
    const sortedRows = Object.keys(rows).sort((a, b) => {
      // If both are numbers, sort numerically
      if (!isNaN(a) && !isNaN(b)) {
        return parseInt(a) - parseInt(b);
      }
      // If both are letters, sort alphabetically
      if (isNaN(a) && isNaN(b)) {
        return a.localeCompare(b);
      }
      // Put numbers before letters
      return isNaN(a) ? 1 : -1;
    });
    
    const sortedRowsObject = {};
    sortedRows.forEach(row => {
      sortedRowsObject[row] = rows[row];
    });
    
    console.log('Sorted rows:', sortedRowsObject);
    
    return sortedRowsObject;
  };

  // Group seats by type for proper layout (box, platinum, gold)
  const groupSeatsByType = (seats) => {
    // Handle case where seats might be undefined or not an array
    if (!seats || !Array.isArray(seats)) {
      console.log('No seats to group by type');
      return { box: {}, platinum: {}, gold: {} };
    }
    
    console.log('Grouping seats by type:', seats);
    
    // Create copies of seats to avoid mutation
    const boxSeats = seats.filter(seat => seat.type === 'box').map(seat => ({...seat}));
    const platinumSeats = seats.filter(seat => seat.type === 'platinum').map(seat => ({...seat}));
    const goldSeats = seats.filter(seat => seat.type === 'gold').map(seat => ({...seat}));
    
    console.log('Box seats:', boxSeats);
    console.log('Platinum seats:', platinumSeats);
    console.log('Gold seats:', goldSeats);
    
    const result = {
      box: groupSeatsByRow(boxSeats),
      platinum: groupSeatsByRow(platinumSeats),
      gold: groupSeatsByRow(goldSeats)
    };
    
    console.log('Seats grouped by type result:', result);
    
    return result;
  };

  // Get seat map layout with proper row grouping and type organization
  const getSeatMapLayout = () => {
    console.log('Rendering seat map with seats:', seats);
    
    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      console.log('No seats to display');
      return <p className="text-center">No seats available</p>;
    }
    
    try {
      // Create copies of seat arrays to avoid mutation issues
      const boxSeats = seats.filter(seat => seat.type === 'box').map(seat => ({...seat}));
      const platinumSeats = seats.filter(seat => seat.type === 'platinum').map(seat => ({...seat}));
      const goldSeats = seats.filter(seat => seat.type === 'gold').map(seat => ({...seat}));
      
      const seatsByType = {
        box: groupSeatsByRow(boxSeats),
        platinum: groupSeatsByRow(platinumSeats),
        gold: groupSeatsByRow(goldSeats)
      };
      
      console.log('Seats grouped by type:', seatsByType);
      
      // Check if we have any seats to display
      const hasBoxSeats = Object.keys(seatsByType.box).length > 0;
      const hasPlatinumSeats = Object.keys(seatsByType.platinum).length > 0;
      const hasGoldSeats = Object.keys(seatsByType.gold).length > 0;
      
      // Check for seats without type
      const otherSeats = seats.filter(seat => !seat.type || (seat.type !== 'box' && seat.type !== 'platinum' && seat.type !== 'gold'));
      const hasOtherSeats = otherSeats.length > 0;
      
      console.log('Seat counts - Box:', hasBoxSeats, 'Platinum:', hasPlatinumSeats, 'Gold:', hasGoldSeats, 'Other:', hasOtherSeats);
      
      // If no seats to display, show a message
      if (!hasBoxSeats && !hasPlatinumSeats && !hasGoldSeats && !hasOtherSeats) {
        console.log('No seats available for display');
        return <p className="text-center">No seats available for display</p>;
      }
      
      return (
        <div className="seat-map-container">
          {/* Unified seat layout without type headers */}
          <div className="seat-section">
            {/* Box Seats - Center Top (no header) */}
            {hasBoxSeats && (
              <div className="mb-3">
                {Object.keys(seatsByType.box).map(row => (
                  <div key={`box-${row}`} className="seat-row d-flex align-items-center justify-content-center mb-1">
                    <div className="row-label me-2 fw-bold" style={{ minWidth: '25px', fontSize: '14px' }}>
                      {row}
                    </div>
                    <div className="seats-container d-flex flex-wrap justify-content-center">
                      {seatsByType.box[row].map((seat, index) => (
                        <button
                          key={`box-${row}-${seat.seat}`}
                          className={getSeatButtonClass(seat)}
                          onClick={() => handleSeatClick(seat)}
                          disabled={seat.status === 'occupied' || seat.status === 'locked'}
                          style={{
                            width: '40px',
                            height: '30px',
                            minWidth: '40px',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            margin: '0 2px 2px 0',
                            fontSize: '12px',
                            borderRadius: '6px'
                          }}
                        >
                          {seat.seat.replace(row, '')}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Platinum Seats - Middle (no header) */}
            {hasPlatinumSeats && (
              <div className="mb-3">
                {Object.keys(seatsByType.platinum).map(row => (
                  <div key={`platinum-${row}`} className="seat-row d-flex align-items-center justify-content-center mb-1">
                    <div className="row-label me-2 fw-bold" style={{ minWidth: '25px', fontSize: '14px' }}>
                      {row}
                    </div>
                    <div className="seats-container d-flex flex-wrap justify-content-center">
                      {seatsByType.platinum[row].map((seat, index) => (
                        <button
                          key={`platinum-${row}-${seat.seat}`}
                          className={getSeatButtonClass(seat)}
                          onClick={() => handleSeatClick(seat)}
                          disabled={seat.status === 'occupied' || seat.status === 'locked'}
                          style={{
                            width: '40px',
                            height: '30px',
                            minWidth: '40px',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            margin: '0 2px 2px 0',
                            fontSize: '12px',
                            borderRadius: '6px'
                          }}
                        >
                          {seat.seat.replace(row, '')}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Gold Seats - Bottom (no header) */}
            {hasGoldSeats && (
              <div className="mb-3">
                {Object.keys(seatsByType.gold).map(row => (
                  <div key={`gold-${row}`} className="seat-row d-flex align-items-center justify-content-center mb-1">
                    <div className="row-label me-2 fw-bold" style={{ minWidth: '25px', fontSize: '14px' }}>
                      {row}
                    </div>
                    <div className="seats-container d-flex flex-wrap justify-content-center">
                      {seatsByType.gold[row].map((seat, index) => (
                        <button
                          key={`gold-${row}-${seat.seat}`}
                          className={getSeatButtonClass(seat)}
                          onClick={() => handleSeatClick(seat)}
                          disabled={seat.status === 'occupied' || seat.status === 'locked'}
                          style={{
                            width: '40px',
                            height: '30px',
                            minWidth: '40px',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            margin: '0 2px 2px 0',
                            fontSize: '12px',
                            borderRadius: '6px'
                          }}
                        >
                          {seat.seat.replace(row, '')}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Fallback for seats without type (no header) */}
            {hasOtherSeats && (
              <div>
                {(() => {
                  const groupedOtherSeats = groupSeatsByRow(otherSeats.map(seat => ({...seat})));
                  return Object.keys(groupedOtherSeats).map(row => (
                    <div key={`other-${row}`} className="seat-row d-flex align-items-center justify-content-center mb-1">
                      <div className="row-label me-2 fw-bold" style={{ minWidth: '25px', fontSize: '14px' }}>
                        {row}
                      </div>
                      <div className="seats-container d-flex flex-wrap justify-content-center">
                        {groupedOtherSeats[row].map((seat, index) => (
                          <button
                            key={`other-${row}-${seat.seat}`}
                            className={getSeatButtonClass(seat)}
                            onClick={() => handleSeatClick(seat)}
                            disabled={seat.status === 'occupied' || seat.status === 'locked'}
                            style={{
                              width: '40px',
                              height: '30px',
                              minWidth: '40px',
                              padding: '0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              margin: '0 2px 2px 0',
                              fontSize: '12px',
                              borderRadius: '6px'
                            }}
                          >
                            {seat.seat.replace(row, '')}
                          </button>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering seat map:', error);
      return <p className="text-center text-danger">Error displaying seat map. Please try again.</p>;
    }
  };

  return (
    <Container>
      <h2 className="text-gold mb-4">Select Seats</h2>
      
      {/* Top Section - Movie Information */}
      <Card className="bg-dark mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              {showtime?.movie?.poster_url && (
                <img 
                  src={showtime.movie.poster_url} 
                  alt={showtime.movie.title}
                  className="img-fluid rounded"
                  style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }}
                />
              )}
            </Col>
            <Col md={9}>
              <h4 className="text-gold mb-3">Movie Information</h4>
              {showtime?.movie && (
                <Row>
                  <Col md={6}>
                    <h5>{showtime.movie.title}</h5>
                    <p><strong>Theater:</strong> {showtime.theater?.name}</p>
                    <p><strong>Date:</strong> {showtime.show_date && new Date(showtime.show_date).toLocaleDateString('en-GB')}</p>
                    <p><strong>Time:</strong> {showtime && calculateShowtime(showtime)}</p>
                  </Col>
                  <Col md={6}>
                    {showtime.theater?.facilities && (
                      <div>
                        <strong>Facilities:</strong>
                        <div className="mt-2">
                          {normalizeFacilities(showtime.theater.facilities).map((facility, index) => (
                            <Badge key={index} bg="secondary" className="me-1 mb-1">
                              {facility}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Col>
                </Row>
              )}  
            </Col>
          </Row>
          
          {/* Other Showtimes Section */}
          {showtime?.movie && (
            <Row className="mt-4">
              <Col>
                <h5 className="text-gold mb-3">Other Showtimes Today</h5>
                {showtimesLoading ? (
                  <div className="text-center py-2">
                    <Spinner animation="border" size="sm" variant="gold" />
                    <span className="ms-2">Loading other showtimes...</span>
                  </div>
                ) : otherShowtimes.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {otherShowtimes.map((otherShowtime) => {
                      const timeRange = calculateShowtime({
                        ...otherShowtime,
                        movie: showtime.movie
                      });
                      
                      return (
                        <Button
                          key={otherShowtime.id}
                          variant="outline-primary"
                          size="sm"
                          className="px-3 py-2"
                          onClick={() => {
                            // Navigate to the other showtime
                            navigate(`/booking/seats/${otherShowtime.id}`);
                          }}
                          style={{
                            minWidth: '120px',
                            borderRadius: '8px',
                            fontSize: '13px'
                          }}
                        >
                          <div className="d-flex flex-column align-items-center">
                            <strong>{timeRange}</strong>
                            <small className="text-muted">Available</small>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted mb-0">No other showtimes available today</p>
                )}
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Main Content Row */}
      <Row>
        {/* Left Column - Selected Seats */}
        <Col md={3}>
          <div className="sticky-top" style={{ top: '110px', zIndex: '10' }}>
            <Card className="bg-dark" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <Card.Body className="p-3">
                <h5 className="text-gold mb-2">Selected Seats</h5>
                <div style={{ minHeight: '150px' }}>
                  {selectedSeats.length > 0 ? (
                    <div className="d-flex flex-column gap-1">
                      {selectedSeats.map((seat, index) => (
                        <div key={index} className="d-flex align-items-center justify-content-between bg-secondary p-1 rounded small">
                          <span className="fw-bold">{seat.seat}</span>
                          <Badge bg={
                            seat.type === 'box' ? 'warning' : 
                            seat.type === 'platinum' ? 'info' : 'light'
                          } className="small">
                            {seat.type}
                          </Badge>
                          <span className="text-gold small">{(seat.price / 25000)?.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted small mb-0">No seats selected</p>
                  )}
                  
                  <div className="mt-2 pt-2 border-top">
                    <div className="d-flex justify-content-between">
                      <strong className="small">Total:</strong>
                      <strong className="text-gold small">
                        {(selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0) / 25000)?.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}
                      </strong>
                    </div>
                  </div>

                  {lockError && (
                    <Alert variant="danger" className="mt-2 mb-0 small">
                      {lockError}
                    </Alert>
                  )}
                  
                  <Button 
                    variant="gold" 
                    size="sm"
                    className="w-100 mt-2"
                    onClick={lockSelectedSeats}
                    disabled={selectedSeats.length === 0 || lockLoading}
                  >
                    {lockLoading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        /> Locking...
                      </>
                    ) : (
                      'Proceed to Checkout'
                    )}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
        
        {/* Right Column - Seat Map */}
        <Col md={9}>
          <Card className="bg-dark">
            <Card.Body>
              <div className="text-center mb-3">
                <div className="bg-light text-dark py-2 px-4 rounded" style={{ display: 'inline-block', fontSize: '14px', fontWeight: 'bold' }}>
                  SCREEN
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="gold" />
                  <p className="mt-2">Loading seat map...</p>
                </div>
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : (
                <div className="mb-4 d-flex justify-content-center">
                  <div className="seat-map-wrapper w-100" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                    {seats && seats.length > 0 ? (
                      getSeatMapLayout()
                    ) : (
                      <p className="text-center">No seats available</p>
                    )}
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="mt-3">
                <h6 className="text-gold mb-2">Legend</h6>
                <div className="row">
                  <div className="col-6 col-md-4 d-flex align-items-center mb-1">
                    <div className="btn btn-outline-light me-1" style={{ width: '25px', height: '18px', padding: '0', fontSize: '10px', borderRadius: '4px' }}></div>
                    <small>Gold</small>
                  </div>
                  <div className="col-6 col-md-4 d-flex align-items-center mb-1">
                    <div className="btn btn-outline-info me-1" style={{ width: '25px', height: '18px', padding: '0', fontSize: '10px', borderRadius: '4px' }}></div>
                    <small>Platinum</small>
                  </div>
                  <div className="col-6 col-md-4 d-flex align-items-center mb-1">
                    <div className="btn btn-outline-warning me-1" style={{ width: '25px', height: '18px', padding: '0', fontSize: '10px', borderRadius: '4px' }}></div>
                    <small>Box</small>
                  </div>
                  <div className="col-6 col-md-4 d-flex align-items-center mb-1">
                    <div className="btn btn-primary me-1" style={{ width: '25px', height: '18px', padding: '0', fontSize: '10px', borderRadius: '4px' }}></div>
                    <small>Selected</small>
                  </div>
                  <div className="col-6 col-md-4 d-flex align-items-center mb-1">
                    <div className="btn btn-secondary me-1" style={{ width: '25px', height: '18px', padding: '0', fontSize: '10px', borderRadius: '4px' }}></div>
                    <small>Occupied</small>
                  </div>
                  <div className="col-6 col-md-4 d-flex align-items-center mb-1">
                    <div className="btn btn-warning me-1" style={{ width: '25px', height: '18px', padding: '0', fontSize: '10px', borderRadius: '4px' }}></div>
                    <small>Locked</small>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Bottom Section - User Ratings */}
      <Card className="bg-dark mt-4">
        <Card.Body>
          <h4 className="text-gold mb-3">User Reviews</h4>
          <div className="text-center py-4">
            <p className="text-muted mb-3">Share your experience with other moviegoers</p>
            <div className="d-flex justify-content-center align-items-center gap-4">
              <div className="text-center">
                <div className="h5 text-warning mb-1">★★★★☆</div>
                <small className="text-muted">Average Rating</small>
              </div>
              <div className="text-center">
                <div className="h5 text-info mb-1">4.2/5</div>
                <small className="text-muted">Based on 128 reviews</small>
              </div>
              <Button variant="outline-gold" size="sm">
                Write a Review
              </Button>
            </div>
          </div>
          
          {/* Sample reviews */}
          <div className="mt-4">
            <div className="border-bottom pb-3 mb-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <strong className="text-warning">★★★★★</strong>
                  <span className="ms-2">John D.</span>
                </div>
                <small className="text-muted">2 days ago</small>
              </div>
              <p className="mt-2 mb-0">"Great movie experience! The theater facilities were excellent and the sound quality was amazing."</p>
            </div>
            
            <div className="border-bottom pb-3 mb-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <strong className="text-warning">★★★★☆</strong>
                  <span className="ms-2">Sarah M.</span>
                </div>
                <small className="text-muted">5 days ago</small>
              </div>
              <p className="mt-2 mb-0">"Good movie, comfortable seats. The platinum seats were worth the extra cost."</p>
            </div>
            
            <div className="text-center">
              <Button variant="link" className="text-gold">
                View All Reviews
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Seats;