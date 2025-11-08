#!/usr/bin/env python3
"""
Training script for XGBoost and LightGBM models for hourly traffic prediction.

This script:
1. Loads training data (CSV format expected)
2. Prepares features matching server.py feature engineering
3. Trains XGBoost and LightGBM models
4. Saves models in the format expected by server.py
5. Saves feature columns for consistency

Usage:
    python train_xgboost_lightgbm.py --data your_data.csv --target traffic_load
"""

import pandas as pd
import numpy as np
import joblib
import xgboost as xgb
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import argparse
from pathlib import Path
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Festival name mapping (must match server.py)
FESTIVAL_MAP = {
    'None': 0,
    'Diwali': 1,
    'Holi': 2,
    'Christmas': 3,
    'Independence Day': 4,
    'Republic Day': 5,
    'Ram Navami': 6,
    'Diwali Weekend': 7
}

def prepare_features(df, is_training=True):
    """
    Prepare features matching server.py feature engineering.
    
    Expected input columns:
    - timestamp (datetime or string)
    - festival_name (string)
    - traffic_lag_1h, traffic_lag_24h, traffic_lag_168h (float)
    - traffic_rolling_mean_24h, traffic_rolling_std_24h, traffic_rolling_max_24h (float)
    - cpu_usage, memory_usage, response_time, error_rate (float)
    - is_campaign (int, optional)
    """
    features_df = df.copy()
    
    # Convert timestamp to datetime if string
    if 'timestamp' in features_df.columns:
        if features_df['timestamp'].dtype == 'object':
            features_df['timestamp'] = pd.to_datetime(features_df['timestamp'])
    elif 'datetime' in features_df.columns:
        if features_df['datetime'].dtype == 'object':
            features_df['timestamp'] = pd.to_datetime(features_df['datetime'])
        else:
            features_df['timestamp'] = features_df['datetime']
    else:
        raise ValueError("Data must have 'timestamp' or 'datetime' column")
    
    # Extract temporal features
    features_df['hour'] = features_df['timestamp'].dt.hour
    features_df['day_of_week'] = features_df['timestamp'].dt.dayofweek
    features_df['month'] = features_df['timestamp'].dt.month
    features_df['day'] = features_df['timestamp'].dt.day
    features_df['year'] = features_df['timestamp'].dt.year
    features_df['week_of_year'] = features_df['timestamp'].dt.isocalendar().week
    features_df['quarter'] = features_df['timestamp'].dt.quarter
    features_df['day_of_year'] = features_df['timestamp'].dt.dayofyear
    
    # Cyclical encoding
    features_df['hour_sin'] = np.sin(2 * np.pi * features_df['hour'] / 24)
    features_df['hour_cos'] = np.cos(2 * np.pi * features_df['hour'] / 24)
    features_df['dow_sin'] = np.sin(2 * np.pi * features_df['day_of_week'] / 7)
    features_df['dow_cos'] = np.cos(2 * np.pi * features_df['day_of_week'] / 7)
    
    # Boolean features
    features_df['is_weekend'] = (features_df['day_of_week'] >= 5).astype(int)
    features_df['is_business_hours'] = ((features_df['hour'] >= 9) & (features_df['hour'] <= 18)).astype(int)
    features_df['is_peak_hours'] = features_df['hour'].isin([12, 13, 19, 20, 21]).astype(int)
    features_df['is_night'] = ((features_df['hour'] < 6) | (features_df['hour'] > 22)).astype(int)
    
    # Festival features
    if 'is_festival' not in features_df.columns:
        features_df['is_festival'] = (features_df['festival_name'] != 'None').astype(int)
    
    if 'is_campaign' not in features_df.columns:
        features_df['is_campaign'] = 0
    
    # Encode festival_name for XGBoost (numeric encoding)
    if 'festival_name' in features_df.columns:
        features_df['festival_name_encoded'] = features_df['festival_name'].map(
            lambda x: FESTIVAL_MAP.get(str(x), 0)
        ).fillna(0).astype(int)
    else:
        features_df['festival_name_encoded'] = 0
        features_df['festival_name'] = 'None'
    
    # Ensure lag features exist (fill with defaults if missing)
    lag_features = [
        'traffic_lag_1h', 'traffic_lag_24h', 'traffic_lag_168h',
        'traffic_rolling_mean_24h', 'traffic_rolling_std_24h', 'traffic_rolling_max_24h'
    ]
    for feat in lag_features:
        if feat not in features_df.columns:
            # Use default values if missing
            if 'lag_1h' in feat:
                features_df[feat] = 1200.0
            elif 'lag_24h' in feat:
                features_df[feat] = 1500.0
            elif 'lag_168h' in feat:
                features_df[feat] = 1400.0
            elif 'mean' in feat:
                features_df[feat] = 1300.0
            elif 'std' in feat:
                features_df[feat] = 200.0
            elif 'max' in feat:
                features_df[feat] = 2000.0
    
    # System metrics (fill with defaults if missing)
    system_features = ['cpu_usage', 'memory_usage', 'response_time', 'error_rate']
    for feat in system_features:
        if feat not in features_df.columns:
            if 'cpu' in feat:
                features_df[feat] = 45.0
            elif 'memory' in feat:
                features_df[feat] = 60.0
            elif 'response' in feat:
                features_df[feat] = 150.0
            elif 'error' in feat:
                features_df[feat] = 0.5
    
    # Select features in the exact order expected by server.py
    # Note: server.py uses 'festival_name' as the column name (not 'festival_name_encoded')
    # But for XGBoost it expects numeric encoding, for LightGBM it also needs numeric
    feature_columns = [
        'hour', 'day_of_week', 'month', 'day', 'year', 'week_of_year', 'quarter',
        'day_of_year', 'hour_sin', 'hour_cos', 'dow_sin', 'dow_cos',
        'is_weekend', 'is_business_hours', 'is_peak_hours', 'is_night',
        'is_festival', 'is_campaign', 'festival_name',
        'traffic_lag_1h', 'traffic_lag_24h', 'traffic_lag_168h',
        'traffic_rolling_mean_24h', 'traffic_rolling_std_24h', 'traffic_rolling_max_24h',
        'cpu_usage', 'memory_usage', 'response_time', 'error_rate'
    ]
    
    # Replace festival_name with encoded version (both models need numeric)
    features_df['festival_name'] = features_df['festival_name_encoded']
    
    # Select and order features
    X = features_df[feature_columns].copy()
    
    # Ensure all features are numeric
    for col in X.columns:
        if not pd.api.types.is_numeric_dtype(X[col]):
            X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)
    
    return X, feature_columns

