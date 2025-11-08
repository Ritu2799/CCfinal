# AI Predictive Autoscaling System

A full-stack application for predicting traffic load and auto-scaling AWS EC2 instances using ML models.

## Project Structure

- **Backend**: FastAPI Python server with ML models (CatBoost, LightGBM, XGBoost, LSTM)
- **Frontend**: React application with modern UI components

## Prerequisites

- Python 3.9+ (recommended 3.10 or 3.11)
- Node.js 16+ and Yarn
- MongoDB (for status checks - optional)
- AWS credentials (optional, for real auto-scaling)

## Setup Instructions

### 1. Backend Setup

#### Install Python Dependencies

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python3 -m venv .venv

# Activate virtual environment
# On macOS/Linux:

# On Windows:
# .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# MongoDB (required for status checks)
MONGO_URL=mongodb://localhost:27017
DB_NAME=autoscaling_db

# AWS (optional - for real auto-scaling, otherwise uses mock mode)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_ASG_NAME=my-web-asg

# Calendarific API (optional - uses hardcoded festivals if not provided)
CALENDARIFIC_API_KEY=your_calendarific_api_key

# CORS origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

#### Start Backend Server

**Option 1: Using the startup script**
```bash
# Make script executable (if not already)
chmod +x backend/start-server.sh

# Run the script
./backend/start-server.sh
```

**Option 2: Manual start**
```bash
cd backend
source .venv/bin/activate  # if using virtual environment
python -m uvicorn server:app --reload --port 8000 --host 127.0.0.1
```

The backend will start on `http://127.0.0.1:8000`

**Verify backend is running:**
```bash
curl http://localhost:8000/api/health
```

### 2. Frontend Setup

#### Install Node Dependencies

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies using yarn
yarn install

# Or using npm
npm install
```

#### Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8000
```

#### Start Frontend Development Server

```bash
# From frontend directory
yarn start

# Or using npm
npm start
```

The frontend will start on `http://localhost:3000` and automatically open in your browser.

## Running the Application

### Quick Start (Terminal 1 - Backend)

```bash
cd backend
source .venv/bin/activate  # if using virtual environment
python -m uvicorn server:app --reload --port 8000 --host 127.0.0.1
```

### Quick Start (Terminal 2 - Frontend)

```bash
cd frontend
yarn start
```

## API Endpoints

The backend API is available at `http://localhost:8000/api`

### Key Endpoints:

- `GET /api/health` - Health check
- `GET /api/models` - List available ML models
- `POST /api/predict` - Predict traffic for next N hours
- `GET /api/next-festival` - Get next upcoming festival with predictions
- `GET /api/festivals/2025` - Get all 2025 festivals
- `GET /api/festivals/2026` - Get all 2026 festivals
- `POST /api/scale` - Scale AWS EC2 instances
- `GET /api/aws/instances` - Get current AWS instances

### Example API Call

```bash
# Get predictions for next 24 hours
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "start_time": "2025-01-20T00:00:00Z",
    "hours": 24,
    "model_name": "catboost"
  }'
```

## Available ML Models

- **catboost** (default, most reliable)
- **lightgbm**
- **xgboost**
- **lstm** (requires TensorFlow)

The system automatically falls back to CatBoost if other models fail.

## Troubleshooting

### Backend Issues

1. **Models not loading:**
   - Ensure all model files are in the `backend` directory:
     - `catboost_hourly_model.pkl`
     - `lightgbm_hourly_model.pkl`
     - `xgboost_hourly_model.pkl`
     - `lstm_hourly_model_fixed.h5` (optional)
     - `feature_columns_hourly.pkl`

2. **Port already in use:**
   - Change the port in `start-server.sh` or use: `--port 8001`

3. **MongoDB connection error:**
   - Ensure MongoDB is running, or update `MONGO_URL` in `.env`

### Frontend Issues

1. **Cannot connect to backend:**
   - Verify backend is running on the correct port
   - Check `REACT_APP_BACKEND_URL` in `frontend/.env`
   - Check CORS settings in backend

2. **Dependencies installation issues:**
   - Clear cache: `yarn cache clean` or `npm cache clean --force`
   - Delete `node_modules` and `yarn.lock`/`package-lock.json`, then reinstall

3. **Port 3000 already in use:**
   - The app will prompt to use a different port, or set `PORT=3001` in `.env`

## Development

### Backend Development

- Server runs with `--reload` flag for auto-reload on code changes
- Logs are printed to console
- Check `backend_server.log` for server logs

### Frontend Development

- React app supports hot-reload
- Check browser console for errors
- Check `frontend_dev.log` for development logs

## Production Deployment

### Backend

```bash
# Build and run with production settings
cd backend
source .venv/bin/activate
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend

```bash
# Build for production
cd frontend
yarn build

# The build folder will contain production-ready files
# Serve using a web server like nginx or serve the build folder
```

## Notes

- AWS auto-scaling works in mock mode if credentials are not provided
- Festival data uses hardcoded Indian festivals (2023-2026) with traffic boost multipliers
- Calendarific API is optional and only used for dates not in the hardcoded list
- LSTM model is optional and may require TensorFlow compatibility fixes

