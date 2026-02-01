# 🔗 URL Shortener - Bun + DevOps Learning Project

A production-ready URL shortener API built with **Bun**, featuring authentication, analytics, middleware, and a complete DevOps pipeline.

## 🎯 Learning Objectives

This project helps you learn:
- ✅ **Bun Runtime**: Fast JavaScript runtime with built-in SQLite
- ✅ **DevOps Practices**: Docker, CI/CD, health checks, monitoring
- ✅ **Middleware**: Logging, authentication, CORS, rate limiting, error handling
- ✅ **Database Operations**: SQLite with prepared statements and transactions
- ✅ **Authentication**: JWT tokens, password hashing with bcrypt
- ✅ **Testing**: Comprehensive test suite with Bun's test runner
- ✅ **RESTful API Design**: Best practices for API development

## 🚀 Features

### Core Features
- 🔐 **User Authentication**: Register, login, JWT-based auth
- 🔗 **URL Shortening**: Create short URLs with optional custom codes
- 📊 **Analytics**: Track clicks, user agents, referrers
- ⏰ **URL Expiration**: Set expiration dates for URLs
- 🔒 **Authorization**: Users can only manage their own URLs
- 🚦 **Rate Limiting**: Prevent abuse with configurable rate limits

### DevOps Features
- 🐳 **Docker**: Containerized application with multi-stage builds
- 🔄 **CI/CD**: GitHub Actions pipeline with tests, security scanning
- 💚 **Health Checks**: Built-in health endpoints
- 📝 **Logging**: Request/response logging middleware
- 🛡️ **Security**: CORS, rate limiting, input validation
- 📦 **Database Migrations**: Automated schema management

## 📋 Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- Docker & Docker Compose (optional, for containerization)
- Git

## 🛠️ Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd url-shortener
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize database**
   ```bash
   bun run db:migrate
   ```

5. **Seed database (optional)**
   ```bash
   bun run db:seed
   ```

6. **Start development server**
   ```bash
   bun run dev
   ```

The server will start at `http://localhost:3000`

### Docker Development

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Run in detached mode**
   ```bash
   docker-compose up -d
   ```

3. **View logs**
   ```bash
   docker-compose logs -f
   ```

4. **Stop containers**
   ```bash
   docker-compose down
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePass123"
}
```

#### Get Profile
```bash
GET /api/auth/profile
Authorization: Bearer <token>
```

### URL Endpoints

#### Create Short URL
```bash
# Public (no auth required)
POST /api/urls
Content-Type: application/json

{
  "url": "https://example.com/very/long/url",
  "customCode": "mylink",  # optional
  "expiresInDays": 30      # optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "URL shortened successfully",
  "data": {
    "shortCode": "mylink",
    "shortUrl": "http://localhost:3000/mylink",
    "originalUrl": "https://example.com/very/long/url",
    "expiresAt": "2024-03-01T00:00:00.000Z"
  }
}
```

#### Get User's URLs
```bash
GET /api/urls
Authorization: Bearer <token>
```

#### Get URL Analytics
```bash
GET /api/urls/:code/analytics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shortCode": "mylink",
    "totalClicks": 42,
    "clicksByDay": [
      { "date": "2024-01-31", "clicks": 15 },
      { "date": "2024-01-30", "clicks": 27 }
    ]
  }
}
```

#### Delete URL
```bash
DELETE /api/urls/:code
Authorization: Bearer <token>
```

#### Redirect (Access Short URL)
```bash
GET /:code
# Redirects to original URL and logs analytics
```

### System Endpoints

#### Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-31T12:00:00.000Z",
  "uptime": 12345.67
}
```

## 🧪 Testing

### Run all tests
```bash
bun test
```

### Run tests in watch mode
```bash
bun test --watch
```

### Run specific test file
```bash
bun test tests/api.test.ts
```

## 🏗️ Project Structure

```
url-shortener/
├── src/
│   ├── controllers/           # Request handlers
│   │   ├── auth.controller.ts
│   │   └── url.controller.ts
│   ├── middleware/            # Middleware functions
│   │   └── index.ts
│   ├── db.ts                  # Database configuration
│   ├── routes.ts              # Route definitions
│   ├── utils.ts               # Utility functions
│   └── index.ts               # Application entry point
├── tests/
│   └── api.test.ts            # API tests
├── scripts/
│   ├── migrate.ts             # Database migrations
│   └── seed.ts                # Database seeding
├── .github/
│   └── workflows/
│       └── ci.yml             # CI/CD pipeline
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Docker Compose setup
├── bunfig.toml                # Bun configuration
├── package.json               # Dependencies
└── README.md                  # Documentation
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `0.0.0.0` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_PATH` | SQLite database path | `./data/urls.db` |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRES_IN` | Token expiration | `24h` |
| `API_RATE_LIMIT` | Requests per window | `100` |
| `RATE_LIMIT_WINDOW` | Rate limit window (ms) | `900000` (15 min) |
| `CORS_ORIGIN` | CORS allowed origin | `*` |
| `BASE_URL` | Base URL for short links | `http://localhost:3000` |

## 🚢 Deployment

### Manual Deployment

1. **Build Docker image**
   ```bash
   docker build -t url-shortener .
   ```

2. **Run container**
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e JWT_SECRET=your-secret \
     -v $(pwd)/data:/app/data \
     url-shortener
   ```

### CI/CD Deployment

The project includes a GitHub Actions workflow that:
1. ✅ Runs tests on every push/PR
2. 🔍 Performs security scanning with Trivy
3. 🏗️ Builds Docker image
4. 🚀 Deploys to production on main branch

**Setup GitHub Secrets:**
- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password
- `SERVER_HOST`: Production server host
- `SERVER_USER`: SSH username
- `SSH_PRIVATE_KEY`: SSH private key
- `PRODUCTION_URL`: Production URL for health checks

### Production Considerations

1. **Database**: Consider PostgreSQL for production
2. **Secrets**: Use proper secret management (AWS Secrets Manager, HashiCorp Vault)
3. **Monitoring**: Add APM tools (DataDog, New Relic)
4. **Logging**: Use centralized logging (ELK, CloudWatch)
5. **SSL**: Configure HTTPS with Let's Encrypt
6. **Scaling**: Use load balancers and container orchestration (Kubernetes)

## 📊 Middleware Overview

### 1. Logger Middleware
Logs all HTTP requests with method, URL, status, and duration.

### 2. CORS Middleware
Handles Cross-Origin Resource Sharing headers and OPTIONS requests.

### 3. Authentication Middleware
Validates JWT tokens and attaches user info to context.

### 4. Rate Limiting Middleware
Prevents abuse with configurable request limits per IP.

### 5. Error Handler Middleware
Catches and formats errors consistently.

### 6. JSON Parser Middleware
Parses JSON request bodies with validation.

## 🔐 Security Features

- 🔒 **Password Hashing**: bcrypt with salt rounds
- 🎫 **JWT Authentication**: Stateless authentication
- 🚦 **Rate Limiting**: Per-IP request limits
- ✅ **Input Validation**: Comprehensive validation
- 🛡️ **CORS**: Configurable origin restrictions
- 🔍 **SQL Injection Prevention**: Prepared statements
- 📊 **Security Headers**: Basic security headers

## 🎓 Learning Resources

### Bun
- [Bun Official Docs](https://bun.sh/docs)
- [Bun API Reference](https://bun.sh/docs/api)

### DevOps
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [CI/CD Fundamentals](https://www.redhat.com/en/topics/devops/what-is-ci-cd)

### SQLite
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Database Design](https://www.sqlitetutorial.net/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - feel free to use this project for learning and commercial purposes.

## 🎯 Next Steps

To continue learning, try:
1. **Add Redis**: Cache frequently accessed URLs
2. **Add PostgreSQL**: Replace SQLite for production
3. **Implement QR Codes**: Generate QR codes for short URLs
4. **Add Webhooks**: Notify on URL creation/clicks
5. **Create Admin Dashboard**: React frontend for management
6. **Implement API Versioning**: Support multiple API versions
7. **Add Prometheus Metrics**: Export metrics for monitoring
8. **Implement GraphQL**: Alternative to REST API
9. **Add Email Notifications**: Password reset, etc.
10. **Deploy to AWS/GCP**: Cloud deployment practice

## 💬 Support

If you have questions or run into issues:
- Open an issue on GitHub
- Check existing issues and documentation
- Review the code comments for implementation details

---

Built with ❤️ using Bun • Happy Learning! 🚀
