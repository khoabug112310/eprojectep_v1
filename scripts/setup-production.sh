#!/bin/bash
# CineBook Production Setup Script
# Automated production environment configuration

set -e

# Configuration
DOMAIN="${DOMAIN:-cinebook.com}"
EMAIL="${EMAIL:-admin@cinebook.com}"
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-$(openssl rand -base64 32)}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 32)}"
REDIS_PASSWORD="${REDIS_PASSWORD:-$(openssl rand -base64 32)}"
APP_KEY="${APP_KEY:-base64:$(openssl rand -base64 32)}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
        exit 1
    fi
}

# Install Docker and Docker Compose
install_docker() {
    log "Installing Docker and Docker Compose..."
    
    # Check if Docker is already installed
    if command -v docker &> /dev/null; then
        success "Docker is already installed"
    else
        log "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        sudo usermod -aG docker "$USER"
        rm get-docker.sh
        success "Docker installed successfully"
    fi
    
    # Check if Docker Compose is already installed
    if command -v docker-compose &> /dev/null; then
        success "Docker Compose is already installed"
    else
        log "Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        success "Docker Compose installed successfully"
    fi
}

# Install system dependencies
install_dependencies() {
    log "Installing system dependencies..."
    
    # Update package list
    sudo apt-get update
    
    # Install required packages
    sudo apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        nginx \
        certbot \
        python3-certbot-nginx \
        ufw \
        fail2ban \
        htop \
        net-tools \
        bc
    
    success "System dependencies installed"
}

# Configure firewall
configure_firewall() {
    log "Configuring UFW firewall..."
    
    # Reset UFW to defaults
    sudo ufw --force reset
    
    # Set default policies
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH (adjust port if needed)
    sudo ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow Docker networks (if needed)
    sudo ufw allow from 172.16.0.0/12
    
    # Enable firewall
    sudo ufw --force enable
    
    success "Firewall configured"
}

# Configure Fail2Ban
configure_fail2ban() {
    log "Configuring Fail2Ban..."
    
    # Create jail.local configuration
    sudo tee /etc/fail2ban/jail.local > /dev/null << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF
    
    # Restart Fail2Ban
    sudo systemctl restart fail2ban
    sudo systemctl enable fail2ban
    
    success "Fail2Ban configured"
}

# Create application directory
setup_application_directory() {
    log "Setting up application directory..."
    
    local app_dir="/opt/cinebook"
    
    # Create directory structure
    sudo mkdir -p "$app_dir"
    sudo chown "$USER:$USER" "$app_dir"
    
    # Create subdirectories
    mkdir -p "$app_dir"/{config,data,logs,backups,ssl}
    
    success "Application directory created at $app_dir"
    echo "APP_DIR=$app_dir" >> ~/.bashrc
}

# Generate SSL certificates
setup_ssl() {
    log "Setting up SSL certificates..."
    
    # Check if domain is provided
    if [[ -z "$DOMAIN" ]] || [[ "$DOMAIN" == "cinebook.com" ]]; then
        warning "No domain provided, skipping SSL setup"
        warning "Please configure SSL manually after setting up your domain"
        return 0
    fi
    
    # Stop nginx if running
    sudo systemctl stop nginx || true
    
    # Generate certificate
    sudo certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        -d "$DOMAIN" \
        -d "api.$DOMAIN"
    
    # Setup auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
    
    success "SSL certificates configured for $DOMAIN"
}

# Generate environment configuration
generate_environment() {
    log "Generating environment configuration..."
    
    local env_file="/opt/cinebook/.env"
    
    cat > "$env_file" << EOF
# CineBook Production Environment Configuration
# Generated on $(date)

# Application Settings
APP_NAME=CineBook
ENVIRONMENT=production
APP_VERSION=1.0.0
APP_DEBUG=false

# Domain Configuration
FRONTEND_DOMAIN=$DOMAIN
API_DOMAIN=api.$DOMAIN
TRAEFIK_DOMAIN=traefik.$DOMAIN

# URLs
VITE_API_BASE_URL=https://api.$DOMAIN
APP_URL=https://api.$DOMAIN

# Security Keys
APP_KEY=$APP_KEY

# Database Configuration
DB_DATABASE=cinebook
DB_USERNAME=cinebook
DB_PASSWORD=$DB_PASSWORD
DB_ROOT_PASSWORD=$DB_ROOT_PASSWORD

# Redis Configuration
REDIS_PASSWORD=$REDIS_PASSWORD

# Email Configuration (Configure with your SMTP settings)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls

# SSL Configuration
ACME_EMAIL=$EMAIL

# Monitoring
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 32)

# Security
ERROR_TRACKING_ENABLED=true
BUILD_TARGET=production
EOF
    
    # Secure the environment file
    chmod 600 "$env_file"
    
    success "Environment configuration generated"
    warning "Please edit $env_file and configure your email settings"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring configuration..."
    
    local app_dir="/opt/cinebook"
    
    # Create Prometheus configuration
    mkdir -p "$app_dir/monitoring/prometheus"
    cat > "$app_dir/monitoring/prometheus/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']

  - job_name: 'mysql'
    static_configs:
      - targets: ['localhost:9104']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']
