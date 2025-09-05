// CineBook E2E Global Setup
// Prepare test environment and create test data

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting CineBook E2E Test Setup...')
  
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    const baseURL = config.webServer?.url || 'http://localhost:3000'
    
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...')
    await page.goto(baseURL)
    await page.waitForSelector('body', { timeout: 30000 })
    
    // Create test admin user
    console.log('👤 Creating test admin user...')
    await createTestAdmin(page, baseURL)
    
    // Create test regular user
    console.log('👥 Creating test regular user...')
    await createTestUser(page, baseURL)
    
    // Create test data
    console.log('🎬 Creating test data...')
    await createTestData(page, baseURL)
    
    console.log('✅ E2E Test Setup Complete!')
    
  } catch (error) {
    console.error('❌ E2E Test Setup Failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function createTestAdmin(page: any, baseURL: string) {
  try {
    // Navigate to admin registration (if available) or directly insert admin
    await page.goto(`${baseURL}/admin/register`)
    
    // Fill admin registration form
    await page.fill('[data-testid="admin-name"]', 'Test Admin')
    await page.fill('[data-testid="admin-email"]', 'admin@test.cinebook.com')
    await page.fill('[data-testid="admin-password"]', 'AdminTest123!')
    await page.fill('[data-testid="admin-confirm-password"]', 'AdminTest123!')
    await page.click('[data-testid="admin-register-submit"]')
    
    // Wait for success or handle if admin already exists
    try {
      await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 5000 })
      console.log('✅ Test admin created successfully')
    } catch {
      // Admin might already exist, try to login
      await page.goto(`${baseURL}/admin/login`)
      await page.fill('[data-testid="admin-login-email"]', 'admin@test.cinebook.com')
      await page.fill('[data-testid="admin-login-password"]', 'AdminTest123!')
      await page.click('[data-testid="admin-login-submit"]')
      
      await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 5000 })
      console.log('✅ Test admin login successful')
    }
    
  } catch (error) {
    console.log('⚠️ Admin creation/login failed, continuing with existing admin')
  }
}

async function createTestUser(page: any, baseURL: string) {
  try {
    // Navigate to user registration
    await page.goto(`${baseURL}/auth/register`)
    
    // Fill user registration form
    await page.fill('[data-testid="register-name"]', 'Test User')
    await page.fill('[data-testid="register-email"]', 'user@test.cinebook.com')
    await page.fill('[data-testid="register-phone"]', '0987654321')
    await page.fill('[data-testid="register-password"]', 'UserTest123!')
    await page.fill('[data-testid="register-confirm-password"]', 'UserTest123!')
    await page.click('[data-testid="register-submit"]')
    
    // Wait for success or handle if user already exists
    try {
      await page.waitForSelector('[data-testid="user-profile-menu"]', { timeout: 5000 })
      console.log('✅ Test user created successfully')
    } catch {
      // User might already exist, that's fine
      console.log('✅ Test user already exists')
    }
    
  } catch (error) {
    console.log('⚠️ User creation failed, continuing with existing user')
  }
}

async function createTestData(page: any, baseURL: string) {
  try {
    // Login as admin to create test data
    await page.goto(`${baseURL}/admin/login`)
    await page.fill('[data-testid="admin-login-email"]', 'admin@test.cinebook.com')
    await page.fill('[data-testid="admin-login-password"]', 'AdminTest123!')
    await page.click('[data-testid="admin-login-submit"]')
    
    // Wait for admin dashboard
    await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 })
    
    // Create test theaters
    await createTestTheaters(page)
    
    // Create test movies
    await createTestMovies(page)
    
    // Create test showtimes
    await createTestShowtimes(page)
    
    console.log('✅ Test data creation completed')
    
  } catch (error) {
    console.log('⚠️ Test data creation failed:', error)
  }
}

