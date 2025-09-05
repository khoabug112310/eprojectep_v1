import { useState, useEffect } from 'react'
import './SeatLockTimer.css'

interface SeatLockTimerProps {
  expiresAt: string
  seatId: string
  onExpiry?: (seatId: string) => void
  compact?: boolean
  className?: string
}

export default function SeatLockTimer({ 
  expiresAt, 
  seatId, 
  onExpiry, 
  compact = false,
  className = '' 
}: SeatLockTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isExpired, setIsExpired] = useState(false)
  const [urgencyLevel, setUrgencyLevel] = useState<'normal' | 'warning' | 'critical'>('normal')

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiryTime = new Date(expiresAt)
      const now = new Date()
      const diff = expiryTime.getTime() - now.getTime()
      
      if (diff <= 0) {
        setTimeLeft(0)
        setIsExpired(true)
        if (onExpiry) {
          onExpiry(seatId)
        }
        return
      }
      
      setTimeLeft(Math.floor(diff / 1000))
      setIsExpired(false)
      
      // Set urgency level based on time remaining
      const minutes = Math.floor(diff / (1000 * 60))
      if (minutes <= 2) {
        setUrgencyLevel('critical')
      } else if (minutes <= 5) {
        setUrgencyLevel('warning')
      } else {
        setUrgencyLevel('normal')
      }
    }

    // Calculate immediately
    calculateTimeLeft()

    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [expiresAt, seatId, onExpiry])

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (compact) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const getTimerIcon = () => {
    if (isExpired) return '⏰'
    
    switch (urgencyLevel) {
      case 'critical': return '🔴'
      case 'warning': return '🟡'
      default: return '⏱️'
    }
  }

  const getProgressPercentage = () => {
    const totalLockTime = 15 * 60 // 15 minutes in seconds
    const elapsed = totalLockTime - timeLeft
    return (elapsed / totalLockTime) * 100
  }

  if (isExpired) {
    return (
      <div className={`seat-lock-timer expired ${className}`}>
        <span className="timer-icon">⏰</span>
        <span className="timer-text">Expired</span>
      </div>
    )
  }

  return (
    <div className={`seat-lock-timer ${urgencyLevel} ${compact ? 'compact' : ''} ${className}`}>
      <div className="timer-content">
        <span className="timer-icon">{getTimerIcon()}</span>
        <span className="timer-text">
          {compact ? formatTime(timeLeft) : `Lock expires: ${formatTime(timeLeft)}`}
        </span>
      </div>
      
      {!compact && (
        <div className="timer-progress-bar">
          <div 
            className="timer-progress-fill"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      )}
      
      {urgencyLevel === 'critical' && !compact && (
        <div className="timer-warning">
          ⚠️ Lock expires soon! Complete booking quickly.
        </div>
      )}
    </div>
  )
}