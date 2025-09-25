// Helper functions for the application

/**
 * Normalize facilities data which may come in different formats
 * @param {any} facilities - Facilities data in various formats
 * @returns {Array} - Normalized array of facilities
 */
export const normalizeFacilities = (facilities) => {
  if (!facilities) return [];
  
  // If it's already an array, return as is
  if (Array.isArray(facilities)) {
    return facilities;
  }
  
  // If it's a JSON string, parse it
  if (typeof facilities === 'string') {
    try {
      const parsed = JSON.parse(facilities);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      // If it's an object, return its values
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.values(parsed);
      }
    } catch (e) {
      // If parsing fails, treat as comma-separated string
      return facilities.split(',').map(item => item.trim()).filter(item => item);
    }
  }
  
  // If it's an object, return its values
  if (typeof facilities === 'object' && facilities !== null) {
    return Object.values(facilities);
  }
  
  // Fallback: treat as comma-separated string
  if (typeof facilities === 'string') {
    return facilities.split(',').map(item => item.trim()).filter(item => item);
  }
  
  // If all else fails, return empty array
  return [];
};

/**
 * Format currency in VND
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount / 25000); // Convert VND to USD (approximate rate)
};

/**
 * Format date to DD/MM/YYYY
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Calculate showtime with end time based on movie duration
 * @param {Object} showtime - Showtime object
 * @returns {string} - Formatted showtime string
 */
export const calculateShowtime = (showtime) => {
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