# Deployment Guide

## Prepare for Production

Before deploying, ensure:
- ✅ All environment variables configured
- ✅ API endpoints tested and working
- ✅ No console errors in production build
- ✅ Images optimized
- ✅ Security headers configured

---

## Deployment Options

Choose one based on your needs:

| Option | Cost | Setup | Management | Best For |
|--------|------|-------|------------|----------|
| **Vercel** | Free / Paid | 2 min | Auto | Quick, cloud |
| **Netlify** | Free / Paid | 3 min | Auto | Static files |
| **Docker + Server** | Server cost | 30 min | Manual | Full control |
| **DigitalOcean App Platform** | $5-12/mo | 10 min | Auto | Affordable |
| **AWS Amplify** | Per usage | 10 min | Auto | AWS ecosystem |
| **Self-hosted Linux** | Server cost | 1 hour | Manual | Maximum control |

---

## Option 1: Vercel (Recommended - Easiest)

Vercel is created by the Next.js team and gives you the best Next.js experience.

### Step 1: Push to GitHub

```bash
cd d:\git_personal\smp\frontend
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smp-frontend.git
git push -u origin main
```

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub account
3. Authorize Vercel

### Step 3: Deploy Project

1. Click "Add New" → "Project"
2. Select your GitHub repository
3. Configure:
   - **Framework**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Environment Variables**: Add your `.env.local` variables
4. Click "Deploy"

### Step 4: Set Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_API_URL=https://api.yourschool.edu
   NEXT_PUBLIC_AI_SERVICE_URL=https://ai.yourschool.edu
   ```
3. Redeploy

### Result
- Your app is live at: `https://your-project-name.vercel.app`
- Auto-deploys on git push to main
- Preview URLs for pull requests
- Automatic SSL certificates

---

## Option 2: Docker (Self-Hosted)

For maximum control over hosting.

### Step 1: Create Dockerfile

Create `/frontend/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project
COPY . .

# Build Next.js app
RUN npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
```

### Step 2: Create .dockerignore

Create `/frontend/.dockerignore`:

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.next
```

### Step 3: Build Docker Image

```bash
cd d:\git_personal\smp\frontend

# Build image
docker build -t school-erp-frontend:latest .

# Test locally
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://api:3001 \
  school-erp-frontend:latest
```

### Step 4: Push to Docker Registry

```bash
# Create Docker Hub account at hub.docker.com

# Tag image
docker tag school-erp-frontend:latest YOUR_USERNAME/school-erp-frontend:latest

# Login
docker login

# Push
docker push YOUR_USERNAME/school-erp-frontend:latest
```

### Step 5: Deploy to Server

On your DigitalOcean/AWS/Azure server:

```bash
# Pull image
docker pull YOUR_USERNAME/school-erp-frontend:latest

# Run container
docker run -d \
  --name frontend \
  -p 80:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.school.edu \
  YOUR_USERNAME/school-erp-frontend:latest

# View logs
docker logs -f frontend
```

---

## Option 3: DigitalOcean App Platform

Similar ease to Vercel but more control.

### Step 1: Connect GitHub

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Select your GitHub repository

### Step 2: Configure

1. **Name**: school-erp-frontend
2. **Source**: GitHub
3. **Branch**: main
4. **Build Command**: `npm run build`
5. **Run Command**: `npm start`

### Step 3: Add Environment Variables

In the UI:
- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_AI_SERVICE_URL

### Step 4: Set Resource Plan

- Standard (1GB RAM) = $5/month
- Professional (2GB RAM) = $12/month

### Result
- App deployed to: `https://app-name.ondigitalocean.app`
- Auto-deploys on git push
- Easy scaling

---

## Option 4: AWS Amplify

For AWS ecosystem integration.

### Step 1: Install Amplify CLI

```bash
npm install -g @aws-amplify/cli
amplify configure
```

### Step 2: Initialize Amplify

```bash
cd d:\git_personal\smp\frontend
amplify init
```

### Step 3: Add Hosting

```bash
amplify add hosting
# Select:
# ? Select the plugin module to execute: Hosting with Amplify Console
# ? Choose a type: Manual deployment

amplify publish
```

### Step 4: Connect GitHub (Optional)

1. Go to Amplify Console
2. Click "Connect repository"
3. Select your GitHub repo
4. Configure build settings

---

## Option 5: Traditional Linux Server

For maximum flexibility.

### Step 1: Install Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs npm
```

### Step 2: Clone and Install

```bash
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/smp-frontend.git
cd smp-frontend/frontend
sudo npm install
```

### Step 3: Build

```bash
npm run build
```

### Step 4: Setup PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Create ecosystem config
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'school-erp',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/smp-frontend/frontend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_API_URL: 'https://api.school.edu',
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### Step 5: Setup Nginx

```bash
sudo apt-get install nginx

# Create config
sudo nano /etc/nginx/sites-available/school-erp
```

Paste this config:

```nginx
upstream app {
  server 127.0.0.1:3000;
}

