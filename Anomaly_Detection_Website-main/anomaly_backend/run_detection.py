from main import AnomalyDetectionSystem, AnomalyDetectionConfig
import sys
import logging

def quick_run():
    """Chạy nhanh anomaly detection với cấu hình mặc định"""
    print("Bat dau phat hien anomaly...")
    
    try:
        # Khởi tạo với cấu hình mặc định
        config = AnomalyDetectionConfig()
        system = AnomalyDetectionSystem(config)
        
        # Chạy full pipeline
        success = system.run_full_pipeline()
        
        if success:
            print("Hoan thanh thanh cong!")
            return 0
        else:
            print("Co loi xay ra!")
            return 1
            
    except KeyboardInterrupt:
        print("\nNguoi dung dung chuong trinh")
        return 130
    except Exception as e:
        print(f"Loi: {e}")
        return 1

if __name__ == "__main__":
    # Tắt logging chi tiết để output gọn hơn
    logging.getLogger().setLevel(logging.WARNING)
    
    exit_code = quick_run()
    sys.exit(exit_code)