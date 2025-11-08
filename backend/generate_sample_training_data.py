#!/usr/bin/env python3
"""
Generate sample training data for model training.

This script creates a sample CSV file with the required format for training.
You can modify this to match your actual data structure.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_sample_data(n_samples=1000, start_date='2023-01-01'):
    """Generate sample training data"""
    
    # Create date range
    start = datetime.strptime(start_date, '%Y-%m-%d')
    dates = [start + timedelta(hours=i) for i in range(n_samples)]
    
    # Festival dates (for example)
    festival_dates = {
        '2023-01-26': 'Republic Day',
        '2023-03-08': 'Holi',
        '2023-10-24': 'Diwali',
        '2023-12-25': 'Christmas',
        '2024-01-26': 'Republic Day',
        '2024-03-25': 'Holi',
        '2024-11-01': 'Diwali',
        '2024-12-25': 'Christmas',
    }
    
    data = []
    base_traffic = 1200.0
    
    for i, dt in enumerate(dates):
        date_str = dt.strftime('%Y-%m-%d')
        
        # Check if festival
        festival_name = festival_dates.get(date_str, 'None')
        is_festival = 1 if festival_name != 'None' else 0
        
        # Base traffic with daily and hourly patterns
        hour = dt.hour
        day_of_week = dt.weekday()
        
        # Hourly pattern (peak during 12-13, 19-21)
        hour_multiplier = 1.0
        if hour in [12, 13]:
            hour_multiplier = 1.5
        elif hour in [19, 20, 21]:
            hour_multiplier = 1.8
        elif hour < 6:
            hour_multiplier = 0.5
        
        # Weekly pattern (higher on weekends)
        week_multiplier = 1.2 if day_of_week >= 5 else 1.0
        
        # Festival boost
        festival_boost = 4.5 if festival_name == 'Diwali' else (3.0 if is_festival else 1.0)
        
        # Calculate traffic load
        traffic_load = base_traffic * hour_multiplier * week_multiplier * festival_boost
        traffic_load += np.random.normal(0, traffic_load * 0.1)  # Add noise
        traffic_load = max(traffic_load, 50.0)  # Ensure positive
        
        # Lag features (simplified - in real data, calculate from previous rows)
        traffic_lag_1h = traffic_load * 0.95 + np.random.normal(0, 50)
        traffic_lag_24h = traffic_load * 0.9 + np.random.normal(0, 100)
        traffic_lag_168h = traffic_load * 0.85 + np.random.normal(0, 150)
        
        # Rolling statistics
        traffic_rolling_mean_24h = traffic_load * 0.92
        traffic_rolling_std_24h = traffic_load * 0.15
        traffic_rolling_max_24h = traffic_load * 1.2
        
        # System metrics
        cpu_usage = min(45.0 + (traffic_load / 100) * 0.5, 95.0)
        memory_usage = min(60.0 + (traffic_load / 100) * 0.3, 90.0)
        response_time = max(150.0 - (traffic_load / 100) * 0.1, 50.0)
        error_rate = max(0.5 - (traffic_load / 10000), 0.1)
        
        data.append({
            'timestamp': dt,
            'festival_name': festival_name,
            'traffic_load': traffic_load,
            'traffic_lag_1h': traffic_lag_1h,
            'traffic_lag_24h': traffic_lag_24h,
            'traffic_lag_168h': traffic_lag_168h,
            'traffic_rolling_mean_24h': traffic_rolling_mean_24h,
            'traffic_rolling_std_24h': traffic_rolling_std_24h,
            'traffic_rolling_max_24h': traffic_rolling_max_24h,
            'cpu_usage': cpu_usage,
            'memory_usage': memory_usage,
            'response_time': response_time,
            'error_rate': error_rate,
            'is_campaign': 0
        })
    
    df = pd.DataFrame(data)
    return df

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate sample training data')
    parser.add_argument('--output', type=str, default='training_data_sample.csv', help='Output CSV file')
    parser.add_argument('--samples', type=int, default=2000, help='Number of samples to generate')
    parser.add_argument('--start-date', type=str, default='2023-01-01', help='Start date (YYYY-MM-DD)')
    
    args = parser.parse_args()
    
    print(f"Generating {args.samples} samples starting from {args.start_date}...")
    df = generate_sample_data(args.samples, args.start_date)
    
    df.to_csv(args.output, index=False)
    print(f"✅ Sample data saved to: {args.output}")
    print(f"   Rows: {len(df)}")
    print(f"   Columns: {list(df.columns)}")
    print(f"   Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    print(f"   Traffic range: {df['traffic_load'].min():.2f} - {df['traffic_load'].max():.2f}")