server {
  listen 80;
  server_name school.example.com;

  # Redirect HTTP to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name school.example.com;

  # SSL certificates (from Let's Encrypt)
  ssl_certificate /etc/letsencrypt/live/school.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/school.example.com/privkey.pem;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "SAMEORIGIN" always;

  # Gzip compression
  gzip on;
  gzip_types text/plain text/css text/javascript application/json;

  location / {
    proxy_pass http://app;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/school-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d school.example.com
```

---

## Environment Variables by Environment

### Development (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
```

### Staging (in your deployment platform)
```
NEXT_PUBLIC_API_URL=https://api-staging.school.edu
NEXT_PUBLIC_AI_SERVICE_URL=https://ai-staging.school.edu
```

### Production (in your deployment platform)
```
NEXT_PUBLIC_API_URL=https://api.school.edu
NEXT_PUBLIC_AI_SERVICE_URL=https://ai.school.edu
```

---

## Production Build Checklist

```bash
# 1. Check for TypeScript errors
npm run type-check

# 2. Run linter
npm run lint

# 3. Build production bundle
npm run build

# 4. Check bundle size
npm run build -- --analyze

# 5. Run locally in production mode
npm start

# 6. Test on http://localhost:3000
# - Check all pages load
# - Test responsive design
# - Test API integration
# - Check browser console for errors
```

---

## Performance Optimization

### Enable Image Optimization

Already enabled in `next.config.js`:

```javascript
images: {
  unoptimized: false,  // Keep false for optimization
  domains: ['your-api.com'],  // Add your image domains
}
```

### Enable Compression

Add to `next.config.js`:

```javascript
compress: true,
```

### Optimize Fonts

Already done in `globals.css`:

```css
@font-face {
  font-family: 'system-ui';
  font-display: swap;  /* Shows text immediately */
}
```

---

## Monitoring & Logging

### For Vercel
- Built-in monitoring dashboard
- View real-time logs
- Performance analytics

### For Docker/Self-Hosted

```bash
# View PM2 logs
pm2 logs school-erp

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Set up monitoring with pm2+
pm2 install pm2-auto-pull
```

---

## Scaling

### Vercel
- Automatic scaling
- No configuration needed

### Docker/Self-Hosted
```bash
# Run multiple instances
docker run -d -p 3001:3000 school-erp-frontend
docker run -d -p 3002:3000 school-erp-frontend
docker run -d -p 3003:3000 school-erp-frontend

# Use load balancer (Nginx)
upstream backend {
  server localhost:3001;
  server localhost:3002;
  server localhost:3003;
}
```

---

## Troubleshooting

### High Memory Usage
```bash
# Restart app
pm2 restart school-erp

# Check process
pm2 monit

# Increase Node memory
NODE_OPTIONS=--max-old-space-size=2048 npm start
```

### Slow Page Loads
- Enable compression
- Optimize images
- Check API response times
- Use CDN for static assets

### CORS Errors
Update backend `.env`:
```
CORS_ORIGIN=https://yourfrontend.com
```

### API Connection Issues
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend is running
- Check CORS settings on backend
- Review SSL certificates

---

## Backup & Recovery

### Backup Database (Backend)
```bash
# PostgreSQL backup
pg_dump -U user database_name > backup.sql

# Restore
psql -U user database_name < backup.sql
```

### Backup Frontend (in Git)
```bash
git push origin main
# All code is backed up to GitHub
```

---

## Security Best Practices

### HTTPS/SSL
- ✅ Always use HTTPS
- ✅ Auto-renew certificates
- ✅ Use HTTP strict transport security

### Environment Variables
- ✅ Never commit `.env.local`
- ✅ Use platform's secret management
- ✅ Rotate keys regularly

### Dependencies
- ✅ Keep npm packages updated
- ✅ Review security alerts
- ✅ Use `npm audit` regularly

### Headers
```bash
# Already configured for Nginx above
# Add to Next.js if needed (next.config.js):
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      ],
    },
  ]
}
```

---

## Cost Estimation

| Service | Tier | Cost | Traffic |
|---------|------|------|---------|
| **Vercel** | Pro | $20/mo | Unlimited |
| **DigitalOcean** | App Platform | $5-12/mo | Unlimited |
| **Netlify** | Pro | $19/mo | Unlimited |
| **AWS Amplify** | Pay-as-you-go | $0.015/GB | Usage-based |
| **Self-hosted VPS** | Budget | $5-20/mo | 50-500GB/mo |

---

## Getting Help

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Nginx Docs**: https://nginx.org/en/docs/
- **Docker Docs**: https://docs.docker.com
- **PM2 Docs**: https://pm2.keymetrics.io/docs

---

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] API endpoints verified working
- [ ] No console errors in production build
- [ ] Images optimized
- [ ] SSL certificate installed
- [ ] CORS configured correctly
- [ ] Rate limiting configured
- [ ] Error tracking setup (optional)
- [ ] Analytics setup (optional)
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Team trained on deployment process

---

**Version**: 1.0.0
**Last Updated**: March 19, 2024
