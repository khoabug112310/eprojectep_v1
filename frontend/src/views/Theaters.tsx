import React, { useState, useEffect } from 'react';
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

interface TheaterChain {
  name: string;
  logo: string;
  theaters: Theater[];
  color: string;
}

const Theaters: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [theaterChains, setTheaterChains] = useState<TheaterChain[]>([]);
  const [loading, setLoading] = useState(true);

  // Sample theater data - Galaxy Cinema inspired
  const sampleTheaterChains: TheaterChain[] = [
    {
      name: 'Galaxy Cinema',
      logo: '🌟',
      color: '#FFD700',
      theaters: [
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
          name: 'Galaxy Tân Bình',
          address: '246 Nguyễn Hồng Đào, Phường 14, Tân Bình',
          city: 'TP.HCM',
          total_seats: 240,
          seat_configuration: {
            gold: { rows: 8, cols: 12, price: 85000 },
            platinum: { rows: 4, cols: 10, price: 115000 },
            box: { rows: 2, cols: 4, price: 145000 }
          },
          facilities: ['2D', '3D', 'Sound DTS'],
          status: 'active'
        }
      ]
    },
    {
      name: 'CGV Cinemas',
      logo: '🎬',
      color: '#E50914',
      theaters: [
        {
          id: 4,
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
        },
        {
          id: 5,
          name: 'CGV Aeon Mall Tân Phú',
          address: 'Tầng 3, Aeon Mall Tân Phú, 30 Bờ Bao Tân Thắng',
          city: 'TP.HCM',
          total_seats: 250,
          seat_configuration: {
            gold: { rows: 8, cols: 12, price: 95000 },
            platinum: { rows: 4, cols: 10, price: 120000 },
            box: { rows: 2, cols: 4, price: 160000 }
          },
          facilities: ['3D', 'Dolby Atmos', 'Recliner Seats'],
          status: 'active'
        }
      ]
    },
    {
      name: 'Lotte Cinema',
      logo: '🎪',
      color: '#FF6B6B',
      theaters: [
        {
          id: 6,
          name: 'Lotte Cinema Diamond Plaza',
          address: 'Tầng 13, Diamond Plaza, 34 Lê Duẩn, Bến Nghé, Quận 1',
          city: 'TP.HCM',
          total_seats: 320,
          seat_configuration: {
            gold: { rows: 12, cols: 16, price: 105000 },
            platinum: { rows: 5, cols: 12, price: 135000 },
            box: { rows: 2, cols: 8, price: 175000 }
          },
          facilities: ['4DX', 'IMAX', 'Dolby Atmos', 'Super Plex G'],
          status: 'active'
        }
      ]
    }
  ];

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setTheaterChains(sampleTheaterChains);
      setLoading(false);
    }, 1000);
  }, []);

  const cities = ['all', 'TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ'];

  const filteredTheaterChains = theaterChains.map(chain => ({
    ...chain,
    theaters: chain.theaters.filter(theater => {
      const matchesCity = selectedCity === 'all' || theater.city === selectedCity;
      const matchesSearch = theater.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           theater.address.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCity && matchesSearch;
    })
  })).filter(chain => chain.theaters.length > 0);

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

        {/* Theater Chains */}
        <div className="theater-chains">
          {filteredTheaterChains.map((chain, index) => (
            <div key={index} className="theater-chain">
              <div className="chain-header">
                <div className="chain-logo">
                  <span className="logo-icon">{chain.logo}</span>
                  <h2 style={{ color: chain.color }}>{chain.name}</h2>
                </div>
                <div className="chain-stats">
                  <span>{chain.theaters.length} rạp</span>
                </div>
              </div>

              <div className="theaters-grid">
                {chain.theaters.map((theater) => (
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

        {filteredTheaterChains.length === 0 && (
          <div className="no-results">
            <div className="no-results-icon">🎭</div>
            <h3>Không tìm thấy rạp chiếu</h3>
            <p>Vui lòng thử tìm kiếm với từ khóa khác hoặc chọn thành phố khác.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Theaters;