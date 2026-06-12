FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 5000

# Startup script: migrate, seed (if first run), then start
CMD sh -c "npx prisma migrate deploy && node prisma/seed.js 2>/dev/null || true; node src/index.js"
