# Use official Bun image
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install production dependencies
RUN mkdir -p /temp/prod
COPY package.json /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy source code and dependencies
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Run tests (optional - can be commented out for faster builds)
# RUN bun test

# Production stage
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app/src ./src
COPY --from=prerelease /app/package.json .

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun fetch http://localhost:3000/health || exit 1

# Run the app
USER bun
ENTRYPOINT ["bun", "run", "src/index.ts"]
