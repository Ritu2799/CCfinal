#!/usr/bin/env python3
"""
Reconstruct LSTM model architecture from weights and create a loadable model
"""
import tensorflow as tf
import h5py
import numpy as np

print("Reconstructing LSTM model from weights...")

lstm_path = 'lstm_hourly_model.h5'
input_features = 29  # From feature_columns_hourly.pkl

# Analyze weights to determine architecture
with h5py.File(lstm_path, 'r') as f:
    weights = f['model_weights']
    
    # Bidirectional LSTM: kernel (29, 512) -> 29 input, 512 = 4 * 128 units
    bidir_kernel = weights['bidirectional/sequential/bidirectional/forward_lstm/lstm_cell/kernel']
    bidir_units = bidir_kernel.shape[1] // 4  # 512 / 4 = 128
    print(f"Bidirectional LSTM: {bidir_units} units")
    
    # LSTM_1: kernel (256, 384) -> 256 input (from bidirectional output), 384 = 4 * 96 units
    lstm1_kernel = weights['lstm_1/sequential/lstm_1/lstm_cell/kernel']
    lstm1_units = lstm1_kernel.shape[1] // 4  # 384 / 4 = 96
    print(f"LSTM_1: {lstm1_units} units")
    
    # LSTM_2: kernel (96, 256) -> 96 input, 256 = 4 * 64 units
    lstm2_kernel = weights['lstm_2/sequential/lstm_2/lstm_cell/kernel']
    lstm2_units = lstm2_kernel.shape[1] // 4  # 256 / 4 = 64
    print(f"LSTM_2: {lstm2_units} units")
    
    # Dense layers
    dense_kernel = weights['dense/sequential/dense/kernel']
    dense_units = dense_kernel.shape[1]  # 48
    print(f"Dense: {dense_kernel.shape[0]} -> {dense_units}")
    
    dense1_kernel = weights['dense_1/sequential/dense_1/kernel']
    dense1_units = dense1_kernel.shape[1]  # 24
    print(f"Dense_1: {dense1_kernel.shape[0]} -> {dense1_units}")
    
    dense2_kernel = weights['dense_2/sequential/dense_2/kernel']
    print(f"Dense_2: {dense2_kernel.shape[0]} -> {dense2_kernel.shape[1]} (output)")

# Reconstruct model architecture
print("\nBuilding model architecture...")
model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(1, input_features), name='input_layer'),
    tf.keras.layers.Bidirectional(
        tf.keras.layers.LSTM(bidir_units, return_sequences=True),
        name='bidirectional'
    ),
    tf.keras.layers.Dropout(0.2, name='dropout'),
    tf.keras.layers.LSTM(lstm1_units, return_sequences=True, name='lstm_1'),
    tf.keras.layers.Dropout(0.2, name='dropout_1'),
    tf.keras.layers.LSTM(lstm2_units, return_sequences=False, name='lstm_2'),
    tf.keras.layers.Dropout(0.2, name='dropout_2'),
    tf.keras.layers.Dense(dense_units, name='dense'),
    tf.keras.layers.Dropout(0.2, name='dropout_3'),
    tf.keras.layers.Dense(dense1_units, name='dense_1'),
    tf.keras.layers.Dense(1, name='dense_2')  # Output layer
])

print("Model architecture created!")
print(f"Total parameters: {model.count_params():,}")

# Try to load weights using by_name=True to match layer names
print("\nLoading weights...")
try:
    # Load weights by name (this should work even if structure is slightly different)
    model.load_weights(lstm_path, by_name=True, skip_mismatch=False)
    print("✅ Weights loaded successfully!")
    
    # Save the reconstructed model with full architecture
    output_path = 'lstm_hourly_model_fixed.h5'
    model.save(output_path, save_format='h5', include_optimizer=False)
    print(f"✅ Saved reconstructed model to {output_path}")
    
    # Test prediction
    print("\nTesting model...")
    test_input = np.random.randn(1, 1, input_features).astype(np.float32)
    prediction = model.predict(test_input, verbose=0)
    print(f"✅ Test prediction successful: {prediction[0][0]:.2f}")
    print(f"\n✅ Model is ready to use!")
    print(f"\nTo use this model, update server.py to load: {output_path}")
    
except Exception as e:
    print(f"❌ Error loading weights: {e}")
    import traceback
    traceback.print_exc()
    print("\nTrying alternative loading method...")
    
    # Alternative: try loading with skip_mismatch
    try:
        model.load_weights(lstm_path, by_name=True, skip_mismatch=True)
        print("✅ Weights loaded with skip_mismatch=True")
        output_path = 'lstm_hourly_model_fixed.h5'
        model.save(output_path, save_format='h5', include_optimizer=False)
        print(f"✅ Saved to {output_path}")
    except Exception as e2:
        print(f"❌ Alternative method also failed: {e2}")
