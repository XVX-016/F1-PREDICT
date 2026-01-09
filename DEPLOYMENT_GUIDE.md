# F1 Predict App Deployment Guide

## Domain: f1predictapp.tech

This guide will help you deploy the F1 Predict App to production with the domain `f1predictapp.tech`.

## Prerequisites

### 1. Server Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+ (recommended)
- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: Minimum 50GB SSD
- **CPU**: 2+ cores
- **Network**: Static IP address

### 2. Software Requirements
- Docker 20.10+
- Docker Compose 2.0+
- Git
- curl
- ufw (firewall)

### 3. Domain Setup
- Domain `f1predictapp.tech` pointing to your server's IP
- SSL certificate for HTTPS (Let's Encrypt recommended)

## Deployment Steps

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install additional tools
sudo apt install -y git curl ufw

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Clone and Setup

```bash
# Clone repository
git clone <your-repo-url> f1predictapp
cd f1predictapp

# Make deployment script executable
chmod +x deploy.sh
```

### 3. SSL Certificate Setup

#### Option A: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot

# Stop any running web server
sudo systemctl stop nginx

# Obtain certificate
sudo certbot certonly --standalone -d f1predictapp.tech -d www.f1predictapp.tech

# Create SSL directory
mkdir -p ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/f1predictapp.tech/fullchain.pem ssl/f1predictapp.tech.crt
sudo cp /etc/letsencrypt/live/f1predictapp.tech/privkey.pem ssl/f1predictapp.tech.key

# Set proper permissions
sudo chown $USER:$USER ssl/*
chmod 600 ssl/*
```

#### Option B: Custom SSL Certificate

```bash
# Create SSL directory
mkdir -p ssl

# Copy your certificates
cp your-certificate.crt ssl/f1predictapp.tech.crt
cp your-private-key.key ssl/f1predictapp.tech.key

# Set proper permissions
chmod 600 ssl/*
```

### 4. Environment Configuration

```bash
# Copy and edit production environment
cp production.env .env.production

# Edit the environment file
nano .env.production
```

**Required Environment Variables:**
```env
# Database
DB_PASSWORD=your_secure_database_password
DB_USER=f1predict_user

# JWT Secret (generate a strong secret)
JWT_SECRET=your_super_secure_jwt_secret_key

# Payment Integration (if using)
NOWPAYMENTS_API_KEY=your_api_key
NOWPAYMENTS_PUBLIC_KEY=your_public_key
NOWPAYMENTS_API_SECRET=your_api_secret
```

### 5. Deploy Application

```bash
# Run deployment script
./deploy.sh
```

### 6. Verify Deployment

```bash
# Check if all services are running
docker-compose -f docker-compose.prod.yml ps

# Check application health
curl -f https://f1predictapp.tech/health

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Post-Deployment

### 1. DNS Configuration

Ensure your domain DNS records point to your server:
- `A` record: `f1predictapp.tech` → `YOUR_SERVER_IP`
- `A` record: `www.f1predictapp.tech` → `YOUR_SERVER_IP`

### 2. SSL Certificate Renewal (Let's Encrypt)

```bash
# Create renewal script
sudo crontab -e

# Add this line for automatic renewal
0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f /path/to/your/app/docker-compose.prod.yml restart nginx-proxy
```

### 3. Monitoring

```bash
# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# Check resource usage
docker stats

# Monitor disk space
df -h
```

## Maintenance Commands

### Start/Stop Services
```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Stop services
docker-compose -f docker-compose.prod.yml down

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Backup Database
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U f1predict_user f1_prediction_market_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U f1predict_user f1_prediction_market_prod < backup_file.sql
```

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues**
   ```bash
   # Check certificate validity
   openssl x509 -in ssl/f1predictapp.tech.crt -text -noout
   
   # Verify certificate matches domain
   openssl x509 -in ssl/f1predictapp.tech.crt -subject -noout
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose -f docker-compose.prod.yml logs postgres
   
   # Test database connection
   docker-compose -f docker-compose.prod.yml exec postgres psql -U f1predict_user -d f1_prediction_market_prod -c "SELECT 1;"
   ```

3. **Application Not Loading**
   ```bash
   # Check all service logs
   docker-compose -f docker-compose.prod.yml logs
   
   # Check nginx configuration
   docker-compose -f docker-compose.prod.yml exec nginx-proxy nginx -t
   ```

### Performance Optimization

1. **Enable Gzip Compression** (already configured in nginx-prod.conf)
2. **Set up CDN** for static assets
3. **Configure Redis** for better caching
4. **Monitor resource usage** and scale accordingly

## Security Considerations

1. **Firewall**: Only open necessary ports (22, 80, 443)
2. **SSL/TLS**: Use strong ciphers and TLS 1.2+
3. **Database**: Use strong passwords and limit access
4. **Updates**: Keep system and Docker images updated
5. **Monitoring**: Set up log monitoring and alerts

## Support

For issues or questions:
1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify configuration: `docker-compose -f docker-compose.prod.yml config`
3. Test connectivity: `curl -I https://f1predictapp.tech`

---

**Your F1 Predict App is now live at: https://f1predictapp.tech** 🏁
