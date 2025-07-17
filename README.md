# 🚀 Professional MERN Stack Application

A production-ready MERN (MongoDB, Express.js, React, Node.js) stack application with comprehensive DevOps pipeline, monitoring, and deployment automation.

## ✨ Features

### Backend
- **Express.js** with TypeScript-like validation using Joi
- **MongoDB** with Mongoose ODM and advanced schemas
- **JWT Authentication** with refresh tokens and rate limiting
- **Security** - Helmet, CORS, XSS protection, MongoDB injection prevention
- **Logging** - Winston logger with file rotation
- **Error Handling** - Centralized error handling with request tracing
- **API Documentation** - RESTful API with comprehensive validation
- **Health Checks** - Built-in health monitoring endpoints

### Frontend
- **React 18** with modern hooks and context API
- **React Router** for client-side routing with lazy loading
- **Axios** with interceptors for API communication
- **React Hook Form** for optimized form handling
- **React Hot Toast** for user notifications
- **Error Boundaries** for graceful error handling
- **Loading States** with skeleton screens
- **Responsive Design** with mobile-first approach

### DevOps & Deployment
- **GitHub Actions** CI/CD pipelines
- **Docker** containerization with multi-stage builds
- **Multiple Deployment Options** (Render, Railway, Heroku, Vercel, Netlify)
- **Environment Management** with validation
- **Monitoring** - Health checks and uptime monitoring
- **Security Scanning** and dependency auditing

## 🏗️ Architecture

```
mern-app/
├── backend/                 # Express.js API server
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API route handlers
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   └── logs/               # Application logs
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── contexts/       # React contexts
├── .github/workflows/      # CI/CD pipelines
├── deployment/             # Deployment configurations
├── monitoring/             # Monitoring scripts
└── scripts/                # Automation scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm 8+
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd mern-deployment-project
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install dependencies:**
   ```bash
   npm run install:all
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```

### Manual Setup

If you prefer manual setup:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Start development
npm run dev
```

## 🔧 Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development
- `npm run build` - Build frontend for production
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run deploy` - Deploy to production
- `npm run health-check` - Check application health
- `npm run monitor` - Start uptime monitoring

### Backend
- `npm run dev` - Start with nodemon
- `npm run start` - Start production server
- `npm run test` - Run Jest tests
- `npm run lint` - ESLint checking
- `npm run format` - Prettier formatting

### Frontend
- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run React tests
- `npm run analyze` - Analyze bundle size

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update user profile

### Posts
- `GET /api/posts` - Get posts (with pagination, search, filtering)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post (authenticated)
- `PUT /api/posts/:id` - Update post (authenticated)
- `DELETE /api/posts/:id` - Delete post (authenticated)
- `POST /api/posts/:id/like` - Like/unlike post (authenticated)

### System
- `GET /health` - Health check endpoint

## 🔒 Security Features

- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control
- **Rate Limiting**: API and auth endpoint protection
- **Input Validation**: Joi schema validation
- **Data Sanitization**: XSS and NoSQL injection prevention
- **Security Headers**: Helmet.js implementation
- **CORS**: Configurable cross-origin requests
- **Password Security**: Bcrypt with configurable rounds

## 📊 Monitoring & Logging

### Health Monitoring
```bash
# Check application health
npm run health-check

# Start continuous monitoring
npm run monitor
```

### Logging
- **Development**: Console logging with colors
- **Production**: File-based logging with rotation
- **Request Tracing**: Unique request IDs
- **Error Tracking**: Structured error logging

## 🚀 Deployment

### Automated Deployment
```bash
# Deploy to production
npm run deploy -- --backend render --frontend vercel

# Deploy with custom options
./scripts/deploy.sh -b railway -f netlify -s
```

### Platform-Specific Deployment

#### Backend Options
- **Render**: `npm run deploy -- --backend render`
- **Railway**: `npm run deploy -- --backend railway`
- **Heroku**: `npm run deploy -- --backend heroku`

#### Frontend Options
- **Vercel**: `npm run deploy -- --frontend vercel`
- **Netlify**: `npm run deploy -- --frontend netlify`
- **GitHub Pages**: `npm run deploy -- --frontend github-pages`

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://your-frontend-domain.com
```

#### Frontend
```env
REACT_APP_API_URL=https://your-backend-domain.com/api
REACT_APP_ENVIRONMENT=production
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Frontend Testing
```bash
cd frontend
npm test                   # Interactive test runner
npm run test:coverage      # Coverage report
```

## 📈 Performance Optimization

### Backend
- **Compression**: Gzip compression enabled
- **Caching**: MongoDB query optimization
- **Connection Pooling**: Mongoose connection management
- **Rate Limiting**: Prevent abuse and improve stability

### Frontend
- **Code Splitting**: Lazy loading with React.lazy()
- **Bundle Optimization**: Webpack optimizations
- **Image Optimization**: Responsive images
- **Caching**: Service worker implementation ready

## 🔧 Development Tools

### Code Quality
- **ESLint**: Code linting with custom rules
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality checks
- **Jest**: Testing framework

### Debugging
- **Request Tracing**: Unique request IDs
- **Detailed Logging**: Winston logger
- **Error Boundaries**: React error handling
- **Source Maps**: Development debugging

## 📚 Documentation

### API Documentation
- Comprehensive endpoint documentation
- Request/response examples
- Error code references
- Authentication guides

### Code Documentation
- JSDoc comments
- README files for each module
- Architecture decision records
- Deployment guides

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Documentation**: Comprehensive guides in `/docs`
- **Examples**: Sample implementations in `/examples`

## 🎯 Roadmap

- [ ] GraphQL API implementation
- [ ] Real-time features with Socket.io
- [ ] Advanced caching with Redis
- [ ] Microservices architecture
- [ ] Advanced monitoring with Prometheus
- [ ] Mobile app with React Native

---

**Built with ❤️ using the MERN stack and modern DevOps practices.**