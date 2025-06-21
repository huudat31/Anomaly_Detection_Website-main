import pandas as pd
from src.feature_engineering import extract_features_from_log
from sklearn.preprocessing import StandardScaler
import numpy as np

def load_and_extract(path):
    df = pd.read_csv(path)
    features = extract_features_from_log(df)
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features.values)
    # Làm sạch đặc trưng: thay NaN/inf bằng 0
    features_scaled = np.nan_to_num(features_scaled, nan=0.0, posinf=0.0, neginf=0.0)
    # Debug: log min/max/NaN count
    print(f"[DEBUG] features_scaled shape: {features_scaled.shape}")
    print(f"[DEBUG] features_scaled min: {features_scaled.min()}, max: {features_scaled.max()}, NaN count: {np.isnan(features_scaled).sum()}")
    return features_scaled
