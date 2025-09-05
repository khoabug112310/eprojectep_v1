import { useState, useEffect } from 'react'
import useWebSocket from '../hooks/useWebSocket'
import './ConnectionStatus.css'

interface ConnectionStatusProps {
  showDetails?: boolean
  className?: string
}

export default function ConnectionStatus({ showDetails = false, className = '' }: ConnectionStatusProps) {
  const { isConnected, connectionStatus, reconnect, lastUpdate } = useWebSocket()
  const [showReconnectButton, setShowReconnectButton] = useState(false)

  // Show reconnect button after 10 seconds of disconnection
  useEffect(() => {
    if (!isConnected) {
      const timer = setTimeout(() => {
        setShowReconnectButton(true)
      }, 10000)

      return () => clearTimeout(timer)
    } else {
      setShowReconnectButton(false)
    }
  }, [isConnected])

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return '🟢'
      case 'reconnecting':
        return '🟡'
      case 'disconnected':
        return '🔴'
      default:
        return '⚪'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Real-time updates active'
      case 'reconnecting':
        return 'Reconnecting...'
      case 'disconnected':
        return 'Connection lost'
      default:
        return 'Connecting...'
    }
  }

  const getStatusClass = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'status-connected'
      case 'reconnecting':
        return 'status-reconnecting'
      case 'disconnected':
        return 'status-disconnected'
      default:
        return 'status-connecting'
    }
  }

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'No updates yet'
    
    const now = new Date()
    const diff = now.getTime() - lastUpdate.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)

    if (seconds < 60) {
      return `${seconds}s ago`
    } else if (minutes < 60) {
      return `${minutes}m ago`
    } else {
      return lastUpdate.toLocaleTimeString()
    }
  }

  return (
    <div className={`connection-status ${getStatusClass()} ${className}`}>
      <div className="status-indicator">
        <span className="status-icon" title={getStatusText()}>
          {getStatusIcon()}
        </span>
        
        {showDetails && (
          <div className="status-details">
            <span className="status-text">{getStatusText()}</span>
            {lastUpdate && (
              <span className="last-update">Last update: {formatLastUpdate()}</span>
            )}
          </div>
        )}
      </div>

      {showReconnectButton && connectionStatus === 'disconnected' && (
        <button 
          className="reconnect-button"
          onClick={reconnect}
          title="Manually reconnect to real-time updates"
        >
          🔄 Reconnect
        </button>
      )}

      {/* Pulse animation for active connection */}
      {connectionStatus === 'connected' && (
        <div className="pulse-indicator" title="Real-time updates active" />
      )}
    </div>
  )
}