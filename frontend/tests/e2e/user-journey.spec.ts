// CineBook E2E User Journey Tests
// Critical user flow testing from browsing to booking completion

import { test, expect } from '@playwright/test'

test.describe('Critical User Journey Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="homepage-hero"]', { timeout: 10000 })
  })

  test('Complete Movie Browsing to Booking Journey', async ({ page }) => {
    // Step 1: Browse Movies from Homepage
    await test.step('Browse movies from homepage', async () => {
      // Check hero section is visible
      await expect(page.locator('[data-testid="homepage-hero"]')).toBeVisible()
      
      // Navigate to movies page
      await page.click('[data-testid="view-all-movies"]')
      await page.waitForURL('**/movies')
      
      // Verify movies are loaded
      await expect(page.locator('[data-testid="movie-card"]').first()).toBeVisible()
    })

    // Step 2: Search and Filter Movies
    await test.step('Search and filter movies', async () => {
      // Use search functionality
      await page.fill('[data-testid="movie-search"]', 'Avengers')
      await page.press('[data-testid="movie-search"]', 'Enter')
      
      // Wait for search results
      await page.waitForFunction(() => {
        const results = document.querySelectorAll('[data-testid="movie-card"]')
        return results.length > 0
      })
      
      // Apply genre filter
      await page.click('[data-testid="filter-genre-action"]')
      await page.waitForTimeout(1000) // Wait for filter to apply
    })

    // Step 3: Select Movie and View Details
    await test.step('Select movie and view details', async () => {
      // Click on first movie
      await page.click('[data-testid="movie-card"]')
      await page.waitForURL('**/movies/**')
      
      // Verify movie details page
      await expect(page.locator('[data-testid="movie-title"]')).toBeVisible()
      await expect(page.locator('[data-testid="movie-poster"]')).toBeVisible()
      await expect(page.locator('[data-testid="movie-synopsis"]')).toBeVisible()
      
      // Check showtimes section
      await expect(page.locator('[data-testid="showtimes-section"]')).toBeVisible()
    })

    // Step 4: Select Showtime
    await test.step('Select showtime for booking', async () => {
      // Click on book now for first available showtime
      await page.click('[data-testid="book-showtime"]')
      await page.waitForURL('**/booking/seats/**')
      
      // Verify seat selection page
      await expect(page.locator('[data-testid="seat-map"]')).toBeVisible()
      await expect(page.locator('[data-testid="movie-info"]')).toBeVisible()
    })

    // Step 5: Select Seats
    await test.step('Select seats', async () => {
      // Select 2 seats
      await page.click('[data-testid="seat-A1"]')
      await page.click('[data-testid="seat-A2"]')
      
      // Verify seats are selected
      await expect(page.locator('[data-testid="seat-A1"][data-selected="true"]')).toBeVisible()
      await expect(page.locator('[data-testid="seat-A2"][data-selected="true"]')).toBeVisible()
      
      // Check price calculation
      const totalPrice = await page.locator('[data-testid="total-price"]').textContent()
      expect(totalPrice).toMatch(/\d+/)
      
      // Continue to checkout
      await page.click('[data-testid="continue-checkout"]')
      await page.waitForURL('**/booking/checkout')
    })

    // Step 6: Complete Checkout (Guest User)
    await test.step('Complete checkout process', async () => {
      // Fill customer information (guest booking)
      await page.fill('[data-testid="customer-name"]', 'John Doe')
      await page.fill('[data-testid="customer-email"]', 'john.doe@test.com')
      await page.fill('[data-testid="customer-phone"]', '0987654321')
      
      // Select payment method
      await page.click('[data-testid="payment-method-card"]')
      
      // Fill payment information (dummy)
      await page.fill('[data-testid="card-number"]', '4111111111111111')
      await page.fill('[data-testid="card-expiry"]', '12/25')
      await page.fill('[data-testid="card-cvv"]', '123')
      
      // Accept terms and conditions
      await page.check('[data-testid="accept-terms"]')
      
      // Complete booking
      await page.click('[data-testid="complete-booking"]')
      await page.waitForURL('**/booking/confirmation')
    })

    // Step 7: Verify Booking Confirmation
    await test.step('Verify booking confirmation', async () => {
      // Check confirmation page elements
      await expect(page.locator('[data-testid="booking-success"]')).toBeVisible()
      await expect(page.locator('[data-testid="booking-code"]')).toBeVisible()
      await expect(page.locator('[data-testid="e-ticket"]')).toBeVisible()
      
      // Verify booking details
      const bookingCode = await page.locator('[data-testid="booking-code"]').textContent()
      expect(bookingCode).toMatch(/^BK\d{8}$/) // Booking code format
      
      // Check e-ticket download option
      await expect(page.locator('[data-testid="download-ticket"]')).toBeVisible()
    })
  })

  test('Registered User Login and Booking Flow', async ({ page }) => {
    // Step 1: User Registration
    await test.step('Register new user', async () => {
      await page.click('[data-testid="login-button"]')
      await page.click('[data-testid="register-link"]')
      
      // Fill registration form
      await page.fill('[data-testid="register-name"]', 'Jane Smith')
      await page.fill('[data-testid="register-email"]', 'jane.smith@test.com')
      await page.fill('[data-testid="register-phone"]', '0123456789')
      await page.fill('[data-testid="register-password"]', 'Password123!')
      await page.fill('[data-testid="register-confirm-password"]', 'Password123!')
      
      await page.click('[data-testid="register-submit"]')
      
      // Should be redirected and logged in
      await page.waitForSelector('[data-testid="user-profile-menu"]')
    })

    // Step 2: Quick Booking from Homepage
    await test.step('Use quick booking form', async () => {
      await page.goto('/')
      
      // Use quick booking form
      await page.selectOption('[data-testid="quick-book-city"]', 'Ho Chi Minh City')
      await page.selectOption('[data-testid="quick-book-movie"]', 'Avengers: Endgame')
      await page.fill('[data-testid="quick-book-date"]', '2024-01-15')
      await page.selectOption('[data-testid="quick-book-theater"]', 'Galaxy Nguyen Du')
      
      await page.click('[data-testid="quick-book-search"]')
      
      // Should navigate to showtime selection
      await page.waitForURL('**/booking/showtimes/**')
    })

    // Step 3: Fast Booking Flow (Registered User)
    await test.step('Complete fast booking for registered user', async () => {
      // Select showtime
      await page.click('[data-testid="select-showtime-19:00"]')
      
      // Quick seat selection
      await page.click('[data-testid="seat-B5"]')
      await page.click('[data-testid="continue-checkout"]')
      
      // Pre-filled user information should be visible
      await expect(page.locator('[data-testid="customer-name"]')).toHaveValue('Jane Smith')
      await expect(page.locator('[data-testid="customer-email"]')).toHaveValue('jane.smith@test.com')
      
      // Select payment and complete
      await page.click('[data-testid="payment-method-wallet"]')
      await page.check('[data-testid="accept-terms"]')
      await page.click('[data-testid="complete-booking"]')
      
      // Verify success
      await page.waitForURL('**/booking/confirmation')
      await expect(page.locator('[data-testid="booking-success"]')).toBeVisible()
    })

    // Step 4: Check Booking History
    await test.step('View booking history', async () => {
      await page.click('[data-testid="user-profile-menu"]')
      await page.click('[data-testid="booking-history-link"]')
      
      // Should show recent booking
      await expect(page.locator('[data-testid="booking-list"]')).toBeVisible()
      await expect(page.locator('[data-testid="booking-item"]').first()).toBeVisible()
    })
  })

  test('Movie Review and Rating Flow', async ({ page }) => {
    // Login first
    await test.step('Login as registered user', async () => {
      await page.click('[data-testid="login-button"]')
      await page.fill('[data-testid="login-email"]', 'user@test.cinebook.com')
      await page.fill('[data-testid="login-password"]', 'UserTest123!')
      await page.click('[data-testid="login-submit"]')
      
      await page.waitForSelector('[data-testid="user-profile-menu"]')
    })

    // Navigate to movie and add review
    await test.step('Add movie review and rating', async () => {
      await page.goto('/movies')
      await page.click('[data-testid="movie-card"]')
      
      // Scroll to reviews section
      await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded()
      
      // Add rating (5 stars)
      await page.click('[data-testid="star-rating-5"]')
      
      // Add review comment
      await page.fill('[data-testid="review-comment"]', 'Amazing movie! Great action sequences and compelling storyline.')
      
      // Submit review
      await page.click('[data-testid="submit-review"]')
      
      // Verify review submitted (pending approval)
      await expect(page.locator('[data-testid="review-pending-message"]')).toBeVisible()
    })
  })

  test('Responsive Mobile User Journey', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await test.step('Mobile navigation and booking', async () => {
      // Test mobile navigation
      await page.click('[data-testid="mobile-menu-toggle"]')
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
      
      await page.click('[data-testid="mobile-menu-movies"]')
      await page.waitForURL('**/movies')
      
      // Mobile movie browsing
      await expect(page.locator('[data-testid="movie-card"]')).toBeVisible()
      
      // Mobile seat selection
      await page.click('[data-testid="movie-card"]')
      await page.click('[data-testid="book-showtime"]')
      
      // Touch-friendly seat selection
      await page.tap('[data-testid="seat-C3"]')
      await expect(page.locator('[data-testid="seat-C3"][data-selected="true"]')).toBeVisible()
      
      // Mobile checkout
      await page.click('[data-testid="continue-checkout"]')
      await expect(page.locator('[data-testid="mobile-checkout-form"]')).toBeVisible()
    })
  })

  test('Error Handling and Edge Cases', async ({ page }) => {
    await test.step('Test seat selection conflicts', async () => {
      await page.goto('/movies')
      await page.click('[data-testid="movie-card"]')
      await page.click('[data-testid="book-showtime"]')
      
      // Try to select already occupied seat
      await page.click('[data-testid="seat-occupied"]')
      await expect(page.locator('[data-testid="seat-unavailable-message"]')).toBeVisible()
    })

    await test.step('Test network error handling', async () => {
      // Simulate network failure during checkout
      await page.route('**/api/bookings', route => route.abort())
      
      await page.goto('/booking/checkout')
      await page.fill('[data-testid="customer-name"]', 'Test User')
      await page.fill('[data-testid="customer-email"]', 'test@example.com')
      await page.click('[data-testid="complete-booking"]')
      
      // Should show error message
      await expect(page.locator('[data-testid="network-error-message"]')).toBeVisible()
    })

    await test.step('Test form validation errors', async () => {
      await page.goto('/auth/register')
      
      // Submit empty form
      await page.click('[data-testid="register-submit"]')
      
      // Should show validation errors
      await expect(page.locator('[data-testid="name-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible()
    })
  })

  test('Performance and Loading States', async ({ page }) => {
    await test.step('Test loading states and performance', async () => {
      // Monitor network requests
      const responses: any[] = []
      page.on('response', response => {
        if (response.url().includes('/api/')) {
          responses.push({
            url: response.url(),
            status: response.status(),
            time: Date.now()
          })
        }
      })

      await page.goto('/')
      
      // Check that loading states are shown
      await expect(page.locator('[data-testid="loading-skeleton"]')).toBeVisible()
      
      // Wait for content to load
      await page.waitForSelector('[data-testid="homepage-hero"]')
      
      // Verify API responses
      expect(responses.some(r => r.status === 200)).toBeTruthy()
    })

    await test.step('Test image loading and optimization', async () => {
      await page.goto('/movies')
      
      // Check that movie posters load
      const posterImages = page.locator('[data-testid="movie-poster"] img')
      const count = await posterImages.count()
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(posterImages.nth(i)).toHaveAttribute('src', /.+/)
      }
    })
  })
})