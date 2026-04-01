# 🚀 Wedo - دليل نشر التطبيق للإنتاج (Deploy to Server - LIVE)

هذا الدليل مخصص للسيرفر الجديد بمواصفات (**4 vCPU**, **8 GB RAM**, **75 GB NVMe**).

---

## 1. إعداد السيرفر لأول مرة (Initial Server Setup)
قم بالدخول للسيرفر عبر SSH ثم نفذ الأوامر التالية بالترتيب:

### أ- تحديث النظام (System Updates)
```bash
sudo apt update && sudo apt upgrade -y
```

### ب- تثبيت Node.js (Version 20.x)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### ج- تثبيت MongoDB (Database)
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### د- تثبيت PM2 & Nginx (Management & Logic)
```bash
sudo npm install -g pm2
sudo apt-get install -y nginx
```

---

## 2. نقل الكود وإعداده (Code Deployment)
قم برفع مجلد `backend` للسيرفر، ثم ادخل للمجلد وقم بتنفيذ التالي:

### أ- تثبيت المكتبات (Install Dependencies)
```bash
npm install
```

### ب- إعداد ملف البيئة (.env)
قم بإنشاء ملف `.env` داخل مجلد `backend` وضع فيه:
```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/wedo
JWT_SECRET=اكتب_هنا_سر_عشوائي_وقوي_جدا
NODE_ENV=production
```

### ج- تشغيل التطبيق بـ PM2
```bash
pm2 start dist/index.js --name "wedo-backend"
# لضمان بقاء التطبيق يعمل بعد إعادة تشغيل السيرفر
pm2 save
pm2 startup
```

---

## 3. إعداد النطاق (Domain) والـ SSL (HTTPS)
بما أنك أندرويد/آيفون، الـ **HTTPS إلزامي**.

### أ- إعداد Nginx كـ Reverse Proxy
قم بتعديل ملف إعدادات Nginx:
```bash
sudo nano /etc/nginx/sites-available/default
```
استبدل المحتوى بالتالي (مع استبدال `api.wedo.sd` بنطاقك أو الـ IP الخاص بك):
```nginx
server {
    listen 80;
    server_name api.wedo.sd; # أو الـ IP الخاص بك

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
بعد الحفظ، اختبر الإعدادات وأعد التشغيل:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### ب- تثبيت شهادة SSL مجانية (Certbot)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.wedo.sd
```

---

## 4. الخطوة النهائية في تطبيق الموبايل
بعد تشغيل السيرفر وحصولك على الرابط (مثلاً: `https://api.wedo.sd`)، اذهب لملف:
`mobile/src/config/env.ts`

وقم بتحديث الرابط كما يلي:
```typescript
export const API_BASE_URL = 'https://api.wedo.sd/api';
```

---

## 💡 نصائح للسيرفر الجديد (4 vCPU / 8 GB RAM):
1.  **الأداء:** بما أن السيرفر قوي جداً، يمكنك تعديل عدد النسخ المشغلة (Clustering) عبر PM2 لزيادة السرعة:
    `pm2 start dist/index.js -i max` (سيفتح نسخة لكل نواة vCPU).
2.  **الأمان:** تأكد من إغلاق المنافذ غير المستخدمة في الـ Firewall (UFW) والسماح بـ **80, 443, 22** فقط.
3.  **Logs:** يمكنك مشاهدة أداء السيرفر والأخطاء لحظياً عبر: `pm2 logs wedo-backend`.
