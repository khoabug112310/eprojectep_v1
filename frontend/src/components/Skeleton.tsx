import './Skeleton.css'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
}

export function Skeleton({ width, height, className = '' }: SkeletonProps) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div 
      className={`skeleton ${className}`}
      style={style}
    />
  )
}

// Movie Card Skeleton
export function MovieCardSkeleton() {
  return (
    <div className="movie-card-skeleton">
      <Skeleton className="skeleton-poster" width="100%" height={300} />
      <div className="skeleton-content">
        <Skeleton className="skeleton-title" width="80%" height={20} />
        <Skeleton className="skeleton-genre" width="60%" height={16} />
        <Skeleton className="skeleton-rating" width="40%" height={16} />
      </div>
    </div>
  )
}

// Movie List Skeleton
export function MovieListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="movie-list-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <MovieCardSkeleton key={index} />
      ))}
    </div>
  )
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="table-row-skeleton">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton 
          key={index}
          className="skeleton-cell"
          width="100%"
          height={20}
        />
      ))}
    </div>
  )
}

// Table Skeleton
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="table-skeleton">
      <div className="skeleton-header">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton 
            key={index}
            className="skeleton-header-cell"
            width="100%"
            height={24}
          />
        ))}
      </div>
      <div className="skeleton-body">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRowSkeleton key={rowIndex} columns={columns} />
        ))}
      </div>
    </div>
  )
}

// Profile Skeleton
export function ProfileSkeleton() {
  return (
    <div className="profile-skeleton">
      <div className="skeleton-avatar">
        <Skeleton width={80} height={80} />
      </div>
      <div className="skeleton-info">
        <Skeleton className="skeleton-name" width="60%" height={24} />
        <Skeleton className="skeleton-email" width="80%" height={16} />
        <Skeleton className="skeleton-phone" width="50%" height={16} />
      </div>
    </div>
  )
}

// Booking Card Skeleton
export function BookingCardSkeleton() {
  return (
    <div className="booking-card-skeleton">
      <div className="skeleton-booking-header">
        <Skeleton className="skeleton-movie-poster" width={60} height={90} />
        <div className="skeleton-booking-info">
          <Skeleton className="skeleton-movie-title" width="70%" height={18} />
          <Skeleton className="skeleton-theater" width="50%" height={14} />
          <Skeleton className="skeleton-showtime" width="40%" height={14} />
        </div>
      </div>
      <div className="skeleton-booking-details">
        <Skeleton className="skeleton-seats" width="60%" height={16} />
        <Skeleton className="skeleton-amount" width="40%" height={16} />
      </div>
    </div>
  )
}

// Form Skeleton
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="form-skeleton">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="skeleton-form-group">
          <Skeleton className="skeleton-label" width="30%" height={16} />
          <Skeleton className="skeleton-input" width="100%" height={40} />
        </div>
      ))}
      <Skeleton className="skeleton-button" width="120px" height={40} />
    </div>
  )
}

// Dashboard Stats Skeleton
export function DashboardStatsSkeleton() {
  return (
    <div className="dashboard-stats-skeleton">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="skeleton-stat-card">
          <Skeleton className="skeleton-stat-icon" width={40} height={40} />
          <div className="skeleton-stat-content">
            <Skeleton className="skeleton-stat-value" width="60%" height={24} />
            <Skeleton className="skeleton-stat-label" width="80%" height={16} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Chart Skeleton
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="chart-skeleton">
      <Skeleton className="skeleton-chart-title" width="40%" height={20} />
      <Skeleton className="skeleton-chart" width="100%" height={height} />
      <div className="skeleton-chart-legend">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="skeleton-legend-item" width="20%" height={16} />
        ))}
      </div>
    </div>
  )
} 