import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8')

import os
import csv
import random
from datetime import datetime

# Số dòng dữ liệu muốn tạo
num_rows = 5000

# Đường dẫn file CSV
csv_file = 'data/traffic.csv'

# Tạo thư mục nếu chưa có
os.makedirs(os.path.dirname(csv_file), exist_ok=True)

# Danh sách các cột đặc trưng
headers = [
    'timestamp', 'ip_address', 'username', 'endpoint',
    'duration', 'status', 'bytes_sent', 'method'
]

usernames = ['admin', 'user', 'guest', 'unknown', 'test', 'root']
endpoints = ['/login', '/dashboard', '/config', '/api/data', '/logout', '/settings', '/profile', '/admin']
methods = ['GET', 'POST', 'PUT', 'DELETE']
statuses = [200, 201, 400, 401, 403, 404, 500]
ip_bases = ['192.168.1.', '10.0.0.', '172.16.0.', '91.92.18.', '203.0.113.']

print('Dang thu thap du lieu...')
with open(csv_file, mode='w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerow(headers)
    for i in range(num_rows):
        is_abnormal = random.random() < 0.1
        if not is_abnormal:
            hour = random.randint(8, 17)
            ip_address = random.choice(ip_bases[:3]) + str(random.randint(1, 254))
            username = random.choice(usernames[:4])
            endpoint = random.choice(['/login', '/dashboard', '/api/data', '/profile'])
            duration = round(random.uniform(0.2, 2.0), 2)
            status = 200
            bytes_sent = random.randint(500, 5000)
            method = random.choice(['GET', 'POST'])
        else:
            hour = random.choice(list(range(0, 8)) + list(range(18, 24)))
            ip_address = random.choice(ip_bases[3:]) + str(random.randint(1, 254))
            username = random.choice(['unknown', 'guest', 'root', 'test'])
            endpoint = random.choice(['/config', '/admin', '/settings', '/logout'])
            duration = round(random.uniform(0.01, 8.0), 2)
            status = random.choice([400, 401, 403, 404, 500])
            bytes_sent = random.choice([random.randint(0, 100), random.randint(10000, 20000)])
            method = random.choice(['PUT', 'DELETE', 'POST', 'GET'])
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        timestamp = f"{hour:02d}:{minute:02d}:{second:02d}"
        writer.writerow([
            timestamp, ip_address, username, endpoint,
            duration, status, bytes_sent, method
        ])
        if (i+1) % 100 == 0:
            print(f'Đã thu thập {i+1}/{num_rows} dòng dữ liệu...')
print(f'Đã tạo {num_rows} dòng dữ liệu ngẫu nhiên vào {csv_file}')
