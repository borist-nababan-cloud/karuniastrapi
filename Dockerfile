# Use Node 20 Alpine for smaller image size
FROM node:20-alpine AS base

# Install system dependencies for Strapi
# libvips-dev is required for sharp (image processing)
RUN apk update && \
    apk add --no-cache \
    build-base \
    gcc \
    autoconf \
    automake \
    zlib-dev \
    libpng-dev \
    nasm \
    bash \
    vips-dev \
    git

# Set working directory
WORKDIR /app

# --- Build Stage ---
FROM base AS builder

# Copy package files
COPY package*.json ./

# Install dependencies
# Using --production=false to include devDependencies needed for build
RUN npm ci --production=false

# Copy source code
COPY . .

# Build admin panel
ENV NODE_ENV=production
RUN npm run build

# Remove development dependencies after build
RUN npm prune --production

# --- Production Stage ---
FROM base AS production

# Set to production
ENV NODE_ENV=production

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/config ./config
COPY --from=builder /app/database ./database
COPY --from=builder /app/src ./src
COPY --from=builder /app/favicon.png ./

# Create directories for uploads and temp data
RUN mkdir -p /app/public/uploads /app/.tmp && \
    chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose Strapi port
EXPOSE 1337

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:1337/_health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Strapi
CMD ["npm", "run", "start"]