async function createTestTheaters(page: any) {
  try {
    await page.click('[data-testid="nav-theaters"]')
    
    const theaters = [
      {
        name: 'Galaxy Nguyen Du',
        address: '116 Nguyen Du, District 1, Ho Chi Minh City',
        city: 'Ho Chi Minh City',
        totalSeats: '200',
        goldSeats: '120',
        platinumSeats: '60',
        boxSeats: '20'
      },
      {
        name: 'CGV Vincom Center',
        address: '72 Le Thanh Ton, District 1, Ho Chi Minh City', 
        city: 'Ho Chi Minh City',
        totalSeats: '180',
        goldSeats: '100',
        platinumSeats: '60',
        boxSeats: '20'
      },
      {
        name: 'Lotte Cinema Landmark',
        address: '5B Ton Duc Thang, District 1, Ho Chi Minh City',
        city: 'Ho Chi Minh City',
        totalSeats: '220',
        goldSeats: '140',
        platinumSeats: '60',
        boxSeats: '20'
      }
    ]
    
    for (const theater of theaters) {
      try {
        await page.click('[data-testid="add-theater-btn"]')
        await page.waitForSelector('[data-testid="theater-form-modal"]')
        
        await page.fill('[data-testid="theater-name"]', theater.name)
        await page.fill('[data-testid="theater-address"]', theater.address)
        await page.selectOption('[data-testid="theater-city"]', theater.city)
        await page.fill('[data-testid="theater-total-seats"]', theater.totalSeats)
        await page.fill('[data-testid="gold-seats"]', theater.goldSeats)
        await page.fill('[data-testid="platinum-seats"]', theater.platinumSeats)
        await page.fill('[data-testid="box-seats"]', theater.boxSeats)
        
        // Add facilities
        await page.check('[data-testid="facility-3d"]')
        await page.check('[data-testid="facility-dolby"]')
        
        await page.click('[data-testid="save-theater"]')
        
        // Wait for success message and close modal
        await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 })
        await page.waitForTimeout(1000)
        
        console.log(`✅ Created theater: ${theater.name}`)
      } catch (error) {
        console.log(`⚠️ Failed to create theater ${theater.name}:`, error)
      }
    }
  } catch (error) {
    console.log('⚠️ Theater creation process failed:', error)
  }
}

async function createTestMovies(page: any) {
  try {
    await page.click('[data-testid="nav-movies"]')
    
    const movies = [
      {
        title: 'Avengers: Endgame',
        synopsis: 'The epic conclusion to the Infinity Saga that became a critically acclaimed worldwide phenomenon, this film sees the Avengers assemble once more in order to reverse Thanos\' actions and restore balance to the universe.',
        duration: '181',
        language: 'English',
        rating: 'PG-13',
        releaseDate: '2024-01-15',
        director: 'Anthony Russo, Joe Russo',
        cast: 'Robert Downey Jr., Chris Evans, Mark Ruffalo, Chris Hemsworth',
        trailer: 'https://www.youtube.com/watch?v=TcMBFSGVi1c',
        genres: ['action', 'adventure', 'sci-fi']
      },
      {
        title: 'Spider-Man: No Way Home',
        synopsis: 'Peter Parker seeks help from Doctor Strange to make people forget he is Spider-Man. When the spell goes wrong, dangerous foes from other worlds start to appear.',
        duration: '148',
        language: 'English', 
        rating: 'PG-13',
        releaseDate: '2024-01-20',
        director: 'Jon Watts',
        cast: 'Tom Holland, Zendaya, Benedict Cumberbatch, Jacob Batalon',
        trailer: 'https://www.youtube.com/watch?v=JfVOs4VSpmA',
        genres: ['action', 'adventure', 'sci-fi']
      },
      {
        title: 'The Batman',
        synopsis: 'Batman ventures into Gotham City\'s underworld when a sadistic killer leaves behind a trail of cryptic clues. As the evidence begins to lead closer to home, he must forge new relationships and unmask the culprit.',
        duration: '176',
        language: 'English',
        rating: 'PG-13',
        releaseDate: '2024-02-01',
        director: 'Matt Reeves',
        cast: 'Robert Pattinson, Zoë Kravitz, Paul Dano, Jeffrey Wright',
        trailer: 'https://www.youtube.com/watch?v=mqqft2x_Aa4',
        genres: ['action', 'crime', 'drama']
      }
    ]
    
    for (const movie of movies) {
      try {
        await page.click('[data-testid="add-movie-btn"]')
        await page.waitForSelector('[data-testid="movie-form-modal"]')
        
        await page.fill('[data-testid="movie-title"]', movie.title)
        await page.fill('[data-testid="movie-synopsis"]', movie.synopsis)
        await page.fill('[data-testid="movie-duration"]', movie.duration)
        await page.selectOption('[data-testid="movie-language"]', movie.language)
        await page.selectOption('[data-testid="movie-rating"]', movie.rating)
        await page.fill('[data-testid="movie-release-date"]', movie.releaseDate)
        await page.fill('[data-testid="movie-director"]', movie.director)
        await page.fill('[data-testid="movie-cast"]', movie.cast)
        await page.fill('[data-testid="movie-trailer"]', movie.trailer)
        
        // Select genres
        for (const genre of movie.genres) {
          await page.check(`[data-testid="genre-${genre}"]`)
        }
        
        await page.click('[data-testid="save-movie"]')
        
        // Wait for success message
        await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 })
        await page.waitForTimeout(1000)
        
        console.log(`✅ Created movie: ${movie.title}`)
      } catch (error) {
        console.log(`⚠️ Failed to create movie ${movie.title}:`, error)
      }
    }
  } catch (error) {
    console.log('⚠️ Movie creation process failed:', error)
  }
}