EOF
    
    # Create Grafana provisioning
    mkdir -p "$app_dir/monitoring/grafana/provisioning/datasources"
    cat > "$app_dir/monitoring/grafana/provisioning/datasources/prometheus.yml" << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF
    
    success "Monitoring configuration created"
}

# Setup backup system
setup_backup_system() {
    log "Setting up backup system..."
    
    local backup_script="/opt/cinebook/scripts/backup.sh"
    mkdir -p "/opt/cinebook/scripts"
    
    cat > "$backup_script" << 'EOF'
#!/bin/bash
# Automated backup script for CineBook

BACKUP_DIR="/opt/cinebook/backups"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
docker-compose exec -T database mysqldump -u root -p"$DB_ROOT_PASSWORD" --all-databases | gzip > "$BACKUP_DIR/database_$DATE.sql.gz"

# Redis backup
docker-compose exec -T redis redis-cli -a "$REDIS_PASSWORD" --rdb /tmp/dump.rdb
docker cp $(docker-compose ps -q redis):/tmp/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"

# Application files backup
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='vendor' \
    --exclude='storage/logs/*' \
    /opt/cinebook

# Clean old backups
find "$BACKUP_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.rdb" -mtime +$RETENTION_DAYS -delete

# Log backup completion
echo "$(date): Backup completed successfully" >> /opt/cinebook/logs/backup.log
EOF
    
    chmod +x "$backup_script"
    
    # Setup cron job for daily backups at 2 AM
    (crontab -l 2>/dev/null; echo "0 2 * * * /opt/cinebook/scripts/backup.sh") | crontab -
    
    success "Backup system configured (daily at 2 AM)"
}

# Create systemd services
setup_systemd_services() {
    log "Setting up systemd services..."
    
    # CineBook service
    sudo tee /etc/systemd/system/cinebook.service > /dev/null << 'EOF'
[Unit]
Description=CineBook Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/cinebook
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
    
    # Enable and start service
    sudo systemctl daemon-reload
    sudo systemctl enable cinebook.service
    
    success "Systemd services configured"
}

# Final security hardening
security_hardening() {
    log "Applying security hardening..."
    
    # Disable root login
    sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    
    # Disable password authentication (uncomment if using SSH keys)
    # sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    
    # Restart SSH service
    sudo systemctl restart sshd
    
    # Set file permissions
    chmod 700 ~/.ssh 2>/dev/null || true
    chmod 600 ~/.ssh/authorized_keys 2>/dev/null || true
    
    # Create log rotation for application logs
    sudo tee /etc/logrotate.d/cinebook > /dev/null << 'EOF'
/opt/cinebook/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF
    
    success "Security hardening applied"
}

# Display completion summary
display_summary() {
    echo ""
    echo "🎉 CineBook Production Setup Complete!"
    echo "======================================"
    echo ""
    echo "✅ System prepared for CineBook deployment"
    echo "📁 Application directory: /opt/cinebook"
    echo "🔐 Environment file: /opt/cinebook/.env"
    echo "🔒 SSL certificates: /etc/letsencrypt/live/$DOMAIN (if domain configured)"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Edit /opt/cinebook/.env with your configuration"
    echo "2. Clone your application code to /opt/cinebook"
    echo "3. Run 'cd /opt/cinebook && docker-compose up -d'"
    echo "4. Configure your DNS to point to this server"
    echo ""
    echo "🔧 Management Commands:"
    echo "• Start services: sudo systemctl start cinebook"
    echo "• Stop services: sudo systemctl stop cinebook"
    echo "• View logs: docker-compose logs -f"
    echo "• Health check: ./scripts/health-check.sh"
    echo "• Manual backup: ./scripts/backup.sh"
    echo ""
    echo "⚠️  Important Notes:"
    echo "• Configure your email settings in .env file"
    echo "• Review firewall rules for your specific needs"
    echo "• Setup monitoring alerts for production use"
    echo "• Test backup and restore procedures"
    echo ""
    
    if [[ "$DOMAIN" != "cinebook.com" ]]; then
        echo "🌐 Your application will be available at:"
        echo "• Frontend: https://$DOMAIN"
        echo "• API: https://api.$DOMAIN"
        echo "• Monitoring: https://traefik.$DOMAIN (if configured)"
    else
        echo "⚠️  Configure your domain name and re-run SSL setup"
    fi
}

# Main execution
main() {
    echo "🚀 CineBook Production Setup"
    echo "==========================="
    
    check_root
    install_dependencies
    install_docker
    configure_firewall
    configure_fail2ban
    setup_application_directory
    generate_environment
    setup_monitoring
    setup_backup_system
    setup_systemd_services
    security_hardening
    
    # Setup SSL (optional based on domain)
    if [[ "$DOMAIN" != "cinebook.com" ]]; then
        setup_ssl
    fi
    
    display_summary
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --email)
            EMAIL="$2"
            shift 2
            ;;
        --help)
            echo "CineBook Production Setup Script"
            echo "Usage: $0 [--domain DOMAIN] [--email EMAIL]"
            echo ""
            echo "Options:"
            echo "  --domain DOMAIN   Set domain name for SSL certificates"
            echo "  --email EMAIL     Set email for SSL certificate registration"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main