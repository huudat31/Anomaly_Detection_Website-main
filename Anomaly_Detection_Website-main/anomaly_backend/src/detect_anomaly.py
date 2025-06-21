import torch
import numpy as np
from src.train_model import Autoencoder

def detect_anomalies(data, model_path="model/autoencoder.pth", threshold=1.5):
    model = Autoencoder(input_dim=data.shape[1])
    model.load_state_dict(torch.load(model_path))
    model.eval()

    data_tensor = torch.tensor(data, dtype=torch.float32)
    with torch.no_grad():
        reconstructed = model(data_tensor)
        loss = torch.mean((data_tensor - reconstructed) ** 2, dim=1)
        # Debug: log min/max/mean loss để kiểm tra threshold
        print(f"[DEBUG] Loss min: {loss.min().item():.6f}, max: {loss.max().item():.6f}, mean: {loss.mean().item():.6f}")
        anomalies = loss > threshold
    return anomalies.numpy(), loss.numpy()
