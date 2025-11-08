# Troubleshooting: "Failed to fetch predictions: Network Error"

## 🔍 Quick Diagnosis

This error means the frontend cannot connect to the backend. Let's diagnose step by step.

## ✅ Step 1: Check Backend is Running

```bash
# Check if backend is running on port 8000
curl http://localhost:8000/api/health

# Should return: {"status":"healthy","models_loaded":true,...}
```

**If this fails:**
- Backend is not running → Start it (see README.md)
- Backend crashed → Check backend logs for errors
- Port 8000 in use → Change port in backend

## ✅ Step 2: Check Frontend Environment Variables

```bash
# Check if .env file exists in frontend directory
cd frontend
cat .env

# Should contain:
# REACT_APP_BACKEND_URL=http://localhost:8000
```

**If .env is missing or wrong:**
```bash
cd frontend
echo "REACT_APP_BACKEND_URL=http://localhost:8000" > .env
# Then restart the frontend (stop and run yarn start again)
```

## ✅ Step 3: Verify Frontend is Using Correct URL

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for the error message - it should log: `Backend URL: http://localhost:8000/api`
4. If it shows a different URL, the .env file isn't being read

**Important:** After changing .env file, you MUST restart the frontend dev server!

## ✅ Step 4: Check CORS Configuration

The backend must allow requests from `http://localhost:3000`.

**Check backend .env:**
```bash
cd backend
cat .env | grep CORS_ORIGINS

# Should contain:
# CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**If missing, add it:**
```bash
cd backend
echo "CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000" >> .env
# Then restart backend
```

## ✅ Step 5: Test API Directly from Browser

Open browser console and run:
```javascript
fetch('http://localhost:8000/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**If this fails:**
- CORS issue → Fix backend CORS_ORIGINS
- Network error → Backend not accessible
- Connection refused → Backend not running

## ✅ Step 6: Check Browser Console for Detailed Errors

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for:
   - `Failed to fetch` → Network/CORS issue
   - `CORS policy` → CORS configuration issue
   - `Connection refused` → Backend not running
   - `404 Not Found` → Wrong API endpoint

## ✅ Step 7: Verify Ports

```bash
# Check what's running on each port
lsof -i :8000  # Backend should be here
lsof -i :3000  # Frontend should be here
```

## 🔧 Common Fixes

### Fix 1: Backend Not Running
```bash
cd backend
source .venv/bin/activate
python -m uvicorn server:app --reload --port 8000
```

### Fix 2: Frontend .env Missing
```bash
cd frontend
echo "REACT_APP_BACKEND_URL=http://localhost:8000" > .env
# Restart frontend
```

### Fix 3: CORS Issue
```bash
cd backend
# Add to .env file
echo "CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000" >> .env
# Restart backend
```

### Fix 4: MongoDB Connection Issue
If backend fails to start due to MongoDB:
```bash
# Option 1: Start MongoDB locally
mongod

# Option 2: Use MongoDB Atlas (free)
# Update backend/.env with your Atlas connection string:
# MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/autoscaling_db
```

### Fix 5: Port Conflicts
If port 8000 is in use:
```bash
# Change backend port to 8001
python -m uvicorn server:app --reload --port 8001

# Update frontend .env
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > frontend/.env
```

## 🧪 Complete Test Sequence

Run these commands in order:

```bash
# 1. Test backend health
curl http://localhost:8000/api/health

# 2. Test backend from browser console
# Open http://localhost:3000, press F12, run:
fetch('http://localhost:8000/api/health').then(r => r.json()).then(console.log)

# 3. Test predictions endpoint
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"start_time": "2025-01-20T00:00:00Z", "hours": 24, "model_name": "catboost"}'
```

## 📋 Checklist

- [ ] Backend is running on port 8000
- [ ] Backend health endpoint responds: `curl http://localhost:8000/api/health`
- [ ] Frontend .env file exists with `REACT_APP_BACKEND_URL=http://localhost:8000`
- [ ] Frontend was restarted after creating/updating .env
- [ ] Backend .env has CORS_ORIGINS configured
- [ ] Backend was restarted after updating CORS_ORIGINS
- [ ] No port conflicts (8000 and 3000 are free)
- [ ] MongoDB is running (if using local MongoDB)
- [ ] Browser console shows correct backend URL

## 🆘 Still Not Working?

1. **Check backend logs** for errors:
   ```bash
   # Look at the terminal where backend is running
   # Or check backend_server.log
   ```

2. **Check frontend logs** in browser console (F12)

3. **Try different browser** (Chrome, Firefox, Safari)

4. **Clear browser cache** and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

5. **Check firewall/antivirus** isn't blocking localhost connections

6. **Verify network connectivity**:
   ```bash
   ping localhost
   telnet localhost 8000
   ```

## 💡 Pro Tip

Always check the browser's Network tab (F12 → Network) to see:
- What URL is being requested
- What status code is returned
- What error message (if any)
- Whether the request is being blocked by CORS

