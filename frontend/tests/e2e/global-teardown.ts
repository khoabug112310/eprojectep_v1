// CineBook E2E Global Teardown
// Clean up test environment and data

import { chromium, FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting CineBook E2E Test Cleanup...')
  
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    const baseURL = config.webServer?.url || 'http://localhost:3000'
    
    // Login as admin for cleanup
    await page.goto(`${baseURL}/admin/login`)
    await page.fill('[data-testid="admin-login-email"]', 'admin@test.cinebook.com')
    await page.fill('[data-testid="admin-login-password"]', 'AdminTest123!')
    await page.click('[data-testid="admin-login-submit"]')
    
    // Wait for admin dashboard
    await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 })
    
    // Clean up test data
    console.log('🗑️ Cleaning up test data...')
    await cleanupTestData(page)
    
    // Clean up test users (optional - might want to keep for future runs)
    console.log('👥 Cleaning up test users...')
    await cleanupTestUsers(page)
    
    // Generate test report summary
    console.log('📊 Generating test summary...')
    await generateTestSummary()
    
    console.log('✅ E2E Test Cleanup Complete!')
    
  } catch (error) {
    console.error('❌ E2E Test Cleanup Failed:', error)
  } finally {
    await browser.close()
  }
}

async function cleanupTestData(page: any) {
  try {
    // Clean up test showtimes
    await page.goto('/admin/showtimes')
    const showtimeRows = await page.locator('[data-testid*="showtime-row"]').count()
    
    for (let i = 0; i < showtimeRows; i++) {
      const deleteButton = page.locator('[data-testid*="showtime-delete"]').first()
      if (await deleteButton.isVisible()) {
        await deleteButton.click()
        await page.click('[data-testid="confirm-delete"]')
        await page.waitForTimeout(1000)
      }
    }
    
    // Clean up test movies
    await page.goto('/admin/movies')
    const movieRows = await page.locator('[data-testid*="movie-row"]').count()
    
    for (let i = 0; i < movieRows; i++) {
      const deleteButton = page.locator('[data-testid*="movie-delete"]').first()
      if (await deleteButton.isVisible()) {
        await deleteButton.click()
        await page.click('[data-testid="confirm-delete"]')
        await page.waitForTimeout(1000)
      }
    }
    
    // Clean up test theaters
    await page.goto('/admin/theaters')
    const theaterRows = await page.locator('[data-testid*="theater-row"]').count()
    
    for (let i = 0; i < theaterRows; i++) {
      const deleteButton = page.locator('[data-testid*="theater-delete"]').first()
      if (await deleteButton.isVisible()) {
        await deleteButton.click()
        await page.click('[data-testid="confirm-delete"]')
        await page.waitForTimeout(1000)
      }
    }
    
    console.log('✅ Test data cleaned up successfully')
    
  } catch (error) {
    console.log('⚠️ Failed to clean up test data:', error)
  }
}

async function cleanupTestUsers(page: any) {
  try {
    // Navigate to user management
    await page.goto('/admin/users')
    
    // Find and delete test users
    const testUserEmails = ['user@test.cinebook.com', 'admin@test.cinebook.com']
    
    for (const email of testUserEmails) {
      try {
        // Search for user by email
        await page.fill('[data-testid="user-search"]', email)
        await page.click('[data-testid="user-search-submit"]')
        
        // Delete user if found
        const deleteButton = page.locator('[data-testid*="user-delete"]').first()
        if (await deleteButton.isVisible()) {
          await deleteButton.click()
          await page.click('[data-testid="confirm-delete"]')
          await page.waitForTimeout(1000)
          console.log(`✅ Test user ${email} deleted`)
        }
      } catch (error) {
        console.log(`⚠️ Could not delete user ${email}:`, error)
      }
    }
    
  } catch (error) {
    console.log('⚠️ Failed to clean up test users:', error)
  }
}

async function generateTestSummary() {
  try {
    const fs = require('fs')
    const path = require('path')
    
    // Read test results
    const resultsPath = path.join(process.cwd(), 'test-results', 'results.json')
    
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'))
      
      const summary = {
        timestamp: new Date().toISOString(),
        total: results.suites?.length || 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        environment: process.env.NODE_ENV || 'development',
        browsers: ['chromium', 'firefox', 'webkit', 'Mobile Chrome', 'Mobile Safari']
      }
      
      // Calculate summary statistics
      if (results.suites) {
        results.suites.forEach((suite: any) => {
          if (suite.specs) {
            suite.specs.forEach((spec: any) => {
              if (spec.tests) {
                spec.tests.forEach((test: any) => {
                  test.results?.forEach((result: any) => {
                    switch (result.status) {
                      case 'passed':
                        summary.passed++
                        break
                      case 'failed':
                        summary.failed++
                        break
                      case 'skipped':
                        summary.skipped++
                        break
                    }
                    summary.duration += result.duration || 0
                  })
                })
              }
            })
          }
        })
      }
      
      // Write summary
      const summaryPath = path.join(process.cwd(), 'test-results', 'summary.json')
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
      
      console.log('📊 Test Summary:', summary)
      
      // Console output
      console.log(`
╔══════════════════════════════════════╗
║           E2E TEST SUMMARY           ║
╠══════════════════════════════════════╣
║ Total Tests: ${summary.total.toString().padEnd(23)} ║
║ Passed:      ${summary.passed.toString().padEnd(23)} ║
║ Failed:      ${summary.failed.toString().padEnd(23)} ║
║ Skipped:     ${summary.skipped.toString().padEnd(23)} ║
║ Duration:    ${(summary.duration / 1000).toFixed(2)}s${' '.repeat(18)} ║
╚══════════════════════════════════════╝
      `)
      
    }
    
  } catch (error) {
    console.log('⚠️ Failed to generate test summary:', error)
  }
}

export default globalTeardown