// E-Ticket Management Component for CineBook
// Comprehensive ticket management with filtering, searching, and bulk operations

import React, { useState, useEffect, useMemo } from 'react';
import { ETicketData } from '../../services/QRCodeService';
import { BookingEmailData } from '../../services/EmailNotificationService';
import ETicketDisplay from './ETicketDisplay';

interface ETicketManagementProps {
  userId?: string;
  className?: string;
}

interface TicketWithBooking {
  ticket: ETicketData;
  booking: BookingEmailData;
  createdAt: number;
  lastAccessed: number;
}

interface FilterOptions {
  status: 'all' | 'confirmed' | 'used' | 'cancelled';
  dateRange: 'all' | 'upcoming' | 'past' | 'this_week' | 'this_month';
  theater: string;
  sortBy: 'date' | 'movie' | 'theater' | 'status';
  sortOrder: 'asc' | 'desc';
}

export function ETicketManagement({ userId, className = '' }: ETicketManagementProps) {
  const [tickets, setTickets] = useState<TicketWithBooking[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketWithBooking[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithBooking | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    dateRange: 'all',
    theater: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Sample ticket data for demonstration
  useEffect(() => {
    const loadTickets = async () => {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sample tickets
      const sampleTickets: TicketWithBooking[] = [
        {
          ticket: {
            id: 'ticket_001',
            bookingCode: 'CB123456789',
            movieTitle: 'Avengers: Endgame',
            qrCode: 'base64_qr_data_here',
            qrData: 'encoded_ticket_data',
            status: 'confirmed'
          },
          booking: {
            bookingId: 'booking_001',
            bookingCode: 'CB123456789',
            customerName: 'John Doe',
            customerEmail: 'john@example.com',
            movieTitle: 'Avengers: Endgame',
            theater: 'Galaxy Cinema District 1',
            showDate: '2024-01-15',
            showTime: '19:30',
            seats: ['A1', 'A2'],
            totalAmount: 240000,
            currency: 'VND',
            paymentMethod: 'Credit Card'
          },
          createdAt: Date.now() - 86400000, // 1 day ago
          lastAccessed: Date.now() - 3600000 // 1 hour ago
        },
        {
          ticket: {
            id: 'ticket_002',
            bookingCode: 'CB987654321',
            movieTitle: 'Spider-Man: No Way Home',
            qrCode: 'base64_qr_data_here_2',
            qrData: 'encoded_ticket_data_2',
            status: 'used'
          },
          booking: {
            bookingId: 'booking_002',
            bookingCode: 'CB987654321',
            customerName: 'John Doe',
            customerEmail: 'john@example.com',
            movieTitle: 'Spider-Man: No Way Home',
            theater: 'CGV Vincom Center',
            showDate: '2023-12-20',
            showTime: '21:00',
            seats: ['B3', 'B4'],
            totalAmount: 280000,
            currency: 'VND',
            paymentMethod: 'VNPay'
          },
          createdAt: Date.now() - 1209600000, // 2 weeks ago
          lastAccessed: Date.now() - 1209600000
        },
        {
          ticket: {
            id: 'ticket_003',
            bookingCode: 'CB456789123',
            movieTitle: 'The Batman',
            qrCode: 'base64_qr_data_here_3',
            qrData: 'encoded_ticket_data_3',
            status: 'confirmed'
          },
          booking: {
            bookingId: 'booking_003',
            bookingCode: 'CB456789123',
            customerName: 'John Doe',
            customerEmail: 'john@example.com',
            movieTitle: 'The Batman',
            theater: 'Lotte Cinema',
            showDate: '2024-01-20',
            showTime: '16:00',
            seats: ['C5'],
            totalAmount: 150000,
            currency: 'VND',
            paymentMethod: 'MoMo'
          },
          createdAt: Date.now() + 432000000, // 5 days from now
          lastAccessed: Date.now()
        }
      ];

      setTickets(sampleTickets);
      setLoading(false);
    };

    loadTickets();
  }, [userId]);

  // Filter and search tickets
  const applyFiltersAndSearch = useMemo(() => {
    let result = [...tickets];

    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(item => item.ticket.status === filters.status);
    }

    // Apply date range filter
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    switch (filters.dateRange) {
      case 'upcoming':
        result = result.filter(item => new Date(item.booking.showDate).getTime() > now);
        break;
      case 'past':
        result = result.filter(item => new Date(item.booking.showDate).getTime() < now);
        break;
      case 'this_week':
        result = result.filter(item => {
          const showTime = new Date(item.booking.showDate).getTime();
          return showTime >= now && showTime <= now + oneWeek;
        });
        break;
      case 'this_month':
        result = result.filter(item => {
          const showTime = new Date(item.booking.showDate).getTime();
          return showTime >= now && showTime <= now + oneMonth;
        });
        break;
    }

    // Apply theater filter
    if (filters.theater) {
      result = result.filter(item =>
        item.booking.theater.toLowerCase().includes(filters.theater.toLowerCase())
      );
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.booking.movieTitle.toLowerCase().includes(query) ||
        item.booking.bookingCode.toLowerCase().includes(query) ||
        item.booking.theater.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'date':
          aValue = new Date(a.booking.showDate).getTime();
          bValue = new Date(b.booking.showDate).getTime();
          break;
        case 'movie':
          aValue = a.booking.movieTitle;
          bValue = b.booking.movieTitle;
          break;
        case 'theater':
          aValue = a.booking.theater;
          bValue = b.booking.theater;
          break;
        case 'status':
          aValue = a.ticket.status;
          bValue = b.ticket.status;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [tickets, filters, searchQuery]);

  useEffect(() => {
    setFilteredTickets(applyFiltersAndSearch);
  }, [applyFiltersAndSearch]);

  // Get unique theaters for filter dropdown
  const uniqueTheaters = useMemo(() => {
    return Array.from(new Set(tickets.map(item => item.booking.theater)));
  }, [tickets]);

  // Handle ticket selection
  const toggleTicketSelection = (ticketId: string) => {
    const newSelection = new Set(selectedTickets);
    if (newSelection.has(ticketId)) {
      newSelection.delete(ticketId);
    } else {
      newSelection.add(ticketId);
    }
    setSelectedTickets(newSelection);
  };

  // Select all filtered tickets
  const selectAllTickets = () => {
    const allIds = new Set(filteredTickets.map(item => item.ticket.id));
    setSelectedTickets(allIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedTickets(new Set());
  };

  // Bulk operations
  const downloadSelectedTickets = async () => {
    for (const ticketId of selectedTickets) {
      const ticketItem = tickets.find(item => item.ticket.id === ticketId);
      if (ticketItem) {
        // Trigger download for each ticket
        console.log('Downloading ticket:', ticketItem.booking.bookingCode);
      }
    }
    alert(`Downloaded ${selectedTickets.size} tickets`);
  };

  const exportSelectedTickets = () => {
    const selectedItems = tickets.filter(item => selectedTickets.has(item.ticket.id));
    const csvData = selectedItems.map(item => ({
      'Booking Code': item.booking.bookingCode,
      'Movie': item.booking.movieTitle,
      'Theater': item.booking.theater,
      'Date': item.booking.showDate,
      'Time': item.booking.showTime,
      'Seats': item.booking.seats.join(', '),
      'Amount': item.booking.totalAmount,
      'Status': item.ticket.status
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cinebook-tickets.csv';
    link.click();
    URL.revokeObjectURL(url);
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

  // Get status styling
  const getStatusStyling = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { color: '#46d369', icon: '✅', label: 'Confirmed' };
      case 'used':
        return { color: '#8c8c8c', icon: '✓', label: 'Used' };
      case 'cancelled':
        return { color: '#ff3b30', icon: '❌', label: 'Cancelled' };
      default:
        return { color: '#cccccc', icon: '?', label: 'Unknown' };
    }
  };

  if (loading) {
    return (
      <div className="e-ticket-management loading">
        <div className="loading-spinner"></div>
        <p>Loading your tickets...</p>
      </div>
    );
  }

  return (
    <div className={`e-ticket-management ${className}`}>
      {/* Header */}
      <div className="management-header">
        <div className="header-title">
          <h1>🎫 My Tickets</h1>
          <p>{filteredTickets.length} of {tickets.length} tickets</p>
        </div>
        
        <div className="header-actions">
          <button
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            🔍 Filters
          </button>
          
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ⊞ Grid
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰ List
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            {/* Search */}
            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search by movie, booking code, or theater..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Status Filter */}
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="used">Used</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="filter-group">
              <label>Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
              >
                <option value="all">All Dates</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
              </select>
            </div>

            {/* Theater Filter */}
            <div className="filter-group">
              <label>Theater</label>
              <select
                value={filters.theater}
                onChange={(e) => setFilters(prev => ({ ...prev, theater: e.target.value }))}
              >
                <option value="">All Theaters</option>
                {uniqueTheaters.map(theater => (
                  <option key={theater} value={theater}>{theater}</option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              >
                <option value="date">Date</option>
                <option value="movie">Movie</option>
                <option value="theater">Theater</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedTickets.size > 0 && (
        <div className="bulk-actions">
          <div className="selection-info">
            <span>{selectedTickets.size} tickets selected</span>
            <button onClick={clearSelection} className="clear-selection">Clear</button>
          </div>
          
          <div className="bulk-buttons">
            <button onClick={downloadSelectedTickets} className="bulk-btn download">
              💾 Download All
            </button>
            <button onClick={exportSelectedTickets} className="bulk-btn export">
              📊 Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Tickets List/Grid */}
      {filteredTickets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎫</div>
          <h3>No tickets found</h3>
          <p>Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className={`tickets-container ${viewMode}`}>
          {/* Select All Option */}
          <div className="select-all-option">
            <button onClick={selectAllTickets} className="select-all-btn">
              ☑️ Select All ({filteredTickets.length})
            </button>
          </div>

          {/* Tickets */}
          {filteredTickets.map((item) => {
            const statusStyle = getStatusStyling(item.ticket.status);
            const isSelected = selectedTickets.has(item.ticket.id);
            const isPast = new Date(item.booking.showDate).getTime() < Date.now();

            return (
              <div
                key={item.ticket.id}
                className={`ticket-card ${isSelected ? 'selected' : ''} ${isPast ? 'past' : ''}`}
              >
                {/* Selection Checkbox */}
                <div className="ticket-selection">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTicketSelection(item.ticket.id)}
                    className="selection-checkbox"
                  />
                </div>

                {/* Ticket Content */}
                <div 
                  className="ticket-content"
                  onClick={() => setSelectedTicket(item)}
                >
                  <div className="ticket-header">
                    <h3 className="movie-title">{item.booking.movieTitle}</h3>
                    <div className="ticket-status" style={{ color: statusStyle.color }}>
                      <span>{statusStyle.icon}</span>
                      <span>{statusStyle.label}</span>
                    </div>
                  </div>

                  <div className="ticket-details">
                    <div className="detail-row">
                      <span className="label">Booking:</span>
                      <span className="value">{item.booking.bookingCode}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Theater:</span>
                      <span className="value">{item.booking.theater}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Date & Time:</span>
                      <span className="value">
                        {item.booking.showDate} {item.booking.showTime}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Seats:</span>
                      <span className="value seats">{item.booking.seats.join(', ')}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Amount:</span>
                      <span className="value amount">
                        {formatAmount(item.booking.totalAmount, item.booking.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="ticket-actions">
                    <button 
                      className="action-btn primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTicket(item);
                      }}
                    >
                      👁️ View Ticket
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="ticket-modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="ticket-modal" onClick={(e) => e.stopPropagation()}>
            <ETicketDisplay
              ticket={selectedTicket.ticket}
              bookingData={selectedTicket.booking}
              onClose={() => setSelectedTicket(null)}
              onDownload={(ticket) => console.log('Downloaded:', ticket.id)}
              onShare={(ticket) => console.log('Shared:', ticket.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ETicketManagement;