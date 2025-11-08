#!/usr/bin/env python3
"""
Script to fix or recreate LSTM model for TensorFlow 2.15.0 compatibility
"""
import tensorflow as tf
import numpy as np
import h5py
import json

print(f"TensorFlow version: {tf.__version__}")
print(f"Keras version: {tf.keras.__version__}")

lstm_path = 'lstm_hourly_model.h5'

# Check what's in the model file
print("\n=== Checking model file structure ===")
with h5py.File(lstm_path, 'r') as f:
    print("Keys:", list(f.keys()))
    
    # Check for model_config
    if 'model_config' in f:
        print("\n✅ Found model_config")
        config_str = f['model_config'][()].decode('utf-8')
        config = json.loads(config_str)
        print("Config type:", type(config))
        if isinstance(config, dict):
            print("Config keys:", list(config.keys()))
    else:
        print("\n❌ No model_config found - model only has weights")
    
    # Check model_weights structure
    if 'model_weights' in f:
        print("\n✅ Found model_weights")
        print("Weight groups:", list(f['model_weights'].keys()))

# Try to infer architecture from weights
print("\n=== Attempting to infer model architecture ===")
try:
    with h5py.File(lstm_path, 'r') as f:
        if 'model_weights' in f:
            weights = f['model_weights']
            
            # Common LSTM architectures for time series
            # Based on 29 features (from feature_columns_hourly.pkl)
            input_features = 29
            
            # Try to determine LSTM units from weight shapes
            lstm_layers = []
            for layer_name in weights.keys():
                if 'lstm' in layer_name.lower() or 'dense' in layer_name.lower():
                    layer_weights = weights[layer_name]
                    if 'kernel:0' in layer_weights:
                        kernel_shape = layer_weights['kernel:0'].shape
                        print(f"Layer {layer_name}: kernel shape {kernel_shape}")
                        
                        if 'lstm' in layer_name.lower():
                            # LSTM kernel shape: (input_dim + units, 4 * units)
                            # So: input_dim + units = kernel_shape[0]
                            # And: 4 * units = kernel_shape[1]
                            if len(kernel_shape) == 2:
                                units = kernel_shape[1] // 4
                                lstm_layers.append((layer_name, units))
                                print(f"  -> LSTM with {units} units")
            
            if lstm_layers:
                print(f"\nDetected LSTM layers: {lstm_layers}")
                print("\nSuggested model architecture:")
                print(f"  Input: (None, 1, {input_features})")
                for name, units in lstm_layers:
                    print(f"  {name}: LSTM({units})")
                print("  Output: Dense(1)")
except Exception as e:
    print(f"Error analyzing weights: {e}")

print("\n=== Recommendation ===")
print("The LSTM model file appears to be missing the architecture definition.")
print("Options:")
print("1. Retrain the LSTM model with current TensorFlow version")
print("2. If you have the original training script, save the model with:")
print("   model.save('lstm_hourly_model.h5', save_format='h5', include_optimizer=False)")
print("3. Use only the other 3 models (CatBoost, LightGBM, XGBoost) which work fine")

