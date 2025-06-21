#!/usr/bin/env python3
"""
Anomaly Detection System - Main Entry Point
Hệ thống phát hiện bất thường sử dụng Autoencoder
"""

import subprocess
import pandas as pd
import argparse
import logging
import sys
import os
from pathlib import Path
from typing import Tuple, Optional, Dict, Any
from datetime import datetime
import json

# Fix encoding issues for Windows
if sys.platform.startswith('win'):
    # Set console encoding to UTF-8
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    # Fix stdout encoding
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')

from src.extract_features import load_and_extract
from src.train_model import train_autoencoder
from src.detect_anomaly import detect_anomalies
from src.export_result import export_results
from src.alert import send_alert_email, send_alert_to_file

# Custom logging formatter that handles Unicode properly
class UnicodeFormatter(logging.Formatter):
    def format(self, record):
        # Format the record as usual
        formatted = super().format(record)
        # Ensure it's properly encoded
        if isinstance(formatted, str):
            return formatted
        return formatted.decode('utf-8', errors='replace')

# Custom stream handler that handles Unicode
class UnicodeStreamHandler(logging.StreamHandler):
    def emit(self, record):
        try:
            msg = self.format(record)
            stream = self.stream
            # Handle encoding issues
            if hasattr(stream, 'encoding') and stream.encoding:
                if stream.encoding.lower() in ['cp1252', 'windows-1252']:
                    # Fallback to ASCII with replacement for problematic encodings
                    msg = msg.encode('ascii', errors='replace').decode('ascii')
            stream.write(msg + self.terminator)
            self.flush()
        except Exception:
            self.handleError(record)

# Custom file handler that handles Unicode
class UnicodeFileHandler(logging.FileHandler):
    def __init__(self, filename, mode='a', encoding='utf-8', delay=False):
        super().__init__(filename, mode, encoding, delay)

# Configure logging with Unicode support
def setup_logging():
    """Setup logging with proper Unicode handling"""
    # Clear any existing handlers
    for handler in logging.root.handlers[:]:
        logging.root.removeHandler(handler)
    
    # Create formatters
    formatter = UnicodeFormatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # File handler with UTF-8 encoding
    file_handler = UnicodeFileHandler('anomaly_detection.log', encoding='utf-8')
    file_handler.setFormatter(formatter)
    
    # Console handler with Unicode support
    console_handler = UnicodeStreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        handlers=[file_handler, console_handler]
    )

# Initialize logging
setup_logging()
logger = logging.getLogger(__name__)


class AnomalyDetectionConfig:
    """Lớp quản lý cấu hình hệ thống"""
    
    def __init__(self, config_path: str = "config.json"):
        self.config_path = config_path
        self.config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """Tải cấu hình từ file hoặc tạo cấu hình mặc định"""
        try:
            if Path(self.config_path).exists():
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Khong the tai cau hinh tu {self.config_path}: {e}")
        
        # Cấu hình mặc định
        default_config = {
            "data_path": "data/traffic.csv",
            "model_path": "models/autoencoder.h5",
            "output_dir": "outputs",
            "alert_file": "alert.csv",
            "email_alerts": False,
            "email_recipient": "",
            "smtp_server": "",
            "smtp_port": 587,
            "smtp_user": "",
            "smtp_password": "",
            "from_email": "",
            "threshold": 0.5,
            "generate_random_data": True,
            "export_results": True
        }
        
        self._save_config(default_config)
        return default_config
    
    def _save_config(self, config: Dict[str, Any]) -> None:
        """Lưu cấu hình ra file"""
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Khong the luu cau hinh: {e}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """Lấy giá trị cấu hình"""
        return self.config.get(key, default)
    
    def update(self, updates: Dict[str, Any]) -> None:
        """Cập nhật cấu hình"""
        self.config.update(updates)
        self._save_config(self.config)


