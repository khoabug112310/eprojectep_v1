// CineBook E2E Admin Journey Tests
// Comprehensive admin workflow testing

import { test, expect } from '@playwright/test'

test.describe('Admin Journey Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Admin login
    await page.goto('/admin/login')
    await page.fill('[data-testid="admin-login-email"]', 'admin@test.cinebook.com')
    await page.fill('[data-testid="admin-login-password"]', 'AdminTest123!')
    await page.click('[data-testid="admin-login-submit"]')
    
    // Wait for admin dashboard
    await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 })
  })

  test('Complete Admin Dashboard Overview', async ({ page }) => {
    await test.step('Verify dashboard metrics and overview', async () => {
      // Check main dashboard elements
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible()
      
      // Verify metrics cards
      await expect(page.locator('[data-testid="revenue-card"]')).toBeVisible()
      await expect(page.locator('[data-testid="bookings-card"]')).toBeVisible()
      await expect(page.locator('[data-testid="movies-card"]')).toBeVisible()
      await expect(page.locator('[data-testid="users-card"]')).toBeVisible()
      
      // Check charts section
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="popular-movies-chart"]')).toBeVisible()
      
      // Verify recent activity
      await expect(page.locator('[data-testid="recent-bookings"]')).toBeVisible()
    })

    await test.step('Navigate through admin sections', async () => {
      // Test navigation to different admin sections
      await page.click('[data-testid="nav-movies"]')
      await expect(page.locator('[data-testid="movies-management"]')).toBeVisible()
      
      await page.click('[data-testid="nav-theaters"]')
      await expect(page.locator('[data-testid="theaters-management"]')).toBeVisible()
      
      await page.click('[data-testid="nav-showtimes"]')
      await expect(page.locator('[data-testid="showtimes-management"]')).toBeVisible()
      
      await page.click('[data-testid="nav-bookings"]')
      await expect(page.locator('[data-testid="bookings-management"]')).toBeVisible()
    })
  })

  test('Theater Management Workflow', async ({ page }) => {
    await test.step('Navigate to theater management', async () => {
      await page.click('[data-testid="nav-theaters"]')
      await expect(page.locator('[data-testid="theaters-management"]')).toBeVisible()
    })

    await test.step('Create new theater', async () => {
      await page.click('[data-testid="add-theater-btn"]')
      await expect(page.locator('[data-testid="theater-form-modal"]')).toBeVisible()
      
      // Fill theater information
      await page.fill('[data-testid="theater-name"]', 'Galaxy Test Cinema')
      await page.fill('[data-testid="theater-address"]', '123 Test Street, District 1')
      await page.selectOption('[data-testid="theater-city"]', 'Ho Chi Minh City')
      await page.fill('[data-testid="theater-total-seats"]', '200')
      
      // Configure seat categories
      await page.fill('[data-testid="gold-seats"]', '120')
      await page.fill('[data-testid="platinum-seats"]', '60')
      await page.fill('[data-testid="box-seats"]', '20')
      
      // Add facilities
      await page.check('[data-testid="facility-3d"]')
      await page.check('[data-testid="facility-imax"]')
      await page.check('[data-testid="facility-dolby"]')
      
      // Submit form
      await page.click('[data-testid="save-theater"]')
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Theater created successfully')
    })

    await test.step('Edit existing theater', async () => {
      // Find and edit the created theater
      await page.click('[data-testid="theater-edit-btn"]')
      await expect(page.locator('[data-testid="theater-form-modal"]')).toBeVisible()
      
      // Update theater name
      await page.fill('[data-testid="theater-name"]', 'Galaxy Test Cinema - Updated')
      
      // Update total seats
      await page.fill('[data-testid="theater-total-seats"]', '220')
      await page.fill('[data-testid="gold-seats"]', '130')
      
      // Save changes
      await page.click('[data-testid="save-theater"]')
      
      // Verify update success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Theater updated successfully')
    })

    await test.step('View theater details', async () => {
      await page.click('[data-testid="theater-view-btn"]')
      await expect(page.locator('[data-testid="theater-details-modal"]')).toBeVisible()
      
      // Verify theater information
      await expect(page.locator('[data-testid="theater-name-display"]')).toContainText('Galaxy Test Cinema - Updated')
      await expect(page.locator('[data-testid="total-seats-display"]')).toContainText('220')
      
      // Check facilities display
      await expect(page.locator('[data-testid="facility-3d-display"]')).toBeVisible()
      await expect(page.locator('[data-testid="facility-imax-display"]')).toBeVisible()
    })
  })

  test('Movie Management Workflow', async ({ page }) => {
    await test.step('Navigate to movie management', async () => {
      await page.click('[data-testid="nav-movies"]')
      await expect(page.locator('[data-testid="movies-management"]')).toBeVisible()
    })

    await test.step('Create new movie', async () => {
      await page.click('[data-testid="add-movie-btn"]')
      await expect(page.locator('[data-testid="movie-form-modal"]')).toBeVisible()
      
      // Fill basic movie information
      await page.fill('[data-testid="movie-title"]', 'Test Movie: Epic Adventure')
      await page.fill('[data-testid="movie-synopsis"]', 'An epic adventure movie for testing purposes with amazing action sequences.')
      await page.fill('[data-testid="movie-duration"]', '150')
      await page.selectOption('[data-testid="movie-language"]', 'English')
      await page.selectOption('[data-testid="movie-rating"]', 'PG-13')
      await page.fill('[data-testid="movie-release-date"]', '2024-02-15')
      
      // Select genres
      await page.check('[data-testid="genre-action"]')
      await page.check('[data-testid="genre-adventure"]')
      
      // Add cast and crew
      await page.fill('[data-testid="movie-director"]', 'Test Director')
      await page.fill('[data-testid="movie-cast"]', 'Actor One, Actor Two, Actor Three')
      
      // Add trailer URL
      await page.fill('[data-testid="movie-trailer"]', 'https://www.youtube.com/watch?v=test123')
      
      // Upload poster (simulate file upload)
      const fileInput = page.locator('[data-testid="movie-poster-upload"]')
      await fileInput.setInputFiles('./tests/fixtures/test-poster.jpg')
      
      // Submit form
      await page.click('[data-testid="save-movie"]')
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Movie created successfully')
    })

    await test.step('Search and filter movies', async () => {
      // Test search functionality
      await page.fill('[data-testid="movie-search"]', 'Test Movie')
      await page.press('[data-testid="movie-search"]', 'Enter')
      
      // Verify search results
      await expect(page.locator('[data-testid="movie-row"]')).toContainText('Test Movie: Epic Adventure')
      
      // Test genre filter
      await page.selectOption('[data-testid="filter-genre"]', 'Action')
      await page.waitForTimeout(1000)
      
      // Test status filter
      await page.selectOption('[data-testid="filter-status"]', 'active')
      await page.waitForTimeout(1000)
    })

    await test.step('Edit movie information', async () => {
      await page.click('[data-testid="movie-edit-btn"]')
      await expect(page.locator('[data-testid="movie-form-modal"]')).toBeVisible()
      
      // Update movie information
      await page.fill('[data-testid="movie-title"]', 'Test Movie: Epic Adventure - Updated')
      await page.fill('[data-testid="movie-duration"]', '165')
      
      // Add additional genre
      await page.check('[data-testid="genre-drama"]')
      
      // Update synopsis
      await page.fill('[data-testid="movie-synopsis"]', 'Updated synopsis with more detailed description of the epic adventure.')
      
      // Save changes
      await page.click('[data-testid="save-movie"]')
      
      // Verify update
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Movie updated successfully')
    })
  })

  test('Showtime Management Workflow', async ({ page }) => {
    await test.step('Navigate to showtime management', async () => {
      await page.click('[data-testid="nav-showtimes"]')
      await expect(page.locator('[data-testid="showtimes-management"]')).toBeVisible()
    })

    await test.step('Create new showtime', async () => {
      await page.click('[data-testid="add-showtime-btn"]')
      await expect(page.locator('[data-testid="showtime-form-modal"]')).toBeVisible()
      
      // Select movie
      await page.selectOption('[data-testid="showtime-movie"]', 'Test Movie: Epic Adventure - Updated')
      
      // Select theater
      await page.selectOption('[data-testid="showtime-theater"]', 'Galaxy Test Cinema - Updated')
      
      // Set date and time
      await page.fill('[data-testid="showtime-date"]', '2024-02-20')
      await page.fill('[data-testid="showtime-time"]', '19:00')
      
      // Set pricing
      await page.fill('[data-testid="price-gold"]', '120000')
      await page.fill('[data-testid="price-platinum"]', '150000')
      await page.fill('[data-testid="price-box"]', '200000')
      
      // Submit showtime
      await page.click('[data-testid="save-showtime"]')
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Showtime created successfully')
    })

    await test.step('View showtimes in calendar', async () => {
      // Switch to calendar view
      await page.click('[data-testid="calendar-view-btn"]')
      await expect(page.locator('[data-testid="showtime-calendar"]')).toBeVisible()
      
      // Navigate to showtime date
      await page.click('[data-testid="calendar-date-2024-02-20"]')
      
      // Verify showtime appears
      await expect(page.locator('[data-testid="showtime-item"]')).toContainText('Test Movie: Epic Adventure')
      await expect(page.locator('[data-testid="showtime-item"]')).toContainText('19:00')
    })

    await test.step('Edit showtime', async () => {
      await page.click('[data-testid="showtime-edit-btn"]')
      await expect(page.locator('[data-testid="showtime-form-modal"]')).toBeVisible()
      
      // Update time
      await page.fill('[data-testid="showtime-time"]', '21:00')
      
      // Update pricing
      await page.fill('[data-testid="price-gold"]', '130000')
      await page.fill('[data-testid="price-platinum"]', '160000')
      
      // Save changes
      await page.click('[data-testid="save-showtime"]')
      
      // Verify update
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Showtime updated successfully')
    })
  })

  test('Booking Management and Analytics', async ({ page }) => {
    await test.step('Navigate to booking management', async () => {
      await page.click('[data-testid="nav-bookings"]')
      await expect(page.locator('[data-testid="bookings-management"]')).toBeVisible()
    })

    await test.step('View and filter bookings', async () => {
      // Check bookings list
      await expect(page.locator('[data-testid="bookings-table"]')).toBeVisible()
      
      // Test date range filter
      await page.fill('[data-testid="filter-date-from"]', '2024-02-01')
      await page.fill('[data-testid="filter-date-to"]', '2024-02-29')
      await page.click('[data-testid="apply-date-filter"]')
      
      // Test status filter
      await page.selectOption('[data-testid="filter-status"]', 'confirmed')
      await page.waitForTimeout(1000)
      
      // Test search by booking code
      await page.fill('[data-testid="booking-search"]', 'BK')
      await page.press('[data-testid="booking-search"]', 'Enter')
    })

    await test.step('View booking details', async () => {
      await page.click('[data-testid="booking-view-btn"]')
      await expect(page.locator('[data-testid="booking-details-modal"]')).toBeVisible()
      
      // Verify booking information
      await expect(page.locator('[data-testid="booking-code-display"]')).toBeVisible()
      await expect(page.locator('[data-testid="customer-info-display"]')).toBeVisible()
      await expect(page.locator('[data-testid="movie-info-display"]')).toBeVisible()
      await expect(page.locator('[data-testid="seats-info-display"]')).toBeVisible()
      await expect(page.locator('[data-testid="payment-info-display"]')).toBeVisible()
    })

    await test.step('Manage booking status', async () => {
      // Cancel a booking
      await page.click('[data-testid="booking-cancel-btn"]')
      await expect(page.locator('[data-testid="cancel-confirmation-modal"]')).toBeVisible()
      
      await page.fill('[data-testid="cancellation-reason"]', 'Customer request for cancellation')
      await page.click('[data-testid="confirm-cancellation"]')
      
      // Verify cancellation
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Booking cancelled successfully')
    })
  })

  test('Reports and Analytics Workflow', async ({ page }) => {
    await test.step('Navigate to reports section', async () => {
      await page.click('[data-testid="nav-reports"]')
      await expect(page.locator('[data-testid="reports-dashboard"]')).toBeVisible()
    })

    await test.step('Generate revenue reports', async () => {
      // Select report type
      await page.selectOption('[data-testid="report-type"]', 'revenue')
      
      // Set date range
      await page.fill('[data-testid="report-date-from"]', '2024-02-01')
      await page.fill('[data-testid="report-date-to"]', '2024-02-29')
      
      // Generate report
      await page.click('[data-testid="generate-report"]')
      
      // Verify report elements
      await expect(page.locator('[data-testid="revenue-summary"]')).toBeVisible()
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="theater-breakdown"]')).toBeVisible()
      
      // Test export functionality
      await page.click('[data-testid="export-report"]')
      // Note: File download verification would need additional setup
    })

    await test.step('View movie performance analytics', async () => {
      await page.selectOption('[data-testid="report-type"]', 'movie-performance')
      await page.click('[data-testid="generate-report"]')
      
      // Verify movie performance elements
      await expect(page.locator('[data-testid="top-movies-list"]')).toBeVisible()
      await expect(page.locator('[data-testid="movie-revenue-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="occupancy-rates"]')).toBeVisible()
    })

    await test.step('Analyze user demographics', async () => {
      await page.selectOption('[data-testid="report-type"]', 'user-analytics')
      await page.click('[data-testid="generate-report"]')
      
      // Verify user analytics
      await expect(page.locator('[data-testid="user-registrations-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="booking-patterns"]')).toBeVisible()
      await expect(page.locator('[data-testid="popular-times"]')).toBeVisible()
    })
  })

  test('System Settings and Configuration', async ({ page }) => {
    await test.step('Navigate to system settings', async () => {
      await page.click('[data-testid="nav-settings"]')
      await expect(page.locator('[data-testid="settings-dashboard"]')).toBeVisible()
    })

    await test.step('Configure system settings', async () => {
      // Update general settings
      await page.fill('[data-testid="site-name"]', 'CineBook Test System')
      await page.fill('[data-testid="support-email"]', 'support@test.cinebook.com')
      await page.fill('[data-testid="booking-timeout"]', '900') // 15 minutes
      
      // Configure pricing settings
      await page.fill('[data-testid="default-gold-price"]', '120000')
      await page.fill('[data-testid="default-platinum-price"]', '150000')
      await page.fill('[data-testid="default-box-price"]', '200000')
      
      // Update booking settings
      await page.fill('[data-testid="max-seats-per-booking"]', '8')
      await page.check('[data-testid="allow-guest-booking"]')
      await page.check('[data-testid="email-notifications"]')
      
      // Save settings
      await page.click('[data-testid="save-settings"]')
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Settings updated successfully')
    })

    await test.step('Manage user roles and permissions', async () => {
      await page.click('[data-testid="user-management-tab"]')
      
      // View users list
      await expect(page.locator('[data-testid="users-table"]')).toBeVisible()
      
      // Search for specific user
      await page.fill('[data-testid="user-search"]', 'jane.smith@test.com')
      await page.press('[data-testid="user-search"]', 'Enter')
      
      // Update user role
      await page.click('[data-testid="user-edit-btn"]')
      await page.selectOption('[data-testid="user-role"]', 'admin')
      await page.click('[data-testid="save-user"]')
      
      // Verify role update
      await expect(page.locator('[data-testid="success-message"]')).toContainText('User updated successfully')
    })
  })

  test('Admin Error Handling and Edge Cases', async ({ page }) => {
    await test.step('Test form validation in admin forms', async () => {
      // Try to create movie with missing required fields
      await page.click('[data-testid="nav-movies"]')
      await page.click('[data-testid="add-movie-btn"]')
      
      // Submit empty form
      await page.click('[data-testid="save-movie"]')
      
      // Verify validation errors
      await expect(page.locator('[data-testid="title-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="duration-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="release-date-error"]')).toBeVisible()
    })

    await test.step('Test duplicate entries prevention', async () => {
      // Try to create theater with existing name
      await page.click('[data-testid="nav-theaters"]')
      await page.click('[data-testid="add-theater-btn"]')
      
      await page.fill('[data-testid="theater-name"]', 'Galaxy Test Cinema - Updated')
      await page.fill('[data-testid="theater-address"]', '456 Another Street')
      await page.click('[data-testid="save-theater"]')
      
      // Should show duplicate error
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Theater name already exists')
    })

    await test.step('Test conflicting showtime creation', async () => {
      // Try to create overlapping showtimes
      await page.click('[data-testid="nav-showtimes"]')
      await page.click('[data-testid="add-showtime-btn"]')
      
      await page.selectOption('[data-testid="showtime-theater"]', 'Galaxy Test Cinema - Updated')
      await page.fill('[data-testid="showtime-date"]', '2024-02-20')
      await page.fill('[data-testid="showtime-time"]', '21:00') // Same as existing
      
      await page.click('[data-testid="save-showtime"]')
      
      // Should show conflict error
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Showtime conflict detected')
    })
  })
})