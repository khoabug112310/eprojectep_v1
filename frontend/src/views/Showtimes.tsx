import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Showtimes.css';

interface Movie {
  id: number;
  title: string;
  poster_url: string;
  duration: number;
  genre: string[];
  age_rating: string;
  average_rating: number;
}

interface Theater {
  id: number;
  name: string;
  address: string;
  city: string;
  facilities: string[];
}

interface ShowtimeSlot {
  id: number;
  show_time: string;
  prices: {
    gold: number;
    platinum: number;
    box: number;
  };
  available_seats: number;
  total_seats: number;
}

interface ShowtimeData {
  movie: Movie;
  theater: Theater;
  date: string;
  showtimes: ShowtimeSlot[];
}

const Showtimes: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [showtimeData, setShowtimeData] = useState<ShowtimeData[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate next 7 days
  const getNextSevenDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('vi-VN', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'numeric' 
        }),
        isToday: i === 0,
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }
    return days;
  };

  const [availableDates] = useState(getNextSevenDays());

  useEffect(() => {
    // Set default date to today
    setSelectedDate(availableDates[0].date);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setShowtimeData(sampleShowtimeData);
        setLoading(false);
      }, 800);
    }
  }, [selectedDate, selectedCity, selectedGenre]);

  // Sample data - comprehensive like Galaxy Cinema
  const sampleShowtimeData: ShowtimeData[] = [
    {
      movie: {
        id: 1,
        title: 'Avengers: Endgame',
        poster_url: 'https://picsum.photos/300/450?random=1',
        duration: 181,
        genre: ['Hành động', 'Khoa học viễn tưởng'],
        age_rating: 'T13',
        average_rating: 4.7
      },
      theater: {
        id: 1,
        name: 'Galaxy Nguyễn Du',
        address: '116 Nguyễn Du, Quận 1',
        city: 'TP.HCM',
        facilities: ['2D', '3D', 'Dolby 7.1']
      },
      date: selectedDate,
      showtimes: [
        {
          id: 1,
          show_time: '09:00',
          prices: { gold: 85000, platinum: 115000, box: 150000 },
          available_seats: 45,
          total_seats: 300
        },
        {
          id: 2,
          show_time: '12:30',
          prices: { gold: 95000, platinum: 125000, box: 160000 },
          available_seats: 23,
          total_seats: 300
        },
        {
          id: 3,
          show_time: '16:00',
          prices: { gold: 105000, platinum: 135000, box: 170000 },
          available_seats: 78,
          total_seats: 300
        },
        {
          id: 4,
          show_time: '19:30',
          prices: { gold: 115000, platinum: 145000, box: 180000 },
          available_seats: 12,
          total_seats: 300
        },
        {
          id: 5,
          show_time: '22:00',
          prices: { gold: 105000, platinum: 135000, box: 170000 },
          available_seats: 89,
          total_seats: 300
        }
      ]
    },
    {
      movie: {
        id: 2,
        title: 'Mai',
        poster_url: 'https://picsum.photos/300/450?random=2',
        duration: 131,
        genre: ['Tâm lý', 'Tình cảm'],
        age_rating: 'T16',
        average_rating: 4.2
      },
      theater: {
        id: 2,
        name: 'CGV Landmark 81',
        address: 'Vincom Center Landmark 81, Bình Thạnh',
        city: 'TP.HCM',
        facilities: ['IMAX', '4DX', 'Dolby Atmos']
      },
      date: selectedDate,
      showtimes: [
        {
          id: 6,
          show_time: '10:15',
          prices: { gold: 100000, platinum: 130000, box: 180000 },
          available_seats: 67,
          total_seats: 280
        },
        {
          id: 7,
          show_time: '13:45',
          prices: { gold: 110000, platinum: 140000, box: 190000 },
          available_seats: 34,
          total_seats: 280
        },
        {
          id: 8,
          show_time: '17:20',
          prices: { gold: 120000, platinum: 150000, box: 200000 },
          available_seats: 56,
          total_seats: 280
        },
        {
          id: 9,
          show_time: '20:45',
          prices: { gold: 130000, platinum: 160000, box: 210000 },
          available_seats: 8,
          total_seats: 280
        }
      ]
    },
    {
      movie: {
        id: 3,
        title: 'Spider-Man: No Way Home',
        poster_url: 'https://picsum.photos/300/450?random=3',
        duration: 148,
        genre: ['Hành động', 'Khoa học viễn tưởng'],
        age_rating: 'T13',
        average_rating: 4.6
      },
      theater: {
        id: 3,
        name: 'Lotte Cinema Diamond Plaza',
        address: 'Diamond Plaza, Quận 1',
        city: 'TP.HCM',
        facilities: ['4DX', 'IMAX', 'Super Plex G']
      },
      date: selectedDate,
      showtimes: [
        {
          id: 10,
          show_time: '11:00',
          prices: { gold: 105000, platinum: 135000, box: 175000 },
          available_seats: 92,
          total_seats: 320
        },
        {
          id: 11,
          show_time: '14:30',
          prices: { gold: 115000, platinum: 145000, box: 185000 },
          available_seats: 45,
          total_seats: 320
        },
        {
          id: 12,
          show_time: '18:00',
          prices: { gold: 125000, platinum: 155000, box: 195000 },
          available_seats: 23,
          total_seats: 320
        },
        {
          id: 13,
          show_time: '21:30',
          prices: { gold: 115000, platinum: 145000, box: 185000 },
          available_seats: 67,
          total_seats: 320
        }
      ]
    }
  ];

  const cities = ['all', 'TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ'];
  const genres = ['all', 'Hành động', 'Tình cảm', 'Hài', 'Kinh dị', 'Khoa học viễn tưởng', 'Tâm lý'];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getOccupancyPercentage = (available: number, total: number) => {
    return Math.round(((total - available) / total) * 100);
  };

  const getOccupancyStatus = (percentage: number) => {
    if (percentage >= 90) return 'full';
    if (percentage >= 70) return 'high';
    if (percentage >= 40) return 'medium';
    return 'low';
  };

  const filteredShowtimeData = showtimeData.filter(data => {
    const matchesCity = selectedCity === 'all' || data.theater.city === selectedCity;
    const matchesGenre = selectedGenre === 'all' || data.movie.genre.includes(selectedGenre);
    return matchesCity && matchesGenre;
  });

  if (loading) {
    return (
      <div className="showtimes-page">
        <div className="showtimes-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải lịch chiếu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="showtimes-page">
      <div className="showtimes-container">
        {/* Header */}
        <div className="showtimes-header">
          <h1>Lịch Chiếu Phim</h1>
          <p>Chọn ngày và rạp để xem lịch chiếu chi tiết</p>
        </div>

        {/* Controls */}
        <div className="showtimes-controls">
          {/* Date Selection */}
          <div className="date-selection">
            <h3>📅 Chọn ngày</h3>
            <div className="date-tabs">
              {availableDates.map((day) => (
                <button
                  key={day.date}
                  className={`date-tab ${selectedDate === day.date ? 'active' : ''} ${day.isWeekend ? 'weekend' : ''}`}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <span className="date-day">{day.display}</span>
                  {day.isToday && <span className="today-badge">Hôm nay</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="filter-group">
              <label>🏙️ Thành phố:</label>
              <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                {cities.map(city => (
                  <option key={city} value={city}>
                    {city === 'all' ? 'Tất cả' : city}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>🎭 Thể loại:</label>
              <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}>
                {genres.map(genre => (
                  <option key={genre} value={genre}>
                    {genre === 'all' ? 'Tất cả' : genre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Showtimes List */}
        <div className="showtimes-list">
          {filteredShowtimeData.map((data, index) => (
            <div key={index} className="showtime-card">
              <div className="showtime-header">
                <div className="movie-info">
                  <div className="movie-poster">
                    <img src={data.movie.poster_url} alt={data.movie.title} />
                    <div className="rating-badge">
                      ⭐ {data.movie.average_rating}
                    </div>
                  </div>
                  
                  <div className="movie-details">
                    <h3>{data.movie.title}</h3>
                    <div className="movie-meta">
                      <span className="duration">⏱️ {data.movie.duration} phút</span>
                      <span className="age-rating">{data.movie.age_rating}</span>
                      <div className="genres">
                        {data.movie.genre.map((g, idx) => (
                          <span key={idx} className="genre-tag">{g}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="theater-info">
                  <h4>{data.theater.name}</h4>
                  <p className="theater-address">📍 {data.theater.address}</p>
                  <div className="theater-facilities">
                    {data.theater.facilities.map((facility, idx) => (
                      <span key={idx} className="facility-badge">{facility}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="showtimes-grid">
                {data.showtimes.map((showtime) => {
                  const occupancy = getOccupancyPercentage(showtime.available_seats, showtime.total_seats);
                  const status = getOccupancyStatus(occupancy);
                  
                  return (
                    <div key={showtime.id} className={`showtime-slot ${status}`}>
                      <div className="showtime-time">
                        <span className="time">{formatTime(showtime.show_time)}</span>
                        <span className="availability">
                          {showtime.available_seats} ghế trống
                        </span>
                      </div>
                      
                      <div className="showtime-pricing">
                        <div className="price-row">
                          <span className="seat-type gold">Gold</span>
                          <span className="price">{formatPrice(showtime.prices.gold)}</span>
                        </div>
                        <div className="price-row">
                          <span className="seat-type platinum">Platinum</span>
                          <span className="price">{formatPrice(showtime.prices.platinum)}</span>
                        </div>
                        <div className="price-row">
                          <span className="seat-type box">Box</span>
                          <span className="price">{formatPrice(showtime.prices.box)}</span>
                        </div>
                      </div>

                      <div className="occupancy-bar">
                        <div 
                          className={`occupancy-fill ${status}`}
                          style={{ width: `${occupancy}%` }}
                        ></div>
                        <span className="occupancy-text">{occupancy}% đã đặt</span>
                      </div>

                      <Link 
                        to={`/booking/seats/${showtime.id}`}
                        className={`book-btn ${showtime.available_seats === 0 ? 'disabled' : ''}`}
                      >
                        {showtime.available_seats === 0 ? 'Hết vé' : 'Đặt vé'}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {filteredShowtimeData.length === 0 && (
          <div className="no-showtimes">
            <div className="no-showtimes-icon">🎬</div>
            <h3>Không có suất chiếu</h3>
            <p>Không tìm thấy suất chiếu nào cho ngày và điều kiện đã chọn.</p>
            <p>Vui lòng thử chọn ngày khác hoặc điều chỉnh bộ lọc.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Showtimes;