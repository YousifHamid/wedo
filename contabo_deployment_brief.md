# Deployment Brief for DevOps/Backend Developer (Contabo VPS)

**Project Name:** Wedo (Ride-Hailing Platform)
**App type:** Node.js Backend API + React Frontend (Admin Panel)

---

## 🎯 **Objective**
We need to deploy our full MERN/Node.js stack application into a single **Contabo VPS** running Ubuntu 22.04/24.04. The deployment must be production-ready, secure, and configured to handle WebSocket connections properly.

## 🛠️ **Tech Stack & Architecture**
- **Backend API:** Node.js (Express) + TypeScript.
- **Database:** MongoDB (Local installation on the same VPS).
- **Admin Dashboard:** React.js (Vite), to be built statically (`npm run build`).
- **WebSockets:** Socket.io (Crucial for real-time ride tracking, must be supported by reverse proxy).
- **Web Server:** Nginx (Reverse Proxy for Backend + Serving Admin Static Files).
- **Process Manager:** PM2.

---

## 📋 **Required Tasks**

### 1. Server Setup & Security
- Update and upgrade Ubuntu packages.
- Setup a non-root sudo user for security (optional but recommended).
- Configure UFW (Uncomplicated Firewall) to allow only essential ports: `22` (SSH), `80` (HTTP), `443` (HTTPS), and block MongoDB port `27017` from public access.

### 2. Dependencies Installation
- Install **Node.js** (v18 or v20 LTS).
- Install **MongoDB Community Server** and secure it (authentication setup, binding to `127.0.0.1` only).
- Install **PM2** globally (`npm i -g pm2`).
- Install **Nginx**.

### 3. Backend Deployment (API)
- Clone the repository / Upload the backend files.
- Run `npm install` and compile TypeScript if required (`npm run build`).
- Ensure environment variables (`.env`) are correctly mapped (DB URI, JWT Secrets, Maps APIs, Ports).
- Start the backend via PM2 containing the Node API (e.g., `pm2 start dist/server.js --name "wedo-api"`).
- Setup PM2 startup script to survive server reboots (`pm2 startup` & `pm2 save`).

### 4. Admin Dashboard Deployment
- Navigate to the admin project directory.
- Add the correct `VITE_API_BASE_URL` to `.env` pointing to the live API domain.
- Run `npm install` and `npm run build`.
- Move the `dist` folder to `/var/www/wedo-admin`.

### 5. Nginx & Reverse Proxy Configuration
Provide Nginx server blocks configured for two domains/subdomains:
1. **API Domain** (e.g., `api.wedo.sd`):
   - Reverse proxy pointing to the Node.js local port (e.g., `http://127.0.0.1:5000`).
   - **Crucial:** Must include WebSocket upgrade headers for Socket.io to work smoothly:
     ```nginx
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";
     ```
2. **Admin Domain** (e.g., `admin.wedo.sd`):
   - Serve static files from `/var/www/wedo-admin`.
   - Setup `try_files $uri $uri/ /index.html;` to support React Router.

### 6. SSL / HTTPS Setup
- Install `certbot` and `python3-certbot-nginx`.
- Provision free SSL certificates for both subdomains/domains to ensure forced HTTPS processing.

---

## 📤 **Deliverables**
- A fully accessible Admin Panel via HTTPS URL.
- Responsive API endpoints and active WebSocket connections tested via Postman/Browser.
- Brief documentation or terminal commands showing how to restart PM2 or see logs (e.g., `pm2 logs wedo-api`).
