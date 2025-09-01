import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../utils'
import Modal from '../../components/Modal'

describe('Modal Component', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal when open', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )

    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render modal when closed', () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )

    const closeButton = screen.getByText('×')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when overlay clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )

    const overlay = screen.getByText('Modal content').closest('.modal-overlay')
    if (overlay) {
      fireEvent.click(overlay)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    }
  })

  it('does not close when modal content clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )

    const modalContent = screen.getByText('Modal content')
    fireEvent.click(modalContent)

    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('closes on Escape key press', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('does not close on other key press', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )

    fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' })

    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('renders without title', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>Modal content</p>
      </Modal>
    )

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={mockOnClose} size="large">
        <p>Modal content</p>
      </Modal>
    )

    const modalContent = screen.getByText('Modal content').closest('.modal-content')
    expect(modalContent).toHaveClass('modal-large')

    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="small">
        <p>Modal content</p>
      </Modal>
    )

    expect(modalContent).toHaveClass('modal-small')
  })

  it('hides close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal" showCloseButton={false}>
        <p>Modal content</p>
      </Modal>
    )

    expect(screen.queryByText('×')).not.toBeInTheDocument()
  })

  it('prevents body scroll when open', () => {
    // Store initial body overflow value
    const initialOverflow = document.body.style.overflow
    
    const { rerender } = render(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )

    // Modal is closed, should not affect body overflow
    expect(document.body.style.overflow).toBe(initialOverflow)

    rerender(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )

    // Modal is open, should prevent body scroll
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body scroll when closed', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )

    expect(document.body.style.overflow).toBe('hidden')

    rerender(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )

    expect(document.body.style.overflow).toBe('unset')
  })
})