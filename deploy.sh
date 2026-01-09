#!/bin/bash

# F1 Predict App Deployment Script for f1predictapp.tech
# This script deploys the application to production

set -e

echo "🚀 Starting F1 Predict App deployment for f1predictapp.tech..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Consider using a non-root user for security."
fi

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Set Docker Compose command
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

print_status "Using Docker Compose command: $DOCKER_COMPOSE"

# Check if production environment file exists
if [ ! -f "production.env" ]; then
    print_error "Production environment file 'production.env' not found."
    print_status "Please create production.env file with your configuration."
    exit 1
fi

# Check if SSL certificates exist
if [ ! -d "ssl" ]; then
    print_warning "SSL directory not found. Creating ssl directory..."
    mkdir -p ssl
    print_warning "Please add your SSL certificates to the ssl/ directory:"
    print_warning "  - f1predictapp.tech.crt"
    print_warning "  - f1predictapp.tech.key"
    print_warning "You can obtain SSL certificates from Let's Encrypt or your certificate provider."
fi

# Load environment variables
print_status "Loading production environment variables..."
export $(cat production.env | grep -v '^#' | xargs)

# Stop existing containers
print_status "Stopping existing containers..."
$DOCKER_COMPOSE -f docker-compose.prod.yml down || true

# Pull latest images
print_status "Pulling latest images..."
$DOCKER_COMPOSE -f docker-compose.prod.yml pull

# Build images
print_status "Building application images..."
$DOCKER_COMPOSE -f docker-compose.prod.yml build --no-cache

# Start services
print_status "Starting production services..."
$DOCKER_COMPOSE -f docker-compose.prod.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
print_status "Checking service status..."
$DOCKER_COMPOSE -f docker-compose.prod.yml ps

# Health check
print_status "Performing health check..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_status "✅ Application is healthy and running!"
    print_status "🌐 Your F1 Predict App is now available at: https://f1predictapp.tech"
else
    print_warning "⚠️  Health check failed. Please check the logs:"
    $DOCKER_COMPOSE -f docker-compose.prod.yml logs --tail=50
fi

# Show logs
print_status "Recent logs:"
$DOCKER_COMPOSE -f docker-compose.prod.yml logs --tail=20

print_status "🎉 Deployment completed!"
print_status "📊 To view logs: $DOCKER_COMPOSE -f docker-compose.prod.yml logs -f"
print_status "🛑 To stop: $DOCKER_COMPOSE -f docker-compose.prod.yml down"
print_status "🔄 To restart: $DOCKER_COMPOSE -f docker-compose.prod.yml restart"
