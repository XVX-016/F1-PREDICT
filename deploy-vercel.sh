#!/bin/bash

# F1 Predict App - Vercel Deployment Script
# This script deploys the app to Vercel

set -e

echo "🏁 F1 Predict App - Vercel Deployment"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed."
    print_status "Install it with: npm i -g vercel"
    exit 1
fi

print_status "Vercel CLI found: $(vercel --version)"

# Check if we're in the right directory
if [ ! -f "project/package.json" ]; then
    print_error "Please run this script from the project root directory."
    exit 1
fi

# Navigate to project directory
print_step "Navigating to project directory..."
cd project

# Check if .vercel directory exists (already linked)
if [ -d ".vercel" ]; then
    print_status "Project is already linked to Vercel."
    read -p "Do you want to redeploy? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "Redeploying to Vercel..."
        vercel --prod
    else
        print_status "Deployment cancelled."
        exit 0
    fi
else
    print_step "Deploying to Vercel for the first time..."
    print_warning "You'll be prompted to configure the project."
    print_status "Recommended settings:"
    print_status "  - Project name: f1-predict-app"
    print_status "  - Framework: Vite"
    print_status "  - Build command: npm run build"
    print_status "  - Output directory: dist"
    echo
    
    vercel
fi

# Check deployment status
print_step "Checking deployment status..."
if vercel ls | grep -q "f1-predict-app"; then
    print_status "✅ Deployment successful!"
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel ls | grep "f1-predict-app" | head -1 | awk '{print $2}')
    print_status "🌐 Your app is live at: https://$DEPLOYMENT_URL"
    
    # Test health endpoint
    print_step "Testing health endpoint..."
    if curl -f "https://$DEPLOYMENT_URL/api/health" > /dev/null 2>&1; then
        print_status "✅ Health check passed!"
    else
        print_warning "⚠️  Health check failed. Check the logs: vercel logs"
    fi
    
    print_status ""
    print_status "🎉 Deployment completed successfully!"
    print_status ""
    print_status "📊 Useful commands:"
    print_status "  View logs: vercel logs"
    print_status "  Redeploy:  vercel --prod"
    print_status "  Local dev: vercel dev"
    print_status "  Domains:   vercel domains"
    
else
    print_error "Deployment failed. Check the logs: vercel logs"
    exit 1
fi
