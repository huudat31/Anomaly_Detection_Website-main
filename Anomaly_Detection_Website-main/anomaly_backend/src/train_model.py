import os
import torch
import torch.nn as nn
import numpy as np
import random

def set_seed(seed=42):
    torch.manual_seed(seed)
    np.random.seed(seed)
    random.seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

set_seed(42)

class Autoencoder(nn.Module):
    def __init__(self, input_dim):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 4),
            nn.ReLU(),
            nn.Linear(4, 2),
            nn.ReLU()
        )
        self.decoder = nn.Sequential(
            nn.Linear(2, 4),
            nn.ReLU(),
            nn.Linear(4, input_dim),
            nn.Sigmoid()
        )

    def forward(self, x):
        return self.decoder(self.encoder(x))

def train_autoencoder(data, epochs=50, save_path="model/autoencoder.pth"):
    # Đảm bảo thư mục cha tồn tại trước khi lưu mô hình
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    model = Autoencoder(input_dim=data.shape[1])
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    data_tensor = torch.tensor(data, dtype=torch.float32)

    for epoch in range(epochs):
        output = model(data_tensor)
        loss = criterion(output, data_tensor)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        if (epoch+1) % 10 == 0:
            print(f"Epoch {epoch+1}/{epochs}, Mất mát: {loss.item():.6f}")
    # Debug: log loss cuối cùng
    print(f"[DEBUG] Final train loss: {loss.item():.6f}")

    torch.save(model.state_dict(), save_path)
    return model
