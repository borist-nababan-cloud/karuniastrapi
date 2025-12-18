# -----------------------------------------------------------------------------
# BASE IMAGE
# -----------------------------------------------------------------------------
FROM node:18-alpine as builder

# Install dependencies required for sharp and other native modules
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application source
COPY . .

# Build the admin panel and backend
ENV NODE_ENV=production
RUN npm run build

# -----------------------------------------------------------------------------
# PRODUCTION IMAGE
# -----------------------------------------------------------------------------
FROM node:18-alpine

# Install runtime dependencies for sharp
RUN apk update && apk add --no-cache vips-dev

WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts and ESSENTIAL CONFIGURATION
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config ./config
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Expose the Strapi port
EXPOSE 1337

# Start the application
CMD ["npm", "run", "start"]