// E-Ticket Display and Management Component for CineBook
// Comprehensive e-ticket display with QR code, download, and management features

import React, { useState, useRef, useEffect } from 'react';
import { ETicketData, useQRCode } from '../../services/QRCodeService';
import { useEmailNotification, BookingEmailData } from '../../services/EmailNotificationService';

interface ETicketDisplayProps {
  ticket: ETicketData;
  bookingData: BookingEmailData;
  onClose?: () => void;
  onDownload?: (ticket: ETicketData) => void;
  onShare?: (ticket: ETicketData) => void;
  className?: string;
}

interface TicketAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  disabled?: boolean;
}

export function ETicketDisplay({
  ticket,
  bookingData,
  onClose,
  onDownload,
  onShare,
  className = ''
}: ETicketDisplayProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [showDetails, setShowDetails] = useState(true);
  const [actionHistory, setActionHistory] = useState<Array<{action: string; timestamp: number}>>([]);
  
  const ticketRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { generateQRCode, validateQRData } = useQRCode();
  const { sendBookingConfirmation } = useEmailNotification();

  // Generate QR code for the ticket
  useEffect(() => {
    if (canvasRef.current) {
      generateQRCode(ticket.qrData, canvasRef.current, 200);
    }
  }, [ticket.qrData, generateQRCode]);

  // Brightness adjustment for better scanning
  const adjustBrightness = (value: number) => {
    setBrightness(value);
    if (ticketRef.current) {
      ticketRef.current.style.filter = `brightness(${value}%)`;
    }
  };

  // Enter fullscreen mode for scanning
  const enterFullscreen = () => {
    if (ticketRef.current && ticketRef.current.requestFullscreen) {
      ticketRef.current.requestFullscreen();
      setIsFullscreen(true);
      adjustBrightness(120); // Increase brightness for scanning
      logAction('Enter Fullscreen');
    }
  };

  // Exit fullscreen mode
  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
      adjustBrightness(100);
      logAction('Exit Fullscreen');
    }
  };

  // Download ticket as image
  const downloadTicket = async () => {
    if (!ticketRef.current) return;

    try {
      // Create canvas for ticket capture
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Set canvas size
      canvas.width = 800;
      canvas.height = 1000;

      // Draw ticket background
      ctx.fillStyle = '#1f1f1f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw header
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 32px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('🎬 CINEBOOK E-TICKET', canvas.width / 2, 60);

      // Draw movie title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Inter';
      ctx.fillText(bookingData.movieTitle, canvas.width / 2, 120);

      // Draw booking details
      ctx.font = '20px Inter';
      ctx.textAlign = 'left';
      const details = [
        `Booking Code: ${bookingData.bookingCode}`,
        `Theater: ${bookingData.theater}`,
        `Date & Time: ${bookingData.showDate} ${bookingData.showTime}`,
        `Seats: ${bookingData.seats.join(', ')}`,
        `Customer: ${bookingData.customerName}`,
        `Total: ${formatAmount(bookingData.totalAmount, bookingData.currency)}`
      ];

      details.forEach((detail, index) => {
        ctx.fillText(detail, 50, 180 + (index * 40));
      });

      // Add QR code
      if (canvasRef.current) {
        const qrImage = canvasRef.current.toDataURL();
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, (canvas.width - 200) / 2, 450, 200, 200);
          
          // Add instructions
          ctx.font = '16px Inter';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#cccccc';
          ctx.fillText('Show this QR code at the theater entrance', canvas.width / 2, 700);
          
          // Download
          const link = document.createElement('a');
          link.download = `cinebook-ticket-${bookingData.bookingCode}.png`;
          link.href = canvas.toDataURL();
          link.click();
        };
        img.src = qrImage;
      }

      logAction('Download Ticket');
      onDownload && onDownload(ticket);
    } catch (error) {
      console.error('Failed to download ticket:', error);
    }
  };

  // Share ticket
  const shareTicket = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `CineBook Ticket - ${bookingData.movieTitle}`,
          text: `I've booked tickets for ${bookingData.movieTitle} at ${bookingData.theater}!`,
          url: window.location.href
        });
        logAction('Share Ticket');
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      const ticketInfo = `🎬 CineBook Ticket\n${bookingData.movieTitle}\n${bookingData.theater}\n${bookingData.showDate} ${bookingData.showTime}`;
      await navigator.clipboard.writeText(ticketInfo);
      alert('Ticket information copied to clipboard!');
      logAction('Copy to Clipboard');
    }
    onShare && onShare(ticket);
  };

  // Print ticket
  const printTicket = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CineBook E-Ticket - ${bookingData.bookingCode}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .ticket { max-width: 400px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
            .header { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .qr-code { text-align: center; margin: 20px 0; }
            .details div { margin: 10px 0; }
            .instructions { font-size: 12px; text-align: center; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">🎬 CINEBOOK E-TICKET</div>
            <div class="details">
              <div><strong>Movie:</strong> ${bookingData.movieTitle}</div>
              <div><strong>Booking Code:</strong> ${bookingData.bookingCode}</div>
              <div><strong>Theater:</strong> ${bookingData.theater}</div>
              <div><strong>Date & Time:</strong> ${bookingData.showDate} ${bookingData.showTime}</div>
              <div><strong>Seats:</strong> ${bookingData.seats.join(', ')}</div>
              <div><strong>Customer:</strong> ${bookingData.customerName}</div>
              <div><strong>Total:</strong> ${formatAmount(bookingData.totalAmount, bookingData.currency)}</div>
            </div>
            <div class="qr-code">
              <img src="${canvasRef.current?.toDataURL()}" alt="QR Code" style="width: 150px; height: 150px;" />
            </div>
            <div class="instructions">
              Present this ticket and a valid ID at the theater entrance
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    logAction('Print Ticket');
  };

  // Resend confirmation email
  const resendEmail = async () => {
    try {
      await sendBookingConfirmation(bookingData);
      alert('Confirmation email sent successfully!');
      logAction('Resend Email');
    } catch (error) {
      console.error('Failed to resend email:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  // Log user actions
  const logAction = (action: string) => {
    setActionHistory(prev => [...prev, { action, timestamp: Date.now() }]);
  };

  // Format amount for display
  const formatAmount = (amount: number, currency: string = 'VND'): string => {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Get ticket status styling
  const getStatusStyling = () => {
    switch (ticket.status) {
      case 'confirmed':
        return { color: '#46d369', icon: '✅' };
      case 'used':
        return { color: '#8c8c8c', icon: '✓' };
      case 'cancelled':
        return { color: '#ff3b30', icon: '❌' };
      default:
        return { color: '#cccccc', icon: '?' };
    }
  };

  const statusStyle = getStatusStyling();

  // Available actions
  const actions: TicketAction[] = [
    {
      id: 'fullscreen',
      label: isFullscreen ? 'Exit Fullscreen' : 'Fullscreen',
      icon: isFullscreen ? '⛶' : '⛶',
      action: isFullscreen ? exitFullscreen : enterFullscreen
    },
    {
      id: 'download',
      label: 'Download',
      icon: '💾',
      action: downloadTicket
    },
    {
      id: 'print',
      label: 'Print',
      icon: '🖨️',
      action: printTicket
    },
    {
      id: 'share',
      label: 'Share',
      icon: '📤',
      action: shareTicket
    },
    {
      id: 'email',
      label: 'Resend Email',
      icon: '📧',
      action: resendEmail
    }
  ];

  return (
    <div className={`e-ticket-display ${className}`}>
      {/* Ticket Container */}
      <div 
        ref={ticketRef}
        className={`e-ticket ${isFullscreen ? 'fullscreen' : ''}`}
        style={{ filter: `brightness(${brightness}%)` }}
      >
        {/* Ticket Header */}
        <div className="e-ticket__header">
          <div className="brand-logo">
            <span className="logo-icon">🎬</span>
            <span className="logo-text">CINEBOOK</span>
          </div>
          <div className="ticket-status" style={{ color: statusStyle.color }}>
            <span className="status-icon">{statusStyle.icon}</span>
            <span className="status-text">{ticket.status.toUpperCase()}</span>
          </div>
          {onClose && !isFullscreen && (
            <button className="close-btn" onClick={onClose}>✕</button>
          )}
        </div>

        {/* Movie Information */}
        <div className="e-ticket__movie">
          <h1 className="movie-title">{bookingData.movieTitle}</h1>
          <div className="movie-meta">
            <span className="theater-name">{bookingData.theater}</span>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="e-ticket__qr">
          <div className="qr-container">
            <canvas 
              ref={canvasRef}
              className="qr-code"
              width={200}
              height={200}
            />
            <div className="qr-instructions">
              <p>📱 Show this QR code at theater entrance</p>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        {showDetails && (
          <div className="e-ticket__details">
            <div className="details-grid">
              <div className="detail-item">
                <span className="label">Booking Code</span>
                <span className="value booking-code">{bookingData.bookingCode}</span>
              </div>
              <div className="detail-item">
                <span className="label">Date & Time</span>
                <span className="value">{bookingData.showDate} {bookingData.showTime}</span>
              </div>
              <div className="detail-item">
                <span className="label">Seats</span>
                <span className="value seats">{bookingData.seats.join(', ')}</span>
              </div>
              <div className="detail-item">
                <span className="label">Customer</span>
                <span className="value">{bookingData.customerName}</span>
              </div>
              <div className="detail-item">
                <span className="label">Total Amount</span>
                <span className="value amount">
                  {formatAmount(bookingData.totalAmount, bookingData.currency)}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Payment Method</span>
                <span className="value">{bookingData.paymentMethod}</span>
              </div>
            </div>
          </div>
        )}

        {/* Important Notes */}
        <div className="e-ticket__notes">
          <h4>📋 Important Information</h4>
          <ul>
            <li>Please arrive 15 minutes before showtime</li>
            <li>Bring a valid photo ID for verification</li>
            <li>This ticket is non-transferable and non-refundable</li>
            <li>Keep this ticket until the end of the show</li>
          </ul>
        </div>

        {/* Ticket Footer */}
        <div className="e-ticket__footer">
          <div className="footer-info">
            <p>CineBook - Your Ultimate Movie Experience</p>
            <p>Visit: www.cinebook.com | Call: 1900-CINEMA</p>
          </div>
          <div className="ticket-id">
            <small>Ticket ID: {ticket.id}</small>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      {!isFullscreen && (
        <div className="e-ticket__controls">
          {/* Brightness Control */}
          <div className="brightness-control">
            <label htmlFor="brightness">🔆 Brightness</label>
            <input
              id="brightness"
              type="range"
              min="50"
              max="150"
              value={brightness}
              onChange={(e) => adjustBrightness(Number(e.target.value))}
              className="brightness-slider"
            />
            <span>{brightness}%</span>
          </div>

          {/* Toggle Details */}
          <div className="detail-toggle">
            <button
              className={`toggle-btn ${showDetails ? 'active' : ''}`}
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? '🔼' : '🔽'} Details
            </button>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            {actions.map(action => (
              <button
                key={action.id}
                className={`action-btn ${action.disabled ? 'disabled' : ''}`}
                onClick={action.action}
                disabled={action.disabled}
                title={action.label}
              >
                <span className="action-icon">{action.icon}</span>
                <span className="action-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Exit Button */}
      {isFullscreen && (
        <button 
          className="fullscreen-exit"
          onClick={exitFullscreen}
        >
          ✕ Exit Fullscreen
        </button>
      )}

      {/* Action History (Development Mode) */}
      {process.env.NODE_ENV === 'development' && actionHistory.length > 0 && (
        <div className="action-history">
          <h4>Action History</h4>
          <ul>
            {actionHistory.slice(-5).map((item, index) => (
              <li key={index}>
                {item.action} - {new Date(item.timestamp).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ETicketDisplay;