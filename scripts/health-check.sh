#!/bin/bash
# CineBook Health Check Script
# Comprehensive health monitoring for all application components

set -e

# Configuration
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USERNAME="${DB_USERNAME:-cinebook}"
DB_PASSWORD="${DB_PASSWORD}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_CHECKS++))
}

error() {
    echo -e "${RED}❌ $1${NC}" >&2
    ((FAILED_CHECKS++))
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Health check function
check_service() {
    ((TOTAL_CHECKS++))
    local service_name="$1"
    local check_command="$2"
    local timeout="${3:-10}"
    
    log "Checking $service_name..."
    
    if timeout "$timeout" bash -c "$check_command" &>/dev/null; then
        success "$service_name is healthy"
        return 0
    else
        error "$service_name health check failed"
        return 1
    fi
}

# Check HTTP service
check_http_service() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local timeout="${4:-10}"
    
    ((TOTAL_CHECKS++))
    log "Checking $name at $url..."
    
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null)
    
    if [[ "$response" == "$expected_status" ]]; then
        success "$name is responding (HTTP $response)"
        return 0
    else
        error "$name returned HTTP $response (expected $expected_status)"
        return 1
    fi
}

# Check database connectivity
check_database() {
    ((TOTAL_CHECKS++))
    log "Checking MySQL database connectivity..."
    
    if command -v mysql >/dev/null 2>&1; then
        if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" -e "SELECT 1;" >/dev/null 2>&1; then
            success "Database connection successful"
            return 0
        else
            error "Database connection failed"
            return 1
        fi
    else
        warning "MySQL client not available, skipping database check"
        ((TOTAL_CHECKS--))
        return 0
    fi
}

# Check Redis connectivity
check_redis() {
    ((TOTAL_CHECKS++))
    log "Checking Redis connectivity..."
    
    if command -v redis-cli >/dev/null 2>&1; then
        if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping >/dev/null 2>&1; then
            success "Redis connection successful"
            return 0
        else
            error "Redis connection failed"
            return 1
        fi
    else
        warning "Redis client not available, skipping Redis check"
        ((TOTAL_CHECKS--))
        return 0
    fi
}

# Check Docker containers
check_docker_containers() {
    if command -v docker >/dev/null 2>&1; then
        log "Checking Docker containers..."
        
        # Check if docker-compose is running
        if docker-compose ps | grep -q "Up"; then
            success "Docker containers are running"
            
            # Check individual container health
            while IFS= read -r container; do
                ((TOTAL_CHECKS++))
                container_name=$(echo "$container" | awk '{print $1}')
                container_status=$(echo "$container" | awk '{print $3}')
                
                if [[ "$container_status" == "Up" ]]; then
                    success "$container_name container is healthy"
                else
                    error "$container_name container is not healthy ($container_status)"
                fi
            done < <(docker-compose ps --services | xargs -I {} docker-compose ps {})
        else
            warning "No Docker containers found or not running"
        fi
    else
        warning "Docker not available, skipping container checks"
    fi
}

# Check application-specific endpoints
check_application_endpoints() {
    log "Checking application-specific endpoints..."
    
    # Frontend health check
    check_http_service "Frontend" "$FRONTEND_URL/health" "200" 10
    
    # Backend API health check
    check_http_service "Backend API" "$BACKEND_URL/api/health" "200" 10
    
    # Backend API routes
    check_http_service "Backend Movies API" "$BACKEND_URL/api/movies" "200" 10
    
    # Check if WebSocket endpoint is available (if applicable)
    if command -v nc >/dev/null 2>&1; then
        ((TOTAL_CHECKS++))
        log "Checking WebSocket endpoint..."
        if nc -z -w5 localhost 8000 >/dev/null 2>&1; then
            success "WebSocket endpoint is accessible"
        else
            error "WebSocket endpoint is not accessible"
        fi
    fi
}

# Check system resources
check_system_resources() {
    log "Checking system resources..."
    
    # Check disk space
    ((TOTAL_CHECKS++))
    local disk_usage
    disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [[ "$disk_usage" -lt 80 ]]; then
        success "Disk usage is acceptable ($disk_usage%)"
    elif [[ "$disk_usage" -lt 90 ]]; then
        warning "Disk usage is high ($disk_usage%)"
    else
        error "Disk usage is critical ($disk_usage%)"
    fi
    
    # Check memory usage
    ((TOTAL_CHECKS++))
    local memory_usage
    memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    
    if [[ "$memory_usage" -lt 80 ]]; then
        success "Memory usage is acceptable ($memory_usage%)"
    elif [[ "$memory_usage" -lt 90 ]]; then
        warning "Memory usage is high ($memory_usage%)"
    else
        error "Memory usage is critical ($memory_usage%)"
    fi
    
    # Check CPU load
    ((TOTAL_CHECKS++))
    local cpu_load
    cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_count
    cpu_count=$(nproc)
    local cpu_usage
    cpu_usage=$(echo "$cpu_load / $cpu_count * 100" | bc -l | cut -d. -f1)
    
    if [[ "$cpu_usage" -lt 70 ]]; then
        success "CPU usage is acceptable ($cpu_usage%)"
    elif [[ "$cpu_usage" -lt 90 ]]; then
        warning "CPU usage is high ($cpu_usage%)"
    else
        error "CPU usage is critical ($cpu_usage%)"
    fi
}

