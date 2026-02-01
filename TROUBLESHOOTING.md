# 🔧 Troubleshooting Guide

Common issues and their solutions when running the URL Shortener project.

## Installation Issues

### Issue: `bun: command not found`

**Solution:**
```bash
# Install Bun (Unix/Linux/macOS)
curl -fsSL https://bun.sh/install | bash

# For Windows
powershell -c "irm bun.sh/install.ps1|iex"

# Verify installation
bun --version
```

### Issue: `Cannot find module 'bcrypt'` or similar dependency errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
bun install

# Or force clean install
bun install --force
```

### Issue: TypeScript errors about types

**Solution:**
```bash
# Install all dev dependencies
bun install

# If still having issues, try:
bun add -d @types/node @types/bcrypt @types/jsonwebtoken bun-types
```

## Database Issues

### Issue: `SQLITE_CANTOPEN: unable to open database file`

**Solution:**
```bash
# Create the data directory
mkdir -p data

# Make sure you have write permissions
chmod 755 data

# Run migrations
bun run db:migrate
```

### Issue: `table users already exists` or similar

**Solution:**
```bash
# Delete existing database and recreate
rm -rf data/*.db data/*.db-*
bun run db:migrate
```

### Issue: Database locked errors

**Solution:**
```bash
# Close all connections to the database
# Stop the server if running
# Delete WAL files
rm data/*.db-wal data/*.db-shm

# Restart the server
bun run dev
```

## Runtime Issues

### Issue: `Port 3000 is already in use`

**Solution 1 - Use different port:**
```bash
PORT=3001 bun run dev
```

**Solution 2 - Kill process using port 3000:**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Or in one command
lsof -ti:3000 | xargs kill -9
```

### Issue: `ECONNREFUSED` when testing

**Solution:**
Make sure the server is running:
```bash
# In one terminal
bun run dev

# In another terminal
bun test
```

### Issue: JWT token errors or "Invalid token"

**Solution:**
```bash
# Make sure JWT_SECRET is set in .env
echo 'JWT_SECRET=your-secret-here' >> .env

# Restart the server
bun run dev

# Get a fresh token by logging in again
```

## Test Issues

### Issue: Tests fail with database errors

**Solution:**
```bash
# Tests use in-memory database by default
# Make sure DATABASE_PATH=":memory:" is set in test environment

# Run tests with explicit memory database
DATABASE_PATH=":memory:" bun test
```

### Issue: Rate limit tests failing

**Solution:**
```bash
# Rate limiting uses in-memory store
# Tests might fail if running too quickly
# Try running tests individually:

bun test tests/api.test.ts
```

## Docker Issues

### Issue: `Cannot connect to Docker daemon`

**Solution:**
```bash
# Make sure Docker is running
sudo systemctl start docker

# Or on macOS
open -a Docker

# Verify Docker is running
docker ps
```

### Issue: `permission denied while trying to connect to Docker`

**Solution:**
```bash
# Add your user to docker group (Linux)
sudo usermod -aG docker $USER

# Log out and log back in, or run:
newgrp docker

# Or run with sudo (not recommended for regular use)
sudo docker-compose up
```

### Issue: Build fails with `failed to solve` error

**Solution:**
```bash
# Clear Docker build cache
docker builder prune -a

# Rebuild without cache
docker-compose build --no-cache

# Or rebuild specific service
docker-compose build --no-cache app
```

### Issue: Container exits immediately

**Solution:**
```bash
# Check logs
docker-compose logs app

# Common causes:
# 1. Syntax error in code - fix and rebuild
# 2. Missing environment variables - check .env file
# 3. Port already in use - change PORT in docker-compose.yml
```

## API Issues

### Issue: CORS errors in browser

**Solution:**
```bash
# Make sure CORS_ORIGIN is set correctly in .env
# For development, use:
CORS_ORIGIN=*

# For production with specific origin:
CORS_ORIGIN=https://yourdomain.com

# Restart server after changing
```

### Issue: `429 Too Many Requests` errors

**Solution:**
```bash
# Increase rate limits in .env
API_RATE_LIMIT=200
RATE_LIMIT_WINDOW=900000

# Or restart server to reset in-memory counters
```

### Issue: Authentication not working

**Solution:**
```bash
# Check that Authorization header is correct format:
# Authorization: Bearer <token>

# Example with curl:
curl -H "Authorization: Bearer your-token-here" http://localhost:3000/api/auth/profile

# Make sure token hasn't expired (default is 24h)
```

## Development Issues

### Issue: Hot reload not working

**Solution:**
```bash
# Make sure you're using --watch flag
bun --watch src/index.ts

# Or use the dev script
bun run dev

# If still not working, manually restart
```

### Issue: Changes not reflected in Docker

**Solution:**
```bash
# Make sure volumes are mounted correctly
# Check docker-compose.yml has:
# volumes:
#   - ./src:/app/src

# Restart container
docker-compose restart app

# Or rebuild if needed
docker-compose up --build
```

## Production Issues

### Issue: High memory usage

**Solution:**
1. Add memory limits to docker-compose.yml:
```yaml
services:
  app:
    mem_limit: 512m
    memswap_limit: 512m
```

2. Monitor with:
```bash
docker stats
```

3. Consider using PostgreSQL instead of SQLite for production

### Issue: Database growing too large

**Solution:**
```bash
# Clean up expired URLs periodically
# Add a cron job or scheduled task

# Example cleanup script:
sqlite3 data/urls.db "DELETE FROM urls WHERE expires_at < datetime('now');"
sqlite3 data/urls.db "VACUUM;"
```

### Issue: SSL/HTTPS not working

**Solution:**
1. Use nginx reverse proxy with Let's Encrypt
2. Update nginx.conf with your domain
3. Generate certificates:
```bash
certbot certonly --nginx -d yourdomain.com
```

## Getting Help

If none of these solutions work:

1. **Check the logs:**
   ```bash
   # Development
   Check terminal output
   
   # Docker
   docker-compose logs -f app
   ```

2. **Enable debug mode:**
   ```bash
   LOG_LEVEL=debug bun run dev
   ```

3. **Verify environment:**
   ```bash
   # Check Bun version
   bun --version
   
   # Check Node version (if needed)
   node --version
   
   # Check dependencies
   bun pm ls
   ```

4. **Clean install:**
   ```bash
   rm -rf node_modules
   rm bun.lockb
   bun install
   ```

5. **Reset everything:**
   ```bash
   # Stop all containers
   docker-compose down -v
   
   # Remove all project files
   rm -rf node_modules data/*.db dist
   
   # Start fresh
   bun install
   bun run db:migrate
   bun run dev
   ```

## Common Error Messages

| Error | Likely Cause | Solution |
|-------|-------------|----------|
| `EADDRINUSE` | Port already in use | Change PORT or kill process |
| `MODULE_NOT_FOUND` | Missing dependency | Run `bun install` |
| `SQLITE_ERROR` | Database issue | Check database file permissions |
| `JsonWebTokenError` | Invalid JWT | Get new token by logging in |
| `ValidationError` | Invalid input | Check request body format |
| `ECONNREFUSED` | Server not running | Start server with `bun run dev` |

## Need More Help?

1. Check the main README.md
2. Check the LEARNING_GUIDE.md
3. Review the code comments
4. Check Bun documentation: https://bun.sh/docs
5. Open an issue on GitHub

Remember: Most issues can be solved by reading error messages carefully and checking that all environment variables are set correctly!
