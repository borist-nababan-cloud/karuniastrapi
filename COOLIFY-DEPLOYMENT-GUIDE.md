# Coolify Deployment Guide for Karunia Motor Backend

**Comprehensive guide for deploying your Strapi v5 backend to Coolify**

Last Updated: December 18, 2025  
Strapi Version: 5.31.3  
Node Version: >=20.0.0

---

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Understanding Coolify](#understanding-coolify)
4. [Deployment Options](#deployment-options)
5. [Method 1: Deploy Using Docker Compose (Recommended)](#method-1-deploy-using-docker-compose-recommended)
6. [Method 2: Deploy Using GitLab Repository with Nixpacks](#method-2-deploy-using-gitlab-repository-with-nixpacks)
7. [Database Configuration](#database-configuration)
8. [Environment Variables Setup](#environment-variables-setup)
9. [File Uploads & Persistent Storage](#file-uploads--persistent-storage)
10. [SSL/HTTPS Configuration](#sslhttps-configuration)
11. [Post-Deployment Steps](#post-deployment-steps)
12. [Troubleshooting](#troubleshooting)
13. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Introduction

This guide provides step-by-step instructions for deploying the **Karunia Motor Strapi backend** application to a VPS server managed by **Coolify**. Coolify is an open-source, self-hosted Platform as a Service (PaaS) alternative to Heroku, Netlify, and Vercel.

### What is Coolify?

[Coolify](https://coolify.io) is a self-hosted platform that simplifies application deployment by providing:
- **Git-based workflows** with automatic deployments
- **Automatic SSL certificates** via Let's Encrypt
- **Built-in monitoring** and logging
- **Docker-based deployments** with zero-config
- **Multi-server management** through a centralized dashboard

### Why Deploy Strapi on Coolify?

- **Cost-effective**: Self-hosted on your VPS without additional platform fees
- **Full control**: Manage your own infrastructure
- **Scalable**: Add multiple servers as needed
- **Developer-friendly**: Git push to deploy workflow
- **Zero vendor lock-in**: Open-source solution

---

## Prerequisites

Before starting deployment, ensure you have:

### 1. **VPS Server Requirements**

Minimum specifications for Coolify + Strapi:
- **RAM**: 4GB (8GB recommended for production)
- **CPU**: 2 cores (4 cores recommended)
- **Storage**: 50GB SSD (100GB+ recommended)
- **OS**: Ubuntu 22.04 LTS or newer (recommended)
- **Network**: Public IP address with open ports 80, 443, 8000, 6002

### 2. **Domain Name**

- A registered domain name (e.g., `api.karuniamotor.com`)
- DNS configured to point to your VPS IP address
- Subdomain support for preview deployments (optional)

### 3. **Local Development Setup**

- Git installed and repository access
- GitLab account (for Git-based deployments)
- SSH access to your VPS
- Basic understanding of Docker concepts

### 4. **Project Requirements**

This deployment guide is specifically for:
- **Strapi Version**: 5.31.3
- **Node.js Version**: 20.x or 22.x (NOT 21.x)
- **Database**: PostgreSQL 14+ (required for production)
- **Package Manager**: npm (default for this project)

---

## Understanding Coolify

### How Coolify Works

Coolify deploys applications as **Docker containers**. When you deploy to Coolify:

1. **Source Code Retrieval**: Coolify clones your Git repository
2. **Build Process**: Creates a Docker image using buildpacks (Nixpacks/Dockerfile)
3. **Container Launch**: Runs your app in an isolated Docker container
4. **Proxy Setup**: Configures Traefik reverse proxy for routing and SSL
5. **Health Checks**: Monitors container health and availability

### Key Concepts

- **Project**: A logical grouping of related applications and services
- **Resource**: An application, database, or service within a project
- **Environment**: Separate instances (production, staging, preview)
- **Build Pack**: Method for transforming code into Docker images
- **Persistent Storage**: Volumes for data that survives container restarts

---

## Deployment Options

You have two main deployment methods for this Strapi application:

### Option 1: Docker Compose (Recommended)

**Best for:**
- Production deployments
- Full control over services (app + database)
- Custom configuration needs
- Volume and network management

**Pros:**
- Complete control over build process
- Can include multiple services (Strapi + PostgreSQL)
- Easy to customize and maintain
- Persistent data management

**Cons:**
- Requires Docker knowledge
- More initial setup

### Option 2: Nixpacks with GitLab

**Best for:**
- Quick deployments
- CI/CD automation
- Preview deployments from PRs
- Minimal configuration

**Pros:**
- Zero-config deployments
- Automatic buildpack detection
- Built-in preview deployments
- Easier initial setup

**Cons:**
- Less control over build process
- Database must be provisioned separately
- Limited customization

**Recommendation**: Use **Method 1 (Docker Compose)** for production deployments as it provides better control and includes database management.

---

## Method 1: Deploy Using Docker Compose (Recommended)

This method uses Docker Compose to deploy both Strapi and PostgreSQL together.

### Step 1: Install Coolify on Your VPS

1. **SSH into your VPS**:
   ```bash
   ssh root@your-vps-ip
   ```

2. **Install Coolify**:
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```

   This single command will:
   - Install Docker and Docker Compose
   - Install Traefik reverse proxy
   - Set up Coolify dashboard
   - Configure basic firewall rules

3. **Verify Installation**:
   After installation completes (takes 2-5 minutes), you'll see:
   ```
   Coolify is now running on: http://your-vps-ip:8000
   ```

4. **Access Coolify Dashboard**:
   - Open browser: `http://your-vps-ip:8000`
   - Complete initial setup wizard
   - Set admin email and password

### Step 2: Create Project in Coolify

1. **Login to Coolify Dashboard**
2. **Navigate to Projects** → Click **"+ New Project"**
3. **Enter Project Details**:
   - Name: `karunia-motor-backend`
   - Description: `Strapi backend for Karunia Motor dealership system`
   - Environment: `production`
4. **Click "Create"**

### Step 3: Prepare Docker Compose Configuration

Create `docker-compose.prod.yml` in your project root:

```yaml
version: '3.8'

services:
  strapi:
    build:
      context: .
      dockerfile: Dockerfile
    image: karunia-strapi:latest
    container_name: karunia-strapi
    restart: unless-stopped
    env_file: .env
    environment:
      NODE_ENV: production
      DATABASE_CLIENT: postgres
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: ${DATABASE_NAME}
      DATABASE_USERNAME: ${DATABASE_USERNAME}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      DATABASE_SSL: false
      APP_KEYS: ${APP_KEYS}
      API_TOKEN_SALT: ${API_TOKEN_SALT}
      ADMIN_JWT_SECRET: ${ADMIN_JWT_SECRET}
      TRANSFER_TOKEN_SALT: ${TRANSFER_TOKEN_SALT}
      JWT_SECRET: ${JWT_SECRET}
    volumes:
      - strapi-uploads:/app/public/uploads
      - strapi-data:/app/.tmp
    ports:
      - "1337:1337"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - karunia-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:1337/_health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15-alpine
    container_name: karunia-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DATABASE_NAME}
      POSTGRES_USER: ${DATABASE_USERNAME}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=en_US.UTF-8"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    networks:
      - karunia-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USERNAME} -d ${DATABASE_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

volumes:
  strapi-uploads:
    driver: local
  strapi-data:
    driver: local
  postgres-data:
    driver: local

networks:
  karunia-network:
    driver: bridge
```

### Step 4: Create Production Dockerfile

Create `Dockerfile` in your project root:

```dockerfile
# Use Node 20 Alpine for smaller image size
FROM node:20-alpine3.18 AS base

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
COPY --from=builder /app/build ./build
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
```

### Step 5: Configure Git Repository Access in Coolify

#### Option A: Using GitLab Integration (Recommended)

1. **In Coolify Dashboard** → Go to **Settings** → **Sources**
2. **Click "Add Source"** → Select **"GitLab"**
3. **Follow OAuth flow** to authorize Coolify with GitLab
4. **Select repositories** you want to grant access to

#### Option B: Using Deploy Key

1. **In Coolify Dashboard** → Go to **Settings** → **Keys**
2. **Generate SSH Key** → Copy the public key
3. **In GitLab** → Go to your repository → **Settings** → **Repository** → **Deploy Keys**
4. **Add Deploy Key** → Paste public key, grant read access
5. **In Coolify** → Add repository URL with SSH format (git@gitlab.com:username/repo.git)

### Step 6: Deploy Application

1. **In Your Project** → Click **"+ New Resource"**
2. **Select "Application"** → Choose **"Docker Compose"**
3. **Configure Repository**:
   - **Repository URL**: Your GitLab repository URL (e.g., https://gitlab.com/karuniamotor/karunia-backend.git)
   - **Branch**: `main` (or your deployment branch)
   - **Docker Compose Location**: `docker-compose.prod.yml`
   - **Build Pack**: Docker Compose

4. **Configure Build Settings**:
   - **Base Directory**: `.` (root)
   - **Docker Compose Path**: `./docker-compose.prod.yml`
   - **Dockerfile Path**: `./Dockerfile` (if custom)

5. **Set Resource Name**: `karunia-motor-strapi`

6. **Enable "Preserve Repository Code"** (Important!):
   - This ensures volumes persist properly
   - Located in: **Configuration** → **General** → **Preserve Repository Code**

7. **Click "Save"**

### Step 7: Configure Environment Variables

**In Coolify Dashboard** → Your Application → **Environment Variables**

Add the following variables:

```env
# Server Configuration
HOST=0.0.0.0
PORT=1337
NODE_ENV=production

# Security Keys (IMPORTANT: Generate unique values!)
APP_KEYS="your-app-key-1,your-app-key-2,your-app-key-3,your-app-key-4"
API_TOKEN_SALT=your-unique-api-token-salt
ADMIN_JWT_SECRET=your-unique-admin-jwt-secret
TRANSFER_TOKEN_SALT=your-unique-transfer-token-salt
JWT_SECRET=your-unique-jwt-secret
ENCRYPTION_KEY=your-unique-encryption-key

# Database Configuration
DATABASE_CLIENT=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=karunia_motor
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=your-secure-database-password
DATABASE_SSL=false
DATABASE_SCHEMA=public

# Optional: CORS Configuration
# Add your frontend domains here
# FRONTEND_URL=https://karuniamotor.com
```

**Generate Secure Random Keys**:

You can generate secure keys using Node.js:

```bash
# Generate random keys (run on your local machine)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Run this command 5 times to generate:
- 4 values for APP_KEYS (comma-separated)
- API_TOKEN_SALT
- ADMIN_JWT_SECRET
- TRANSFER_TOKEN_SALT
- JWT_SECRET

### Step 8: Configure Domain

1. **In Your Application** → Go to **Domains**
2. **Add Domain**: `api.karuniamotor.com` (or your domain)
3. **Enable HTTPS**: Toggle **"Generate Let's Encrypt Certificate"**
4. **Wait for SSL**: Coolify will automatically obtain SSL certificate

### Step 9: Deploy!

1. **Click "Deploy" button** in your application dashboard
2. **Monitor Logs**: Watch the deployment process in real-time
3. **Wait for Completion**: Initial deployment takes 5-10 minutes
4. **Verify Health**: Check that all containers are running

### Step 10: Access Your Application

Once deployed successfully:

- **API**: `https://api.karuniamotor.com/api`
- **Admin Panel**: `https://api.karuniamotor.com/admin`
- **Documentation**: `https://api.karuniamotor.com/documentation`

---

## Method 2: Deploy Using GitLab Repository with Nixpacks

This method uses Coolify's automatic build detection (Nixpacks) for simpler deployments.

### Step 1: Install Coolify (Same as Method 1)

Follow **Method 1, Step 1** to install Coolify on your VPS.

### Step 2: Create Project

Follow **Method 1, Step 2** to create a project in Coolify.

### Step 3: Deploy PostgreSQL Database First

1. **In Your Project** → Click **"+ New Resource"**
2. **Select "Database"** → Choose **"PostgreSQL"**
3. **Configure Database**:
   - **Name**: `karunia-postgres`
   - **Version**: `15` (or latest stable)
   - **Database Name**: `karunia_motor`
   - **Username**: `strapi_user`
   - **Password**: Generate secure password
   - **Port**: `5432` (internal), `5433` (external, if needed)
   - **Persistent Storage**: Enabled
4. **Click "Create"**
5. **Wait for Database**: Wait until status shows "Running"
6. **Note Connection Details**: You'll need these for Strapi

**Important**: Copy the **Internal Connection String** for use in Strapi:
```
postgres://strapi_user:password@postgres:5432/karunia_motor
```

### Step 4: Deploy Strapi Application

1. **In Your Project** → Click **"+ New Resource"**
2. **Select "Application"** → Choose **"Git Repository"**
3. **Configure Repository**:
   - **Source**: GitLab (connect via OAuth or Deploy Key)
   - **Repository**: Select your repository (karuniamotor/karunia-backend)
   - **Branch**: `main`
   - **Build Pack**: Nixpacks (auto-detected)

4. **Configure Build**:
   - **Install Command**: `npm ci`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - **Port**: `1337`

5. **Enable Features**:
   - **Auto Deploy**: Enable (deploys on git push)
   - **Preview Deployments**: Enable (optional, for PR previews)
   - **Watch Path**: Leave empty (deploys on any change)

### Step 5: Configure Environment Variables

Same as **Method 1, Step 7**, but update `DATABASE_HOST`:

```env
# Use the internal hostname of your PostgreSQL database
# Format: {database-resource-name} (without port)
DATABASE_HOST=karunia-postgres
DATABASE_PORT=5432
DATABASE_NAME=karunia_motor
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=your-database-password
```

### Step 6: Configure Persistent Storage

**In Your Application** → **Storage** → **Add Persistent Storage**

Add these volumes:

1. **Uploads Volume**:
   - **Name**: `strapi-uploads`
   - **Mount Path**: `/app/public/uploads`
   - **Size**: `10GB` (adjust based on needs)

2. **Temp Data Volume**:
   - **Name**: `strapi-temp`
   - **Mount Path**: `/app/.tmp`
   - **Size**: `1GB`

### Step 7: Deploy & Monitor

1. **Click "Deploy"**
2. **Monitor Build Logs**: Watch for any errors
3. **Wait for Success**: First deployment takes 5-10 minutes

---

## Database Configuration

### PostgreSQL Best Practices

For production Strapi deployments, PostgreSQL is **strongly recommended** over SQLite.

#### Why PostgreSQL?

- **Concurrent Connections**: Handles multiple users simultaneously
- **Data Integrity**: Better ACID compliance
- **Scalability**: Can handle millions of records
- **Backup & Replication**: Enterprise-grade features
- **Performance**: Optimized for read-heavy workloads

#### Database Connection Strings

**Internal Connection** (from Strapi container to DB container):
```env
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=karunia_motor
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=your-password
```

**External Connection** (from outside VPS, e.g., pgAdmin):
```
postgres://strapi_user:password@your-vps-ip:5433/karunia_motor
```

**Note**: Port 5433 is used externally to avoid conflicts with default PostgreSQL port.

#### Database Backups

**Automated Backups in Coolify**:

1. **In Database Resource** → **Backups**
2. **Schedule**: Daily at 2 AM
3. **Retention**: 7 days (adjust as needed)
4. **Destination**: Local server or S3-compatible storage

**Manual Backup**:

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Create backup
docker exec karunia-postgres pg_dump -U strapi_user karunia_motor > backup_$(date +%Y%m%d).sql

# Restore backup
cat backup_20251218.sql | docker exec -i karunia-postgres psql -U strapi_user karunia_motor
```

---

## Environment Variables Setup

### Critical Environment Variables

These environment variables are **required** for production:

#### Security Keys

```env
# APP_KEYS: Comma-separated list of 4 random strings
# Used for session encryption
APP_KEYS="key1==,key2==,key3==,key4=="

# API_TOKEN_SALT: Salt for API token hashing
API_TOKEN_SALT="your-unique-salt-here"

# ADMIN_JWT_SECRET: Secret for admin JWT tokens
ADMIN_JWT_SECRET="your-admin-jwt-secret"

# TRANSFER_TOKEN_SALT: Salt for transfer tokens
TRANSFER_TOKEN_SALT="your-transfer-salt"

# JWT_SECRET: Secret for user JWT tokens
JWT_SECRET="your-jwt-secret"
```

**Important**: Never commit these to Git! Use Coolify's environment variable management.

#### Database Configuration

```env
DATABASE_CLIENT=postgres
DATABASE_HOST=postgres  # Internal hostname in Docker network
DATABASE_PORT=5432
DATABASE_NAME=karunia_motor
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=your-secure-password
DATABASE_SSL=false  # Set to true if using SSL
DATABASE_SCHEMA=public
```

#### Server Configuration

```env
HOST=0.0.0.0
PORT=1337
NODE_ENV=production
```

#### Optional: CORS & Frontend Integration

```env
# If you have a frontend application
FRONTEND_URL=https://karuniamotor.com
CLIENT_URL=https://karuniamotor.com
```

Update `config/server.ts` to use these:

```typescript
export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: true,
  },
  http: {
    middleware: {
      cors: {
        origin: [
          env('FRONTEND_URL'),
          'http://localhost:3000',
          'http://localhost:1337'
        ],
        credentials: true,
      },
    },
  },
});
```

### Environment Variable Management

**In Coolify**:

1. Navigate to: **Application** → **Environment Variables**
2. Click **"Add Variable"**
3. Enter **Key** and **Value**
4. Click **"Save"**
5. **Restart Application** for changes to take effect

**Security Best Practices**:

- Never commit `.env` files to Git
- Use different secrets for staging and production
- Rotate secrets periodically (every 90 days)
- Use strong, randomly generated passwords (32+ characters)
- Store backups of environment variables securely

---

## File Uploads & Persistent Storage

### Understanding Persistent Storage in Docker

Docker containers are **ephemeral** by default - when a container restarts, all data inside is lost. For Strapi, this means:

- User-uploaded files (images, documents)
- Database files (if using SQLite)
- Temporary cache data

To persist this data, we use **Docker volumes**.

### Required Volumes for Strapi

#### 1. Uploads Directory

**Purpose**: Stores all media files uploaded through Strapi admin panel.

**Configuration**:
```yaml
volumes:
  - strapi-uploads:/app/public/uploads
```

**Location on VPS**:
```
/data/coolify/applications/[app-id]/strapi-uploads
```

**Important Notes**:
- **Enable "Preserve Repository Code"** in Coolify settings
- Without this, Coolify won't copy files from Git to volumes
- Initial deployment will create empty directories
- Files persist across container restarts and redeployments

#### 2. Temporary Data Directory

**Purpose**: Stores session data, cache, and temporary files.

**Configuration**:
```yaml
volumes:
  - strapi-data:/app/.tmp
```

**Note**: Can be omitted if using external session storage (Redis).

### Managing Upload Storage

#### Check Storage Usage

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Check volume size
du -sh /data/coolify/applications/*/strapi-uploads

# Check specific container volumes
docker volume ls
docker volume inspect strapi-uploads
```

#### Backup Uploads

```bash
# Create backup of uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz \
  /data/coolify/applications/[app-id]/strapi-uploads

# Restore uploads
tar -xzf uploads-backup-20251218.tar.gz -C /
```

#### Clean Up Old Uploads

```bash
# Find files older than 90 days
find /data/coolify/applications/*/strapi-uploads -type f -mtime +90

# Delete files older than 90 days (be careful!)
find /data/coolify/applications/*/strapi-uploads -type f -mtime +90 -delete
```

### Alternative: External File Storage

For production, consider using external storage providers:

#### AWS S3 Configuration

Install provider plugin:
```bash
npm install @strapi/provider-upload-aws-s3
```

Configure in `config/plugins.ts`:
```typescript
export default ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        accessKeyId: env('AWS_ACCESS_KEY_ID'),
        secretAccessKey: env('AWS_ACCESS_SECRET'),
        region: env('AWS_REGION'),
        params: {
          Bucket: env('AWS_BUCKET'),
        },
      },
    },
  },
});
```

**Benefits**:
- Unlimited storage
- CDN integration
- Better performance
- Automatic backups
- No VPS storage concerns

#### Cloudinary Configuration

Install provider:
```bash
npm install @strapi/provider-upload-cloudinary
```

Configure:
```typescript
export default ({ env }) => ({
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
      },
    },
  },
});
```

---

## SSL/HTTPS Configuration

Coolify automatically handles SSL certificate generation and renewal via **Let's Encrypt**.

### Automatic SSL Setup

1. **Add Domain** to your application in Coolify
2. **Enable HTTPS**: Toggle "Generate Let's Encrypt Certificate"
3. **Wait**: SSL certificate is obtained automatically (1-2 minutes)
4. **Verify**: Access your domain via `https://`

### Requirements for SSL

- Domain must be publicly accessible
- DNS must point to your VPS IP
- Ports 80 and 443 must be open
- Domain must not be localhost or IP address

### Force HTTPS

**In Coolify**:

1. **Application** → **Configuration** → **Network**
2. Enable **"Force HTTPS"**
3. All HTTP traffic will redirect to HTTPS

**Alternatively, in Strapi** (`config/server.ts`):

```typescript
export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  proxy: true, // Important for HTTPS behind reverse proxy
  url: env('PUBLIC_URL', 'https://api.karuniamotor.com'),
  app: {
    keys: env.array('APP_KEYS'),
  },
});
```

### SSL Certificate Renewal

Let's Encrypt certificates expire every **90 days**.

**Coolify automatically renews** certificates before expiration.

**Manual Renewal** (if needed):

```bash
# In Coolify Dashboard
# Go to: Application → Domains → Click "Renew SSL"
```

### Wildcard SSL (Optional)

For multiple subdomains (`api.example.com`, `cms.example.com`):

1. Use **wildcard certificate**: `*.example.com`
2. Requires DNS validation (not HTTP validation)
3. Configure in Coolify DNS settings

---

## Post-Deployment Steps

After successful deployment, complete these essential tasks:

### 1. Create Admin User

1. **Access Admin Panel**: `https://api.karuniamotor.com/admin`
2. **First-time Setup**: You'll be prompted to create admin account
3. **Enter Details**:
   - Email: `admin@karuniamotor.com`
   - Password: Strong password (12+ characters)
   - First Name: Your name
   - Last Name: Your surname
4. **Click "Create Admin"**

**Note**: If you already have an admin user from development, you can skip this.

### 2. Seed Database (If Needed)

If deploying fresh installation without existing data:

```bash
# SSH into VPS
ssh root@your-vps-ip

# Access Strapi container
docker exec -it karunia-strapi bash

# Run seed script
npm run seed:example

# Set permissions
npm run set-permissions

# Exit container
exit
```

**Important**: Only run seed scripts once! They use a first-run flag and won't run again.

### 3. Verify API Endpoints

Test these endpoints to ensure everything works:

```bash
# Health check
curl https://api.karuniamotor.com/_health

# Public endpoints (should work without auth)
curl https://api.karuniamotor.com/api/vehicle-types
curl https://api.karuniamotor.com/api/branches
curl https://api.karuniamotor.com/api/categories

# Admin endpoints (requires authentication)
curl https://api.karuniamotor.com/api/spks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Configure API Permissions

**In Strapi Admin Panel**:

1. Go to: **Settings** → **Users & Permissions Plugin** → **Roles**
2. **Public Role**:
   - Enable `find` and `findOne` for: vehicle-types, vehicle-groups, branches, categories, articles
   - Leave SPK permissions disabled (require authentication)
3. **Authenticated Role**:
   - Enable all CRUD operations for SPK
   - Enable `find` and `findOne` for all content types
4. **Click "Save"**

### 5. Test File Uploads

1. Login to admin panel
2. Navigate to **Content Manager** → **SPK**
3. Create new SPK entry
4. Upload documents (KTP, selfie)
5. Save and verify uploads appear correctly

### 6. Monitor Application Health

**In Coolify Dashboard**:

1. **Check Container Status**: Should show "Running" with green indicator
2. **Review Logs**: Look for errors or warnings
3. **Test Admin Access**: Verify admin panel loads
4. **Test API**: Verify endpoints respond correctly

### 7. Set Up Monitoring (Optional but Recommended)

**Enable Coolify Monitoring**:

1. **Application** → **Monitoring**
2. Enable **"Resource Usage Monitoring"**
3. View CPU, Memory, and Network usage
4. Set alerts for high resource usage

**External Monitoring** (recommended for production):

- **Uptime Robot**: Free uptime monitoring
- **Sentry**: Error tracking and performance monitoring
- **New Relic**: Application performance monitoring

---

## Troubleshooting

Common deployment issues and their solutions:

### Issue 1: Build Fails - "Cannot find module"

**Symptoms**:
```
Error: Cannot find module 'some-package'
```

**Solutions**:

1. **Clear Build Cache**:
   ```bash
   # In Coolify: Application → Actions → Clear Build Cache
   ```

2. **Verify Dependencies**:
   ```bash
   # Locally, ensure all deps are in package.json
   npm install
   npm ls some-package
   ```

3. **Check Node Version**:
   ```dockerfile
   # In Dockerfile, ensure correct Node version
   FROM node:20-alpine3.18
   ```

### Issue 2: Container Crashes Immediately

**Symptoms**:
- Container starts but exits within seconds
- Status shows "Exited" or "Unhealthy"

**Diagnostic Steps**:

```bash
# View container logs
docker logs karunia-strapi

# View last 100 lines of logs
docker logs karunia-strapi --tail 100

# Follow logs in real-time
docker logs karunia-strapi -f
```

**Common Causes**:

1. **Missing Environment Variables**:
   - Check all required variables are set
   - Verify no typos in variable names

2. **Database Connection Failed**:
   ```bash
   # Test database connectivity
   docker exec karunia-postgres psql -U strapi_user -d karunia_motor -c "SELECT 1;"
   ```

3. **Port Already in Use**:
   - Change port mapping in docker-compose.yml
   - Or kill process using the port

### Issue 3: "Host is not allowed" Error

**Symptoms**:
```
Blocked request. This host ('api.karuniamotor.com') is not allowed.
```

**Solution**:

Update `config/server.ts`:

```typescript
export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  proxy: true,
  url: env('PUBLIC_URL', 'https://api.karuniamotor.com'),
  app: {
    keys: env.array('APP_KEYS'),
  },
  // Add this for admin panel
  admin: {
    url: '/admin',
    host: 'api.karuniamotor.com',
  },
});
```

Add environment variable:
```env
PUBLIC_URL=https://api.karuniamotor.com
```

### Issue 4: File Uploads Not Persisting

**Symptoms**:
- Files upload successfully
- After container restart, files are gone

**Solutions**:

1. **Enable "Preserve Repository Code"**:
   - Coolify → Application → Configuration → Preserve Repository Code

2. **Verify Volume Mount**:
   ```bash
   # Check if volume exists
   docker volume ls | grep strapi-uploads
   
   # Inspect volume
   docker volume inspect strapi-uploads
   
   # Check files in volume
   docker exec karunia-strapi ls -la /app/public/uploads
   ```

3. **Check Directory Permissions**:
   ```bash
   # Inside container
   docker exec karunia-strapi ls -la /app/public
   
   # Should be owned by 'node' user
   # If not, fix permissions in Dockerfile:
   # RUN chown -R node:node /app
   ```

### Issue 5: Database Connection Timeout

**Symptoms**:
```
Error: Connection timeout connecting to PostgreSQL
```

**Solutions**:

1. **Verify Database is Running**:
   ```bash
   docker ps | grep postgres
   docker logs karunia-postgres
   ```

2. **Check Network Connectivity**:
   ```bash
   # From Strapi container, test connection
   docker exec karunia-strapi nc -zv postgres 5432
   ```

3. **Verify Environment Variables**:
   ```env
   # Use internal hostname, not localhost or 127.0.0.1
   DATABASE_HOST=postgres  # ✅ Correct
   DATABASE_HOST=localhost  # ❌ Wrong
   DATABASE_HOST=127.0.0.1  # ❌ Wrong
   ```

4. **Add depends_on to docker-compose.yml**:
   ```yaml
   services:
     strapi:
       depends_on:
         postgres:
           condition: service_healthy
   ```

### Issue 6: SSL Certificate Generation Fails

**Symptoms**:
```
Failed to obtain SSL certificate from Let's Encrypt
```

**Solutions**:

1. **Verify DNS Configuration**:
   ```bash
   # Check A record points to your VPS
   nslookup api.karuniamotor.com
   dig api.karuniamotor.com
   ```

2. **Check Ports 80 and 443**:
   ```bash
   # On VPS, verify ports are open
   netstat -tulpn | grep :80
   netstat -tulpn | grep :443
   ```

3. **Wait for DNS Propagation**:
   - DNS changes can take up to 48 hours
   - Use [DNS Checker](https://dnschecker.org/) to verify propagation

4. **Check Rate Limits**:
   - Let's Encrypt has rate limits (5 certificates per domain per week)
   - Wait if you've exceeded limits

### Issue 7: High Memory Usage / Container OOM Killed

**Symptoms**:
```
Container exited with code 137 (OOM Killed)
```

**Solutions**:

1. **Increase Container Memory**:
   ```yaml
   # In docker-compose.yml
   services:
     strapi:
       deploy:
         resources:
           limits:
             memory: 2G  # Increase from default
           reservations:
             memory: 1G
   ```

2. **Optimize Node.js Memory**:
   ```yaml
   # In docker-compose.yml
   services:
     strapi:
       environment:
         NODE_OPTIONS: "--max-old-space-size=1536"
   ```

3. **Reduce Build Memory**:
   - Use Coolify's dedicated build server
   - Enable in: **Settings** → **Servers** → **Build Server**

### Issue 8: Cannot Access Admin Panel

**Symptoms**:
- Admin panel shows 404 or blank page
- API works but `/admin` doesn't

**Solutions**:

1. **Rebuild Admin Panel**:
   ```bash
   # SSH into container
   docker exec -it karunia-strapi bash
   
   # Rebuild admin
   npm run build
   
   # Exit and restart container
   exit
   docker restart karunia-strapi
   ```

2. **Check Build Directory Exists**:
   ```bash
   docker exec karunia-strapi ls -la /app/build
   ```

3. **Verify Environment**:
   ```env
   NODE_ENV=production  # Must be 'production' for built admin
   ```

### Getting Help

If you encounter issues not covered here:

1. **Check Coolify Logs**:
   - In Dashboard: **Application** → **Logs**
   - View both build logs and runtime logs

2. **Check Strapi Logs**:
   ```bash
   docker logs karunia-strapi --tail 200
   ```

3. **Coolify Community**:
   - Discord: https://discord.gg/coolify
   - GitHub Issues: https://github.com/coollabsio/coolify/issues

4. **Strapi Community**:
   - Discord: https://discord.strapi.io
   - Forum: https://forum.strapi.io
   - GitHub: https://github.com/strapi/strapi

---

## Monitoring & Maintenance

### Regular Maintenance Tasks

#### 1. Update Strapi

**Check for Updates**:
```bash
# On local machine
npm outdated

# Check specific for Strapi
npm outdated @strapi/strapi
```

**Update Process**:

```bash
# Local machine - test updates first
npm install @strapi/strapi@latest @strapi/plugin-users-permissions@latest

# Test locally
npm run develop

# Commit and push to Git
git add package.json package-lock.json
git commit -m "chore: update Strapi to latest version"
git push

# Coolify will auto-deploy (if enabled)
```

#### 2. Database Maintenance

**Weekly Tasks**:

```bash
# Vacuum database (reclaim space)
docker exec karunia-postgres vacuumdb -U strapi_user -d karunia_motor --analyze

# Check database size
docker exec karunia-postgres psql -U strapi_user -d karunia_motor -c "
  SELECT 
    pg_size_pretty(pg_database_size('karunia_motor')) as size;
"

# Check table sizes
docker exec karunia-postgres psql -U strapi_user -d karunia_motor -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
  FROM pg_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  LIMIT 10;
"
```

**Monthly Tasks**:

```bash
# Full backup
docker exec karunia-postgres pg_dump -U strapi_user karunia_motor > backup_monthly_$(date +%Y%m).sql

# Upload to S3 or external storage
# aws s3 cp backup_monthly_202512.sql s3://your-bucket/backups/
```

#### 3. Log Rotation

**Configure Log Rotation**:

```bash
# On VPS, create /etc/logrotate.d/docker-containers
cat > /etc/logrotate.d/docker-containers <<EOF
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  missingok
  delaycompress
  copytruncate
}
EOF
```

#### 4. Security Updates

**Update System Packages**:

```bash
# On VPS (Ubuntu)
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
```

**Update Docker**:

```bash
# Check current version
docker --version

# Update Docker (via Coolify)
# Coolify → Settings → System → Update Docker
```

### Performance Monitoring

#### 1. Resource Usage

**In Coolify Dashboard**:
- **Application** → **Monitoring**
- View CPU, Memory, Network graphs
- Set up alerts for high usage

**Via Command Line**:

```bash
# Check container resource usage
docker stats karunia-strapi karunia-postgres

# Check disk usage
df -h

# Check volume sizes
du -sh /data/coolify/applications/*/strapi-uploads
du -sh /var/lib/docker/volumes/*
```

#### 2. Application Performance

**Enable Strapi Admin Metrics**:

In `config/admin.ts`:

```typescript
export default ({ env }) => ({
  // ... other config
  flags: {
    nps: false,
    promoteEE: false,
  },
});
```

**Database Query Performance**:

```bash
# Slow query log
docker exec karunia-postgres psql -U strapi_user -d karunia_motor -c "
  SELECT 
    query,
    calls,
    total_time,
    mean_time
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 10;
"
```

#### 3. External Monitoring Tools

**Recommended Services**:

1. **UptimeRobot** (Free tier available)
   - Monitor API endpoint availability
   - Email/SMS alerts on downtime
   - https://uptimerobot.com

2. **Sentry** (Error tracking)
   - Install in Strapi:
     ```bash
     npm install @sentry/node
     ```
   - Configure in `config/middlewares.ts`:
     ```typescript
     import * as Sentry from "@sentry/node";
     
     Sentry.init({
       dsn: process.env.SENTRY_DSN,
     });
     ```

3. **Cloudflare** (CDN + DDoS protection)
   - Point domain to Cloudflare
   - Enable proxy
   - Free tier includes DDoS protection

### Backup Strategy

#### Automated Backups

**1. Database Backups (Daily)**:

In Coolify:
- **Database** → **Backups** → **Schedule**
- Frequency: Daily at 2 AM
- Retention: 7 days

**2. Application Code**:
- Stored in Git (version controlled)
- No backup needed (can redeploy from repo)

**3. Uploaded Files**:

Create cron job on VPS:

```bash
# Add to crontab
crontab -e

# Add this line (backup uploads daily at 3 AM)
0 3 * * * tar -czf /backups/uploads-$(date +\%Y\%m\%d).tar.gz /data/coolify/applications/*/strapi-uploads && find /backups -name "uploads-*.tar.gz" -mtime +30 -delete
```

#### Disaster Recovery Plan

**1. Complete System Failure**:

```bash
# On new VPS
# 1. Install Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# 2. Restore database backup
cat backup.sql | docker exec -i karunia-postgres psql -U strapi_user karunia_motor

# 3. Restore uploads
tar -xzf uploads-backup.tar.gz -C /data/coolify/applications/[new-app-id]/

# 4. Redeploy application from Git
# Use Coolify dashboard to deploy from your repository

# 5. Verify
curl https://api.karuniamotor.com/_health
```

**2. Database Corruption**:

```bash
# Restore from most recent backup
docker exec -i karunia-postgres psql -U strapi_user karunia_motor < backup_YYYYMMDD.sql

# Restart Strapi
docker restart karunia-strapi
```

**3. Accidental Content Deletion**:

```bash
# Restore specific table from backup
docker exec -i karunia-postgres pg_restore -U strapi_user -d karunia_motor -t spks backup_YYYYMMDD.sql
```

---

## Production Checklist

Before going live with your Strapi deployment, ensure:

### Pre-Launch Checklist

- [ ] **Server Requirements Met**
  - [ ] Minimum 4GB RAM (8GB recommended)
  - [ ] 2+ CPU cores
  - [ ] 50GB+ SSD storage
  - [ ] Ubuntu 22.04 LTS or newer

- [ ] **Domain & DNS**
  - [ ] Domain registered and configured
  - [ ] A record points to VPS IP
  - [ ] DNS propagation complete (24-48 hours)
  - [ ] Subdomain configured (if needed)

- [ ] **Coolify Installation**
  - [ ] Coolify installed successfully
  - [ ] Admin account created
  - [ ] Dashboard accessible

- [ ] **Database Setup**
  - [ ] PostgreSQL deployed and running
  - [ ] Database created with proper credentials
  - [ ] Connection tested from Strapi
  - [ ] Backups configured

- [ ] **Application Deployment**
  - [ ] Application deployed successfully
  - [ ] All containers running (green status)
  - [ ] No errors in logs
  - [ ] Health checks passing

- [ ] **Environment Variables**
  - [ ] All required variables set
  - [ ] Secure random keys generated (not defaults!)
  - [ ] Database credentials correct
  - [ ] CORS origins configured (if needed)

- [ ] **SSL/HTTPS**
  - [ ] Domain configured in Coolify
  - [ ] SSL certificate obtained
  - [ ] HTTPS working correctly
  - [ ] HTTP redirects to HTTPS

- [ ] **Storage & Volumes**
  - [ ] Upload directory volume configured
  - [ ] "Preserve Repository Code" enabled
  - [ ] Test file upload works
  - [ ] Files persist after restart

- [ ] **Security**
  - [ ] Strong admin password set
  - [ ] API tokens rotated
  - [ ] Unnecessary ports closed
  - [ ] Firewall configured
  - [ ] Rate limiting enabled (if applicable)

- [ ] **Content & Data**
  - [ ] Admin account created
  - [ ] Initial content seeded (if needed)
  - [ ] API permissions configured
  - [ ] User roles set up properly

- [ ] **Testing**
  - [ ] Admin panel accessible
  - [ ] API endpoints responding
  - [ ] Authentication working
  - [ ] File uploads working
  - [ ] Database queries fast
  - [ ] No console errors

- [ ] **Monitoring**
  - [ ] Coolify monitoring enabled
  - [ ] External uptime monitor configured
  - [ ] Error tracking set up (Sentry)
  - [ ] Log aggregation configured

- [ ] **Backups**
  - [ ] Daily database backups enabled
  - [ ] Backup retention policy set
  - [ ] Backup restoration tested
  - [ ] Off-site backup storage configured

- [ ] **Documentation**
  - [ ] Deployment documented
  - [ ] Admin credentials stored securely
  - [ ] API documentation accessible
  - [ ] Emergency contacts listed

### Post-Launch Checklist (First 30 Days)

- [ ] **Week 1**
  - [ ] Monitor server resources daily
  - [ ] Check error logs daily
  - [ ] Verify backups running
  - [ ] Test disaster recovery

- [ ] **Week 2**
  - [ ] Review performance metrics
  - [ ] Optimize slow queries
  - [ ] Check SSL certificate auto-renewal
  - [ ] Update documentation

- [ ] **Month 1**
  - [ ] Review security logs
  - [ ] Update dependencies
  - [ ] Optimize resource usage
  - [ ] Plan scaling strategy

---

## Additional Resources

### Official Documentation

- **Coolify Documentation**: https://coolify.io/docs
- **Strapi Documentation**: https://docs.strapi.io
- **Docker Documentation**: https://docs.docker.com
- **PostgreSQL Documentation**: https://www.postgresql.org/docs

### Community & Support

- **Coolify Discord**: https://discord.gg/coolify
- **Strapi Discord**: https://discord.strapi.io
- **Coolify GitHub**: https://github.com/coollabsio/coolify
- **Strapi Forum**: https://forum.strapi.io

### Useful Guides

- **Strapi Docker Guide**: https://docs.strapi.io/dev-docs/installation/docker
- **Strapi Deployment Guide**: https://docs.strapi.io/dev-docs/deployment
- **Docker Compose Best Practices**: https://docs.docker.com/compose/compose-file
- **Let's Encrypt Documentation**: https://letsencrypt.org/docs

### Tools & Services

- **DNS Checker**: https://dnschecker.org
- **SSL Checker**: https://www.sslshopper.com/ssl-checker.html
- **Uptime Robot**: https://uptimerobot.com
- **Sentry**: https://sentry.io
- **Cloudflare**: https://cloudflare.com

---

## Conclusion

Congratulations! You now have a comprehensive guide for deploying your Karunia Motor Strapi backend to Coolify.

### Key Takeaways

1. **Choose the Right Method**: Docker Compose for production, Nixpacks for quick deploys
2. **Security First**: Use strong passwords, rotate secrets, enable HTTPS
3. **Monitor Actively**: Set up monitoring and alerts from day one
4. **Backup Regularly**: Automate daily backups and test restoration
5. **Plan for Scale**: Start with good architecture, scale as needed

### Next Steps

1. Deploy to staging environment first
2. Test thoroughly before production
3. Document your specific configuration
4. Set up monitoring and alerts
5. Plan regular maintenance schedule

### Need Help?

If you encounter issues or have questions:

1. Check the Troubleshooting section in this guide
2. Review Coolify and Strapi documentation
3. Ask in community Discord servers
4. Create GitHub issues for bugs

---

**Happy Deploying! 🚀**

*Generated with ❤️ for Karunia Motor*