class AnomalyDetectionSystem:
    """Lớp chính quản lý hệ thống phát hiện anomaly"""
    
    def __init__(self, config: AnomalyDetectionConfig):
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Tạo thư mục cần thiết
        self._create_directories()
    
    def _create_directories(self) -> None:
        """Tạo các thư mục cần thiết"""
        directories = [
            Path(self.config.get("data_path")).parent,
            Path(self.config.get("model_path")).parent,
            Path(self.config.get("output_dir"))
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
    
    def generate_data(self) -> bool:
        """Sinh dữ liệu ngẫu nhiên"""
        if not self.config.get("generate_random_data", True):
            self.logger.info("Bo qua viec sinh du lieu ngau nhien")
            return True
        try:
            self.logger.info("Dang sinh du lieu ngau nhien...")
            # Determine the absolute path to generate_random_traffic.py
            script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'generate_random_traffic.py')
            result = subprocess.run(
                ['python', script_path],
                check=True,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace'
            )
            self.logger.info("Sinh du lieu thanh cong")
            return True
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Loi khi sinh du lieu: {e}")
            if e.stderr:
                self.logger.error(f"Stderr: {e.stderr}")
            return False
        except FileNotFoundError:
            self.logger.error("Khong tim thay file generate_random_traffic.py")
            return False
    
    def load_and_extract_features(self) -> Optional[pd.DataFrame]:
        """Tải và trích xuất đặc trưng"""
        try:
            data_path = self.config.get("data_path")
            self.logger.info(f"Dang tai va trich xuat dac trung tu {data_path}...")
            
            if not Path(data_path).exists():
                raise FileNotFoundError(f"Khong tim thay file du lieu: {data_path}")
            
            features = load_and_extract(data_path)
            self.logger.info(f"Trich xuat thanh cong {len(features)} mau du lieu")
            return features
        except Exception as e:
            self.logger.error(f"Loi khi tai va trich xuat dac trung: {e}")
            return None
    
    def train_model(self, features: pd.DataFrame) -> bool:
        """Huấn luyện mô hình Autoencoder"""
        try:
            self.logger.info("Dang huan luyen Autoencoder...")
            train_autoencoder(features)
            self.logger.info("Huan luyen mo hinh thanh cong")
            return True
        except Exception as e:
            self.logger.error(f"Loi khi huan luyen mo hinh: {e}")
            return False
    
    def detect_anomalies_in_data(self, features: pd.DataFrame) -> Optional[Tuple[pd.Series, pd.Series]]:
        """Phát hiện anomaly trong dữ liệu"""
        try:
            self.logger.info("Dang phat hien bat thuong...")
            anomalies, losses = detect_anomalies(features)
            
            anomalies_count = sum(anomalies)
            total_samples = len(anomalies)
            anomaly_rate = (anomalies_count / total_samples) * 100 if total_samples > 0 else 0
            
            self.logger.info(f"Phat hien {anomalies_count} bat thuong tren tong so {total_samples} mau ({anomaly_rate:.2f}%)")
            
            return anomalies, losses
        except Exception as e:
            self.logger.error(f"Loi khi phat hien anomaly: {e}")
            return None
    
    def handle_alerts(self, anomalies: pd.Series, features: pd.DataFrame) -> None:
        """Xử lý cảnh báo khi phát hiện anomaly"""
        anomalies_count = sum(anomalies)
        
        if anomalies_count == 0:
            self.logger.info("Khong phat hien anomaly nao - Khong can gui canh bao")
            return
        
        try:
            # Đọc dữ liệu gốc để lấy thông tin mẫu bất thường
            data_path = self.config.get("data_path")
            df = pd.read_csv(data_path)
            abnormal_samples = df[anomalies.astype(bool)]
            
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            anomaly_rate = (anomalies_count / len(anomalies) * 100) if len(anomalies) > 0 else 0
            subject = "[CẢNH BÁO] Phát hiện bất thường trong hệ thống"
            body = f"""
Xin chào,

Hệ thống đã phát hiện {anomalies_count} bất thường trên tổng số {len(anomalies)} mẫu dữ liệu vào lúc {timestamp}.

Chi tiết:
- Tỷ lệ bất thường: {anomaly_rate:.2f}%
- File dữ liệu: {data_path}

Vui lòng kiểm tra lại hệ thống để xử lý kịp thời.

Trân trọng,
Hệ thống Giám sát Anomaly Detection
"""
            
            # Ghi cảnh báo ra file
            alert_file = self.config.get("alert_file")
            send_alert_to_file(
                subject, 
                body, 
                features=abnormal_samples.values, 
                columns=abnormal_samples.columns, 
                file_path=alert_file
            )
            self.logger.info(f"Da ghi canh bao vao file {alert_file}")
            
            # Gửi email nếu được cấu hình
            if self.config.get("email_alerts", False):
                email_recipient = self.config.get("email_recipient")
                smtp_server = self.config.get("smtp_server")
                smtp_port = self.config.get("smtp_port")
                smtp_user = self.config.get("smtp_user")
                smtp_password = self.config.get("smtp_password")
                from_email = self.config.get("from_email")
                if email_recipient and smtp_server and smtp_port and smtp_user and smtp_password and from_email:
                    send_alert_email(subject, body, email_recipient, from_email, smtp_server, smtp_port, smtp_user, smtp_password, attachment_path=alert_file)
                    self.logger.info(f"Da gui email canh bao den {email_recipient}")
                else:
                    self.logger.warning("Email alerts duoc bat nhung thieu thong tin SMTP hoac dia chi email")
        
        except Exception as e:
            self.logger.error(f"Loi khi xu ly canh bao: {e}")
    
    def export_detection_results(self, anomalies: pd.Series, losses: pd.Series) -> bool:
        """Xuất kết quả phát hiện"""
        if not self.config.get("export_results", True):
            self.logger.info("Bo qua viec xuat ket qua")
            return True
        
        try:
            self.logger.info("Dang xuat ket qua...")
            export_results(anomalies, losses)
            self.logger.info("Xuat ket qua thanh cong")
            return True
        except Exception as e:
            self.logger.error(f"Loi khi xuat ket qua: {e}")
            return False
    
    def save_run_history(self, success: bool, anomalies_count: int = 0, total_samples: int = 0) -> None:
        """Lưu lịch sử chạy"""
        try:
            history_file = "history.json"
            history = []
            
            if Path(history_file).exists():
                try:
                    with open(history_file, 'r', encoding='utf-8') as f:
                        content = f.read().strip()
                        if content:  # Only parse if file is not empty
                            history = json.loads(content)
                except json.JSONDecodeError as e:
                    self.logger.warning(f"File history.json bi loi, tao moi: {e}")
                    history = []
            
            run_record = {
                "timestamp": datetime.now().isoformat(),
                "success": success,
                "anomalies_count": anomalies_count,
                "total_samples": total_samples,
                "anomaly_rate": (anomalies_count / total_samples * 100) if total_samples > 0 else 0
            }
            
            history.append(run_record)
            
            # Chỉ giữ lại 100 records gần nhất
            if len(history) > 100:
                history = history[-100:]
            
            # Chuyển đổi các giá trị numpy (nếu có) sang kiểu Python chuẩn để lưu JSON
            def convert_np(obj):
                import numpy as np
                if isinstance(obj, np.integer):
                    return int(obj)
                if isinstance(obj, np.floating):
                    return float(obj)
                if isinstance(obj, np.ndarray):
                    return obj.tolist()
                return obj
            with open(history_file, 'w', encoding='utf-8') as f:
                json.dump(history, f, ensure_ascii=False, indent=2, default=convert_np)
                
        except Exception as e:
            self.logger.error(f"Loi khi luu lich su: {e}")
    
    def run_full_pipeline(self) -> bool:
        """Chạy toàn bộ pipeline phát hiện anomaly"""
        self.logger.info("=== BAT DAU QUA TRINH PHAT HIEN ANOMALY ===")
        start_time = datetime.now()
        
        try:
            # Bước 1: Sinh dữ liệu (nếu cần)
            if not self.generate_data():
                return False
            
            # Bước 2: Tải và trích xuất đặc trưng
            features = self.load_and_extract_features()
            if features is None:
                return False
            
            # Bước 3: Huấn luyện mô hình
            if not self.train_model(features):
                return False
            
            # Bước 4: Phát hiện anomaly
            detection_result = self.detect_anomalies_in_data(features)
            if detection_result is None:
                return False
            
            anomalies, losses = detection_result
            anomalies_count = sum(anomalies)
            total_samples = len(anomalies)
            
            # Bước 5: Xử lý cảnh báo
            self.handle_alerts(anomalies, features)
            
            # Bước 6: Xuất kết quả
            if not self.export_detection_results(anomalies, losses):
                return False
            
            # Lưu lịch sử
            self.save_run_history(True, anomalies_count, total_samples)
            
            # Thống kê cuối
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            self.logger.info("=== HOAN THANH QUA TRINH PHAT HIEN ANOMALY ===")
            self.logger.info(f"Thoi gian thuc hien: {duration:.2f} giay")
            self.logger.info(f"Ket qua: {anomalies_count}/{total_samples} anomalies ({(anomalies_count/total_samples*100):.2f}%)")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Loi trong qua trinh thuc hien: {e}")
            self.save_run_history(False)
            return False


