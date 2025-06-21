import pandas as pd
import numpy as np
from datetime import datetime

def extract_features_from_log(df: pd.DataFrame, history_df: pd.DataFrame = None):
    features = pd.DataFrame()
    # 1. Thời điểm truy cập
    # Giờ trong ngày
    features['hour'] = df['timestamp'].apply(lambda x: int(x.split(':')[0]) + int(x.split(':')[1])/60)
    # Thứ trong tuần (giả sử có cột date, nếu không thì random hoặc bỏ qua)
    features['is_working_hour'] = features['hour'].apply(lambda h: 1 if 8 <= h <= 18 else 0)
    # 2. Địa chỉ IP
    features['is_internal_ip'] = df['ip_address'].apply(lambda ip: 1 if ip.startswith('192.168.') or ip.startswith('10.') or ip.startswith('172.16.') else 0)
    # 3. Tài khoản người dùng
    features['is_identified_user'] = df['username'].apply(lambda u: 0 if u in ['unknown', 'guest', 'null', None] else 1)
    features['is_admin'] = df['username'].apply(lambda u: 1 if u=='admin' else 0)
    # 4. Endpoint
    features['is_sensitive_endpoint'] = df['endpoint'].apply(lambda e: 1 if e in ['/admin', '/config', '/api/delete'] else 0)
    # 5. Method
    for m in ['GET', 'POST', 'PUT', 'DELETE']:
        features[f'method_{m}'] = (df['method'] == m).astype(int)
    # 6. Duration
    features['duration'] = df['duration']
    # 7. Status
    features['is_error'] = df['status'].apply(lambda s: 1 if int(s) >= 400 else 0)
    for s in [200, 201, 400, 401, 403, 404, 500]:
        features[f'status_{s}'] = (df['status'] == s).astype(int)
    # 8. Bytes sent
    features['bytes_sent'] = df['bytes_sent']
    # 9. Endpoint one-hot
    for ep in ['/login', '/dashboard', '/admin', '/config', '/api/data', '/logout', '/settings', '/profile']:
        features[f'endpoint_{ep}'] = (df['endpoint'] == ep).astype(int)
    # Có thể mở rộng thêm các đặc trưng khác nếu cần
    return features
