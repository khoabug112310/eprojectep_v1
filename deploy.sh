#!/bin/bash
# CineBook Deployment Script
# Automates the deployment process for production

set -e  # Exit on any error

# Configuration
PROJECT_NAME="cinebook"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
BACKUP_DIR="./backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        error ".env file not found. Please copy .env.example to .env and configure it."
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Generate backup filename with timestamp
    BACKUP_NAME="${PROJECT_NAME}_backup_$(date +'%Y%m%d_%H%M%S')"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    # Create backup directory
    mkdir -p "$BACKUP_PATH"
    
    # Backup database
    if docker-compose ps database | grep -q "Up"; then
        log "Backing up database..."
        docker-compose exec -T database mysqldump -u root -p"${DB_ROOT_PASSWORD}" --all-databases > "$BACKUP_PATH/database.sql"
        success "Database backup completed"
    fi
    
    # Backup Redis data
    if docker-compose ps redis | grep -q "Up"; then
        log "Backing up Redis data..."
        docker-compose exec -T redis redis-cli -a "${REDIS_PASSWORD}" --rdb /data/dump.rdb
        docker cp $(docker-compose ps -q redis):/data/dump.rdb "$BACKUP_PATH/redis_dump.rdb"
        success "Redis backup completed"
    fi
    
    # Backup application files
    log "Backing up application files..."
    rsync -av --exclude='node_modules' --exclude='.git' --exclude='vendor' . "$BACKUP_PATH/app/"
    
    # Compress backup
    tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
    rm -rf "$BACKUP_PATH"
    
    success "Backup created: $BACKUP_PATH.tar.gz"
}

# Pull latest images
pull_images() {
    log "Pulling latest Docker images..."
    docker-compose pull
    success "Images pulled successfully"
}

# Build application
build_application() {
    log "Building application..."
    docker-compose build --no-cache
    success "Application built successfully"
}

# Deploy application
deploy() {
    log "Starting deployment..."
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose down
    
    # Start new containers
    log "Starting new containers..."
    docker-compose up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Run database migrations
    log "Running database migrations..."
    docker-compose exec -T backend php artisan migrate --force
    
    # Clear caches
    log "Clearing application caches..."
    docker-compose exec -T backend php artisan cache:clear
    docker-compose exec -T backend php artisan config:cache
    docker-compose exec -T backend php artisan route:cache
    docker-compose exec -T backend php artisan view:cache
    
    success "Deployment completed successfully"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    # Check frontend health
    if curl -f http://localhost:${FRONTEND_PORT:-3000}/health &> /dev/null; then
        success "Frontend is healthy"
    else
        error "Frontend health check failed"
        return 1
    fi
    
    # Check backend health
    if curl -f http://localhost:${BACKEND_PORT:-8000}/api/health &> /dev/null; then
        success "Backend is healthy"
    else
        error "Backend health check failed"
        return 1
    fi
    
    # Check database connection
    if docker-compose exec -T backend php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database connection successful';" &> /dev/null; then
        success "Database connection is healthy"
    else
        error "Database connection check failed"
        return 1
    fi
    
    success "All health checks passed"
}

# Rollback function
rollback() {
    if [ -z "$1" ]; then
        error "Please provide backup filename for rollback"
        exit 1
    fi
    
    BACKUP_FILE="$BACKUP_DIR/$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    log "Rolling back to $BACKUP_FILE..."
    
    # Stop current containers
    docker-compose down
    
    # Extract backup
    RESTORE_DIR="/tmp/cinebook_restore"
    rm -rf "$RESTORE_DIR"
    mkdir -p "$RESTORE_DIR"
    tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"
    
    # Restore application files
    BACKUP_APP_DIR=$(find "$RESTORE_DIR" -name "app" -type d | head -1)
    if [ -d "$BACKUP_APP_DIR" ]; then
        rsync -av "$BACKUP_APP_DIR/" ./
    fi
    
    # Start containers
    docker-compose up -d
    
    # Restore database
    BACKUP_SQL=$(find "$RESTORE_DIR" -name "database.sql" | head -1)
    if [ -f "$BACKUP_SQL" ]; then
        log "Restoring database..."
        docker-compose exec -T database mysql -u root -p"${DB_ROOT_PASSWORD}" < "$BACKUP_SQL"
    fi
    
    # Restore Redis
    BACKUP_RDB=$(find "$RESTORE_DIR" -name "redis_dump.rdb" | head -1)
    if [ -f "$BACKUP_RDB" ]; then
        log "Restoring Redis data..."
        docker cp "$BACKUP_RDB" $(docker-compose ps -q redis):/data/dump.rdb
        docker-compose restart redis
    fi
    
    # Cleanup
    rm -rf "$RESTORE_DIR"
    
    success "Rollback completed"
}

# Main deployment process
main() {
    case "$1" in
        "deploy")
            check_prerequisites
            create_backup
            pull_images
            build_application
            deploy
            health_check
            success "Deployment process completed successfully!"
            ;;
        "backup")
            check_prerequisites
            create_backup
            ;;
        "rollback")
            rollback "$2"
            ;;
        "health")
            health_check
            ;;
        "logs")
            docker-compose logs -f "${2:-}"
            ;;
        "status")
            docker-compose ps
            ;;
        "stop")
            docker-compose down
            ;;
        "start")
            docker-compose up -d
            ;;
        *)
            echo "Usage: $0 {deploy|backup|rollback <backup_file>|health|logs [service]|status|stop|start}"
            echo ""
            echo "Commands:"
            echo "  deploy    - Full deployment process (backup, build, deploy, health check)"
            echo "  backup    - Create backup only"
            echo "  rollback  - Rollback to specified backup"
            echo "  health    - Run health checks"
            echo "  logs      - Show logs (optionally for specific service)"
            echo "  status    - Show container status"
            echo "  stop      - Stop all containers"
            echo "  start     - Start all containers"
            exit 1
            ;;
    esac
}

# Load environment variables
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

# Run main function
main "$@"