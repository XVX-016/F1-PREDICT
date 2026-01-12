# Deployment Guide

Production deployment guide for the F1 Prediction Platform.

## Deployment Overview

- **Backend**: Railway or Render
- **Frontend**: Vercel
- **Database**: Supabase (managed)

## Backend Deployment

### Railway

1. **Connect Repository**
   - Go to Railway dashboard
   - Click "New Project" → "Deploy from GitHub"
   - Select your repository

2. **Configure Environment Variables**
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `FASTF1_CACHE_DIR=/tmp/fastf1_cache`
   - `JOLPICA_API_KEY`
   - `PORT=8000` (Railway sets this automatically)

3. **Set Start Command**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

4. **Deploy**
   - Railway automatically detects Python and installs dependencies
   - Runs `requirements.txt`
   - Starts the application

### Render

1. **Create Web Service**
   - Go to Render dashboard
   - Click "New" → "Web Service"
   - Connect GitHub repository

2. **Configuration**
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `/` (or specify if different)

3. **Environment Variables**
   - Set all required variables in Render dashboard

4. **Deploy**
   - Render builds and deploys automatically

### Docker Deployment

```bash
# Build image
docker build -f Dockerfile.backend -t f1-backend .

# Run container
docker run -d \
  -p 8000:8000 \
  -e SUPABASE_URL=$SUPABASE_URL \
  -e SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY \
  -e JOLPICA_API_KEY=$JOLPICA_API_KEY \
  f1-backend
```

## Frontend Deployment

### Vercel

1. **Connect Repository**
   - Go to Vercel dashboard
   - Click "Import Project"
   - Select your repository
   - Set root directory to `Frontend`

2. **Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```

3. **Build Settings**
   - Framework Preset: Vite/Next.js (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `dist` (Vite) or `.next` (Next.js)

4. **Deploy**
   - Vercel automatically deploys on push to main branch

### Manual Build

```bash
cd Frontend
npm run build
# Deploy dist/ or .next/ directory to your hosting provider
```

## Database Setup

### Supabase

1. **Run Migrations**
   - Go to Supabase SQL Editor
   - Copy contents of `backend/database/migrations/001_initial_schema.sql`
   - Execute the migration

2. **Configure RLS**
   ```sql
   -- Public read-only for races and probabilities
   ALTER TABLE races ENABLE ROW LEVEL SECURITY;
   ALTER TABLE race_probabilities ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Public read races" ON races FOR SELECT USING (true);
   CREATE POLICY "Public read probabilities" ON race_probabilities FOR SELECT USING (true);
   
   -- Private tables
   ALTER TABLE telemetry_features ENABLE ROW LEVEL SECURITY;
   ALTER TABLE pace_deltas ENABLE ROW LEVEL SECURITY;
   ALTER TABLE model_runs ENABLE ROW LEVEL SECURITY;
   ALTER TABLE simulation_runs ENABLE ROW LEVEL SECURITY;
   
   -- Service role can access all
   CREATE POLICY "Service role full access" ON telemetry_features FOR ALL USING (auth.role() = 'service_role');
   CREATE POLICY "Service role full access" ON pace_deltas FOR ALL USING (auth.role() = 'service_role');
   ```

3. **Connection Pooling**
   - Use Supabase connection pooling URL for production
   - Set `SUPABASE_URL` to pooling endpoint

## Post-Deployment

### 1. Run Initial Setup

After deployment, run the setup script to populate initial data:

```bash
# SSH into your deployment instance
# Or use Railway/Render CLI
railway run python backend/setup.py
# or
render run python backend/setup.py
```

### 2. Verify Deployment

```bash
# Health check
curl https://your-backend-url.com/health

# Test endpoints
curl https://your-backend-url.com/api/races/{id}/probabilities
```

### 3. Monitor Logs

- Railway: Dashboard → Service → Logs
- Render: Dashboard → Service → Logs
- Vercel: Dashboard → Project → Logs

### 4. Set Up CI/CD

**GitHub Actions Example:**
```yaml
name: Deploy Backend
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: railway up
```

## Production Best Practices

### Backend

- ✅ Use multiple workers: `uvicorn main:app --workers 4`
- ✅ Enable HTTPS
- ✅ Set up monitoring (Sentry, LogRocket)
- ✅ Configure rate limiting
- ✅ Use connection pooling
- ✅ Set up health checks
- ✅ Enable CORS for production domain only

### Frontend

- ✅ Enable caching for static assets
- ✅ Set up CDN
- ✅ Configure environment variables
- ✅ Enable source maps for debugging
- ✅ Set up error tracking

### Database

- ✅ Use connection pooling
- ✅ Configure RLS policies correctly
- ✅ Enable backups
- ✅ Monitor query performance
- ✅ Set up alerts

## Environment Variables Summary

### Backend (Production)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
FASTF1_CACHE_DIR=/tmp/fastf1_cache
JOLPICA_API_KEY=your-key
PORT=8000
ENVIRONMENT=production
LOG_LEVEL=INFO
```

### Frontend (Production)
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

## Troubleshooting Production Issues

### Backend Not Starting

- Check environment variables are set
- Verify port is correct
- Check logs for import errors
- Ensure all dependencies are installed

### Database Connection Issues

- Verify Supabase credentials
- Check connection pooling URL
- Verify RLS policies
- Check network firewall rules

### Frontend Build Fails

- Check Node.js version matches
- Verify environment variables
- Check for TypeScript errors
- Review build logs

## Monitoring & Alerts

### Recommended Tools

- **Backend**: Sentry, LogRocket, Railway/Render built-in monitoring
- **Frontend**: Vercel Analytics, Sentry
- **Database**: Supabase Dashboard, Postgres monitoring

### Key Metrics to Monitor

- API response times
- Error rates
- Database query performance
- Cache hit rates
- Frontend page load times

## Scaling

### Backend

- Increase workers: `--workers 4`
- Use horizontal scaling (multiple instances)
- Enable caching (Redis)
- Optimize database queries

### Frontend

- Use CDN for static assets
- Enable static generation where possible
- Optimize bundle size
- Use lazy loading

## Security Checklist

- [ ] All secrets in environment variables (not in code)
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] RLS policies set
- [ ] Rate limiting enabled
- [ ] Input validation
- [ ] SQL injection prevention (parameterized queries)
- [ ] Regular dependency updates

## Support

For deployment issues:
- Check [Setup Instructions](SETUP_INSTRUCTIONS.md)
- Review [Architecture](ARCHITECTURE.md)
- Check platform-specific documentation (Railway, Render, Vercel)

