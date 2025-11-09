# Backend Model Files Checklist

## ⚠️ CRITICAL: Model Files Required for Deployment

Your backend **MUST** include these ML model files for the application to work. Without them, the prediction API will fail.

---

## Required Model Files

### ✅ Essential Files (Must Have)

1. **`catboost_hourly_model.pkl`**
   - CatBoost machine learning model
   - **Size**: Usually 5-20 MB
   - **Required**: YES - This is the default model

2. **`lightgbm_hourly_model.pkl`**
   - LightGBM machine learning model
   - **Size**: Usually 2-10 MB
   - **Required**: YES

3. **`xgboost_hourly_model.pkl`**
   - XGBoost machine learning model
   - **Size**: Usually 3-15 MB
   - **Required**: YES

4. **`feature_columns_hourly.pkl`**
   - Feature column definitions for models
   - **Size**: Usually < 1 MB
   - **Required**: YES - Without this, models won't know which features to use

### ⚠️ Optional Files (Recommended)

5. **`lstm_hourly_model_fixed.h5`**
   - LSTM neural network model (TensorFlow/Keras)
   - **Size**: Usually 5-50 MB
   - **Required**: NO - Backend will work without it, but LSTM predictions won't be available
   - **Note**: If you have this file, the backend will use it. If not, it will skip LSTM.

6. **`lstm_hourly_model.h5`** (Fallback)
   - Original LSTM model (if fixed version doesn't exist)
   - **Required**: NO - Only used as fallback

---

## Verification Steps

### Before Deployment

**On your local machine:**

```bash
# Navigate to backend directory
cd backend

# Check if all required files exist
ls -la *.pkl *.h5

# You should see at minimum:
# - catboost_hourly_model.pkl
# - lightgbm_hourly_model.pkl
# - xgboost_hourly_model.pkl
# - feature_columns_hourly.pkl
```

### After Deployment to EC2

**On your EC2 instance:**

```bash
# Navigate to backend directory
cd ~/your-repo-name/backend
# OR
cd ~/backend

# Verify model files are present
ls -la *.pkl *.h5

# Check file sizes (they should not be 0 bytes)
ls -lh *.pkl *.h5

# Verify server can load models
python3 -c "
from pathlib import Path
import joblib
import pickle

ROOT_DIR = Path('.')
models = ['catboost_hourly_model.pkl', 'lightgbm_hourly_model.pkl', 'xgboost_hourly_model.pkl']
for model in models:
    path = ROOT_DIR / model
    if path.exists():
        print(f'✅ {model} exists ({path.stat().st_size} bytes)')
    else:
        print(f'❌ {model} MISSING!')

# Check feature columns
if (ROOT_DIR / 'feature_columns_hourly.pkl').exists():
    print('✅ feature_columns_hourly.pkl exists')
else:
    print('❌ feature_columns_hourly.pkl MISSING!')
"
```

### Test Backend Startup

```bash
# Start the backend server
source .venv/bin/activate
python -m uvicorn server:app --host 0.0.0.0 --port 8000

# Check the logs - you should see:
# ✅ Loaded 3 ML models successfully: ['catboost', 'lightgbm', 'xgboost']
# ✅ Feature columns: <number>
```

### Test API Endpoint

```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Should return:
# {
#   "status": "healthy",
#   "models_loaded": true,
#   "available_models": ["catboost", "lightgbm", "xgboost"],
#   "feature_columns": <number>
# }

# Test prediction endpoint
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "start_time": "2025-01-20T00:00:00Z",
    "hours": 24,
    "model_name": "catboost"
  }'

# Should return predictions (not an error!)
```

---

## Troubleshooting

### Error: "Models not loaded" or "Models not found"

**Symptoms:**
- Health endpoint shows `"models_loaded": false`
- Prediction endpoint returns 500 error
- Server logs show: "Error loading models: [Errno 2] No such file or directory"

**Solutions:**

1. **Check if files exist:**
   ```bash
   cd backend
   ls -la *.pkl *.h5
   ```

2. **Verify file paths:**
   - Models should be in the same directory as `server.py`
   - Not in a subdirectory
   - Not in the root project directory

3. **Check file permissions:**
   ```bash
   chmod 644 *.pkl *.h5
   ```

4. **Re-upload files if missing:**
   ```bash
   # From your local machine
   scp -i your-key.pem backend/*.pkl backend/*.h5 ubuntu@YOUR_EC2_IP:~/backend/
   ```

### Error: "Feature columns not found"

**Symptoms:**
- Models load but predictions fail
- Error mentions "feature_columns"

**Solutions:**

1. **Verify feature_columns_hourly.pkl exists:**
   ```bash
   ls -la feature_columns_hourly.pkl
   ```

2. **Re-upload if missing:**
   ```bash
   scp -i your-key.pem backend/feature_columns_hourly.pkl ubuntu@YOUR_EC2_IP:~/backend/
   ```

### Large File Upload Issues

**If model files are too large for SCP:**

1. **Use Git (Recommended):**
   - Commit model files to GitHub
   - Clone repository on EC2
   - Models will be included

2. **Use S3:**
   ```bash
   # Upload to S3 from local machine
   aws s3 cp backend/catboost_hourly_model.pkl s3://your-bucket/models/
   
   # Download on EC2
   aws s3 cp s3://your-bucket/models/catboost_hourly_model.pkl ~/backend/
   ```

3. **Use rsync (faster than SCP):**
   ```bash
   rsync -avz -e "ssh -i your-key.pem" backend/ ubuntu@YOUR_EC2_IP:~/backend/
   ```

---

## File Sizes (Approximate)

- `catboost_hourly_model.pkl`: 5-20 MB
- `lightgbm_hourly_model.pkl`: 2-10 MB
- `xgboost_hourly_model.pkl`: 3-15 MB
- `feature_columns_hourly.pkl`: < 1 MB
- `lstm_hourly_model_fixed.h5`: 5-50 MB

**Total**: ~15-100 MB (depending on LSTM model)

---

## Git Considerations

### Should You Commit Model Files?

**Option 1: Commit to Git (Recommended for small teams)**
- ✅ Easy deployment (just clone)
- ✅ Version control for models
- ❌ Increases repository size
- ❌ Slower git operations

**Option 2: Use Git LFS (Large File Storage)**
- ✅ Keeps repository small
- ✅ Version control for models
- ⚠️ Requires Git LFS setup
- ⚠️ Additional step in deployment

**Option 3: Store in S3 (Recommended for production)**
- ✅ Keeps repository small
- ✅ Can version models separately
- ⚠️ Requires S3 setup
- ⚠️ Additional download step in deployment

**Current Setup**: The `.gitignore` file does NOT exclude `.pkl` or `.h5` files, so they will be committed to Git by default.

---

## Quick Checklist

Before deploying to AWS:

- [ ] All 4 required model files exist in `backend/` directory
- [ ] Model files are not corrupted (check file sizes)
- [ ] `feature_columns_hourly.pkl` is present
- [ ] LSTM model is included (optional but recommended)
- [ ] Tested locally - backend starts without errors
- [ ] Tested locally - predictions work
- [ ] Model files are included in Git (or upload plan)
- [ ] Verified model files after deployment to EC2
- [ ] Tested prediction endpoint on EC2

---

## Summary

**✅ YES - You MUST keep model files in the backend directory!**

Without these files:
- ❌ Backend will start but models won't load
- ❌ Prediction endpoints will return 500 errors
- ❌ Health check will show `models_loaded: false`
- ❌ Application will not function

**Always verify model files are present after deployment!**