def create_argument_parser() -> argparse.ArgumentParser:
    """Tạo argument parser cho command line"""
    parser = argparse.ArgumentParser(
        description="He thong phat hien bat thuong su dung Autoencoder",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        '--config', '-c',
        type=str,
        default='config.json',
        help='Duong dan den file cau hinh (mac dinh: config.json)'
    )
    
    parser.add_argument(
        '--no-generate',
        action='store_true',
        help='Khong sinh du lieu ngau nhien'
    )
    
    parser.add_argument(
        '--no-export',
        action='store_true',
        help='Khong xuat ket qua'
    )
    
    parser.add_argument(
        '--log-level',
        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
        default='INFO',
        help='Muc do log (mac dinh: INFO)'
    )
    
    parser.add_argument(
        '--data-path',
        type=str,
        help='Duong dan den file du lieu (ghi de cau hinh)'
    )
    
    return parser


def main():
    """Hàm main - entry point của chương trình"""
    # Parse arguments
    parser = create_argument_parser()
    args = parser.parse_args()
    
    # Cập nhật log level
    logging.getLogger().setLevel(getattr(logging, args.log_level))
    
    try:
        # Tải cấu hình
        config = AnomalyDetectionConfig(args.config)
        
        # Cập nhật cấu hình từ command line arguments
        config_updates = {}
        if args.no_generate:
            config_updates['generate_random_data'] = False
        if args.no_export:
            config_updates['export_results'] = False
        if args.data_path:
            config_updates['data_path'] = args.data_path
        
        if config_updates:
            config.update(config_updates)
        
        # Khởi tạo và chạy hệ thống
        system = AnomalyDetectionSystem(config)
        success = system.run_full_pipeline()
        
        # Exit code
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        logger.info("Nguoi dung dung chuong trinh")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Loi khong mong muon: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()