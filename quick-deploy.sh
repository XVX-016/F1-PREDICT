#!/bin/bash

# Quick Deploy Script for F1 Predict App
# This script provides a simplified deployment process

set -e

echo "🏁 F1 Predict App - Quick Deploy for f1predictapp.tech"
echo "=================================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root for security reasons."
    echo "   Use a regular user with sudo privileges instead."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "   sudo sh get-docker.sh"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Set Docker Compose command
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

echo "✅ Using Docker Compose command: $DOCKER_COMPOSE"

# Check if production environment file exists
if [ ! -f "production.env" ]; then
    echo "❌ Production environment file 'production.env' not found."
    echo "   Please create it first with your configuration."
    exit 1
fi

# Check if SSL certificates exist
if [ ! -d "ssl" ] || [ ! -f "ssl/f1predictapp.tech.crt" ] || [ ! -f "ssl/f1predictapp.tech.key" ]; then
    echo "⚠️  SSL certificates not found in ssl/ directory."
    echo "   Please add your SSL certificates:"
    echo "   - ssl/f1predictapp.tech.crt"
    echo "   - ssl/f1predictapp.tech.key"
    echo ""
    echo "   You can obtain free SSL certificates from Let's Encrypt:"
    echo "   sudo certbot certonly --standalone -d f1predictapp.tech -d www.f1predictapp.tech"
    echo ""
    read -p "Do you want to continue without SSL? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Load environment variables
echo "📋 Loading environment variables..."
export $(cat production.env | grep -v '^#' | xargs)

# Stop existing containers
echo "🛑 Stopping existing containers..."
$DOCKER_COMPOSE -f docker-compose.prod.yml down || true

# Pull latest images
echo "📥 Pulling latest images..."
$DOCKER_COMPOSE -f docker-compose.prod.yml pull

# Build images
echo "🔨 Building application images..."
$DOCKER_COMPOSE -f docker-compose.prod.yml build --no-cache

# Start services
echo "🚀 Starting production services..."
$DOCKER_COMPOSE -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
$DOCKER_COMPOSE -f docker-compose.prod.yml ps

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Application is healthy and running!"
    echo ""
    echo "🌐 Your F1 Predict App is now available at:"
    echo "   https://f1predictapp.tech"
    echo ""
    echo "📊 Useful commands:"
    echo "   View logs: $DOCKER_COMPOSE -f docker-compose.prod.yml logs -f"
    echo "   Stop app:  $DOCKER_COMPOSE -f docker-compose.prod.yml down"
    echo "   Restart:   $DOCKER_COMPOSE -f docker-compose.prod.yml restart"
    echo ""
    echo "🎉 Deployment completed successfully!"
else
    echo "❌ Health check failed. Please check the logs:"
    $DOCKER_COMPOSE -f docker-compose.prod.yml logs --tail=50
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Check if all required environment variables are set"
    echo "   2. Verify SSL certificates are valid"
    echo "   3. Ensure ports 80 and 443 are not blocked"
    echo "   4. Check Docker logs for errors"
fi
