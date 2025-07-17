#!/bin/bash

# MERN Stack Deployment Script
# This script helps deploy both frontend and backend components

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
ENV_FILE=".env"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    log_info "Dependencies check passed"
}

setup_environment() {
    log_info "Setting up environment..."
    
    if [ ! -f "$ENV_FILE" ]; then
        log_warn "No .env file found, copying from .env.example"
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_warn "Please update .env file with your configuration"
        else
            log_error ".env.example not found"
            exit 1
        fi
    fi
}

install_backend_deps() {
    log_info "Installing backend dependencies..."
    cd $BACKEND_DIR
    npm ci
    cd ..
}

install_frontend_deps() {
    log_info "Installing frontend dependencies..."
    cd $FRONTEND_DIR
    npm ci
    cd ..
}

test_backend() {
    log_info "Running backend tests..."
    cd $BACKEND_DIR
    npm test
    cd ..
}

test_frontend() {
    log_info "Running frontend tests..."
    cd $FRONTEND_DIR
    npm test -- --coverage --watchAll=false
    cd ..
}

build_frontend() {
    log_info "Building frontend..."
    cd $FRONTEND_DIR
    npm run build
    cd ..
}

deploy_backend() {
    local platform=$1
    log_info "Deploying backend to $platform..."
    
    case $platform in
        "render")
            log_info "Triggering Render deployment..."
            if [ -n "$RENDER_DEPLOY_HOOK" ]; then
                curl -X POST "$RENDER_DEPLOY_HOOK"
            else
                log_error "RENDER_DEPLOY_HOOK not set"
                exit 1
            fi
            ;;
        "railway")
            log_info "Deploying to Railway..."
            if command -v railway &> /dev/null; then
                railway up
            else
                log_error "Railway CLI not installed"
                exit 1
            fi
            ;;
        "heroku")
            log_info "Deploying to Heroku..."
            if command -v heroku &> /dev/null; then
                heroku git:remote -a $HEROKU_APP_NAME
                git subtree push --prefix=backend heroku main
            else
                log_error "Heroku CLI not installed"
                exit 1
            fi
            ;;
        *)
            log_error "Unknown backend platform: $platform"
            exit 1
            ;;
    esac
}

deploy_frontend() {
    local platform=$1
    log_info "Deploying frontend to $platform..."
    
    case $platform in
        "vercel")
            log_info "Deploying to Vercel..."
            if command -v vercel &> /dev/null; then
                cd $FRONTEND_DIR
                vercel --prod
                cd ..
            else
                log_error "Vercel CLI not installed"
                exit 1
            fi
            ;;
        "netlify")
            log_info "Deploying to Netlify..."
            if command -v netlify &> /dev/null; then
                cd $FRONTEND_DIR
                netlify deploy --prod --dir=build
                cd ..
            else
                log_error "Netlify CLI not installed"
                exit 1
            fi
            ;;
        "github-pages")
            log_info "Deploying to GitHub Pages..."
            cd $FRONTEND_DIR
            npm run deploy
            cd ..
            ;;
        *)
            log_error "Unknown frontend platform: $platform"
            exit 1
            ;;
    esac
}

health_check() {
    local backend_url=$1
    local frontend_url=$2
    
    log_info "Running health checks..."
    
    if [ -n "$backend_url" ]; then
        log_info "Checking backend health..."
        if curl -f "$backend_url/health" > /dev/null 2>&1; then
            log_info "Backend is healthy"
        else
            log_error "Backend health check failed"
            exit 1
        fi
    fi
    
    if [ -n "$frontend_url" ]; then
        log_info "Checking frontend availability..."
        if curl -f "$frontend_url" > /dev/null 2>&1; then
            log_info "Frontend is accessible"
        else
            log_error "Frontend health check failed"
            exit 1
        fi
    fi
}

# Main deployment function
deploy() {
    local backend_platform=$1
    local frontend_platform=$2
    local skip_tests=$3
    
    log_info "Starting MERN stack deployment..."
    
    check_dependencies
    setup_environment
    
    # Install dependencies
    install_backend_deps
    install_frontend_deps
    
    # Run tests (unless skipped)
    if [ "$skip_tests" != "true" ]; then
        test_backend
        test_frontend
    fi
    
    # Build frontend
    build_frontend
    
    # Deploy components
    if [ -n "$backend_platform" ]; then
        deploy_backend $backend_platform
    fi
    
    if [ -n "$frontend_platform" ]; then
        deploy_frontend $frontend_platform
    fi
    
    # Health checks
    sleep 30  # Wait for deployments to be ready
    health_check $BACKEND_URL $FRONTEND_URL
    
    log_info "Deployment completed successfully!"
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -b, --backend PLATFORM    Deploy backend to platform (render|railway|heroku)"
    echo "  -f, --frontend PLATFORM   Deploy frontend to platform (vercel|netlify|github-pages)"
    echo "  -s, --skip-tests          Skip running tests"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -b render -f vercel"
    echo "  $0 --backend railway --frontend netlify --skip-tests"
}

# Parse command line arguments
BACKEND_PLATFORM=""
FRONTEND_PLATFORM=""
SKIP_TESTS="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--backend)
            BACKEND_PLATFORM="$2"
            shift 2
            ;;
        -f|--frontend)
            FRONTEND_PLATFORM="$2"
            shift 2
            ;;
        -s|--skip-tests)
            SKIP_TESTS="true"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run deployment
if [ -z "$BACKEND_PLATFORM" ] && [ -z "$FRONTEND_PLATFORM" ]; then
    log_error "At least one deployment platform must be specified"
    usage
    exit 1
fi

deploy $BACKEND_PLATFORM $FRONTEND_PLATFORM $SKIP_TESTS