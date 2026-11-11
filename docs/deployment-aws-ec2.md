# Production Deployment Guide: AWS EC2 & RDS (CarePulse HMS)

> **Important Deployment Notice:**  
> This guide provides step-by-step instructions, systemd configurations, and Nginx templates for deploying the Healthcare Management System to Amazon Web Services (AWS). No cloud resources have been automatically created or billed. Execute these steps only on your own authorized AWS account.

---

## 1. Architecture & Instance Sizing

### Recommended Infrastructure
- **Compute:** AWS EC2 `t3.small` (2 vCPU, 2 GB RAM) or `t3.medium` (2 vCPU, 4 GB RAM) running **Ubuntu 24.04 LTS (HVM)** with 20–30 GB General Purpose SSD (gp3).
- **Database:** Amazon RDS for MySQL 8.0 (`db.t3.micro` or `db.t3.small`) with Multi-AZ optional, automated backups, and encryption at rest. For low-cost evaluation or staging, a local MySQL 8.x instance on EC2 can be used.
- **Web Server & Reverse Proxy:** Nginx 1.24+ serving the pre-built React production bundle and reverse-proxying API traffic.
- **WSGI Application Server:** Gunicorn 21+ managed by `systemd`.
- **SSL / TLS Certificate:** Free automated certificates from Let's Encrypt via Certbot.

---

## 2. Security Group Configuration

In the AWS EC2 Management Console, configure the Security Group rules:

### Inbound Rules
| Type | Port Range | Protocol | Source | Purpose |
| :--- | :---: | :---: | :---: | :--- |
| **SSH** | 22 | TCP | Operator's Specific IP (e.g. `203.0.113.50/32`) | Secure server administration |
| **HTTP** | 80 | TCP | `0.0.0.0/0` | Let's Encrypt ACME challenge & HTTP to HTTPS redirect |
| **HTTPS** | 443 | TCP | `0.0.0.0/0` | Secure public web traffic |
| **MySQL (if RDS)** | 3306 | TCP | EC2 Security Group ID (`sg-xxxx`) | Private VPC database access only |

> [!WARNING]
> Never open port 22 (SSH) or port 3306 (MySQL) to `0.0.0.0/0` (Anywhere). Always restrict SSH to your static IP address and MySQL to the EC2 security group.

---

## 3. Server Provisioning & Package Installation

Connect to your EC2 instance via SSH:
```bash
ssh -i "your-key-pair.pem" ubuntu@<your-ec2-public-ip>
```

Update system packages and install Python, virtual environment tooling, Nginx, and build libraries:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv git nginx certbot python3-certbot-nginx libmysqlclient-dev pkg-config
```

Install Node.js 20+ (for building the React frontend):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 4. Database Setup

### Option A: Amazon RDS for MySQL (Recommended)
1. Create a MySQL 8.0 database in Amazon RDS.
2. Ensure the RDS instance is placed in the same VPC as your EC2 instance.
3. Attach the security group allowing port 3306 ingress from the EC2 instance's security group.
4. Record the RDS Endpoint hostname, username, and password.

### Option B: Local MySQL 8.0 on EC2 (Low-Cost Demo)
```bash
sudo apt install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql

# Secure MySQL installation
sudo mysql -e "CREATE DATABASE healthcare_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'hms_app_user'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'StrongRandomProdPassword2026!';"
sudo mysql -e "GRANT ALL PRIVILEGES ON healthcare_management_db.* TO 'hms_app_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

---

## 5. Deploying the Application

### 5.1 Clone Repository & Setup Backend
```bash
sudo mkdir -p /var/www/healthcare-management-system
sudo chown -y ubuntu:ubuntu /var/www/healthcare-management-system
cd /var/www/healthcare-management-system

# Clone your project repository
git clone <your-git-repository-url> .

# Setup Python virtual environment
cd /var/www/healthcare-management-system/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn
```

### 5.2 Configure Production Environment Variables
Create `/var/www/healthcare-management-system/backend/.env`:
```bash
nano /var/www/healthcare-management-system/backend/.env
```

Paste the production configuration:
```dotenv
DJANGO_SECRET_KEY=generate-a-strong-random-50-char-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,<ec2-public-ip>
DJANGO_TIME_ZONE=Asia/Kolkata

DB_ENGINE=mysql
DB_NAME=healthcare_management_db
DB_USER=hms_app_user
DB_PASSWORD=StrongRandomProdPassword2026!
DB_HOST=127.0.0.1  # Or your RDS endpoint
DB_PORT=3306

CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
JWT_ACCESS_TOKEN_MINUTES=30
JWT_REFRESH_TOKEN_DAYS=7
```

Generate a secure secret key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

### 5.3 Run Migrations & Collect Static Files
```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
# Optional: Seed initial departments and demo data
python manage.py seed_data
```

---

## 6. Systemd Service for Gunicorn

Create the systemd service file:
```bash
sudo nano /etc/systemd/system/hms-backend.service
```

Paste the configuration:
```ini
[Unit]
Description=CarePulse HMS Gunicorn Application Server
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/healthcare-management-system/backend
ExecStart=/var/www/healthcare-management-system/backend/venv/bin/gunicorn \
    --workers 3 \
    --bind 127.0.0.1:8000 \
    --access-logfile /var/log/hms-access.log \
    --error-logfile /var/log/hms-error.log \
    config.wsgi:application
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable hms-backend
sudo systemctl start hms-backend
sudo systemctl status hms-backend
```

---

## 7. Frontend Production Build

```bash
cd /var/www/healthcare-management-system/frontend

# Create production .env
cat <<EOF > .env
VITE_API_BASE_URL=/api
EOF

npm install
npm run build
```

This compiles optimized HTML, JavaScript, and CSS bundles into `/var/www/healthcare-management-system/frontend/dist`.

---

## 8. Nginx Web Server & Reverse Proxy Configuration

Create the Nginx site configuration:
```bash
sudo nano /etc/nginx/sites-available/hms
```

Paste the configuration (replace `yourdomain.com` with your domain or public IP):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 20M;

    # Serve React Frontend
    root /var/www/healthcare-management-system/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy Django REST Framework API Requests
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django Admin Console
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django Static Files (Admin & DRF UI)
    location /static/ {
        alias /var/www/healthcare-management-system/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

Enable the site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/hms /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 9. SSL / TLS Setup with Let's Encrypt

Obtain a free SSL certificate and configure automatic HTTPS redirect:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will automatically install SSL certificates and configure renewal cron jobs. Verify renewal with:
```bash
sudo certbot renew --dry-run
```

---

## 10. Monitoring, Maintenance & Backup

### Logs Inspection
- **Django / Gunicorn Error Logs:** `sudo tail -f /var/log/hms-error.log`
- **Nginx Access Logs:** `sudo tail -f /var/log/nginx/access.log`
- **Systemd Service Logs:** `sudo journalctl -u hms-backend -f`

### Automated MySQL Database Backups
Create a backup script in `/home/ubuntu/backup_db.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/db_backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mysqldump -u hms_app_user -p'StrongRandomProdPassword2026!' healthcare_management_db | gzip > "$BACKUP_DIR/hms_backup_$TIMESTAMP.sql.gz"
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +14 -delete
```
Make executable and schedule a nightly cron job:
```bash
chmod +x /home/ubuntu/backup_db.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup_db.sh") | crontab -
```
