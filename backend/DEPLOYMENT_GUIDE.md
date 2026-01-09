# Deployment Guide

## Overview

This guide covers deploying the refactored F1 Prediction Platform to production.

## Prerequisites

- Supabase project created
- Railway/Render account (for backend)
- Vercel account (for frontend)
- Environment variables configured

## Backend Deployment (Railway/Render)

### 1. Prepare for Deployment

```bash
cd backend

# Ensure all dependencies are in requirements.txt
pip freeze > requirements.txt

# Test locally first
python INTEGRATION_TEST.py
uvicorn main_refactored:app --reload
```

### 2. Environment Variables

Set these in Railway/Render dashboard:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
FASTF1_CACHE_DIR=/tmp/fastf1_cache
JOLPICA_API_KEY=your_key_here
PORT=8000
ENVIRONMENT=production
```

### 3. Database Setup

1. Go to Supabase SQL Editor
2. Run migration: `database/migrations/001_initial_schema.sql`
3. Configure RLS policies:

```sql
-- Public read-only for races and probabilities
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_probabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read races" ON races FOR SELECT USING (true);
CREATE POLICY "Public read probabilities" ON outcome_probabilities FOR SELECT USING (true);

-- Private for other tables
CREATE POLICY "Service key only" ON telemetry_features FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service key only" ON pace_deltas FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service key only" ON model_runs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service key only" ON simulation_runs FOR ALL USING (auth.role() = 'service_role');
```

### 4. Deploy to Railway

1. Connect GitHub repository
2. Set root directory to `backend/`
3. Set start command: `uvicorn main_refactored:app --host 0.0.0.0 --port $PORT`
4. Add environment variables
5. Deploy

### 5. Deploy to Render

1. Create new Web Service
2. Connect repository
3. Set:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main_refactored:app --host 0.0.0.0 --port $PORT`
4. Add environment variables
5. Deploy

## Frontend Deployment (Vercel)

### 1. Environment Variables

Set in Vercel dashboard:

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
# or
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

**Never expose:**
- Supabase service keys
- FastF1 credentials
- Jolpica tokens

### 2. Update API Calls

Ensure frontend uses new endpoints:
- `/api/races/{race_id}/probabilities`
- `/api/races/{race_id}/markets`
- Not `/predict` or old endpoints

### 3. Deploy

1. Connect repository to Vercel
2. Set root directory to `project/`
3. Build settings (auto-detected for Next.js)
4. Add environment variables
5. Deploy

## Post-Deployment Checklist

### Backend
- [ ] Health endpoint works: `GET /health`
- [ ] Probabilities endpoint accessible
- [ ] Markets endpoint accessible
- [ ] CORS configured correctly
- [ ] Database connection working
- [ ] Logs show no errors

### Frontend
- [ ] Can fetch probabilities
- [ ] Markets display correctly
- [ ] No direct ML calls
- [ ] No Supabase client errors
- [ ] API calls go to correct backend URL

### Database
- [ ] Schema applied successfully
- [ ] RLS policies configured
- [ ] Can insert/read data
- [ ] Indexes created

## Monitoring

### Backend Logs
- Check for import errors
- Check for database connection issues
- Monitor API response times
- Check for ML model loading errors

### Database Monitoring
- Monitor query performance
- Check table sizes
- Monitor connection pool usage

### Frontend Monitoring
- Check API call success rates
- Monitor error rates
- Check for CORS issues

## Troubleshooting

### Backend Won't Start
- Check environment variables are set
- Verify Supabase credentials
- Check Python version (3.9+)
- Verify all dependencies installed

### Database Connection Errors
- Verify SUPABASE_URL format
- Check SUPABASE_SERVICE_KEY is correct
- Verify RLS policies allow service role
- Check network connectivity

### API Endpoints Not Working
- Verify routers are included in main.py
- Check CORS configuration
- Verify endpoint paths match frontend calls
- Check logs for import errors

### Frontend Can't Connect
- Verify NEXT_PUBLIC_API_URL is set
- Check CORS allows frontend origin
- Verify backend is running
- Check network tab for errors

## Rollback Plan

If issues occur:

1. **Backend Rollback:**
   - Revert to previous deployment
   - Or use `main_old.py` temporarily

2. **Database Rollback:**
   - Don't drop tables
   - Keep data, just fix code

3. **Frontend Rollback:**
   - Revert to previous version
   - Or add feature flags for gradual migration

## Performance Optimization

### Backend
- Enable FastF1 caching
- Use connection pooling for Supabase
- Cache probabilities (with TTL)
- Optimize Monte Carlo simulations

### Database
- Add indexes on frequently queried columns
- Use connection pooling
- Monitor query performance
- Consider read replicas for heavy read loads

### Frontend
- Cache probability responses
- Use React Query or SWR for data fetching
- Implement pagination for large lists
- Optimize bundle size

## Security Checklist

- [ ] Supabase service key only in backend
- [ ] No API keys in frontend
- [ ] RLS policies configured
- [ ] CORS restricted to frontend domain
- [ ] Environment variables secured
- [ ] No secrets in code
- [ ] HTTPS enabled
- [ ] Rate limiting configured (if needed)

## Scaling Considerations

### Backend
- Use multiple workers: `uvicorn main_refactored:app --workers 4`
- Consider async task queue for ML training
- Use Redis for caching (optional)
- Monitor memory usage (Monte Carlo is memory-intensive)

### Database
- Monitor connection pool usage
- Consider read replicas
- Optimize queries
- Archive old data periodically

## Support

For issues:
1. Check logs (backend and frontend)
2. Review `VALIDATION_CHECKLIST.md`
3. Test locally first
4. Check environment variables
5. Verify database schema





