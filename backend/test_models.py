#!/usr/bin/env python3
"""
Test script to diagnose model prediction issues
"""
import joblib
import xgboost as xgb
import lightgbm as lgb
import pandas as pd
import numpy as np
from datetime import datetime

print("="*60)
print("Model Testing & Diagnostics")
print("="*60)

# Load models and feature columns
print("\n1. Loading models and feature columns...")
try:
    xgb_model = joblib.load('xgboost_hourly_model.pkl')
    lgb_model = joblib.load('lightgbm_hourly_model.pkl')
    feature_cols = joblib.load('feature_columns_hourly.pkl')
    print(f"   ✅ XGBoost model loaded: {type(xgb_model)}")
    print(f"   ✅ LightGBM model loaded: {type(lgb_model)}")
    print(f"   ✅ Feature columns: {len(feature_cols)}")
except Exception as e:
    print(f"   ❌ Error loading: {e}")
    exit(1)

# Create test features (matching server.py)
print("\n2. Creating test features...")
test_timestamp = datetime(2025, 1, 15, 12, 0, 0)

features = {
    'hour': 12,
    'day_of_week': 2,
    'month': 1,
    'day': 15,
    'year': 2025,
    'week_of_year': 3,
    'quarter': 1,
    'day_of_year': 15,
    'hour_sin': np.sin(2 * np.pi * 12 / 24),
    'hour_cos': np.cos(2 * np.pi * 12 / 24),
    'dow_sin': np.sin(2 * np.pi * 2 / 7),
    'dow_cos': np.cos(2 * np.pi * 2 / 7),
    'is_weekend': 0,
    'is_business_hours': 1,
    'is_peak_hours': 1,
    'is_night': 0,
    'is_festival': 0,
    'is_campaign': 0,
    'festival_name': 0,  # Encoded
    'traffic_lag_1h': 1200.0,
    'traffic_lag_24h': 1500.0,
    'traffic_lag_168h': 1400.0,
    'traffic_rolling_mean_24h': 1300.0,
    'traffic_rolling_std_24h': 200.0,
    'traffic_rolling_max_24h': 2000.0,
    'cpu_usage': 45.0,
    'memory_usage': 60.0,
    'response_time': 150.0,
    'error_rate': 0.5
}

df = pd.DataFrame([features])
df = df[feature_cols]

# Ensure numeric
for col in df.columns:
    if not pd.api.types.is_numeric_dtype(df[col]):
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

print(f"   Feature DataFrame shape: {df.shape}")
print(f"   Feature ranges:")
for col in df.columns:
    print(f"     {col}: {df[col].iloc[0]}")

# Test XGBoost
print("\n3. Testing XGBoost...")
try:
    dmatrix = xgb.DMatrix(df, feature_names=feature_cols)
    xgb_pred = xgb_model.predict(dmatrix)[0]
    print(f"   Raw prediction: {xgb_pred:.2f}")
    print(f"   After max(50.0): {max(xgb_pred, 50.0):.2f}")
    
    if xgb_pred < 0:
        print(f"   ⚠️  WARNING: Negative prediction! Model may need retraining.")
        print(f"   ⚠️  This suggests feature values don't match training data.")
except Exception as e:
    print(f"   ❌ XGBoost error: {e}")

# Test LightGBM
print("\n4. Testing LightGBM...")
try:
    lgb_pred = lgb_model.predict(df, num_iteration=lgb_model.best_iteration if hasattr(lgb_model, 'best_iteration') else None)[0]
    print(f"   Prediction: {lgb_pred:.2f}")
    print(f"   After max(50.0): {max(lgb_pred, 50.0):.2f}")
except Exception as e:
    print(f"   ❌ LightGBM error: {e}")

# Test with festival
print("\n5. Testing with festival (Diwali)...")
features_festival = features.copy()
features_festival['is_festival'] = 1
features_festival['festival_name'] = 1  # Diwali encoded

df_fest = pd.DataFrame([features_festival])
df_fest = df_fest[feature_cols]

for col in df_fest.columns:
    if not pd.api.types.is_numeric_dtype(df_fest[col]):
        df_fest[col] = pd.to_numeric(df_fest[col], errors='coerce').fillna(0)

try:
    dmatrix_fest = xgb.DMatrix(df_fest, feature_names=feature_cols)
    xgb_pred_fest = xgb_model.predict(dmatrix_fest)[0]
    print(f"   XGBoost prediction (festival): {xgb_pred_fest:.2f}")
    print(f"   After max(50.0): {max(xgb_pred_fest, 50.0):.2f}")
except Exception as e:
    print(f"   ❌ XGBoost festival error: {e}")

try:
    lgb_pred_fest = lgb_model.predict(df_fest, num_iteration=lgb_model.best_iteration if hasattr(lgb_model, 'best_iteration') else None)[0]
    print(f"   LightGBM prediction (festival): {lgb_pred_fest:.2f}")
except Exception as e:
    print(f"   ❌ LightGBM festival error: {e}")

print("\n" + "="*60)
print("Diagnosis:")
print("="*60)
print("If XGBoost returns negative values:")
print("  1. The model was likely trained with different feature scaling")
print("  2. Feature values may not match training data distribution")
print("  3. Model may need retraining with current feature engineering")
print("\nRecommendation:")
print("  - Retrain XGBoost model using train_xgboost_lightgbm.py")
print("  - Ensure training data uses same feature engineering as server.py")
print("  - Verify feature ranges match between training and inference")