def train_xgboost(X_train, y_train, X_val, y_val):
    """Train XGBoost model"""
    print("\n" + "="*60)
    print("Training XGBoost Model")
    print("="*60)
    
    # XGBoost parameters
    params = {
        'objective': 'reg:squarederror',
        'eval_metric': 'rmse',
        'max_depth': 6,
        'learning_rate': 0.1,
        'n_estimators': 200,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 3,
        'gamma': 0.1,
        'reg_alpha': 0.1,
        'reg_lambda': 1.0,
        'random_state': 42,
        'n_jobs': -1
    }
    
    # Create DMatrix for XGBoost
    dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=X_train.columns.tolist())
    dval = xgb.DMatrix(X_val, label=y_val, feature_names=X_val.columns.tolist())
    
    # Train model
    evals = [(dtrain, 'train'), (dval, 'val')]
    model = xgb.train(
        params,
        dtrain,
        num_boost_round=params['n_estimators'],
        evals=evals,
        early_stopping_rounds=20,
        verbose_eval=10
    )
    
    # Evaluate
    y_pred_train = model.predict(dtrain)
    y_pred_val = model.predict(dval)
    
    train_mae = mean_absolute_error(y_train, y_pred_train)
    val_mae = mean_absolute_error(y_val, y_pred_val)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    val_rmse = np.sqrt(mean_squared_error(y_val, y_pred_val))
    train_r2 = r2_score(y_train, y_pred_train)
    val_r2 = r2_score(y_val, y_pred_val)
    
    print(f"\nXGBoost Training Results:")
    print(f"  Train MAE: {train_mae:.2f}, RMSE: {train_rmse:.2f}, R²: {train_r2:.4f}")
    print(f"  Val MAE:   {val_mae:.2f}, RMSE: {val_rmse:.2f}, R²: {val_r2:.4f}")
    
    return model

def train_lightgbm(X_train, y_train, X_val, y_val):
    """Train LightGBM model"""
    print("\n" + "="*60)
    print("Training LightGBM Model")
    print("="*60)
    
    # LightGBM parameters
    params = {
        'objective': 'regression',
        'metric': 'rmse',
        'boosting_type': 'gbdt',
        'num_leaves': 31,
        'learning_rate': 0.1,
        'feature_fraction': 0.8,
        'bagging_fraction': 0.8,
        'bagging_freq': 5,
        'min_child_samples': 20,
        'reg_alpha': 0.1,
        'reg_lambda': 1.0,
        'random_state': 42,
        'n_jobs': -1,
        'verbose': -1
    }
    
    # Create datasets
    train_data = lgb.Dataset(X_train, label=y_train, feature_name=X_train.columns.tolist())
    val_data = lgb.Dataset(X_val, label=y_val, reference=train_data, feature_name=X_val.columns.tolist())
    
    # Train model
    model = lgb.train(
        params,
        train_data,
        num_boost_round=200,
        valid_sets=[train_data, val_data],
        valid_names=['train', 'val'],
        callbacks=[
            lgb.early_stopping(stopping_rounds=20, verbose=True),
            lgb.log_evaluation(period=10)
        ]
    )
    
    # Evaluate
    y_pred_train = model.predict(X_train, num_iteration=model.best_iteration)
    y_pred_val = model.predict(X_val, num_iteration=model.best_iteration)
    
    train_mae = mean_absolute_error(y_train, y_pred_train)
    val_mae = mean_absolute_error(y_val, y_pred_val)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    val_rmse = np.sqrt(mean_squared_error(y_val, y_pred_val))
    train_r2 = r2_score(y_train, y_pred_train)
    val_r2 = r2_score(y_val, y_pred_val)
    
    print(f"\nLightGBM Training Results:")
    print(f"  Train MAE: {train_mae:.2f}, RMSE: {train_rmse:.2f}, R²: {train_r2:.4f}")
    print(f"  Val MAE:   {val_mae:.2f}, RMSE: {val_rmse:.2f}, R²: {val_r2:.4f}")
    
    return model

