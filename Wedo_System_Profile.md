# Wedo System Overview / نظرة عامة على نظام ودّو
*This document contains the core technical, feature, and workflow details of the "Wedo" ride-hailing platform. It is designed to be fed into business or AI agents to generate comprehensive investment, marketing, and technical profiles.*

---

## 🇬🇧 English Version

### 1. Project Overview
**Wedo** is a modern, reliable, and hyper-localized ride-hailing and transportation platform tailored specifically for the Sudanese market (and easily scalable to MENA). It connects Riders with Drivers (Captains) in real-time while strictly addressing the infrastructure, connectivity, and usability pain points of the region.

### 2. Technology Stack (Technical Profile)
The platform is built on a scalable, real-time MERN stack structure with WebSockets.
*   **Mobile App (Cross-Platform):** React Native with Expo (Typescript). Single codebase for both Android (APK) and iOS. Uses Zustand for state management.
*   **Admin Dashboard:** React.js (built via Vite) with TailwindCSS and Recharts for analytics. 
*   **Backend Server:** Node.js with Express (Typescript), running via PM2. 
*   **Database:** MongoDB for structured data (Users, Trips, Zones, Wallets).
*   **Real-time Communication:** Socket.io (for instant trip matching, live tracking, and chat).
*   **Caching & Queueing:** Redis (optimizes matching algorithms and reduces database loads).
*   **Deployment Architecture:** Nginx Reverse Proxy with Let's Encrypt SSL, easily deployable to Contabo, AWS, or DigitalOcean VPS.

### 3. Core Features (Marketing & Product Profile)
*   **Unified Application:** A single app for both Riders and Drivers, routing seamlessly based on their authenticated role.
*   **Interactive Dynamic Mapping:** Smooth, rich-UI mapping experience using robust map APIs. Supports gesture panning, PIN precision drops, and auto-reverse geocoding to translate GPS into human-readable local addresses.
*   **Cash & Wallet System:** Supports precise, integrated digital wallets for Drivers with automatic commission deductions alongside physical cash flows. Includes "deposit change to wallet" functionality if cash exceeds the ride fare.
*   **Heatmaps for Drivers:** A predictive Demand Map highlighting high-request geographical clusters in real-time so Captains can reposition for maximum earnings.
*   **Safety & SOS Hub:** Comprehensive safety modals with discrete reporting (e.g., "Reckless Driving", "Vehicle mismatch") and a 1-tap Police Emergency call button.
*   **Multilingual:** Out-of-the-box Arabic and English localization, fully supporting RTL (Right-to-Left) UI patterns natively.
*   **Advanced Web Admin Panel:** Comprehensive metrics, live complaint monitoring, driver onboarding approvals, and financial overviews.

### 4. System Workflow
1.  **Request Generation (Upfront Dynamic Pricing):** Rider drops an exact Pickup and Drop-off pin on the map. The server calculates an expected KM distance + expected traffic duration to generate a fixed upfront fare.
    *(Weak Internet Handling):* Once the ride starts, active connection isn't mandatory for the meter. At the end of the trip, the server computes actual elapsed time vs expected time, automatically appending any deviations (excessive traffic wait or route changes) to the final fare to protect driver rights.
2.  **Dispatch & Matching:** Node.js + Redis intelligently broadcasts the trip to online drivers within a specific radius.
3.  **Driver Acceptance:** Drivers see an incoming "Card" with Pickup, Drop-off, and Fare. A countdown timer creates urgency. If accepted, Socket.io links the Driver and Rider rooms.
4.  **Live Tracking:** Rider sees real-time map vehicle tracking with intuitive Timeline UI marking ("En Route", "Arrived", "In Progress"). Can share a live Web-tracking link via social media.
5.  **Completion & Feedback:** Driver finalizes the trip, entering cash received (automatically managing wallet change). Both get push notifications prompting for 5-star App Store ratings.

### 5. Future Expansion Roadmap (Phase 2)
The platform architecture is designed to support the following advanced modules post-launch:
*   **Automated Wallet Top-ups:** Direct API integration with local Sudanese banking apps (Bankak, Fawry) to completely automate driver wallet recharging without administrative intervention.
*   **PWA Lite Version:** A highly optimized, sub-10MB Progressive Web App (PWA) to capture the market segment using older hardware or facing extreme storage constraints.
*   **WhatsApp Bot Dispatcher:** Enabling users to request rides simply by texting a designated WhatsApp API number (leveraging free text-bundles offered by local telecom providers like MTN/Zain) without opening the app itself.

