# CineBook API Testing Script
# Testing all API endpoints systematically

$baseUrl = "http://localhost:8000/api/v1"
$frontendUrl = "http://localhost:3005"

Write-Host "=== CineBook API Testing Script ===" -ForegroundColor Green
Write-Host "Backend: $baseUrl" -ForegroundColor Yellow
Write-Host "Frontend: $frontendUrl" -ForegroundColor Yellow
Write-Host ""

# Function to make HTTP requests with error handling
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Uri,
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers -Body $Body -ContentType "application/json"
        } else {
            $response = Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers
        }
        return @{ Success = $true; Data = $response; Error = $null }
    }
    catch {
        return @{ Success = $false; Data = $null; Error = $_.Exception.Message }
    }
}

# Test 1: Authentication APIs
Write-Host "=== TESTING AUTHENTICATION APIS ===" -ForegroundColor Cyan

# Test Login API
Write-Host "1. Testing Login API..." -ForegroundColor Yellow
$loginBody = @{
    email = "user@cinebook.com"
    password = "password"
} | ConvertTo-Json

$loginResult = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/auth/login" -Body $loginBody
if ($loginResult.Success) {
    Write-Host "✓ Login API works!" -ForegroundColor Green
    $token = $loginResult.Data.data.token
    $authHeaders = @{ "Authorization" = "Bearer $token" }
    Write-Host "  Token received: $($token.Substring(0,20))..." -ForegroundColor Gray
} else {
    Write-Host "✗ Login API failed: $($loginResult.Error)" -ForegroundColor Red
}

# Test Registration API
Write-Host "2. Testing Registration API..." -ForegroundColor Yellow
$registerBody = @{
    name = "Test User API"
    email = "testuser$(Get-Random)@test.com"
    phone = "0$(Get-Random -Minimum 900000000 -Maximum 999999999)"
    password = "password123"
    password_confirmation = "password123"
} | ConvertTo-Json

$registerResult = Invoke-ApiRequest -Method "POST" -Uri "$baseUrl/auth/register" -Body $registerBody
if ($registerResult.Success) {
    Write-Host "✓ Registration API works!" -ForegroundColor Green
} else {
    Write-Host "✗ Registration API failed: $($registerResult.Error)" -ForegroundColor Red
}

# Test Profile API (requires auth)
if ($token) {
    Write-Host "3. Testing Profile API..." -ForegroundColor Yellow
    $profileResult = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/auth/profile" -Headers $authHeaders
    if ($profileResult.Success) {
        Write-Host "✓ Profile API works!" -ForegroundColor Green
        Write-Host "  User: $($profileResult.Data.data.name)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Profile API failed: $($profileResult.Error)" -ForegroundColor Red
    }
}

# Test 2: Movie APIs
Write-Host ""
Write-Host "=== TESTING MOVIE APIS ===" -ForegroundColor Cyan

# Test Get Movies
Write-Host "1. Testing Get Movies API..." -ForegroundColor Yellow
$moviesResult = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/movies"
if ($moviesResult.Success) {
    Write-Host "✓ Movies API works!" -ForegroundColor Green
    $movieCount = $moviesResult.Data.data.count
    Write-Host "  Movies found: $movieCount" -ForegroundColor Gray
    $firstMovie = $moviesResult.Data.data.movies[0]
    $movieId = $firstMovie.id
} else {
    Write-Host "✗ Movies API failed: $($moviesResult.Error)" -ForegroundColor Red
}

# Test Get Movie Details
if ($movieId) {
    Write-Host "2. Testing Movie Details API..." -ForegroundColor Yellow
    $movieDetailResult = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/movies/$movieId"
    if ($movieDetailResult.Success) {
        Write-Host "✓ Movie Details API works!" -ForegroundColor Green
        Write-Host "  Movie: $($movieDetailResult.Data.data.title)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Movie Details API failed: $($movieDetailResult.Error)" -ForegroundColor Red
    }
}

# Test Movie Search
Write-Host "3. Testing Movie Search API..." -ForegroundColor Yellow
$searchResult = Invoke-ApiRequest -Method "GET" -Uri "$baseUrl/movies?search=action"
if ($searchResult.Success) {
    Write-Host "✓ Movie Search API works!" -ForegroundColor Green
    Write-Host "  Search results: $($searchResult.Data.data.count)" -ForegroundColor Gray
} else {
    Write-Host "✗ Movie Search API failed: $($searchResult.Error)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== API TESTING COMPLETED ===" -ForegroundColor Green
Write-Host "Initial API tests finished. Check results above." -ForegroundColor Yellow