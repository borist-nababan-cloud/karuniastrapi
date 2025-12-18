# Coolify Deployment Quick Start

**TL;DR version of the complete deployment guide**

For the full comprehensive guide, see: [COOLIFY-DEPLOYMENT-GUIDE.md](./COOLIFY-DEPLOYMENT-GUIDE.md)

---

## Prerequisites Checklist

- [ ] VPS with Ubuntu 22.04+ (4GB RAM, 2 CPU, 50GB disk minimum)
- [ ] Domain name configured (DNS A record pointing to VPS IP)
- [ ] SSH access to VPS
- [ ] GitHub repository ready

---

## Quick Deployment Steps

### 1. Install Coolify (5 minutes)

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Install Coolify with one command
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Access dashboard at: http://your-vps-ip:8000
```

### 2. Create Project in Coolify

1. Open Coolify dashboard: `http://your-vps-ip:8000`
2. Click **"+ New Project"**
3. Name: `karunia-motor-backend`
4. Click **"Create"**

### 3. Connect GitHub

**Settings** → **Sources** → **Add Source** → **GitHub App** → Authorize

### 4. Deploy Application

1. In Project → **"+ New Resource"** → **"Application"**
2. Select **"Docker Compose"**
3. Configure:
   - **Repository**: Your GitLab repo (gitlab.com/karuniamotor/karunia-backend)
   - **Branch**: `main`
   - **Docker Compose Location**: `docker-compose.prod.yml`
4. **Important**: Enable **"Preserve Repository Code"**
5. Click **"Save"**

### 5. Add Environment Variables

**Application** → **Environment Variables** → Add these:

```env
# Generate secure keys first!
# Use: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

HOST=0.0.0.0
PORT=1337
NODE_ENV=production

APP_KEYS="key1,key2,key3,key4"
API_TOKEN_SALT=generate-unique-value
ADMIN_JWT_SECRET=generate-unique-value
TRANSFER_TOKEN_SALT=generate-unique-value
JWT_SECRET=generate-unique-value

DATABASE_CLIENT=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=karunia_motor
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=your-secure-password
DATABASE_SSL=false
```

### 6. Configure Domain & SSL

1. **Application** → **Domains**
2. Add: `api.karuniamotor.com`
3. Enable **"Generate Let's Encrypt Certificate"**
4. Wait 2 minutes for SSL

### 7. Deploy!

1. Click **"Deploy"** button
2. Monitor logs (5-10 minutes)
3. Wait for success ✅

### 8. Access Your Application

- **Admin Panel**: `https://api.karuniamotor.com/admin`
- **API**: `https://api.karuniamotor.com/api`
- **Docs**: `https://api.karuniamotor.com/documentation`

---

## Files You Need

All required files are already created:

- ✅ `Dockerfile` - Production Docker image
- ✅ `docker-compose.prod.yml` - Full stack deployment
- ✅ `.env.production.example` - Environment variable template
- ✅ `.dockerignore` - Build optimization
- ✅ `COOLIFY-DEPLOYMENT-GUIDE.md` - Full comprehensive guide

---

## Common Issues & Quick Fixes

### Issue: Container Crashes

```bash
# Check logs
docker logs karunia-strapi

# Common fix: Restart
docker restart karunia-strapi
```

### Issue: Database Connection Failed

Check environment variables:
- `DATABASE_HOST=postgres` (NOT localhost!)
- Database credentials match

### Issue: Uploads Not Persisting

Enable **"Preserve Repository Code"** in Coolify settings

### Issue: SSL Certificate Failed

1. Verify DNS: `nslookup api.karuniamotor.com`
2. Wait for DNS propagation (up to 48 hours)
3. Check ports 80 and 443 are open

---

## Generate Secure Keys

**IMPORTANT**: Never use example keys in production!

```bash
# Run this 5 times to generate keys
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Use these for:
# 1-4: APP_KEYS (comma-separated)
# 5: API_TOKEN_SALT
# 6: ADMIN_JWT_SECRET
# 7: TRANSFER_TOKEN_SALT
# 8: JWT_SECRET
```

---

## Post-Deployment

1. **Create Admin User**
   - Visit: `https://api.karuniamotor.com/admin`
   - Complete setup wizard

2. **Seed Database** (if needed)
   ```bash
   docker exec -it karunia-strapi npm run seed:example
   docker exec -it karunia-strapi npm run set-permissions
   ```

3. **Test API**
   ```bash
   curl https://api.karuniamotor.com/_health
   curl https://api.karuniamotor.com/api/vehicle-types
   ```

---

## Need More Details?

📖 **Full Guide**: [COOLIFY-DEPLOYMENT-GUIDE.md](./COOLIFY-DEPLOYMENT-GUIDE.md)

Includes:
- Detailed explanations of every step
- Troubleshooting guide (10+ common issues)
- Database management
- Backup strategies
- Performance optimization
- Security best practices
- Monitoring setup

---

## Support

- **Coolify Discord**: https://discord.gg/coolify
- **Strapi Discord**: https://discord.strapi.io
- **Coolify Docs**: https://coolify.io/docs
- **Strapi Docs**: https://docs.strapi.io

---

**Deployment time**: ~30 minutes (first time)

**Pro tip**: Deploy to staging first, test thoroughly, then deploy to production!

Good luck! 🚀