### 6. Competitive Pricing Strategy & Calculation Model
To aggressively capture market share from dominant local competitors (e.g., Tirhal, Yango), Wedo operates a dynamic **Penetration Pricing Model** continuously benchmarking at **8% to 12% lower** than the established market rate. The precise ride fare formula is computed as:
*   **Base Fare:** Benchmark - 10%
*   **Per Kilometer Price:** Benchmark - 10%
*   **Per Minute (Waiting/Traffic) Price:** Benchmark - 10%
*   **Minimum Fare:** Highly competitive lower-bound threshold.
*Note: While rider costs are slashed by ~10%, Wedo offsets this by taking a lower administrative commission, meaning the Captain (Driver) still takes home a higher net profit per ride compared to driving for competitors.*
---

## 🇸🇩 النسخة العربية (Arabic Version)

### 1. نظرة عامة على المشروع
**"ودّو - Wedo"** هو منصة حديثة وموثوقة لطلب سيارات الأجرة مخصصة بالكامل للسوق السوداني (وقابلة للتوسع لمنطقة الشرق الأوسط). تعمل المنصة على ربط الركاب بالسائقين (الكباتن) في الوقت الفعلي مع مراعاة التحديات التقنية المحلية مثل الاتصالات واستقرار البنية التحتية، لتقديم تجربة مستخدم سلسلة وبسيطة.

### 2. البنية التقنية (Tech Stack)
تم بناء المنصة بالكامل لتكون مقياسية (Scalable) وتعتمد على الاتصال الفوري:
*   **تطبيق الجوال:** React Native باستخدام بيئة Expo (TypeScript). تطبيق واحد مدمج (Single App) للراكب والسائق، يعمل على Android و iOS.
*   **لوحة تحكم الإدارة:** React.js (عبر Vite) باستخدام TailwindCSS وتتضمن رسوم بيانية تفاعلية (Recharts).
*   **الخادم (Backend):** Node.js و Express متصل بالـ Socket.io للبيانات اللحظية.
*   **قواعد البيانات:** MongoDB لإدارة البيانات الهيكلية، و Redis للكاش وتسريع خوارزميات البحث وتوزيع الطلبات.

### 3. الميزات الأساسية (Core Features)
*   **تطبيق موحد:** تطبيق ذكي واحد؛ بمجرد تسجيل الدخول يتم توجيه المستخدم لواجهة (الراكب) أو (السائق) حسب صلاحياته.
*   **خرائط غنية وتفاعلية:** نظام اختيار الوجهة عبر الدبوس (Pin) مع جلب تلقائي لاسم الشارع والمدينة باستخدام (Reverse Geocoding).
*   **المحفظة الذكية وإدارة النقد:** نظام مالي دقيق لحساب العمولات، ويتضمن ميزة استثنائية (إيداع الباقي في المحفظة) في حال كانت العملة النقدية المدفوعة أكبر من الأجرة.
*   **الخريطة الحرارية (Heatmaps):** توفر للسائقين خريطة توضح أماكن الذروة والطلب العالي ليتمكنوا من مضاعفة أرباحهم.
*   **مركز الأمان والطوارئ (SOS):** زر طوارئ مخصص للراكب للإبلاغ الفوري عن أي تجاوزات، أو الاتصال بالشرطة بضغطة زر.
*   **مشاركة الرحلة:** ميزة تتبع حية برابط مباشر يعمل خارج التطبيق لإرساله للأهل والأصدقاء (تتبع مشابه لـ Uber).
*   **ثنائية اللغة:** دعم كامل ولحظي للغتين العربية والإنجليزية مع ضبط تلقائي للواجهات من اليمين لليسار (RTL).

