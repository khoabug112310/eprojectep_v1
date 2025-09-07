import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Theaters.css';

interface Theater {
  id: number;
  name: string;
  address: string;
  city: string;
  total_seats: number;
  seat_configuration: {
    gold: { rows: number; cols: number; price: number };
    platinum: { rows: number; cols: number; price: number };
    box: { rows: number; cols: number; price: number };
  };
  facilities: string[];
  status: 'active' | 'inactive' | 'maintenance';
}

const Theaters: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    fetchTheaters();
  }, []);

  const fetchTheaters = async () => {
    setLoading(true);
    setError(null);
    
    // Sample theater data as fallback
    const sampleTheaters: Theater[] = [
      {
        id: 1,
        name: 'Galaxy Nguyễn Du',
        address: '116 Nguyễn Du, Bến Thành, Quận 1',
        city: 'TP.HCM',
        total_seats: 300,
        seat_configuration: {
          gold: { rows: 12, cols: 15, price: 85000 },
          platinum: { rows: 5, cols: 12, price: 115000 },
          box: { rows: 2, cols: 6, price: 150000 }
        },
        facilities: ['2D', '3D', 'Dolby 7.1', 'Galaxy Sofa'],
        status: 'active'
      },
      {
        id: 2,
        name: 'Galaxy Kinh Dương Vương',
        address: '718bis Kinh Dương Vương, An Lạc, Bình Tân',
        city: 'TP.HCM',
        total_seats: 260,
        seat_configuration: {
          gold: { rows: 9, cols: 12, price: 80000 },
          platinum: { rows: 4, cols: 10, price: 110000 },
          box: { rows: 2, cols: 4, price: 140000 }
        },
        facilities: ['2D', '3D', 'Dolby Atmos'],
        status: 'active'
      },
      {
        id: 3,
        name: 'CGV Vincom Center Landmark 81',
        address: 'Tầng 5, Vincom Center Landmark 81, 720A Điện Biên Phủ',
        city: 'TP.HCM',
        total_seats: 280,
        seat_configuration: {
          gold: { rows: 10, cols: 14, price: 100000 },
          platinum: { rows: 4, cols: 12, price: 130000 },
          box: { rows: 2, cols: 6, price: 180000 }
        },
        facilities: ['IMAX', '4DX', 'ScreenX', 'Dolby Atmos', 'Recliner Seats'],
        status: 'active'
      }
    ];
    
    try {
      const response = await api.get('/theaters');
      
      if (response.data?.success) {
        // Handle different possible response structures
        let theatersData: any[] = []
        
        // Check if response.data.data is paginated (Laravel paginated response)
        if (response.data.data && typeof response.data.data === 'object' && response.data.data.data) {
          // Paginated response: response.data.data.data contains the actual array
          theatersData = Array.isArray(response.data.data.data) ? response.data.data.data : []
          console.log('Theaters: Handling paginated API response', { totalItems: theatersData.length })
        } else if (Array.isArray(response.data.data)) {
          // Direct array response
          theatersData = response.data.data
          console.log('Theaters: Handling direct array API response', { totalItems: theatersData.length })
        } else {
          console.warn('Theaters: API returned non-array theaters data:', typeof response.data.data, response.data.data)
          theatersData = []
        }
        
        // Process theaters data to ensure compatibility
        const processedTheatersData = theatersData.map((theater: any) => {
          // Handle facilities field - it might be a JSON string from database  
          let facilitiesArray: string[] = []
          if (theater.facilities) {
            if (Array.isArray(theater.facilities)) {
              facilitiesArray = theater.facilities
            } else if (typeof theater.facilities === 'string') {
              try {
                // Try to parse JSON string from database
                const parsed = JSON.parse(theater.facilities)
                facilitiesArray = Array.isArray(parsed) ? parsed : []
              } catch {
                // If not JSON, split by comma
                facilitiesArray = theater.facilities.split(',').map((f: string) => f.trim())
              }
            }
          }
          
          // Handle seat_configuration field - it might be a JSON string from database
          let seatConfig = {
            gold: { rows: 10, cols: 12, price: 85000 },
            platinum: { rows: 4, cols: 10, price: 115000 },
            box: { rows: 2, cols: 4, price: 150000 }
          }
          
          if (theater.seat_configuration) {
            if (typeof theater.seat_configuration === 'object') {
              seatConfig = theater.seat_configuration
            } else if (typeof theater.seat_configuration === 'string') {
              try {
                const parsed = JSON.parse(theater.seat_configuration)
                seatConfig = parsed
              } catch {
                console.warn('Failed to parse seat_configuration for theater:', theater.id)
              }
            }
          }
          
          return {
            ...theater,
            facilities: facilitiesArray,
            seat_configuration: seatConfig,
            status: theater.status || 'active'
          }
        })
        
        setTheaters(processedTheatersData)
      } else {
        console.warn('Theaters: Invalid API response format, using sample data')
        setTheaters(sampleTheaters)
      }
    } catch (err: any) {
      console.error('Error fetching theaters:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách rạp chiếu từ server');
      
      // Use sample data as fallback
      setTheaters(sampleTheaters);
    } finally {
      setLoading(false);
    }
  };

  const cities = ['all', ...Array.from(new Set(theaters.map(theater => theater.city)))];

  const filteredTheaters = theaters.filter(theater => {
    const matchesCity = selectedCity === 'all' || theater.city === selectedCity;
    const matchesSearch = theater.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         theater.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCity && matchesSearch;
  });

  // Group theaters by city for better organization
  const theatersByCity = filteredTheaters.reduce((acc, theater) => {
    if (!acc[theater.city]) {
      acc[theater.city] = [];
    }
    acc[theater.city].push(theater);
    return acc;
  }, {} as Record<string, Theater[]>);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="theaters-page">
        <div className="theaters-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách rạp chiếu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="theaters-page">
        <div className="theaters-container">
          <div className="theaters-header">
            <h1>Hệ Thống Rạp Chiếu</h1>
            <p>Khám phá mạng lưới rạp chiếu hiện đại với công nghệ tiên tiến nhất</p>
          </div>
          <div className="theaters-error">
            <div className="error-content">
              <div className="error-icon">⚠️</div>
              <h2>Đã xảy ra lỗi</h2>
              <p>{error}</p>
              <button onClick={fetchTheaters} className="btn btn-primary">
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="theaters-page">
      <div className="theaters-container">
        {/* Header Section */}
        <div className="theaters-header">
          <h1>Hệ Thống Rạp Chiếu</h1>
          <p>Khám phá mạng lưới rạp chiếu hiện đại với công nghệ tiên tiến nhất</p>
        </div>

        {/* Search and Filter Section */}
        <div className="theaters-controls">
          <div className="search-section">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Tìm rạp chiếu theo tên hoặc địa chỉ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="filter-section">
            <div className="city-filter">
              <span className="filter-label">📍 Thành phố:</span>
              <select 
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                {cities.map(city => (
                  <option key={city} value={city}>
                    {city === 'all' ? 'Tất cả' : city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Theater Groups by City */}
        <div className="theater-groups">
          {Object.entries(theatersByCity).map(([city, cityTheaters]) => (
            <div key={city} className="theater-group">
              <div className="group-header">
                <h2>📍 {city}</h2>
                <span className="group-stats">{cityTheaters.length} rạp</span>
              </div>

              <div className="theaters-grid">
                {cityTheaters.map((theater) => (
                  <div key={theater.id} className="theater-card">
                    <div className="theater-header">
                      <h3>{theater.name}</h3>
                      <div className="theater-status">
                        <span className={`status-badge ${theater.status}`}>
                          {theater.status === 'active' ? 'Hoạt động' : 
                           theater.status === 'maintenance' ? 'Bảo trì' : 'Tạm dừng'}
                        </span>
                      </div>
                    </div>

                    <div className="theater-info">
                      <div className="address-section">
                        <span className="info-icon">📍</span>
                        <p>{theater.address}</p>
                      </div>
                      
                      <div className="capacity-section">
                        <span className="info-icon">🪑</span>
                        <p>{theater.total_seats} ghế</p>
                      </div>
                    </div>

                    <div className="pricing-section">
                      <h4>Bảng Giá Vé</h4>
                      <div className="pricing-grid">
                        <div className="price-item gold">
                          <span className="seat-type">Gold</span>
                          <span className="price">{formatPrice(theater.seat_configuration.gold.price)}</span>
                        </div>
                        <div className="price-item platinum">
                          <span className="seat-type">Platinum</span>
                          <span className="price">{formatPrice(theater.seat_configuration.platinum.price)}</span>
                        </div>
                        <div className="price-item box">
                          <span className="seat-type">Box</span>
                          <span className="price">{formatPrice(theater.seat_configuration.box.price)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="facilities-section">
                      <h4>Tiện Ích</h4>
                      <div className="facilities-list">
                        {theater.facilities.map((facility, idx) => (
                          <span key={idx} className="facility-tag">
                            {facility}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="theater-actions">
                      <button className="btn btn-primary" type="button">
                        <span>🎬</span>
                        Xem Lịch Chiếu
                      </button>
                      <button className="btn btn-secondary" type="button">
                        <span>📍</span>
                        Chỉ Đường
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {Object.keys(theatersByCity).length === 0 && (
          <div className="no-results">
            <div className="no-results-icon">🎭</div>
            <h3>Không tìm thấy rạp chiếu</h3>
            <p>Vui lòng thử tìm kiếm với từ khóa khác hoặc chọn thành phố khác.</p>
            <button onClick={() => {
              setSelectedCity('all');
              setSearchTerm('');
            }} className="btn btn-primary">
              Xem tất cả rạp
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Theaters;