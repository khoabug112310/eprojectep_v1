import { useEffect } from 'react'
import './Modal.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'small' | 'medium' | 'large'
  showCloseButton?: boolean
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  showCloseButton = true 
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            {showCloseButton && (
              <button className="modal-close" onClick={onClose}>
                ×
              </button>
            )}
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

// Trailer Modal Component
interface TrailerModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl?: string
  title?: string
}

export function TrailerModal({ isOpen, onClose, videoUrl, title }: TrailerModalProps) {
  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtube.com') 
        ? url.split('v=')[1]?.split('&')[0]
        : url.split('youtu.be/')[1]
      return `https://www.youtube.com/embed/${videoId}`
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]
      return `https://player.vimeo.com/video/${videoId}`
    }
    return url
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large" title={title}>
      <div className="trailer-container">
        {videoUrl ? (
          <iframe
            src={getEmbedUrl(videoUrl)}
            title={title || 'Movie Trailer'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="trailer-video"
          />
        ) : (
          <div className="trailer-placeholder">
            <div className="placeholder-icon">🎬</div>
            <p>Trailer không khả dụng</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

// Confirmation Modal Component
interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'info'
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="small" title={title}>
      <div className="confirmation-content">
        <div className="confirmation-icon">
          {type === 'danger' && '⚠️'}
          {type === 'warning' && '⚠️'}
          {type === 'info' && 'ℹ️'}
        </div>
        <p className="confirmation-message">{message}</p>
        <div className="confirmation-actions">
          <button 
            className={`btn btn-secondary ${type === 'danger' ? 'btn-danger' : ''}`}
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className={`btn btn-primary ${type === 'danger' ? 'btn-danger' : ''}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Image Lightbox Modal Component
interface ImageLightboxProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  alt?: string
}

export function ImageLightbox({ isOpen, onClose, imageUrl, alt }: ImageLightboxProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="lightbox-container">
        <button className="lightbox-close" onClick={onClose}>
          ×
        </button>
        <img 
          src={imageUrl} 
          alt={alt || 'Image'} 
          className="lightbox-image"
        />
      </div>
    </Modal>
  )
} 