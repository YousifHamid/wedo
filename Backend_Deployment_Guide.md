# Wedo System Deployment Guide (Backend & Admin Dashboard)

This guide provides step-by-step instructions for deploying the **Wedo Full System** to a Contabo VPS. It covers:
1. The **Backend API** (Node.js, MongoDB, Redis, Socket.io)
2. The **Admin Dashboard** (React.js / Vite)

## 1. Initial Server Setup & Security
Once you receive your Contabo VPS credentials (usually Ubuntu 22.04 or 24.04), connect via SSH:
```bash
ssh root@<YOUR_CONTABO_IP>
```

Update your system packages:
```bash
sudo apt update && sudo apt upgrade -y
```

*(Optional but Recommended)* Set up a basic firewall (UFW) to only allow essential ports:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 2. Install Required Software (Dependencies)

### A. Node.js (v20 LTS recommended)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### B. MongoDB (Database)
You can use a local MongoDB instance or a managed service like MongoDB Atlas. If hosting locally:
```bash
sudo apt install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### C. Redis (For Caching & Queues)
```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### D. PM2 (Process Manager to keep the app running)
```bash
sudo npm install -g pm2
```

### E. Nginx (Reverse Proxy)
```bash
sudo apt install -y nginx
```

---

## 3. Clone Repository from GitHub
Generate an SSH key on your server and add it to your GitHub account, or clone directly via personal access token:

```bash
cd /var/www/
git clone https://github.com/your-username/wedo-backend.git
cd wedo-backend
```

Install the NPM dependencies:
```bash
npm install
```

---

## 4. Environment Configuration
Create the `.env` file in the root of the backend folder:
```bash
nano .env
```
Paste your configuration settings. Example variables required for the project:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/namshi
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=your_super_secret_jwt_key
ENVIRONMENT=production

# Recommended Image Storage configuration for Compression:
# Developers should use Cloudinary or AWS S3 + Multer/Sharp for compressing profile pictures before storing them.
# CLOUDINARY_URL=cloudinary://<your_credentials_here>
```
Press `Ctrl+X`, then `Y`, then `Enter` to save.

---

## 5. Build and Run the Backend

Since the project is using TypeScript, you need to compile it to JavaScript first.
```bash
# Build the project
npm run build

# Start the app using PM2 (assuming the compiled code goes to /dist folder)
pm2 start dist/index.js --name "wedo-backend"

# Ensure PM2 restarts automatically if the server reboots:
pm2 startup
pm2 save
```

To view real-time logs and verify the database/socket connected:
```bash
pm2 logs wedo-backend
```

---

## 6. Configure Nginx & SSL (Making it Live)

Nginx will route requests from port 80/443 to your Node.js app on port 5000 and handle the WebSockets properly.

Create a new Nginx configuration block:
```bash
sudo nano /etc/nginx/sites-available/wedo-api
```

Paste the following config (replace `api.yourdomain.com` with your actual domain/subdomain):
```nginx
server {
    listen 80;
    server_name api.yourdomain.com; # Add your domain or IP here

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Important for WebSocket Connection (Socket.io)
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the configuration:
```bash
sudo ln -s /etc/nginx/sites-available/wedo-api /etc/nginx/sites-enabled/
sudo nginx -t     # Test to make sure there are no syntax errors
sudo systemctl restart nginx
```

### Install Let's Encrypt SSL (HTTPS)
APIs must have HTTPS installed for Location services and Secure comms:
```bash
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

sudo certbot --nginx -d api.yourdomain.com
```

---

## 7. Deploying the Admin Dashboard (Frontend)

The Admin panel is a React JS application built with Vite.

### A. Build the Admin App
Go to the `admin` folder inside the repository:
```bash
cd /var/www/wedo-backend/admin
npm install
npm run build
```
This will generate a `dist` folder.

### B. Configure Nginx for Admin Panel
Create another Nginx block for the Admin URL (e.g., `admin.yourdomain.com`):
```bash
sudo nano /etc/nginx/sites-available/wedo-admin
```
Paste this configuration to serve the static Vite files:
```nginx
server {
    listen 80;
    server_name admin.yourdomain.com; # Add your admin domain

    root /var/www/wedo-backend/admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/wedo-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d admin.yourdomain.com
```
Now, your Admin Panel will be live and securely talking to the API!

---

## 8. Development Notes: Profile Images & Compression
Currently, image compression logic is not built into the Node.js backend files. To ensure fast profile loading and save server storage:
1. **Developer Task:** The developer must install `multer` and `sharp` in the Node.js backend.
2. When a user uploads a profile picture, the route should utilize `sharp` to compress the image to `WEBP` or `JPEG` and limit resolution (e.g., 500x500 pixels).
3. Best practice for live production is to pipe this compressed image directly to a bucket (like AWS S3 or Cloudinary) rather than saving it strictly inside the Contabo instance.

