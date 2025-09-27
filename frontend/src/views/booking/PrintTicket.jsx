import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PrintTicket = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);

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

  // Function to generate QR code URL using QR server API
  const generateQRCodeURL = (bookingCode) => {
    if (!bookingCode) return '';
    const size = '150x150'; // Reduced from 200x200 to 150x150 (75% size)
    const data = encodeURIComponent(bookingCode);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${data}`;
  };

  useEffect(() => {
    // Get booking data from location state or localStorage
    const bookingData = location.state?.booking || JSON.parse(localStorage.getItem('printBooking'));
    
    if (bookingData) {
      setBooking(bookingData);
    } else {
      navigate('/my-bookings');
    }
  }, [location, navigate]);

  useEffect(() => {
    // Automatically print when component loads
    if (booking) {
      const printTimer = setTimeout(() => {
        window.print();
      }, 1000);
      
      return () => clearTimeout(printTimer);
    }
  }, [booking]);

  if (!booking) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading ticket...</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '533px', // Reduced from 800px to about 2/3 (533px)
      margin: '0 auto',
      padding: '13px', // Reduced from 20px to about 2/3 (13px)
      backgroundColor: '#fff',
      color: '#000',
      transform: 'scale(0.85)', // Additional scaling for better fit
      transformOrigin: 'top center'
    }}>
      <div style={{ 
        textAlign: 'center', 
        borderBottom: '2px solid #ffc107',
        paddingBottom: '13px', // Reduced from 20px
        marginBottom: '13px'  // Reduced from 20px
      }}>
        <h1 style={{ color: '#E50914', margin: '0', fontSize: '24px' }}>🎬 CineBook</h1> {/* Reduced font size */}
        <h2 style={{ color: '#333', margin: '7px 0', fontSize: '20px' }}>E-Ticket</h2> {/* Reduced font size and margin */}
        <p style={{ fontSize: '12px', fontWeight: 'bold' }}>Booking Code: {booking.booking_code}</p> {/* Reduced font size */}
      </div>

      <div style={{ 
        border: '1px solid #ddd',
        borderRadius: '5px', // Reduced from 8px
        padding: '13px', // Reduced from 20px
        marginBottom: '13px' // Reduced from 20px
      }}>
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          marginBottom: '13px' // Reduced from 20px
        }}>
          <div style={{ flex: '1', minWidth: '200px', paddingRight: '13px' }}> {/* Reduced minWidth and padding */}
            <h3 style={{ color: '#E50914', borderBottom: '1px solid #eee', paddingBottom: '7px', fontSize: '16px' }}>Movie Details</h3> {/* Reduced font size and padding */}
            <p style={{ fontSize: '11px', margin: '5px 0' }}><strong>Title:</strong> {booking.showtime?.movie?.title}</p> {/* Reduced font size and margin */}
            <p style={{ fontSize: '11px', margin: '5px 0' }}><strong>Theater:</strong> {booking.showtime?.theater?.name}</p>
            <p style={{ fontSize: '11px', margin: '5px 0' }}><strong>Date:</strong> {booking.showtime?.show_date && new Date(booking.showtime.show_date).toLocaleDateString('en-GB')}</p>
            <p style={{ fontSize: '11px', margin: '5px 0' }}><strong>Time:</strong> {booking.showtime && calculateShowtime(booking.showtime)}</p>
          </div>
          
          <div style={{ flex: '1', minWidth: '200px' }}> {/* Reduced minWidth */}
            <h3 style={{ color: '#E50914', borderBottom: '1px solid #eee', paddingBottom: '7px', fontSize: '16px' }}>Booking Information</h3> {/* Reduced font size and padding */}
            <p style={{ fontSize: '11px', margin: '5px 0' }}><strong>Seats:</strong> {booking.seats?.map(seat => seat.seat).join(', ')}</p> {/* Reduced font size and margin */}
            <p style={{ fontSize: '11px', margin: '5px 0' }}><strong>Total Amount:</strong> {booking.total_amount?.toLocaleString()} VND</p>
            <p style={{ fontSize: '11px', margin: '5px 0' }}><strong>Status:</strong> <span style={{ color: '#28a745', fontWeight: 'bold' }}>BOOKED</span></p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '7px' }}> {/* Reduced margin */}
          <h3 style={{ color: '#333', marginBottom: '10px', fontSize: '14px' }}>QR Code for Entry</h3> {/* Reduced font size and margin */}
          <div style={{ 
            display: 'inline-block',
            border: '2px solid #ffc107',
            padding: '10px', // Reduced from 15px
            backgroundColor: '#fff',
            borderRadius: '5px' // Reduced from 8px
          }}>
            <img 
              src={generateQRCodeURL(booking.booking_code)} 
              alt="QR Code" 
              style={{ maxWidth: '150px', height: 'auto' }} // Reduced from 200px to 150px (75% size)
            />
            <p style={{ margin: '7px 0 0 0', fontWeight: 'bold', fontSize: '10px' }}>Scan at theater entrance</p> {/* Reduced font size and margin */}
          </div>
          <p style={{ marginTop: '7px', fontSize: '9px', color: '#666' }}> {/* Reduced font size and margin */}
            Booking Code: {booking.booking_code}
          </p>
        </div>
      </div>

      <div style={{ 
        textAlign: 'center',
        padding: '10px', // Reduced from 15px
        backgroundColor: '#f8f9fa',
        borderRadius: '5px', // Reduced from 8px
        border: '1px solid #dee2e6'
      }}>
        <p style={{ margin: '0', fontWeight: 'bold', fontSize: '10px' }}> {/* Reduced font size */}
          Important: Please arrive at least 30 minutes before the showtime.
        </p>
        <p style={{ margin: '3px 0 0 0', fontSize: '9px' }}> {/* Reduced font size and margin */}
          Bring this e-ticket or have the booking code ready for entry.
        </p>
      </div>

      <div style={{ 
        textAlign: 'center', 
        marginTop: '20px', // Reduced from 30px
        fontSize: '8px', // Reduced from 12px
        color: '#666'
      }}>
        <p style={{ margin: '0' }}>Thank you for choosing CineBook!</p>
        <p style={{ margin: '3px 0 0 0' }}>support@cinebook.com | 1900-123-456</p> {/* Reduced margin */}
      </div>

      {/* Print specific styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 13px; /* Reduced padding */
            background: white !important;
            color: black !important;
          }
          
          button {
            display: none !important;
          }
          
          div[style*="transform"] {
            transform: none !important; /* Remove scaling for actual printing */
          }
        }
        
        @media screen {
          body {
            background: #f5f5f5 !important;
            padding: 13px; /* Reduced padding */
          }
        }
      `}</style>
    </div>
  );
};

export default PrintTicket;