def main():
    parser = argparse.ArgumentParser(description='Train XGBoost and LightGBM models')
    parser.add_argument('--data', type=str, required=True, help='Path to training data CSV file')
    parser.add_argument('--target', type=str, default='traffic_load', help='Target column name')
    parser.add_argument('--test-size', type=float, default=0.2, help='Test set size (default: 0.2)')
    parser.add_argument('--output-dir', type=str, default='.', help='Output directory for models')
    parser.add_argument('--train-xgboost', action='store_true', help='Train XGBoost model')
    parser.add_argument('--train-lightgbm', action='store_true', help='Train LightGBM model')
    parser.add_argument('--train-both', action='store_true', default=True, help='Train both models (default)')
    
    args = parser.parse_args()
    
    # Determine which models to train
    train_xgb = args.train_xgboost or args.train_both
    train_lgb = args.train_lightgbm or args.train_both
    
    print("="*60)
    print("XGBoost & LightGBM Model Training Script")
    print("="*60)
    print(f"Data file: {args.data}")
    print(f"Target column: {args.target}")
    print(f"Train XGBoost: {train_xgb}")
    print(f"Train LightGBM: {train_lgb}")
    print("="*60)
    
    # Load data
    print("\nLoading data...")
    df = pd.read_csv(args.data)
    print(f"Loaded {len(df)} rows, {len(df.columns)} columns")
    
    # Check target column
    if args.target not in df.columns:
        raise ValueError(f"Target column '{args.target}' not found in data. Available columns: {list(df.columns)}")
    
    # Prepare features
    print("\nPreparing features...")
    X, feature_columns = prepare_features(df)
    y = df[args.target].values
    
    print(f"Features prepared: {X.shape[1]} features, {len(X)} samples")
    print(f"Target range: {y.min():.2f} - {y.max():.2f}, Mean: {y.mean():.2f}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=42, shuffle=True
    )
    
    # Further split training into train/val
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=0.2, random_state=42, shuffle=True
    )
    
    print(f"\nData split:")
    print(f"  Train: {len(X_train)} samples")
    print(f"  Val:   {len(X_val)} samples")
    print(f"  Test:  {len(X_test)} samples")
    
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Train XGBoost
    if train_xgb:
        xgb_model = train_xgboost(X_train, y_train, X_val, y_val)
        
        # Save XGBoost model
        xgb_path = output_dir / 'xgboost_hourly_model.pkl'
        joblib.dump(xgb_model, xgb_path)
        print(f"\n✅ XGBoost model saved to: {xgb_path}")
        
        # Test on test set
        dtest = xgb.DMatrix(X_test, feature_names=X_test.columns.tolist())
        y_pred_test = xgb_model.predict(dtest)
        test_mae = mean_absolute_error(y_test, y_pred_test)
        test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
        test_r2 = r2_score(y_test, y_pred_test)
        print(f"  Test MAE: {test_mae:.2f}, RMSE: {test_rmse:.2f}, R²: {test_r2:.4f}")
    
    # Train LightGBM
    if train_lgb:
        lgb_model = train_lightgbm(X_train, y_train, X_val, y_val)
        
        # Save LightGBM model
        lgb_path = output_dir / 'lightgbm_hourly_model.pkl'
        joblib.dump(lgb_model, lgb_path)
        print(f"\n✅ LightGBM model saved to: {lgb_path}")
        
        # Test on test set
        y_pred_test = lgb_model.predict(X_test, num_iteration=lgb_model.best_iteration)
        test_mae = mean_absolute_error(y_test, y_pred_test)
        test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
        test_r2 = r2_score(y_test, y_pred_test)
        print(f"  Test MAE: {test_mae:.2f}, RMSE: {test_rmse:.2f}, R²: {test_r2:.4f}")
    
    # Save feature columns (important for server.py)
    feature_cols_path = output_dir / 'feature_columns_hourly.pkl'
    joblib.dump(feature_columns, feature_cols_path)
    print(f"\n✅ Feature columns saved to: {feature_cols_path}")
    
    print("\n" + "="*60)
    print("Training Complete!")
    print("="*60)
    print(f"\nModels saved in: {output_dir.absolute()}")
    print("\nTo use these models:")
    print("1. Copy the .pkl files to your backend directory")
    print("2. Restart the server")
    print("3. The server will automatically load the new models")

if __name__ == '__main__':
    main()

