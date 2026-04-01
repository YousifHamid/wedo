/**
 * App Environment Configuration
 * 
 * Update API_BASE_URL when deploying the backend:
 * - Local dev: http://<YOUR_IP>:5000/api
 * - Railway:   https://your-app.up.railway.app/api
 * - Render:    https://your-app.onrender.com/api
 */

// ─── API Configuration ──────────────────────────────────────────────
export const API_BASE_URL = 'http://10.249.115.105:5000/api';

// Socket.io URL (same server, no /api path)
export const SOCKET_URL = API_BASE_URL.replace('/api', '');

// ─── App Constants ──────────────────────────────────────────────────
export const APP_NAME = 'Wedo';
export const APP_VERSION = '1.0.0';

// ─── Timeouts (ms) ──────────────────────────────────────────────────
export const API_TIMEOUT = 15000;
export const SOCKET_TIMEOUT = 10000;
export const DISPATCH_COUNTDOWN = 15; // seconds for driver to respond
