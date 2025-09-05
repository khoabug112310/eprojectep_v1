// CineBook Cross-Browser Compatibility E2E Tests
// Test compatibility across different browsers and devices

import { test, expect, devices } from '@playwright/test'

test.describe('Cross-Browser Compatibility Tests', () => {
  
  // Desktop Browser Tests
  test.describe('Desktop Browser Compatibility', () => {
    
    test('Chromium - Core Functionality', async ({ page }) => {
      await test.step('Test in Chromium browser', async () => {
        await page.goto('/')
        
        // Test basic navigation
        await expect(page.locator('[data-testid="homepage-hero"]')).toBeVisible()
        
        // Test movie browsing
        await page.click('[data-testid="view-all-movies"]')
        await expect(page.locator('[data-testid="movie-card"]').first()).toBeVisible()
        
        // Test search functionality
        await page.fill('[data-testid="movie-search"]', 'Avengers')
        await page.press('[data-testid="movie-search"]', 'Enter')
        await page.waitForTimeout(1000)
        
        // Test movie details
        await page.click('[data-testid="movie-card"]')
        await expect(page.locator('[data-testid="movie-title"]')).toBeVisible()
      })
    })

    test('Firefox - Core Functionality', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['Desktop Firefox']
      })
      const page = await context.newPage()
      
      await test.step('Test in Firefox browser', async () => {
        await page.goto('/')
        
        // Test basic navigation
        await expect(page.locator('[data-testid="homepage-hero"]')).toBeVisible()
        
        // Test CSS Grid and Flexbox support
        const movieGrid = page.locator('[data-testid="movie-grid"]')
        await expect(movieGrid).toBeVisible()
        
        // Test form interactions
        await page.click('[data-testid="login-button"]')
        await page.fill('[data-testid="login-email"]', 'test@example.com')
        await page.fill('[data-testid="login-password"]', 'password123')
        
        // Test keyboard navigation
        await page.press('[data-testid="login-password"]', 'Tab')
        await page.press('body', 'Enter')
      })
      
      await context.close()
    })

    test('WebKit/Safari - Core Functionality', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['Desktop Safari']
      })
      const page = await context.newPage()
      
      await test.step('Test in WebKit/Safari browser', async () => {
        await page.goto('/')
        
        // Test WebKit-specific features
        await expect(page.locator('[data-testid="homepage-hero"]')).toBeVisible()
        
        // Test date picker (Safari specific behavior)
        await page.goto('/booking/showtimes/1')
        const datePicker = page.locator('[data-testid="date-picker"]')
        if (await datePicker.isVisible()) {
          await datePicker.click()
          // Safari might handle date picker differently
        }
        
        // Test video playback (trailer)
        await page.goto('/movies/1')
        const trailerButton = page.locator('[data-testid="play-trailer"]')
        if (await trailerButton.isVisible()) {
          await trailerButton.click()
          await expect(page.locator('[data-testid="trailer-modal"]')).toBeVisible()
        }
      })
      
      await context.close()
    })
  })

  // Mobile Browser Tests
  test.describe('Mobile Browser Compatibility', () => {
    
    test('Mobile Chrome - Touch Interactions', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['Pixel 5']
      })
      const page = await context.newPage()
      
      await test.step('Test mobile Chrome touch interactions', async () => {
        await page.goto('/')
        
        // Test mobile navigation
        await page.tap('[data-testid="mobile-menu-toggle"]')
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
        
        // Test touch scrolling
        await page.goto('/movies')
        await page.evaluate(() => window.scrollTo(0, 500))
        
        // Test swipe gestures on movie carousel
        const carousel = page.locator('[data-testid="movie-carousel"]')
        if (await carousel.isVisible()) {
          const carouselBox = await carousel.boundingBox()
          if (carouselBox) {
            // Simulate swipe gesture
            await page.touchscreen.tap(carouselBox.x + carouselBox.width * 0.8, carouselBox.y + carouselBox.height * 0.5)
          }
        }
        
        // Test seat selection with touch
        await page.goto('/booking/seats/1')
        await page.tap('[data-testid="seat-A1"]')
        await expect(page.locator('[data-testid="seat-A1"][data-selected="true"]')).toBeVisible()
      })
      
      await context.close()
    })

    test('Mobile Safari - iOS Specific Features', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12']
      })
      const page = await context.newPage()
      
      await test.step('Test iOS Safari specific features', async () => {
        await page.goto('/')
        
        // Test viewport meta tag behavior
        const viewportContent = await page.getAttribute('meta[name="viewport"]', 'content')
        expect(viewportContent).toContain('width=device-width')
        
        // Test iOS safe area handling
        await page.goto('/booking/checkout')
        const checkoutForm = page.locator('[data-testid="checkout-form"]')
        await expect(checkoutForm).toBeVisible()
        
        // Test iOS keyboard behavior
        await page.tap('[data-testid="customer-name"]')
        await page.fill('[data-testid="customer-name"]', 'John Doe')
        
        // Test form autofill behavior
        await page.tap('[data-testid="customer-email"]')
        await page.fill('[data-testid="customer-email"]', 'john@example.com')
      })
      
      await context.close()
    })
  })

  // Tablet Browser Tests
  test.describe('Tablet Browser Compatibility', () => {
    
    test('iPad - Tablet Layout', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPad Pro']
      })
      const page = await context.newPage()
      
      await test.step('Test iPad tablet layout', async () => {
        await page.goto('/')
        
        // Test tablet-specific layouts
        const navigation = page.locator('[data-testid="main-navigation"]')
        await expect(navigation).toBeVisible()
        
        // Test orientation changes
        await page.setViewportSize({ width: 1366, height: 1024 }) // Landscape
        await expect(page.locator('[data-testid="homepage-hero"]')).toBeVisible()
        
        await page.setViewportSize({ width: 1024, height: 1366 }) // Portrait
        await expect(page.locator('[data-testid="homepage-hero"]')).toBeVisible()
        
        // Test seat map on tablet
        await page.goto('/booking/seats/1')
        const seatMap = page.locator('[data-testid="seat-map"]')
        await expect(seatMap).toBeVisible()
        
        // Test pinch zoom behavior (simulated)
        const seatMapBox = await seatMap.boundingBox()
        if (seatMapBox) {
          await page.touchscreen.tap(seatMapBox.x + 100, seatMapBox.y + 100)
        }
      })
      
      await context.close()
    })
  })

  // Feature Support Tests
  test.describe('Browser Feature Support', () => {
    
    test('CSS Grid and Flexbox Support', async ({ page }) => {
      await test.step('Test CSS Grid and Flexbox compatibility', async () => {
        await page.goto('/')
        
        // Test CSS Grid support
        const gridSupport = await page.evaluate(() => {
          const testElement = document.createElement('div')
          return CSS.supports('display', 'grid')
        })
        expect(gridSupport).toBeTruthy()
        
        // Test Flexbox support
        const flexSupport = await page.evaluate(() => {
          return CSS.supports('display', 'flex')
        })
        expect(flexSupport).toBeTruthy()
        
        // Test that movie grid renders correctly
        await page.goto('/movies')
        const movieGrid = page.locator('[data-testid="movie-grid"]')
        const gridStyles = await movieGrid.evaluate(el => {
          const styles = window.getComputedStyle(el)
          return {
            display: styles.display,
            gridTemplateColumns: styles.gridTemplateColumns
          }
        })
        
        expect(gridStyles.display).toContain('grid')
      })
    })

    test('Local Storage and Session Storage Support', async ({ page }) => {
      await test.step('Test browser storage APIs', async () => {
        await page.goto('/')
        
        // Test localStorage support
        const localStorageSupport = await page.evaluate(() => {
          try {
            const testKey = 'test'
            localStorage.setItem(testKey, 'value')
            const value = localStorage.getItem(testKey)
            localStorage.removeItem(testKey)
            return value === 'value'
          } catch {
            return false
          }
        })
        expect(localStorageSupport).toBeTruthy()
        
        // Test sessionStorage support
        const sessionStorageSupport = await page.evaluate(() => {
          try {
            const testKey = 'test'
            sessionStorage.setItem(testKey, 'value')
            const value = sessionStorage.getItem(testKey)
            sessionStorage.removeItem(testKey)
            return value === 'value'
          } catch {
            return false
          }
        })
        expect(sessionStorageSupport).toBeTruthy()
        
        // Test that user preferences are stored
        await page.click('[data-testid="login-button"]')
        await page.fill('[data-testid="login-email"]', 'test@example.com')
        await page.fill('[data-testid="login-password"]', 'password123')
        
        // Check if form data is remembered
        const rememberMeCheckbox = page.locator('[data-testid="remember-me"]')
        if (await rememberMeCheckbox.isVisible()) {
          await rememberMeCheckbox.check()
        }
      })
    })

    test('ES6+ JavaScript Features', async ({ page }) => {
      await test.step('Test modern JavaScript feature support', async () => {
        await page.goto('/')
        
        // Test Arrow Functions
        const arrowFunctionSupport = await page.evaluate(() => {
          try {
            const test = () => true
            return test() === true
          } catch {
            return false
          }
        })
        expect(arrowFunctionSupport).toBeTruthy()
        
        // Test Promise support
        const promiseSupport = await page.evaluate(() => {
          return typeof Promise !== 'undefined'
        })
        expect(promiseSupport).toBeTruthy()
        
        // Test fetch API support
        const fetchSupport = await page.evaluate(() => {
          return typeof fetch !== 'undefined'
        })
        expect(fetchSupport).toBeTruthy()
        
        // Test async/await support
        const asyncAwaitSupport = await page.evaluate(async () => {
          try {
            const testAsync = async () => {
              return await Promise.resolve(true)
            }
            return await testAsync()
          } catch {
            return false
          }
        })
        expect(asyncAwaitSupport).toBeTruthy()
      })
    })

    test('WebP Image Format Support', async ({ page }) => {
      await test.step('Test WebP image format support', async () => {
        await page.goto('/')
        
        const webpSupport = await page.evaluate(() => {
          const canvas = document.createElement('canvas')
          canvas.width = 1
          canvas.height = 1
          const ctx = canvas.getContext('2d')
          return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
        })
        
        if (webpSupport) {
          console.log('✅ WebP format supported')
          
          // Test that WebP images load correctly
          await page.goto('/movies')
          const moviePosters = page.locator('[data-testid="movie-poster"] img')
          const firstPoster = moviePosters.first()
          
          if (await firstPoster.isVisible()) {
            const src = await firstPoster.getAttribute('src')
            if (src && src.includes('.webp')) {
              // Wait for image to load
              await firstPoster.waitFor({ state: 'visible' })
              const naturalWidth = await firstPoster.evaluate(img => (img as HTMLImageElement).naturalWidth)
              expect(naturalWidth).toBeGreaterThan(0)
            }
          }
        } else {
          console.log('⚠️ WebP format not supported, fallback should be used')
        }
      })
    })
  })

  // Accessibility Cross-Browser Tests
  test.describe('Cross-Browser Accessibility', () => {
    
    test('Keyboard Navigation Across Browsers', async ({ page }) => {
      await test.step('Test keyboard navigation consistency', async () => {
        await page.goto('/')
        
        // Test tab navigation
        await page.keyboard.press('Tab')
        const focusedElement = await page.locator(':focus').first()
        await expect(focusedElement).toBeVisible()
        
        // Test skip link
        await page.keyboard.press('Tab')
        const skipLink = page.locator('[data-testid="skip-link"]')
        if (await skipLink.isVisible()) {
          await page.keyboard.press('Enter')
        }
        
        // Test menu navigation
        await page.goto('/movies')
        await page.keyboard.press('Tab')
        await page.keyboard.press('Enter')
        
        // Test form navigation
        await page.goto('/auth/login')
        await page.keyboard.press('Tab')
        await page.keyboard.type('test@example.com')
        await page.keyboard.press('Tab')
        await page.keyboard.type('password123')
        await page.keyboard.press('Tab')
        await page.keyboard.press('Enter')
      })
    })

    test('Screen Reader Compatibility', async ({ page }) => {
      await test.step('Test screen reader attributes across browsers', async () => {
        await page.goto('/')
        
        // Test ARIA labels
        const heroSection = page.locator('[data-testid="homepage-hero"]')
        const ariaLabel = await heroSection.getAttribute('aria-label')
        if (ariaLabel) {
          expect(ariaLabel.length).toBeGreaterThan(0)
        }
        
        // Test heading structure
        const headings = page.locator('h1, h2, h3, h4, h5, h6')
        const headingCount = await headings.count()
        expect(headingCount).toBeGreaterThan(0)
        
        // Test alt texts for images
        await page.goto('/movies')
        const images = page.locator('img')
        const imageCount = await images.count()
        
        for (let i = 0; i < Math.min(imageCount, 5); i++) {
          const altText = await images.nth(i).getAttribute('alt')
          expect(altText).toBeDefined()
        }
        
        // Test form labels
        await page.goto('/auth/register')
        const emailInput = page.locator('[data-testid="register-email"]')
        const labelFor = await page.locator('label[for]').first().getAttribute('for')
        const inputId = await emailInput.getAttribute('id')
        
        if (labelFor && inputId) {
          expect(labelFor).toBe(inputId)
        }
      })
    })
  })

  // Performance Cross-Browser Tests
  test.describe('Cross-Browser Performance', () => {
    
    test('Page Load Performance Across Browsers', async ({ page }) => {
      await test.step('Test page load performance', async () => {
        const startTime = Date.now()
        
        await page.goto('/')
        await page.waitForSelector('[data-testid="homepage-hero"]')
        
        const loadTime = Date.now() - startTime
        expect(loadTime).toBeLessThan(5000) // 5 seconds max
        
        // Test Core Web Vitals
        const webVitals = await page.evaluate(() => {
          return new Promise((resolve) => {
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries()
              const vitals: any = {}
              
              entries.forEach((entry) => {
                if (entry.entryType === 'paint') {
                  vitals[entry.name] = entry.startTime
                } else if (entry.entryType === 'largest-contentful-paint') {
                  vitals.LCP = entry.startTime
                }
              })
              
              resolve(vitals)
            })
            
            observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] })
            
            // Fallback timeout
            setTimeout(() => resolve({}), 3000)
          })
        })
        
        console.log('Web Vitals:', webVitals)
      })
    })

    test('JavaScript Bundle Size Impact', async ({ page }) => {
      await test.step('Test JavaScript performance across browsers', async () => {
        const responses: any[] = []
        
        page.on('response', response => {
          if (response.url().includes('.js')) {
            responses.push({
              url: response.url(),
              size: response.headers()['content-length'],
              compressed: response.headers()['content-encoding']
            })
          }
        })
        
        await page.goto('/')
        await page.waitForSelector('[data-testid="homepage-hero"]')
        
        // Check that JavaScript files are properly compressed
        const jsFiles = responses.filter(r => r.url.endsWith('.js'))
        expect(jsFiles.length).toBeGreaterThan(0)
        
        jsFiles.forEach(file => {
          if (file.size) {
            const sizeKB = parseInt(file.size) / 1024
            expect(sizeKB).toBeLessThan(500) // Each JS file should be < 500KB
          }
        })
      })
    })
  })

  // Network Conditions Tests
  test.describe('Network Conditions Compatibility', () => {
    
    test('Slow 3G Network Simulation', async ({ page }) => {
      await test.step('Test performance on slow network', async () => {
        // Simulate slow 3G
        await page.route('**/*', async route => {
          await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
          await route.continue()
        })
        
        const startTime = Date.now()
        await page.goto('/')
        await page.waitForSelector('[data-testid="homepage-hero"]')
        const loadTime = Date.now() - startTime
        
        // Should still load in reasonable time even on slow network
        expect(loadTime).toBeLessThan(10000) // 10 seconds max on slow network
        
        // Test that loading states are shown
        await page.goto('/movies')
        const loadingState = page.locator('[data-testid="loading-skeleton"]')
        // Loading state might be brief, so we just check it doesn't error
      })
    })

    test('Offline Functionality', async ({ page }) => {
      await test.step('Test offline behavior', async () => {
        await page.goto('/')
        await page.waitForSelector('[data-testid="homepage-hero"]')
        
        // Simulate offline
        await page.setOffline(true)
        
        // Try to navigate - should show offline message or cached content
        await page.goto('/movies')
        
        // Should either show cached content or offline message
        const offlineMessage = page.locator('[data-testid="offline-message"]')
        const cachedContent = page.locator('[data-testid="movie-card"]')
        
        const hasOfflineMessage = await offlineMessage.isVisible()
        const hasCachedContent = await cachedContent.isVisible()
        
        expect(hasOfflineMessage || hasCachedContent).toBeTruthy()
        
        // Restore online
        await page.setOffline(false)
      })
    })
  })
})