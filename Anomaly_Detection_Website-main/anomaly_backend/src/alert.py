import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import csv
import os

def send_alert_email(subject, body, to_email, from_email, smtp_server, smtp_port, smtp_user, smtp_password, attachment_path=None):
    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    # Đính kèm file nếu có
    if attachment_path and os.path.exists(attachment_path):
        with open(attachment_path, 'rb') as f:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(f.read())
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f'attachment; filename="{os.path.basename(attachment_path)}"')
        msg.attach(part)

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(from_email, to_email, msg.as_string())
        print('Alert email sent successfully!')
    except Exception as e:
        print(f'Failed to send alert email: {e}')

def send_alert_to_file(subject, body, features=None, columns=None, file_path="alert.csv"):
    with open(file_path, "a", encoding="utf-8", newline='') as f:
        writer = csv.writer(f)
        if features is not None and columns is not None:
            # Ghi header nếu file mới
            if f.tell() == 0:
                writer.writerow(['Subject', 'Body'] + list(columns))
            for row in features:
                writer.writerow([subject, body] + list(row))
        else:
            writer.writerow([subject, body])
    print(f'Alert written to {file_path}')

# Ví dụ sử dụng (bạn cần thay đổi thông tin cấu hình cho phù hợp):
# send_alert_email(
#     subject='Cảnh báo bất thường AI',
#     body='Phát hiện bất thường trong luồng dữ liệu mã hóa!',
#     to_email='nguoinhan@email.com',
#     from_email='ban@email.com',
#     smtp_server='smtp.gmail.com',
#     smtp_port=587,
#     smtp_user='ban@email.com',
#     smtp_password='matkhau_ung_dung'
# )

# Ví dụ sử dụng:
# send_alert_to_file(
#     subject='Cảnh báo bất thường AI',
#     body='Phát hiện bất thường trong luồng dữ liệu mã hóa!'
# )
# Hàm này sẽ ghi cảnh báo vào file alert.txt (hoặc file bạn chỉ định)