# Check logs for errors
check_logs() {
    log "Checking recent logs for errors..."
    
    if command -v docker-compose >/dev/null 2>&1; then
        ((TOTAL_CHECKS++))
        local error_count
        error_count=$(docker-compose logs --tail=100 2>/dev/null | grep -i "error\|exception\|fatal" | wc -l)
        
        if [[ "$error_count" -eq 0 ]]; then
            success "No recent errors found in logs"
        elif [[ "$error_count" -lt 5 ]]; then
            warning "Found $error_count recent errors in logs"
        else
            error "Found $error_count recent errors in logs (investigate required)"
        fi
    fi
}

# Check SSL certificates (if HTTPS is configured)
check_ssl_certificates() {
    if [[ "$FRONTEND_URL" == https://* ]]; then
        log "Checking SSL certificate..."
        ((TOTAL_CHECKS++))
        
        local domain
        domain=$(echo "$FRONTEND_URL" | sed -e 's|https://||' -e 's|/.*||')
        
        local cert_expiry
        cert_expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d= -f2)
        
        if [[ -n "$cert_expiry" ]]; then
            local days_until_expiry
            days_until_expiry=$(( ($(date -d "$cert_expiry" +%s) - $(date +%s)) / 86400 ))
            
            if [[ "$days_until_expiry" -gt 30 ]]; then
                success "SSL certificate valid for $days_until_expiry days"
            elif [[ "$days_until_expiry" -gt 7 ]]; then
                warning "SSL certificate expires in $days_until_expiry days"
            else
                error "SSL certificate expires in $days_until_expiry days (renewal required)"
            fi
        else
            error "Could not check SSL certificate"
        fi
    fi
}

# Performance checks
check_performance() {
    log "Checking application performance..."
    
    # Response time check
    ((TOTAL_CHECKS++))
    local response_time
    response_time=$(curl -o /dev/null -s -w '%{time_total}' "$FRONTEND_URL" 2>/dev/null)
    
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        success "Frontend response time is good (${response_time}s)"
    elif (( $(echo "$response_time < 5.0" | bc -l) )); then
        warning "Frontend response time is acceptable (${response_time}s)"
    else
        error "Frontend response time is slow (${response_time}s)"
    fi
    
    # API response time check
    ((TOTAL_CHECKS++))
    local api_response_time
    api_response_time=$(curl -o /dev/null -s -w '%{time_total}' "$BACKEND_URL/api/health" 2>/dev/null)
    
    if (( $(echo "$api_response_time < 1.0" | bc -l) )); then
        success "API response time is good (${api_response_time}s)"
    elif (( $(echo "$api_response_time < 3.0" | bc -l) )); then
        warning "API response time is acceptable (${api_response_time}s)"
    else
        error "API response time is slow (${api_response_time}s)"
    fi
}

# Main health check routine
main() {
    echo "🏥 CineBook Health Check Started"
    echo "================================="
    
    # Load environment if available
    if [[ -f ".env" ]]; then
        source .env
    fi
    
    # Run all health checks
    check_system_resources
    check_docker_containers
    check_database
    check_redis
    check_application_endpoints
    check_ssl_certificates
    check_performance
    check_logs
    
    # Summary
    echo ""
    echo "================================="
    echo "🏥 Health Check Summary"
    echo "================================="
    echo "Total Checks: $TOTAL_CHECKS"
    echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
    
    if [[ "$FAILED_CHECKS" -eq 0 ]]; then
        echo -e "${GREEN}✅ All health checks passed! System is healthy.${NC}"
        exit 0
    else
        echo -e "${RED}❌ $FAILED_CHECKS health check(s) failed! System needs attention.${NC}"
        exit 1
    fi
}

# Handle command line arguments
case "${1:-full}" in
    "quick")
        # Quick health check (essential services only)
        check_application_endpoints
        ;;
    "infrastructure")
        # Infrastructure health check
        check_system_resources
        check_database
        check_redis
        ;;
    "performance")
        # Performance health check
        check_performance
        ;;
    "full"|*)
        # Full health check
        main
        ;;
esac