### 4. سير العمل (Workflow)
1.  **بدء الطلب (التسعير الديناميكي المسبق):** يحدد الراكب نقطة الانطلاق والوجهة بدقة (Pin-to-Pin) على الخريطة. يقوم الخادم بحساب (المسافة بالكيلومتر + الوقت المتوقع للزحام) لحساب وتسعير الأجرة الثابتة مقدماً.
    *(ميزة الإنترنت الضعيف):* بمجرد تثبيت السعر، لا يحتاج السائق والراكب لاتصال إنترنت دائم أثناء الرحلة. وفي حال قام الراكب بتغيير الوجهة أو الانتظار طويلاً، يقوم الخادم عند (إنهاء الرحلة) بمقارنة الزمن والمسافة الفعلية وإضافة فارق (الانتظار أو المسافة الإضافية) أوتوماتيكياً لضمان حق السائق بالكامل!
2.  **توزيع الطلب:** يقوم الخادم ببث الطلب للسائقين المتاحين ضمن النطاق الجغرافي.
3.  **قبول الكابتن:** يظهر الطلب للسائق ببطاقة ذكية تحتوي على التفاصيل مدعومة بعداد ثواني. عند القبول، يتم ربط السائق والراكب بغرفة اتصال حية عبر WebSockets.
4.  **تتبع الرحلة والتنفيذ:** يتابع الراكب سيارة السائق لحظة بلحظة مع جدول زمني للرحلة (في الطريق، وصل، جارية). 
5.  **إنهاء الرحلة الدفع:** بعد الوصول، ينهي السائق الرحلة ويُدخل المبلغ المُستلم، ليقوم النظام أوتوماتيكياً بحساب المحفظة والمتبقي، وإرسال إشعار للطرفين لتقييم التطبيق على متجر بلاي.

### 5. خطة التوسع المستقبلية (Phase 2)
تم تصميم وتجهيز بنية النظام لدعم الإضافات التقنية المتقدمة التالية بعد الإطلاق:
*   **الربط البنكي (Automated Wallet):** التكامل عبر الـ API مع تطبيقات البنوك المحلية (مثل بنكك / فوري) لشحن المحافظ أوتوماتيكياً دون تدخل من فريق الإدارة.
*   **عبر واتساب (WhatsApp Bot):** بناء بوت برمجي لاستقبال طلبات الرحلات نصياً لتجنب استهلاك باقات الإنترنت، نظراً لانخفاض تكلفة أو مجانية باقات وسائل التواصل (Zain, MTN) في السوق السوداني.
*   **نسخة PWA (Lite App):** إطلاق نسخة خفيفة ومصغرة جداً (أقل من 10 ميجابايت) تعمل عبر المتصفح لاستهداف شريحة المستخدمين أصحاب الهواتف الضعيفة أو المساحات الممتلئة.
    
### 6. تفاصيل الرحلات وهيكلة التسعير (Pricing Strategy)
للسيطرة السريعة على السوق السوداني وسحب الحصة السوقية من أهم المنافسين الحاليين (مثل الأقطاب الرئيسية: ترحال، يانغو، وغيرها)، يعتمد "ودّو" استراتيجية **تسعير الاختراق (Penetration Pricing)** بحيث تتم برمجة خوارزمية التسعير لتكون دائماً **أرخص بنسبة (8٪ إلى 12٪)** من متوسط السوق.
ويتم تفصيل الحسبة الرياضية (أوتوماتيكياً في الخادم) كالتالي:
*   **بداية العداد (Base Fare):** أقل بـ 10٪ من المنافس الرئيسي.
*   **سعر الكيلومتر (Per KM):** أقل بـ 10٪ (يُحسب بمرونة المسافة المقطوعة فعلياً).
*   **سعر دقيقة الانتظار / الزحام (Per Minute):** أقل بـ 10٪ (لتعويض السائق في أوقات الاختناق المروري بإنصاف).
*   **الحد الأدنى للمشوار (Minimum Fare):** تسعير تشجيعي جذاب للمشاوير القصيرة والداخلية.

*(السر التجاري للمنصة)*: لكي لا يهرب السائقون بسبب انخفاض تسعيرة الرحلة على الزبون بنسبة 10٪، يقوم تطبيق "ودّو" بالمقابل **باستقطاع نسبة عمولة إدارية أخفض** من عمولة الشركات المنافسة. والنتيجة العملية: الزبون يركب أرخص سعر في السودان، والكابتن (السائق) يربح "صافي دخل" أعلى من باقي التطبيقات في كل رحلة!
