# 🚀 Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites
- Install Bun: `curl -fsSL https://bun.sh/install | bash`

## Steps

### 1. Install Dependencies
```bash
bun install
```

### 2. Verify Setup
```bash
bun run verify
```
This will check that everything is properly configured.

### 3. Set Up Environment
```bash
cp .env.example .env
# Edit .env if needed (defaults work fine for local development)
```

### 4. Initialize Database
```bash
bun run db:migrate
bun run db:seed  # Optional: adds demo data
```

### 5. Start Server
```bash
bun run dev
```

Server runs at `http://localhost:3000` ✨

## 🎮 Try It Out!

### 1. Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com",
    "password": "Alice1234"
  }'
```

Save the token from the response!

### 2. Create a Short URL
```bash
curl -X POST http://localhost:3000/api/urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "url": "https://github.com/oven-sh/bun",
    "customCode": "bunjs"
  }'
```

### 3. Visit Your Short URL
Open `http://localhost:3000/bunjs` in your browser!

### 4. Check Analytics
```bash
curl http://localhost:3000/api/urls/bunjs/analytics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📚 Next Steps

1. **Read the API Docs**: Visit `http://localhost:3000/`
2. **Import Postman Collection**: Use `postman_collection.json`
3. **Explore the Code**: Start with `src/index.ts`
4. **Run Tests**: `bun test`
5. **Try Docker**: `docker-compose up`

## 💡 Demo Users (if you ran seed)
- Username: `demo_user`, Password: `Demo1234`
- Username: `alice`, Password: `Demo1234`
- Username: `bob`, Password: `Demo1234`

## 🎓 Learning Path

1. **Week 1**: Understand the codebase
   - Read through middleware implementations
   - Study the authentication flow
   - Experiment with the API

2. **Week 2**: Enhance functionality
   - Add new middleware (compression, security headers)
   - Implement URL aliasing
   - Add email notifications

3. **Week 3**: Master DevOps
   - Deploy to a cloud provider
   - Set up monitoring and logging
   - Configure CI/CD for automatic deployments

4. **Week 4**: Scale it up
   - Add Redis for caching
   - Implement database replication
   - Set up load balancing

## 🆘 Troubleshooting

**Port 3000 already in use?**
```bash
# Change port in .env
PORT=3001 bun run dev
```

**Database errors?**
```bash
rm -rf data/*.db
bun run db:migrate
```

**Module not found?**
```bash
rm -rf node_modules
bun install
```

## 🎉 You're Ready!

Start building and learning! Check the main README for detailed documentation.
