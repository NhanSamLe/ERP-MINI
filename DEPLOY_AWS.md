# 🚀 Hướng dẫn Deploy ERP-MINI lên AWS

> Dành cho đồ án TLCN. Kiến trúc: **1 EC2 (Ubuntu)** chạy Nginx + Frontend + Backend (PM2),
> **1 RDS MySQL** làm database. Cloudinary / OpenAI / Qdrant giữ nguyên là dịch vụ ngoài.
>
> Bạn đang có **$100 AWS credit** → đủ chạy thoải mái. Nhớ bật **Billing Alert** để không cháy tiền.

---

## MỤC LỤC
0. [Chuẩn bị & chống cháy thẻ](#giai-doan-0)
1. [Tạo RDS MySQL](#giai-doan-1)
2. [Tạo EC2 Ubuntu](#giai-doan-2)
3. [Cài môi trường trên EC2](#giai-doan-3)
4. [Deploy Backend](#giai-doan-4)
5. [Deploy Frontend](#giai-doan-5)
6. [Cấu hình Nginx](#giai-doan-6)
7. [Gắn domain + HTTPS](#giai-doan-7)
8. [Checklist & xử lý sự cố](#checklist)

---

<a name="giai-doan-0"></a>
## GIAI ĐOẠN 0 — Chuẩn bị & CHỐNG CHÁY THẺ ⚠️

1. **Region**: góc trên phải AWS Console → chọn **Asia Pacific (Singapore) `ap-southeast-1`** (gần VN nhất). Làm TẤT CẢ trong region này.

2. **Bật Billing Alert (BẮT BUỘC):**
   - Search `Billing` → **Billing preferences** → tick **Receive Free Tier Usage Alerts** + nhập email.
   - Search `CloudWatch` → **Alarms → Create alarm** → **Select metric → Billing → Total Estimated Charge (USD)** → threshold **> $1** → tạo SNS topic gửi email → xác nhận email.
   - Từ giờ có phí phát sinh là bạn nhận mail ngay.

3. **Tạo Key Pair** (để SSH vào EC2):
   - Search `EC2` → **Key Pairs → Create key pair** → tên `erp-key`, type **RSA**, format **.pem** → tải file `erp-key.pem` về, **giữ kỹ** (mất là không SSH được).

---

<a name="giai-doan-1"></a>
## GIAI ĐOẠN 1 — Tạo RDS MySQL

1. Search `RDS` → **Create database**.
2. Chọn:
   - **Standard create**
   - Engine: **MySQL** (bản 8.0.x)
   - Template: **Free tier** (nếu còn) hoặc **Dev/Test**
3. Settings:
   - DB instance identifier: `erp-mini-db`
   - Master username: `admin`
   - Master password: đặt mật khẩu **mạnh** → ghi lại (đây là `DB_PASS`)
4. Instance: **db.t3.micro** (hoặc db.t4g.micro)
5. Storage: 20 GB, **tắt** autoscaling cho khỏi phát sinh phí.
6. Connectivity:
   - **Public access: Yes** (để dễ kết nối lúc setup — sau có thể siết lại)
   - VPC security group: **Create new** → tên `erp-db-sg`
7. Additional config → **Initial database name**: `erp_mini_database`
8. **Create database** → chờ ~5-10 phút tới khi status = **Available**.
9. Bấm vào DB → copy **Endpoint** (dạng `erp-mini-db.xxxx.ap-southeast-1.rds.amazonaws.com`) → đây là `DB_HOST`.

> ⚠️ **Security Group RDS**: vào EC2 → Security Groups → `erp-db-sg` → Inbound rules → Add rule:
> - Type **MySQL/Aurora (3306)**, Source: **Security group của EC2** (thêm sau khi tạo EC2), hoặc tạm thời `My IP` để test từ máy bạn.

---

<a name="giai-doan-2"></a>
## GIAI ĐOẠN 2 — Tạo EC2 (Amazon Linux 2023)

> 📌 Hướng dẫn này dùng **Amazon Linux 2023** (user SSH = `ec2-user`, cài phần mềm bằng `dnf`).
> Nếu bạn tạo máy Ubuntu thì user là `ubuntu` và dùng `apt` — xem lại phiên bản Ubuntu của file.

1. Search `EC2` → **Launch instance**.
2. Name: `erp-mini-server`
3. AMI: **Amazon Linux 2023** (Free tier eligible)
4. Instance type: **t3.micro** (hoặc t2.micro). *Lưu ý: 1GB RAM hơi ít cho build → xem mẹo swap ở GĐ3.*
5. Key pair: chọn **erp-key** (đã tạo ở GĐ0)
6. Network settings → **Edit** → Security group → **Create** tên `erp-web-sg`, mở các port:
   - **SSH (22)** — Source: My IP
   - **HTTP (80)** — Source: Anywhere (0.0.0.0/0)
   - **HTTPS (443)** — Source: Anywhere
7. Storage: 20-30 GB gp3.
8. **Launch instance**.
9. Vào instance → copy **Public IPv4 address** (vd `13.212.xx.xx`).

> ⚠️ Quay lại Security Group `erp-db-sg` của RDS → thêm inbound MySQL(3306) Source = `erp-web-sg` để EC2 kết nối được DB.

### SSH vào EC2
Trên máy Windows (PowerShell), tại thư mục chứa `erp-key.pem` (thường là `~\Downloads`):
```powershell
cd "$env:USERPROFILE\Downloads"
icacls erp-key.pem /inheritance:r /grant:r "$($env:USERNAME):(R)"
ssh -i erp-key.pem ec2-user@<PUBLIC_IP>
```
> ⚠️ Amazon Linux dùng user **`ec2-user`** (KHÔNG phải `ubuntu`).
> Nếu báo `Permission denied (publickey)` → thường là sai user; thử `ec2-user`, `ubuntu`, `admin`.
> Nếu `Connection timed out` → Security Group chưa mở port 22.

---

<a name="giai-doan-3"></a>
## GIAI ĐOẠN 3 — Cài môi trường trên EC2 (Amazon Linux 2023)

Sau khi SSH vào (`ec2-user@...`), chạy lần lượt các lệnh sau:

```bash
# Cập nhật hệ thống
sudo dnf update -y

# (Quan trọng với t3.micro 1GB RAM) Tạo swap 2GB để build không bị kill
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h    # kiểm tra thấy Swap 2.0Gi là OK

# Cài Node.js 20 LTS (Amazon Linux dùng dnf)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
node -v && npm -v

# Cài Git, Nginx, MySQL client, PM2
sudo dnf install -y git nginx mariadb105   # mariadb105 = mysql client trên AL2023
sudo npm install -g pm2

# Bật Nginx chạy nền + tự khởi động
sudo systemctl enable --now nginx

# Kiểm tra kết nối tới RDS (RDS bắt buộc SSL)
# Tải CA bundle của AWS về trước:
curl -o global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

mysql -h <DB_HOST> -P 3306 -u admin -p \
  --ssl-ca=./global-bundle.pem
# nhập password → nếu vào được là DB OK, gõ: exit
# (Backend đã tự bật SSL qua biến DB_SSL=true, không cần chỉ định CA thủ công)
```

---

<a name="giai-doan-4"></a>
## GIAI ĐOẠN 4 — Deploy Backend

```bash
# Clone code (dùng repo GitHub của bạn)
cd ~
git clone <URL_REPO_GITHUB> erp
cd erp/erp-backend

# Tạo file .env production (dựa theo .env.example)
nano .env
```

Dán nội dung `.env` (điền giá trị thật):
```env
PORT=8888
NODE_ENV=production
DB_HOST=<RDS_ENDPOINT>
DB_PORT=3306
DB_USER=admin
DB_PASS=<RDS_PASSWORD>
DB_NAME=erp_mini_database
DB_SSL=true
JWT_SECRET=<chuoi_random_dai>
JWT_REFRESH_SECRET=<chuoi_random_dai_2>
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
SALT_ROUNDS=10
CORS_ORIGINS=https://<DOMAIN_FRONTEND>
FRONTEND_URL=https://<DOMAIN_FRONTEND>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<gmail>
SMTP_PASS=<gmail_app_password>
CLOUDINARY_CLOUD_NAME=<...>
CLOUDINARY_API_KEY=<...>
CLOUDINARY_API_SECRET=<...>
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=<openai_key>
OPENAI_API_KEY=<openai_key>
OPENAI_MODEL=gpt-4o-mini
QDRANT_URL=<qdrant_cloud_url>
QDRANT_API_KEY=<qdrant_key>
USE_MOCK_LLM=false
```
(Ctrl+O, Enter, Ctrl+X để lưu)

```bash
# Cài dependencies & build
npm install
npm run build

# Chạy migration + seed dữ liệu ban đầu
npm run migrate
npm run seed:roles
npm run seed:users
npm run seed:gl        # nếu cần dữ liệu GL

# Chạy backend bằng PM2
pm2 start dist/server.js --name erp-backend
pm2 save
pm2 startup    # copy & chạy dòng lệnh nó in ra để tự khởi động khi reboot
```

Kiểm tra: `curl http://localhost:8888/api` (hoặc endpoint health nếu có).

---

<a name="giai-doan-5"></a>
## GIAI ĐOẠN 5 — Deploy Frontend

```bash
cd ~/erp/erp-frontend

# Tạo .env production
nano .env
```
Nội dung:
```env
VITE_API_URL=https://<DOMAIN_BACKEND>/api
```
> Nếu chưa có domain, tạm dùng: `VITE_API_URL=http://<PUBLIC_IP>/api`

```bash
npm install
npm run build     # tạo folder dist/

# Copy dist ra thư mục Nginx phục vụ
sudo mkdir -p /var/www/erp
sudo cp -r dist/* /var/www/erp/
sudo chown -R nginx:nginx /var/www/erp   # cấp quyền cho Nginx (Amazon Linux)
```

---

<a name="giai-doan-6"></a>
## GIAI ĐOẠN 6 — Cấu hình Nginx

> 📌 Amazon Linux dùng thư mục `/etc/nginx/conf.d/*.conf` (KHÔNG có `sites-available`/`sites-enabled` như Ubuntu).

```bash
sudo nano /etc/nginx/conf.d/erp.conf
```
Dán:
```nginx
server {
    listen 80;
    server_name <DOMAIN_HOAC_IP>;

    # Frontend (React build tĩnh)
    root /var/www/erp;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API → proxy sang Node
    location /api {
        proxy_pass http://localhost:8888;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket (Socket.IO)
    location /socket.io/ {
        proxy_pass http://localhost:8888;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    client_max_body_size 15M;   # cho upload file OCR/ảnh
}
```
```bash
# Cho Nginx quyền đọc thư mục web (Amazon Linux chặn quyền chặt hơn)
sudo chown -R nginx:nginx /var/www/erp
sudo chmod -R 755 /var/www

sudo nginx -t                 # test config, phải thấy "syntax is ok"
sudo systemctl restart nginx
```
Giờ vào `http://<PUBLIC_IP>` là thấy app chạy.

> ⚠️ Nếu bị lỗi 403 Forbidden: do SELinux/quyền. Chạy:
> `sudo chcon -R -t httpd_sys_content_t /var/www/erp` rồi restart nginx.

---

<a name="giai-doan-7"></a>
## GIAI ĐOẠN 7 — Gắn domain + HTTPS (phần "xịn")

1. **Mua domain** (Namecheap / Cloudflare / hoặc `.me` free từ GitHub Student Pack).
2. **Trỏ DNS** về EC2:
   - Record `A`: `@` → `<PUBLIC_IP>`  (cho frontend, vd `myerp.com`)
   - Record `A`: `api` → `<PUBLIC_IP>` (cho backend, `api.myerp.com`) — hoặc dùng chung 1 domain.
   > 💡 Nên gán **Elastic IP** (EC2 → Elastic IPs → Allocate → Associate vào instance) để IP không đổi khi reboot.
3. **Cài SSL miễn phí (Let's Encrypt) — Amazon Linux 2023:**
```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d myerp.com -d www.myerp.com
# làm theo prompt, chọn redirect HTTP→HTTPS

# Bật tự gia hạn SSL
sudo systemctl enable --now certbot-renew.timer
```
Certbot tự sửa Nginx + tự gia hạn. Giờ vào `https://myerp.com` có ổ khóa 🔒.

4. **Cập nhật lại env cho khớp domain:**
   - Backend `.env`: `CORS_ORIGINS=https://myerp.com`, `FRONTEND_URL=https://myerp.com`
   - Frontend `.env`: `VITE_API_URL=https://myerp.com/api` → rồi `npm run build` + copy lại vào `/var/www/erp`.
   - Restart: `pm2 restart erp-backend`

---

<a name="checklist"></a>
## ✅ CHECKLIST CUỐI & XỬ LÝ SỰ CỐ

**Checklist:**
- [ ] Billing Alert $1 đã bật
- [ ] RDS status = Available, EC2 kết nối được (mysql client vào được)
- [ ] Backend chạy PM2 (`pm2 status` = online)
- [ ] Frontend build copy vào `/var/www/erp`
- [ ] Nginx `nginx -t` OK
- [ ] CORS_ORIGINS + FRONTEND_URL + VITE_API_URL đều trỏ đúng domain
- [ ] HTTPS hoạt động

**Lỗi thường gặp:**
| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| FE gọi API bị CORS | `CORS_ORIGINS` sai domain | Sửa `.env` backend, `pm2 restart` |
| Backend không lên | Sai DB_HOST/pass, hoặc RDS SG chặn | `pm2 logs erp-backend` xem lỗi |
| `npm run build` bị Killed | Hết RAM (t3.micro 1GB) | Đã tạo swap ở GĐ3, hoặc build local rồi scp dist lên |
| WebSocket không kết nối | Thiếu block `/socket.io/` Nginx | Thêm như GĐ6 |
| 502 Bad Gateway | Backend chưa chạy port 8888 | `pm2 status`, kiểm tra PORT |

**Cập nhật code sau này:**
```bash
cd ~/erp && git pull
cd erp-backend && npm install && npm run build && pm2 restart erp-backend
cd ../erp-frontend && npm install && npm run build
sudo cp -r dist/* /var/www/erp/ && sudo chown -R nginx:nginx /var/www/erp
```

---
> Lưu ý credit: chạy EC2 t3.micro + RDS t3.micro ~ vài USD/tháng, $100 credit đủ vài tháng.
> Khi xong đồ án nhớ **Stop/Terminate** EC2 + **Delete** RDS để không tốn thêm.
