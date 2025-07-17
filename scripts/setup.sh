#!/bin/bash

# MERN Stack Setup Script
# This script sets up the development environment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        log_error "Node.js version 16+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    log_info "Node.js version: $(node --version)"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    log_info "npm version: $(npm --version)"
}

# Setup environment file
setup_env() {
    log_info "Setting up environment file..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_info "Created .env file from .env.example"
            log_warn "Please update .env file with your configuration"
        else
            log_error ".env.example file not found"
            exit 1
        fi
    else
        log_info ".env file already exists"
    fi
}

# Install dependencies
install_deps() {
    log_info "Installing root dependencies..."
    npm install
    
    log_info "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    log_info "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
}

# Create necessary directories
create_dirs() {
    log_info "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p backend/uploads
    
    log_info "Directories created"
}

# Setup MongoDB (optional)
setup_mongodb() {
    log_info "MongoDB setup options:"
    echo "1. Use MongoDB Atlas (recommended for production)"
    echo "2. Use local MongoDB installation"
    echo "3. Skip MongoDB setup"
    
    read -p "Choose an option (1-3): " choice
    
    case $choice in
        1)
            log_info "Please visit https://cloud.mongodb.com/ to create a free cluster"
            log_info "Update MONGODB_URI in .env file with your connection string"
            ;;
        2)
            if command -v mongod &> /dev/null; then
                log_info "MongoDB is already installed locally"
            else
                log_warn "MongoDB is not installed locally"
                log_info "Visit https://docs.mongodb.com/manual/installation/ for installation instructions"
            fi
            ;;
        3)
            log_info "Skipping MongoDB setup"
            ;;
        *)
            log_warn "Invalid choice, skipping MongoDB setup"
            ;;
    esac
}

# Run initial tests
run_tests() {
    log_info "Running initial tests..."
    
    log_info "Testing backend..."
    cd backend
    npm test || log_warn "Backend tests failed"
    cd ..
    
    log_info "Testing frontend..."
    cd frontend
    npm test -- --watchAll=false || log_warn "Frontend tests failed"
    cd ..
}

# Setup Git hooks (optional)
setup_git_hooks() {
    if [ -d ".git" ]; then
        log_info "Setting up Git hooks..."
        
        # Pre-commit hook
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Running pre-commit checks..."

# Run backend tests
cd backend && npm test
if [ $? -ne 0 ]; then
    echo "Backend tests failed. Commit aborted."
    exit 1
fi
cd ..

# Run frontend tests
cd frontend && npm test -- --watchAll=false
if [ $? -ne 0 ]; then
    echo "Frontend tests failed. Commit aborted."
    exit 1
fi
cd ..

echo "All checks passed!"
EOF
        
        chmod +x .git/hooks/pre-commit
        log_info "Git pre-commit hook installed"
    else
        log_warn "Not a Git repository, skipping Git hooks setup"
    fi
}

# Main setup function
main() {
    log_info "Starting MERN stack setup..."
    
    check_node
    check_npm
    setup_env
    install_deps
    create_dirs
    setup_mongodb
    
    # Ask if user wants to run tests
    read -p "Run initial tests? (y/n): " run_tests_choice
    if [ "$run_tests_choice" = "y" ] || [ "$run_tests_choice" = "Y" ]; then
        run_tests
    fi
    
    # Ask if user wants to setup Git hooks
    read -p "Setup Git hooks? (y/n): " git_hooks_choice
    if [ "$git_hooks_choice" = "y" ] || [ "$git_hooks_choice" = "Y" ]; then
        setup_git_hooks
    fi
    
    log_info "Setup completed successfully!"
    log_info ""
    log_info "Next steps:"
    log_info "1. Update .env file with your configuration"
    log_info "2. Start development servers with: npm run dev"
    log_info "3. Visit http://localhost:3000 for frontend"
    log_info "4. Visit http://localhost:5000 for backend API"
}

# Run main function
main