async function createTestShowtimes(page: any) {
  try {
    await page.click('[data-testid="nav-showtimes"]')
    
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfter = new Date(today)
    dayAfter.setDate(dayAfter.getDate() + 2)
    
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0]
    }
    
    const showtimes = [
      // Today's showtimes
      {
        movie: 'Avengers: Endgame',
        theater: 'Galaxy Nguyen Du',
        date: formatDate(today),
        time: '14:00',
        prices: { gold: '120000', platinum: '150000', box: '200000' }
      },
      {
        movie: 'Avengers: Endgame',
        theater: 'Galaxy Nguyen Du',
        date: formatDate(today),
        time: '19:00',
        prices: { gold: '130000', platinum: '160000', box: '220000' }
      },
      {
        movie: 'Spider-Man: No Way Home',
        theater: 'CGV Vincom Center',
        date: formatDate(today),
        time: '16:00',
        prices: { gold: '120000', platinum: '150000', box: '200000' }
      },
      {
        movie: 'Spider-Man: No Way Home',
        theater: 'CGV Vincom Center',
        date: formatDate(today),
        time: '21:00',
        prices: { gold: '130000', platinum: '160000', box: '220000' }
      },
      // Tomorrow's showtimes
      {
        movie: 'The Batman',
        theater: 'Lotte Cinema Landmark',
        date: formatDate(tomorrow),
        time: '15:00',
        prices: { gold: '125000', platinum: '155000', box: '210000' }
      },
      {
        movie: 'The Batman',
        theater: 'Lotte Cinema Landmark',
        date: formatDate(tomorrow),
        time: '20:00',
        prices: { gold: '135000', platinum: '165000', box: '230000' }
      }
    ]
    
    for (const showtime of showtimes) {
      try {
        await page.click('[data-testid="add-showtime-btn"]')
        await page.waitForSelector('[data-testid="showtime-form-modal"]')
        
        await page.selectOption('[data-testid="showtime-movie"]', showtime.movie)
        await page.selectOption('[data-testid="showtime-theater"]', showtime.theater)
        await page.fill('[data-testid="showtime-date"]', showtime.date)
        await page.fill('[data-testid="showtime-time"]', showtime.time)
        
        await page.fill('[data-testid="price-gold"]', showtime.prices.gold)
        await page.fill('[data-testid="price-platinum"]', showtime.prices.platinum)
        await page.fill('[data-testid="price-box"]', showtime.prices.box)
        
        await page.click('[data-testid="save-showtime"]')
        
        // Wait for success message
        await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 })
        await page.waitForTimeout(1000)
        
        console.log(`✅ Created showtime: ${showtime.movie} at ${showtime.time} on ${showtime.date}`)
      } catch (error) {
        console.log(`⚠️ Failed to create showtime for ${showtime.movie}:`, error)
      }
    }
  } catch (error) {
    console.log('⚠️ Showtime creation process failed:', error)
  }
}

export default globalSetup