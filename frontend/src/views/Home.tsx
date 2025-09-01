import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import './Home.css'

interface Movie {
  id: number
  title: string
  poster_url?: string
  average_rating?: number
  genre?: string
  status?: 'now_showing' | 'coming_soon' | 'ended'
  release_date?: string
  duration?: number
  age_rating?: string
  synopsis?: string
  trailer_url?: string
  director?: string
  cast?: string[]
}

interface QuickBookingData {
  city: string
  movie: string
  date: string
  theater: string
}

export default function Home() {
  // State management
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([])
  const [comingSoonMovies, setComingSoonMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedMovie, setSelectedMovie] = useState('')
  const [selectedTheater, setSelectedTheater] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [heroCurrentIndex, setHeroCurrentIndex] = useState(0)
  const [promoCurrentIndex, setPromoCurrentIndex] = useState(0)
  const [isHeroPaused, setIsHeroPaused] = useState(false)
  const [isPromoPaused, setIsPromoPaused] = useState(false)
  const [quickBookingLoading, setQuickBookingLoading] = useState(false)
  const [showTrailerModal, setShowTrailerModal] = useState(false)
  const [selectedTrailerMovie, setSelectedTrailerMovie] = useState<Movie | null>(null)
  const [copiedPromoCode, setCopiedPromoCode] = useState<string | null>(null)
  
  // Refs for intervals and elements
  const heroIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const promoIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const heroSectionRef = useRef<HTMLElement>(null)
  const quickBookingRef = useRef<HTMLDivElement>(null)

  // Sample data for quick booking
  const cities = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng']
  
  const theaters = useMemo(() => ({
    'TP. Hồ Chí Minh': [
      'CGV Vincom Center Landmark 81',
      'Galaxy Nguyễn Du',
      'Lotte Cinema Diamond Plaza',
      'BHD Star Bitexco'
    ],
    'Hà Nội': [
      'CGV Vincom Bà Triệu', 
      'Galaxy Mipec Long Biên',
      'Lotte Cinema Keangnam',
      'BHD Star Phạm Hùng'
    ],
    'Đà Nẵng': [
      'CGV Vincom Đà Nẵng',
      'Galaxy Đà Nẵng',
      'Lotte Cinema Đà Nẵng'
    ]
  }), [])

  // Performance optimization: Memoize theater count calculation
  const totalTheaterCount = useMemo(() => {
    return Object.values(theaters).flat().length
  }, [theaters])

  // Default fallback poster URL
  const defaultPosterUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgdmlld0JveD0iMCAwIDUwMCA3NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNzUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNTAgMzAwQzI3NS4yMjkgMzAwIDI5NSAyODAuMjI5IDI5NSAyNTVDMjk1IDIyOS43NzEgMjc1LjIyOSAyMTAgMjUwIDIxMEMyMjQuNzcxIDIxMCAyMDUgMjI5Ljc3MSAyMDUgMjU1QzIwNSAyODAuMjI5IDIyNC43NzEgMzAwIDI1MCAzMDBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0yNTAgMzUwQzI3NS4yMjkgMzUwIDI5NSAzMzAuMjI5IDI5NSAzMDVDMjk1IDI3OS43NzEgMjc1LjIyOSAyNjAgMjUwIDI2MEMyMjQuNzcxIDI2MCAyMDUgMjc5Ljc3MSAyMDUgMzA1QzIwNSAzMzAuMjI5IDIyNC43NzEgMzUwIDI1MCAzNTBaIiBmaWxsPSIjOUI5QkEwIi8+Cjx0ZXh0IHg9IjI1MCIgeT0iNDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QkEwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K'

  // Enhanced image error handling with progressive loading
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== defaultPosterUrl) {
      target.src = defaultPosterUrl;
      target.alt = 'Movie poster not available';
    }
  }, [defaultPosterUrl])

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.opacity = '1';
    target.style.transform = 'scale(1)';
  }, [])

  // Enhanced movie data with comprehensive details - moved outside component for better performance
  const sampleMovies = useMemo((): Movie[] => [
    {
      id: 1,
      title: "Avatar: The Way of Water",
      poster_url: "https://images.moviesanywhere.com/bf6b9c450e9343fe93ad76efd7c6b6b4/e2956d37-3fa0-4e42-af71-1a9f4a3b9b88.webp",
      average_rating: 4.9,
      genre: "Khoa Học Viễn Tưởng, Phiêu Lưu",
      status: "now_showing",
      duration: 192,
      age_rating: "T13",
      synopsis: "Jake Sully sống với gia đình mới được thành lập trên hành tinh Pandora. Khi một mối đe dọa quen thuộc trở lại để hoàn thành những gì đã bắt đầu trước đây, Jake phải làm việc với Neytiri và quân đội của chủng tộc Na'vi để bảo vệ hành tinh của họ.",
      trailer_url: "https://www.youtube.com/watch?v=a8Gx8wiNbs8",
      director: "James Cameron",
      cast: ["Sam Worthington", "Zoe Saldana", "Sigourney Weaver"]
    },
    {
      id: 2,
      title: "Black Panther: Wakanda Forever",
      poster_url: "https://terrigen-cdn-dev.marvel.com/content/prod/1x/blackpantherff_lob_crd_03.jpg",
      average_rating: 4.7,
      genre: "Hành Động, Siêu Anh Hùng",
      status: "now_showing",
      duration: 161,
      age_rating: "T13",
      synopsis: "Nữ hoàng Ramonda, Shuri, M'Baku, Okoye và Dora Milaje chiến đấu để bảo vệ quốc gia của họ khỏi sự can thiệp của các thế lực thế giới sau cái chết của Vua T'Challa.",
      trailer_url: "https://www.youtube.com/watch?v=_Z3QKkl1WyM",
      director: "Ryan Coogler",
      cast: ["Letitia Wright", "Angela Bassett", "Tenoch Huerta"]
    },
    {
      id: 3,
      title: "Top Gun: Maverick",
      poster_url: "https://m.media-amazon.com/images/M/MV5BZWYzOGEwNTgtNWU3NS00ZTQ0LWJkODUtMmVhMjIwMjA1ZmQwXkEyXkFqcGdeQXVyMjkwOTAyMDU@._V1_.jpg",
      average_rating: 4.8,
      genre: "Hành Động, Drama",
      status: "now_showing",
      duration: 130,
      age_rating: "T13",
      synopsis: "Sau hơn ba thập kỷ phục vụ là một trong những phi công hàng đầu của Hải quân, Pete 'Maverick' Mitchell ở nơi anh thuộc về, thúc đẩy phong bì như một phi công thử nghiệm dũng cảm.",
      trailer_url: "https://www.youtube.com/watch?v=giXco2jaZ_4",
      director: "Joseph Kosinski",
      cast: ["Tom Cruise", "Miles Teller", "Jennifer Connelly"]
    },
    {
      id: 4,
      title: "Gái Già Lắm Chiêu V: Những Cuộc Đời Vương Giả",
      poster_url: "https://media.baodautu.vn/files/hongdangcao/2023/03/01/gai-gia-lam-chieu-v-bat-ngo-dat-lich-chieu-som-113129.jpg",
      average_rating: 4.5,
      genre: "Hài, Gia Đình",
      status: "now_showing",
      duration: 112,
      age_rating: "T16",
      synopsis: "Lão bà U90 quyết tâm 'cải lão hoàn đồng' để chinh phục cụ ông hàng xóm. Những tình huống dở khóc dở cười xảy ra liên tục trong hành trình tìm kiếm tình yêu tuổi xế chiều.",
      trailer_url: "https://www.youtube.com/watch?v=example",
      director: "Bảo Nhân",
      cast: ["Lan Hương", "NSND Thành Lộc", "Ngân Chi"]
    },
    {
      id: 5,
      title: "Spider-Man: No Way Home",
      poster_url: "https://m.media-amazon.com/images/M/MV5BZWMyYzFjYTYtNTRjYi00OGExLWE2YzgtOGRmYjAxZTU3NzBiXkEyXkFqcGdeQXVyMzQ0MzA0NTM@._V1_UX182_CR0,0,182,268_AL_.jpg",
      average_rating: 4.7,
      genre: "Hành Động, Phiêu Lưu",
      status: "now_showing",
      duration: 148,
      age_rating: "T13",
      synopsis: "Danh tính bí mật của Peter Parker bị tiết lộ với toàn thế giới. Tuyệt vọng vì sự giúp đỡ, Peter tìm đến Doctor Strange để làm cho thế giới quên anh ta là Spider-Man.",
      trailer_url: "https://www.youtube.com/watch?v=JfVOs4VSpmA",
      director: "Jon Watts",
      cast: ["Tom Holland", "Zendaya", "Benedict Cumberbatch"]
    },
    {
      id: 6,
      title: "Fast X",
      poster_url: "https://m.media-amazon.com/images/M/MV5BNzVlY2MwMjEtM2E4OS00Y2Y3LWE3ZjctYzhkZGM3YzA1ZWM2XkEyXkFqcGdeQXVyODE5NzE3OTE@._V1_UX182_CR0,0,182,268_AL_.jpg",
      average_rating: 4.3,
      genre: "Hành Động, Phiêu Lưu",
      status: "now_showing",
      duration: 141,
      age_rating: "T13",
      synopsis: "Dom Toretto và gia đình anh phải đối mặt với kẻ thù nguy hiểm nhất từ trước đến nay: một mối đe dọa nổi lên từ bóng tối của quá khứ, được thúc đẩy bởi khao khát máu và quyết tâm nghiền nát gia đình này.",
      trailer_url: "https://www.youtube.com/watch?v=aOb15GVFZaA",
      director: "Louis Leterrier",
      cast: ["Vin Diesel", "Michelle Rodriguez", "Jason Momoa"]
    },
    {
      id: 7,
      title: "Mai",
      poster_url: "https://cdn.moveek.com/bundles/ornweb/img/film/film-poster-coming-soon.png",
      average_rating: 4.2,
      genre: "Tình Cảm, Drama",
      status: "coming_soon",
      duration: 131,
      age_rating: "T18",
      release_date: "2024-02-10",
      synopsis: "Một câu chuyện tình yêu đầy cảm động về Mai, một cô gái trẻ phải đối mặt với những thử thách của cuộc sống và tình yêu trong xã hội hiện đại.",
      trailer_url: "https://www.youtube.com/watch?v=example",
      director: "Trấn Thành",
      cast: ["Phương Anh Đào", "Tuấn Trần", "Trấn Thành"]
    },
    {
      id: 8,
      title: "Tết Ở Làng Địa Ngục",
      poster_url: "https://cdn.moveek.com/bundles/ornweb/img/film/film-poster-coming-soon.png",
      average_rating: 4.0,
      genre: "Hài, Kinh Dị",
      status: "coming_soon",
      duration: 108,
      age_rating: "T16",
      release_date: "2024-02-08",
      synopsis: "Một bộ phim hài kinh dị độc đáo về những câu chuyện kỳ lạ xảy ra trong dịp Tết Nguyên Đán tại một ngôi làng bí ẩn.",
      trailer_url: "https://www.youtube.com/watch?v=example",
      director: "Nguyễn Hữu Hoàng",
      cast: ["Tuấn Trần", "Huỳnh Lập", "Thu Trang"]
    }
  ], [])

  useEffect(() => {
    setLoading(true)
    
    // Simulate API call delay
    setTimeout(() => {
      // Filter movies for different sections
      const nowShowingMovies = sampleMovies.filter(movie => movie.status === 'now_showing')
      const upcomingMovies = sampleMovies.filter(movie => movie.status === 'coming_soon')
      
      setFeaturedMovies(nowShowingMovies)
      setComingSoonMovies(upcomingMovies)
      setLoading(false)
    }, 1000)
  }, [sampleMovies])

  // Enhanced hero carousel auto-rotation with pause/resume
  useEffect(() => {
    if (featuredMovies.length > 0 && !isHeroPaused) {
      heroIntervalRef.current = setInterval(() => {
        setHeroCurrentIndex((prevIndex) => 
          prevIndex === featuredMovies.length - 1 ? 0 : prevIndex + 1
        )
      }, 6000) // Slower interval for better UX

      return () => {
        if (heroIntervalRef.current) {
          clearInterval(heroIntervalRef.current)
        }
      }
    }
  }, [featuredMovies, isHeroPaused])

  // Enhanced promotion carousel with pause functionality
  useEffect(() => {
    if (!isPromoPaused) {
      const promoItems = 3
      promoIntervalRef.current = setInterval(() => {
        setPromoCurrentIndex((prevIndex) => 
          prevIndex === promoItems - 1 ? 0 : prevIndex + 1
        )
      }, 8000) // Slower for better readability

      return () => {
        if (promoIntervalRef.current) {
          clearInterval(promoIntervalRef.current)
        }
      }
    }
  }, [isPromoPaused])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heroIntervalRef.current) clearInterval(heroIntervalRef.current)
      if (promoIntervalRef.current) clearInterval(promoIntervalRef.current)
    }
  }, [])

  // Advanced handlers with UX enhancements
  const handleHeroNavigation = useCallback((index: number) => {
    setHeroCurrentIndex(index)
    setIsHeroPaused(true)
    if (heroIntervalRef.current) {
      clearInterval(heroIntervalRef.current)
    }
    // Resume auto-rotation after 10 seconds of manual navigation
    setTimeout(() => setIsHeroPaused(false), 10000)
  }, [])

  const handleTrailerClick = useCallback((movie: Movie) => {
    setSelectedTrailerMovie(movie)
    setShowTrailerModal(true)
    setIsHeroPaused(true)
  }, [])

  const handleCloseTrailer = useCallback(() => {
    setShowTrailerModal(false)
    setSelectedTrailerMovie(null)
    setIsHeroPaused(false)
  }, [])

  const handleCopyPromoCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedPromoCode(code)
      setTimeout(() => setCopiedPromoCode(null), 3000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }, [])

  const handleQuickBooking = useCallback(async () => {
    if (!selectedCity || !selectedMovie || !selectedDate || !selectedTheater) {
      alert('Vui lòng điền đầy đủ thông tin để tìm suất chiếu')
      return
    }

    setQuickBookingLoading(true)
    // Simulate API call
    setTimeout(() => {
      setQuickBookingLoading(false)
      // Navigate to booking page with parameters
      window.location.href = `/booking/movie/${selectedMovie}?city=${encodeURIComponent(selectedCity)}&theater=${encodeURIComponent(selectedTheater)}&date=${selectedDate}`
    }, 2000)
  }, [selectedCity, selectedMovie, selectedDate, selectedTheater])

  const handleHeroMouseEnter = useCallback(() => {
    setIsHeroPaused(true)
  }, [])

  const handleHeroMouseLeave = useCallback(() => {
    setIsHeroPaused(false)
  }, [])

  // Advanced keyboard navigation for hero carousel
  const handleHeroKeyNavigation = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      handleHeroNavigation(heroCurrentIndex === 0 ? featuredMovies.length - 1 : heroCurrentIndex - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      handleHeroNavigation(heroCurrentIndex === featuredMovies.length - 1 ? 0 : heroCurrentIndex + 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (featuredMovies[heroCurrentIndex]) {
        handleTrailerClick(featuredMovies[heroCurrentIndex])
      }
    }
  }, [heroCurrentIndex, featuredMovies, handleHeroNavigation, handleTrailerClick])

  return (
    <div className="home-page">
      {/* Advanced Hero Carousel Section with Enhanced UX */}
      <section 
        className="hero-carousel-section" 
        ref={heroSectionRef}
        onMouseEnter={handleHeroMouseEnter}
        onMouseLeave={handleHeroMouseLeave}
        onKeyDown={handleHeroKeyNavigation}
        role="banner"
        aria-label="Featured Movies Carousel"
        tabIndex={0}
      >
        <div className="hero-carousel-container">
          {featuredMovies.length > 0 && (
            <div className="hero-carousel">
              <div 
                className="hero-slides"
                style={{ 
                  transform: `translateX(-${heroCurrentIndex * 100}%)`,
                  transition: isHeroPaused ? 'none' : 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}
                role="region"
                aria-live="polite"
                aria-label={`Slide ${heroCurrentIndex + 1} of ${featuredMovies.length}`}
              >
                {featuredMovies.map((movie, index) => (
                  <div 
                    key={movie.id} 
                    className={`hero-slide ${index === heroCurrentIndex ? 'active' : ''}`}
                    style={{
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${movie.poster_url || defaultPosterUrl})`
                    }}
                    aria-hidden={index !== heroCurrentIndex}
                  >
                    <div className="hero-slide-content">
                      <div className="hero-slide-info">
                        <div className="movie-badges">
                          <span className="rating-badge" aria-label={`Rating ${movie.average_rating} out of 5 stars`}>
                            ⭐ {movie.average_rating}
                          </span>
                          <span className="age-badge" aria-label={`Age rating ${movie.age_rating}`}>
                            {movie.age_rating}
                          </span>
                          <span className="status-badge" aria-label={`Movie status: ${movie.status}`}>
                            {movie.status === 'now_showing' && '🎬 Đang chiếu'}
                            {movie.status === 'coming_soon' && '🔜 Sắp chiếu'}
                            {movie.status === 'ended' && '⏹️ Đã kết thúc'}
                          </span>
                        </div>
                        
                        <h1 className="hero-movie-title">{movie.title}</h1>
                        
                        <div className="hero-movie-meta">
                          <span className="duration" aria-label={`Duration ${movie.duration} minutes`}>
                            ⏱️ {movie.duration} phút
                          </span>
                          <span className="genre" aria-label={`Genres: ${movie.genre}`}>
                            {movie.genre}
                          </span>
                          {movie.director && (
                            <span className="director" aria-label={`Director: ${movie.director}`}>
                              🎬 {movie.director}
                            </span>
                          )}
                        </div>
                        
                        <p className="hero-movie-synopsis">{movie.synopsis}</p>
                        
                        {movie.cast && (
                          <div className="hero-movie-cast">
                            <span className="cast-label">Diễn viên:</span>
                            <span className="cast-list">{movie.cast.join(', ')}</span>
                          </div>
                        )}
                        
                        <div className="hero-movie-actions">
                          <button 
                            className="hero-cta-primary"
                            onClick={() => handleTrailerClick(movie)}
                            aria-label={`Watch trailer for ${movie.title}`}
                          >
                            <span>▶️</span>
                            Xem Trailer
                          </button>
                          <Link 
                            to={`/booking/movie/${movie.id}`} 
                            className="hero-cta-secondary"
                            aria-label={`Book tickets for ${movie.title}`}
                          >
                            <span>🎫</span>
                            Đặt Vé Ngay
                          </Link>
                          <Link 
                            to={`/movies/${movie.id}`}
                            className="hero-info-btn"
                            aria-label={`View details for ${movie.title}`}
                          >
                            <span>ℹ️</span>
                            Thông Tin
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Enhanced Hero Navigation */}
              <div className="hero-navigation" role="navigation" aria-label="Carousel navigation">
                <button 
                  className="hero-nav-btn prev"
                  onClick={() => handleHeroNavigation(heroCurrentIndex === 0 ? featuredMovies.length - 1 : heroCurrentIndex - 1)}
                  aria-label="Previous movie"
                  tabIndex={0}
                >
                  ❮
                </button>
                <button 
                  className="hero-nav-btn next"
                  onClick={() => handleHeroNavigation(heroCurrentIndex === featuredMovies.length - 1 ? 0 : heroCurrentIndex + 1)}
                  aria-label="Next movie"
                  tabIndex={0}
                >
                  ❯
                </button>
              </div>
              
              {/* Enhanced Hero Indicators */}
              <div className="hero-indicators" role="tablist" aria-label="Movie slides">
                {featuredMovies.map((movie, index) => (
                  <button
                    key={index}
                    className={`hero-indicator ${index === heroCurrentIndex ? 'active' : ''}`}
                    onClick={() => handleHeroNavigation(index)}
                    role="tab"
                    aria-selected={index === heroCurrentIndex}
                    aria-label={`Go to slide ${index + 1}: ${movie.title}`}
                    tabIndex={0}
                  />
                ))}
              </div>
              
              {/* Progress Bar */}
              <div className="hero-progress-bar">
                <div 
                  className="hero-progress-fill"
                  style={{
                    width: `${((heroCurrentIndex + 1) / featuredMovies.length) * 100}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Quick Booking Widget */}
      <section className="quick-booking-section" role="region" aria-label="Quick movie booking">
        <div className="container">
          <div className="quick-booking-widget" ref={quickBookingRef}>
            <div className="quick-booking-header">
              <h3>⚡ Đặt vé nhanh</h3>
              <p className="booking-subtitle">Tìm suất chiếu phù hợp với bạn</p>
            </div>
            
            <div className="booking-form">
              <div className="form-group">
                <label htmlFor="city-select" className="form-label">
                  🏙️ Thành phố
                </label>
                <select 
                  id="city-select"
                  className="form-select" 
                  value={selectedCity} 
                  onChange={(e) => {
                    setSelectedCity(e.target.value)
                    setSelectedTheater('') // Reset theater when city changes
                  }}
                  aria-required="true"
                  aria-describedby="city-help"
                >
                  <option value="">Chọn thành phố</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <small id="city-help" className="form-help">Chọn thành phố để xem danh sách rạp</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="movie-select" className="form-label">
                  🎬 Phim
                </label>
                <select 
                  id="movie-select"
                  className="form-select"
                  value={selectedMovie}
                  onChange={(e) => setSelectedMovie(e.target.value)}
                  aria-required="true"
                  aria-describedby="movie-help"
                >
                  <option value="">Chọn phim</option>
                  {featuredMovies.map(movie => (
                    <option key={movie.id} value={movie.id}>
                      {movie.title} ({movie.duration} phút)
                    </option>
                  ))}
                </select>
                <small id="movie-help" className="form-help">Chọn phim bạn muốn xem</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="date-input" className="form-label">
                  📅 Ngày
                </label>
                <input 
                  id="date-input"
                  type="date" 
                  className="form-input" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  max={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Next 14 days
                  aria-required="true"
                  aria-describedby="date-help"
                />
                <small id="date-help" className="form-help">Chọn ngày chiếu (tối đa 14 ngày)</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="theater-select" className="form-label">
                  🏢 Rạp
                </label>
                <select 
                  id="theater-select"
                  className="form-select"
                  value={selectedTheater}
                  onChange={(e) => setSelectedTheater(e.target.value)}
                  disabled={!selectedCity}
                  aria-required="true"
                  aria-describedby="theater-help"
                >
                  <option value="">Chọn rạp</option>
                  {selectedCity && theaters[selectedCity as keyof typeof theaters]?.map(theater => (
                    <option key={theater} value={theater}>{theater}</option>
                  ))}
                </select>
                <small id="theater-help" className="form-help">
                  {selectedCity ? 'Chọn rạp chiếu' : 'Vui lòng chọn thành phố trước'}
                </small>
              </div>
              
              <button 
                className={`booking-search-btn ${quickBookingLoading ? 'loading' : ''}`}
                onClick={handleQuickBooking}
                disabled={quickBookingLoading || !selectedCity || !selectedMovie || !selectedDate || !selectedTheater}
                aria-label="Tìm suất chiếu phim"
              >
                {quickBookingLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Đang tìm...
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    Tìm suất chiếu
                  </>
                )}
              </button>
            </div>
            
            {/* Quick Stats */}
            <div className="quick-booking-stats">
              <div className="stat-item">
                <span className="stat-number">{featuredMovies.length}</span>
                <span className="stat-label">Phim đang chiếu</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{comingSoonMovies.length}</span>
                <span className="stat-label">Phim sắp chiếu</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{cities.length}</span>
                <span className="stat-label">Thành phố</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{totalTheaterCount}</span>
                <span className="stat-label">Rạp chiếu</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Movies Section */}
      <section className="featured-section">
        <div className="featured-container">
          <div className="section-header">
            <h2 className="section-title">🎬 Phim đang chiếu</h2>
            <p className="section-subtitle">Khám phá những bộ phim được yêu thích nhất</p>
            <Link to="/movies" className="view-all-btn">Xem tất cả →</Link>
          </div>
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải phim...</p>
            </div>
          ) : (
            <div className="movies-grid">
              {Array.isArray(featuredMovies) && featuredMovies.map((movie) => (
                <div key={movie.id} className="movie-card">
                  <Link to={`/movies/${movie.id}`} className="movie-link">
                    <div className="movie-poster">
                      <img 
                        src={movie.poster_url || defaultPosterUrl}
                        alt={movie.title}
                        loading="lazy"
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                        style={{ 
                          opacity: 0, 
                          transform: 'scale(1.1)', 
                          transition: 'opacity 0.3s ease, transform 0.3s ease' 
                        }}
                      />
                      
                      {/* Status Badge */}
                      {movie.status && (
                        <div className={`status-badge status-${movie.status.replace('_', '-')}`}>
                          {movie.status === 'now_showing' && '🎬 Đang chiếu'}
                          {movie.status === 'coming_soon' && '🔜 Sắp chiếu'}
                          {movie.status === 'ended' && '⏹️ Đã kết thúc'}
                        </div>
                      )}
                      
                      {/* Rating Badge */}
                      <div className="movie-rating-badge">
                        <span className="rating-stars">⭐</span>
                        <span className="rating-number">{Number(movie.average_rating || 0).toFixed(1)}</span>
                      </div>
                      
                      {/* Age Rating Badge */}
                      {movie.age_rating && (
                        <div className="age-rating-badge">
                          {movie.age_rating}
                        </div>
                      )}
                      
                      <div className="movie-overlay">
                        <div className="overlay-content">
                          <button className="overlay-btn play-btn">
                            <span>▶️</span>
                            Xem trailer
                          </button>
                          <button className="overlay-btn book-btn">
                            <span>🎫</span>
                            Đặt vé ngay
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="movie-info">
                      <h3 className="movie-title">{movie.title}</h3>
                      <div className="movie-meta">
                        {movie.genre && (
                          <div className="movie-genres">
                            {movie.genre.split(', ').map((g, index) => (
                              <span key={index} className="genre-tag">{g}</span>
                            ))}
                          </div>
                        )}
                        {movie.duration && (
                          <span className="movie-duration">
                            ⏱️ {movie.duration} phút
                          </span>
                        )}
                      </div>
                      {movie.synopsis && (
                        <p className="movie-synopsis">
                          {movie.synopsis.length > 80 
                            ? `${movie.synopsis.substring(0, 80)}...` 
                            : movie.synopsis
                          }
                        </p>
                      )}
                      {movie.status === 'coming_soon' && movie.release_date && (
                        <div className="release-date">
                          📅 Khởi chiếu: {new Date(movie.release_date).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="coming-soon-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">🔜 Phim sắp chiếu</h2>
            <p className="section-subtitle">Các bộ phim đáng chờ đợi sắp ra mắt</p>
          </div>
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải phim...</p>
            </div>
          ) : (
            <div className="coming-soon-carousel">
              {Array.isArray(comingSoonMovies) && comingSoonMovies.map((movie) => (
                <div key={movie.id} className="coming-soon-card">
                  <div className="coming-soon-poster">
                    <img 
                      src={movie.poster_url || defaultPosterUrl}
                      alt={movie.title}
                      loading="lazy"
                      onError={handleImageError}
                      onLoad={handleImageLoad}
                      style={{ 
                        opacity: 0, 
                        transform: 'scale(1.1)', 
                        transition: 'opacity 0.3s ease, transform 0.3s ease' 
                      }}
                    />
                    <div className="coming-soon-overlay">
                      <button className="notify-btn">
                        🔔 Thông báo khi ra mắt
                      </button>
                    </div>
                  </div>
                  <div className="coming-soon-info">
                    <h4 className="coming-soon-title">{movie.title}</h4>
                    {movie.release_date && (
                      <div className="coming-soon-date">
                        📅 {new Date(movie.release_date).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                    <div className="coming-soon-genres">
                      {movie.genre && movie.genre.split(', ').slice(0, 2).map((g, index) => (
                        <span key={index} className="genre-tag">{g}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">🌟 Tại sao chọn CineBook?</h2>
            <p className="section-subtitle">Trải nghiệm đặt vé phim tuyệt vời nhất</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Đặt vé nhanh</h3>
              <p>Chỉ trong vài phút, bạn đã có thể đặt vé và chọn chỗ ngồi yêu thích</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎫</div>
              <h3>E-ticket tiện lợi</h3>
              <p>Vé điện tử với mã QR, không cần in vé, chỉ cần điện thoại</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>Thanh toán an toàn</h3>
              <p>Hỗ trợ nhiều phương thức thanh toán, bảo mật tuyệt đối</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎬</div>
              <h3>Đa dạng phim</h3>
              <p>Từ bom tấn Hollywood đến phim Việt, luôn cập nhật phim mới</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Promotions Section */}
      <section className="promotions-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">🎁 Ưu đãi đặc biệt</h2>
            <p className="section-subtitle">Những ưu đãi hấp dẫn dành riêng cho bạn</p>
          </div>
          
          <div className="promotions-carousel-container">
            <div className="promotions-carousel">
              <div 
                className="promo-slides"
                style={{ transform: `translateX(-${promoCurrentIndex * 100}%)` }}
              >
                <div className="promo-slide">
                  <div className="promo-card featured">
                    <div className="promo-badge">HOT</div>
                    <div className="promo-visual">
                      <div className="promo-icon">🎫</div>
                      <div className="promo-sparkles">
                        <span>✨</span><span>✨</span><span>✨</span>
                      </div>
                    </div>
                    <div className="promo-content">
                      <h3>Giảm 30% vé đôi</h3>
                      <p>Áp dụng cho tất cả suất chiếu cuối tuần</p>
                      <div className="promo-validity">Hết hạn: 31/12/2024</div>
                      <div className="promo-code-section">
                        <span className="promo-code">Mã: COUPLE30</span>
                        <button 
                          className="copy-code-btn"
                          onClick={() => handleCopyPromoCode('COUPLE30')}
                          aria-label="Copy promo code COUPLE30"
                        >
                          {copiedPromoCode === 'COUPLE30' ? '✅ Đã sao chép' : '📋 Sao chép'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="promo-slide">
                  <div className="promo-card">
                    <div className="promo-visual">
                      <div className="promo-icon">🍿</div>
                      <div className="promo-sparkles">
                        <span>✨</span><span>✨</span>
                      </div>
                    </div>
                    <div className="promo-content">
                      <h3>Combo bắp nước miễn phí</h3>
                      <p>Mua vé tặng combo bắp nước miễn phí</p>
                      <div className="promo-validity">Hết hạn: 28/02/2024</div>
                      <div className="promo-code-section">
                        <span className="promo-code">Mã: FREECOMBO</span>
                        <button 
                          className="copy-code-btn"
                          onClick={() => handleCopyPromoCode('FREECOMBO')}
                          aria-label="Copy promo code FREECOMBO"
                        >
                          {copiedPromoCode === 'FREECOMBO' ? '✅ Đã sao chép' : '📋 Sao chép'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="promo-slide">
                  <div className="promo-card">
                    <div className="promo-visual">
                      <div className="promo-icon">⭐</div>
                      <div className="promo-sparkles">
                        <span>✨</span><span>✨</span><span>✨</span>
                      </div>
                    </div>
                    <div className="promo-content">
                      <h3>Thành viên VIP</h3>
                      <p>Tích điểm nhận quà, ưu tiên đặt vé</p>
                      <div className="promo-validity">Lâu dài</div>
                      <div className="promo-code-section">
                        <span className="promo-code special">Đăng ký ngay</span>
                        <Link to="/register" className="register-vip-btn">🎆 Tham gia</Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Promo Navigation */}
            <div className="promo-navigation">
              <button 
                className="promo-nav-btn prev"
                onClick={() => setPromoCurrentIndex(promoCurrentIndex === 0 ? 2 : promoCurrentIndex - 1)}
              >
                ❮
              </button>
              <button 
                className="promo-nav-btn next"
                onClick={() => setPromoCurrentIndex(promoCurrentIndex === 2 ? 0 : promoCurrentIndex + 1)}
              >
                ❯
              </button>
            </div>
            
            {/* Promo Indicators */}
            <div className="promo-indicators">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  className={`promo-indicator ${index === promoCurrentIndex ? 'active' : ''}`}
                  onClick={() => setPromoCurrentIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Enhanced Trailer Modal */}
      {showTrailerModal && selectedTrailerMovie && (
        <div 
          className="trailer-modal-overlay"
          onClick={handleCloseTrailer}
          role="dialog"
          aria-modal="true"
          aria-labelledby="trailer-title"
        >
          <div className="trailer-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="trailer-modal-header">
              <h2 id="trailer-title" className="trailer-title">
                Trailer: {selectedTrailerMovie.title}
              </h2>
              <button 
                className="trailer-close-btn"
                onClick={handleCloseTrailer}
                aria-label="Close trailer"
                tabIndex={0}
              >
                ✕
              </button>
            </div>
            <div className="trailer-modal-body">
              <div className="trailer-video-container">
                {selectedTrailerMovie.trailer_url ? (
                  <iframe
                    src={selectedTrailerMovie.trailer_url.replace('watch?v=', 'embed/')}
                    title={`Trailer for ${selectedTrailerMovie.title}`}
                    allowFullScreen
                    className="trailer-video"
                  />
                ) : (
                  <div className="trailer-placeholder">
                    <div className="placeholder-icon">🎬</div>
                    <p>Trailer chưa có sẵn</p>
                  </div>
                )}
              </div>
              <div className="trailer-info">
                <p className="trailer-synopsis">{selectedTrailerMovie.synopsis}</p>
                <div className="trailer-meta">
                  <span>🕰️ {selectedTrailerMovie.duration} phút</span>
                  <span>🎬 {selectedTrailerMovie.director}</span>
                  <span>⭐ {selectedTrailerMovie.average_rating}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 