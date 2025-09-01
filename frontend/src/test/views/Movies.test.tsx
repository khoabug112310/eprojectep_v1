import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '../utils'
import Movies from '../../views/Movies'
import { mockMovie } from '../utils'

// Mock API
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn()
  }
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    Link: ({ children, to }: any) => <a href={to}>{children}</a>
  }
})

// Import mocked API
import api from '../../services/api'
const mockApi = vi.mocked(api)

describe('Movies Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders movies page correctly', async () => {
    const mockResponse = {
      data: {
        data: [mockMovie],
        meta: {
          total: 1,
          current_page: 1,
          last_page: 1,
          per_page: 12
        }
      }
    }

    mockApi.get.mockResolvedValueOnce(mockResponse)

    await act(async () => {
      render(<Movies />)
    })

    expect(screen.getByText('🎬 Danh sách phim')).toBeInTheDocument()
    expect(screen.getByText('Khám phá những bộ phim hay nhất đang chiếu và sắp ra mắt')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(mockMovie.title)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('shows loading state initially', () => {
    const mockResponse = {
      data: {
        data: [],
        meta: { total: 0, current_page: 1, last_page: 1, per_page: 12 }
      }
    }

    mockApi.get.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<Movies />)

    expect(screen.getByText('Đang tải danh sách phim...')).toBeInTheDocument()
  })

  it('handles search functionality', async () => {
    const mockResponse = {
      data: {
        data: [mockMovie],
        meta: { total: 1, current_page: 1, last_page: 1, per_page: 12 }
      }
    }

    mockApi.get.mockResolvedValue(mockResponse)

    render(<Movies />)

    // Wait for initial load
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalled()
    })

    const searchInput = screen.getByPlaceholderText('Tìm kiếm phim theo tên, diễn viên, đạo diễn...')
    
    // Clear any previous calls
    mockApi.get.mockClear()
    
    fireEvent.change(searchInput, { target: { value: 'Test Movie' } })

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/movies', {
        params: expect.objectContaining({
          search: 'Test Movie'
        })
      })
    })
  })

  it('handles genre filter', async () => {
    const mockResponse = {
      data: {
        data: [mockMovie],
        meta: { total: 1, current_page: 1, last_page: 1, per_page: 12 }
      }
    }

    mockApi.get.mockResolvedValue(mockResponse)

    render(<Movies />)

    // Wait for initial load
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalled()
    })

    const genreSelect = screen.getByLabelText('Thể loại:')
    
    // Clear any previous calls
    mockApi.get.mockClear()
    
    fireEvent.change(genreSelect, { target: { value: 'Action' } })

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/movies', {
        params: expect.objectContaining({
          genre: 'Action'
        })
      })
    })
  })

  it('handles language filter', async () => {
    const mockResponse = {
      data: {
        data: [mockMovie],
        meta: { total: 1, current_page: 1, last_page: 1, per_page: 12 }
      }
    }

    mockApi.get.mockResolvedValue(mockResponse)

    render(<Movies />)

    // Wait for initial load
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalled()
    })

    const languageSelect = screen.getByLabelText('Ngôn ngữ:')
    
    // Clear any previous calls
    mockApi.get.mockClear()
    
    fireEvent.change(languageSelect, { target: { value: 'English' } })

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/movies', {
        params: expect.objectContaining({
          language: 'English'
        })
      })
    })
  })

  it('handles status filter', async () => {
    const mockResponse = {
      data: {
        data: [mockMovie],
        meta: { total: 1, current_page: 1, last_page: 1, per_page: 12 }
      }
    }

    mockApi.get.mockResolvedValue(mockResponse)

    render(<Movies />)

    // Wait for initial load
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalled()
    })

    const statusSelect = screen.getByLabelText('Trạng thái:')
    
    // Clear any previous calls
    mockApi.get.mockClear()
    
    fireEvent.change(statusSelect, { target: { value: 'active' } })

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/movies', {
        params: expect.objectContaining({
          status: 'active'
        })
      })
    })
  })

  it('clears all filters', async () => {
    const mockResponse = {
      data: {
        data: [mockMovie],
        meta: { total: 1, current_page: 1, last_page: 1, per_page: 12 }
      }
    }

    mockApi.get.mockResolvedValue(mockResponse)

    render(<Movies />)

    // Wait for initial load
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalled()
    })

    // Set some filters first
    const searchInput = screen.getByPlaceholderText('Tìm kiếm phim theo tên, diễn viên, đạo diễn...')
    fireEvent.change(searchInput, { target: { value: 'Test' } })

    const genreSelect = screen.getByLabelText('Thể loại:')
    fireEvent.change(genreSelect, { target: { value: 'Action' } })

    // Clear filters
    const clearButton = screen.getByText('✕ Xóa bộ lọc')
    fireEvent.click(clearButton)

    expect(searchInput).toHaveValue('')
    expect(genreSelect).toHaveValue('')
  })

  it('displays movie cards correctly', async () => {
    const mockResponse = {
      data: {
        data: [mockMovie],
        meta: { total: 1 }
      }
    }

    mockApi.get.mockResolvedValueOnce(mockResponse)

    render(<Movies />)

    await waitFor(() => {
      expect(screen.getByText(mockMovie.title)).toBeInTheDocument()
      expect(screen.getByText('4.5/5')).toBeInTheDocument()
      expect(screen.getByText('2h 0m')).toBeInTheDocument()
      expect(screen.getByText('Action, Drama')).toBeInTheDocument()
    })
  })

  it('shows empty state when no movies found', async () => {
    const mockResponse = {
      data: {
        data: [],
        meta: { total: 0 }
      }
    }

    mockApi.get.mockResolvedValueOnce(mockResponse)

    render(<Movies />)

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy phim')).toBeInTheDocument()
      expect(screen.getByText('Không có phim nào phù hợp với bộ lọc của bạn.', { exact: false })).toBeInTheDocument()
    })
  })

  it('handles API error', async () => {
    const errorMessage = 'Failed to fetch movies'
    mockApi.get.mockRejectedValueOnce(new Error(errorMessage))

    render(<Movies />)

    await waitFor(() => {
      expect(screen.getByText('Không thể tải danh sách phim')).toBeInTheDocument()
    })
  })

  it('loads more movies on pagination', async () => {
    // Create enough movies to test pagination - need multiple pages to trigger pagination
    const manyMovies = Array.from({ length: 12 }, (_, i) => ({
      ...mockMovie,
      id: i + 1,
      title: `Movie ${i + 1}`
    }))

    const mockResponse = {
      data: {
        data: manyMovies,
        meta: {
          current_page: 1,
          last_page: 2, // Set to 2 pages to trigger pagination display
          total: 24,
          per_page: 12
        }
      }
    }

    mockApi.get.mockResolvedValueOnce(mockResponse)

    render(<Movies />)

    await waitFor(() => {
      expect(screen.getByText('Movie 1')).toBeInTheDocument()
    })

    // Check that pagination controls appear (since we have multiple pages)
    await waitFor(() => {
      const pagination = document.querySelector('.pagination')
      expect(pagination).toBeInTheDocument()
    })
  })
})