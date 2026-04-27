import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  ar: {
    translation: {
      // Branding
      app_name: "Wedo",
      tagline: "تنقل موثوق داخل العاصمة",
      
      // General
      welcome: "أهلاً بك",
      welcome_back: "أهلاً بعودتك",
      loading: "جاري التحميل...",
      error: "خطأ",
      success: "تم بنجاح",
      cancel: "إلغاء",
      confirm: "تأكيد",
      save: "حفظ",
      close: "إغلاق",
      retry: "إعادة المحاولة",
      back: "رجوع",
      next: "التالي",
      done: "تم",
      
      // Auth
      passenger: "راكب",
      driver: "كابتن",
      book_rides: "رحلات آمنة وساهلة، وأرخص سعر",
      earn_money: "يلا ياكابتن تبدأ أقوي وتكسب أكتر",
      select_journey: "اختر نوع رحلتك",
      start_safe_trip: "ابدأ رحلة آمنة وسريعة",
      premium_cars: "رحلات فخمة.\nتمتع بالرفاهية",
      premium_desc: "تنقل مريح وأنيق داخل العاصمة، بأفضل الأسعار.",
      passenger_go: "راكب — يلا نمشي",
      driver_earn: "كابتن — ابدأ واكسب",
      login: "تسجيل الدخول",
      sign_up: "إنشاء حساب",
      phone_number: "رقم الهاتف",
      password: "كلمة المرور",
      full_name: "الاسم الكامل",
      enter_phone: "أدخل رقم الهاتف",
      enter_password: "أدخل كلمة المرور",
      login_subtitle: "أدخل بياناتك لتسجيل الدخول",
      signup_subtitle: "سجّل حسابك الجديد",
      already_have_account: "لديك حساب بالفعل؟",
      no_account: "ليس لديك حساب؟",
      terms_notice: "بمتابعتك، أنت توافق على شروط الخدمة",
      location_detect: "تحديد الموقع",
      location_detecting: "جاري التحديد...",
      location_verified: "تم تحديد الموقع",
      location_required: "مطلوب تحديد الموقع",
      
      // Rider Home
      where_to: "إلى أين تريد الذهاب؟",
      where_heading: "إلى أين وجهتك اليوم؟",
      pickup_zone: "منطقة الانطلاق",
      dropoff_zone: "منطقة الوصول",
      select_pickup: "اختر منطقة الانطلاق",
      select_dropoff: "اختر منطقة الوصول...",
      recent_zones: "المناطق الأخيرة",
      view_all: "عرض الكل",
      change: "تغيير",
      
      // Vehicle & Fare
      estimated_fare: "السعر التقديري",
      arrival: "الوقت المتوقع",
      mashi_standard: "Wedo قياسي",
      mashi_premium: "Wedo مميز",
      standard_rate: "سعر قياسي",
      cash_only: "نقداً فقط",
      sdg: "ج.س",
      fixed_zone_fare: "سعر ثابت بين المناطق",
      
      // Booking
      request: "اطلب رحلة",
      request_ride: "اطلب رحلة",
      quick_request: "طلب سريع (بدون وجهة)",
      
      // Searching & Matching
      finding_ride: "جاري البحث عن رحلتك",
      matching_driver: "جاري مطابقتك مع أقرب كابتن",
      estimated_price: "السعر التقديري",
      vehicle_type: "نوع المركبة",
      cancel_request: "إلغاء الطلب",
      driver_assigned: "تم تعيين الكابتن",
      eta: "الوقت المتوقع",
      min: "دقيقة",
      vehicle: "المركبة",
      plate_number: "رقم اللوحة",
      message: "رسالة",
      call: "اتصال",
      
      // Trip Status
      trip_in_progress: "الرحلة جارية",
      en_route: "في الطريق إلى الوجهة",
      arriving_soon: "يصل قريباً",
      driver_arriving: "الكابتن في الطريق",
      
      // Trip Complete
      trip_completed: "اكتملت الرحلة",
      trip_complete: "تمت الرحلة!",
      total_fare: "إجمالي الأجرة",
      pay_cash: "ادفع نقداً للكابتن",
      rate_driver: "قيّم الكابتن",
      rate_trip: "قيّم رحلتك",
      
      // Driver
      online: "متصل",
      offline: "غير متصل",
      go_online: "اتصل بالخدمة",
      go_offline: "قطع الاتصال",
      current_status: "الحالة الحالية",
      ready_for_orders: "جاهز لاستقبال الطلبات",
      system_connectivity: "حالة الاتصال",
      current_location: "الموقع الحالي",
      
      // Driver - Earnings
      earnings: "أرباح اليوم",
      daily_performance: "الأداء اليومي",
      total_trips: "إجمالي الرحلات",
      total_earnings: "إجمالي الأرباح",
      last_trip: "آخر رحلة",
      cash: "نقداً",
      
      // Driver - Trip Request
      new_trip_request: "طلب رحلة جديد",
      accept_trip: "قبول الرحلة",
      reject_trip: "رفض الرحلة",
      trip_fare: "أجرة الرحلة",
      commission_deduction: "خصم العمولة",
      seconds_remaining: "ثانية متبقية",
      
      // Driver - Active Trip
      active_trip: "رحلة نشطة",
      heading_to_pickup: "في الطريق لنقطة الانطلاق",
      arrived_pickup: "وصل لنقطة الانطلاق",
      start_trip: "بدء الرحلة",
      complete_trip: "إنهاء الرحلة",
      navigate: "تنقل",
      collect_cash: "استلم النقد من الراكب",
      
      // Wallet
      driver_wallet: "محفظة الكابتن",
      wallet_balance: "رصيد المحفظة",
      current_balance: "الرصيد الحالي",
      view_details: "عرض التفاصيل",
      balance_sufficient: "الرصيد كافٍ لاستقبال الرحلات.",
      balance_low: "الرصيد منخفض! قد يتأثر ترتيبك.",
      balance_zero: "الرصيد غير كافٍ. لا يمكنك استقبال رحلات.",
      top_up: "شحن المحفظة",
      top_up_wallet: "شحن المحفظة",
      withdraw: "سحب",
      add_funds: "+ إضافة رصيد",
      cash_payment: "الدفع نقداً",
      transaction_history: "سجل المعاملات",
      top_up_amount: "مبلغ الشحن",
      deposit_reference: "رقم إيصال الإيداع",
      submit_request: "إرسال الطلب",
      top_up_pending: "طلب شحن قيد المراجعة",
      top_up_approved: "تم اعتماد الشحن",
      top_up_rejected: "تم رفض طلب الشحن",
      
      // Driver - Blocked State
      driver_blocked: "حسابك موقوف",
      blocked_subtitle: "رصيدك غير كافٍ لاستقبال الرحلات",
      please_top_up: "يرجى شحن محفظتك لاستقبال الرحلات.",
      top_up_instructions: "شحن المحفظة عبر مراكز الإيداع المعتمدة",
      
      // Profile
      profile: "الملف الشخصي",
      account_info: "معلومات الحساب",
      email_address: "البريد الإلكتروني",
      phone_label: "رقم الهاتف",
      vehicle_details: "تفاصيل المركبة",
      payment_wallet: "الدفع والمحفظة",
      rating: "التقييم",
      trips_count: "الرحلات",
      rides_count: "الرحلات",
      spent: "الإنفاق",
      logout: "تسجيل الخروج",
      logout_confirm: "هل أنت متأكد من تسجيل الخروج؟",
      
      // Navigation Tabs
      tab_home: "الرئيسية",
      tab_activity: "النشاط",
      tab_trips: "الرحلات",
      tab_wallet: "المحفظة",
      tab_profile: "الحساب",

      // Zones (Khartoum)
      zone_khartoum_north: "الخرطوم شمال",
      zone_khartoum_center: "وسط الخرطوم",
      zone_khartoum_south: "الخرطوم جنوب",
      zone_omdurman: "أم درمان",
      zone_bahri: "بحري",
      zone_airport: "المطار",
      zone_riyadh: "الرياض",
      zone_arkaweet: "أركويت",
      zone_burri: "بري",
      zone_jabra: "جبرة",
      
      // Network
      no_internet: "لا يوجد اتصال بالإنترنت",
      weak_connection: "الاتصال ضعيف",
      reconnecting: "جاري إعادة الاتصال...",
    }
  },
  en: {
    translation: {
      // Branding
      app_name: "Wedo",
      tagline: "Reliable city transport",
      
      // General
      welcome: "Welcome",
      welcome_back: "Welcome back",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      confirm: "Confirm",
      save: "Save",
      close: "Close",
      retry: "Retry",
      back: "Back",
      next: "Next",
      done: "Done",
      
      // Auth
      passenger: "Passenger",
      driver: "Captain",
      book_rides: "Safe, easy rides, cheapest price",
      earn_money: "Let's go Captain, start strong & earn more",
      select_journey: "Select your journey",
      start_safe_trip: "Start safe and fast trip",
      premium_cars: "Premium rides.\nEnjoy the luxury",
      premium_desc: "Premium and prestige daily mobility. Experience the thrill at a lower price.",
      passenger_go: "Passenger — Let's Go",
      driver_earn: "Captain — Start Earning",
      login: "Login",
      sign_up: "Sign Up",
      phone_number: "Phone Number",
      password: "Password",
      full_name: "Full Name",
      enter_phone: "Enter phone number",
      enter_password: "Enter password",
      login_subtitle: "Enter your details to log in",
      signup_subtitle: "Create your new account",
      already_have_account: "Already have an account?",
      no_account: "Don't have an account?",
      terms_notice: "By continuing, you agree to our Terms of Service",
      location_detect: "Detect Location",
      location_detecting: "Detecting...",
      location_verified: "Location Verified",
      location_required: "Location Required",
      
      // Rider Home
      where_to: "Where are you going?",
      where_heading: "Where are you heading today?",
      pickup_zone: "Pickup Zone",
      dropoff_zone: "Drop-off Zone",
      select_pickup: "Select pickup zone",
      select_dropoff: "Select drop-off zone...",
      recent_zones: "Recent Zones",
      view_all: "View all",
      change: "Change",
      
      // Vehicle & Fare
      estimated_fare: "Estimated Fare",
      arrival: "Arrival",
      mashi_standard: "Wedo Standard",
      mashi_premium: "Wedo Premium",
      standard_rate: "Standard rate applied",
      cash_only: "CASH ONLY",
      sdg: "SDG",
      fixed_zone_fare: "Fixed Zone-to-Zone Fare",
      
      // Booking
      request: "Request Ride",
      request_ride: "Request Ride",
      quick_request: "Quick Request (No Destination)",
      
      // Searching & Matching
      finding_ride: "Finding your ride",
      matching_driver: "Matching with the best nearby captain",
      estimated_price: "Estimated Price",
      vehicle_type: "Vehicle Type",
      cancel_request: "Cancel Request",
      driver_assigned: "Captain Assigned",
      eta: "ETA",
      min: "min",
      vehicle: "Vehicle",
      plate_number: "Plate Number",
      message: "Message",
      call: "Call",
      
      // Trip Status
      trip_in_progress: "Trip in Progress",
      en_route: "En route to destination",
      arriving_soon: "Arriving soon",
      driver_arriving: "Captain is on the way",
      
      // Trip Complete
      trip_completed: "Trip Completed",
      trip_complete: "Trip Complete!",
      total_fare: "Total Fare",
      pay_cash: "Pay cash to captain",
      rate_driver: "Rate Captain",
      rate_trip: "Rate your trip",
      
      // Driver
      online: "ONLINE",
      offline: "OFFLINE",
      go_online: "Go Online",
      go_offline: "Go Offline",
      current_status: "Current Status",
      ready_for_orders: "Ready for orders",
      system_connectivity: "System Connectivity",
      current_location: "Current Location",
      
      // Driver - Earnings
      earnings: "Today's Earnings",
      daily_performance: "Daily Performance",
      total_trips: "Total Trips",
      total_earnings: "Earnings",
      last_trip: "Last trip",
      cash: "Cash",
      
      // Driver - Trip Request
      new_trip_request: "New Trip Request",
      accept_trip: "Accept Trip",
      reject_trip: "Reject Trip",
      trip_fare: "Trip Fare",
      commission_deduction: "Commission Deduction",
      seconds_remaining: "seconds remaining",
      
      // Driver - Active Trip
      active_trip: "Active Trip",
      heading_to_pickup: "Heading to Pickup",
      arrived_pickup: "Arrived at Pickup",
      start_trip: "Start Trip",
      complete_trip: "Complete Trip",
      navigate: "Navigate",
      collect_cash: "Collect cash from rider",
      
      // Wallet
      driver_wallet: "Captain Wallet",
      wallet_balance: "Wallet Balance",
      current_balance: "Current Balance",
      view_details: "View Details",
      balance_sufficient: "Balance is sufficient for trips.",
      balance_low: "Low balance! Your dispatch priority may be affected.",
      balance_zero: "Insufficient balance. You cannot receive trips.",
      top_up: "Top Up",
      top_up_wallet: "Top-up Wallet",
      withdraw: "Withdraw",
      add_funds: "+ Add Funds",
      cash_payment: "Cash Payment",
      transaction_history: "Transaction History",
      top_up_amount: "Top-up Amount",
      deposit_reference: "Cash Deposit Reference",
      submit_request: "Submit Request",
      top_up_pending: "Top-up request pending review",
      top_up_approved: "Top-up approved",
      top_up_rejected: "Top-up rejected",
      
      // Driver - Blocked State
      driver_blocked: "Account Blocked",
      blocked_subtitle: "Insufficient balance to receive trips",
      please_top_up: "Please top up your wallet to receive trips.",
      top_up_instructions: "Top up at designated cash deposit centers",
      
      // Profile
      profile: "Profile",
      account_info: "Account Information",
      email_address: "Email Address",
      phone_label: "Phone Number",
      vehicle_details: "Vehicle Details",
      payment_wallet: "Payment & Wallet",
      rating: "Rating",
      trips_count: "Trips",
      rides_count: "Rides",
      spent: "Spent",
      logout: "Logout",
      logout_confirm: "Are you sure you want to log out?",
      
      // Navigation Tabs
      tab_home: "Home",
      tab_activity: "Activity",
      tab_trips: "Trips",
      tab_wallet: "Wallet",
      tab_profile: "Profile",
      
      // Zones (Khartoum)
      zone_khartoum_north: "Khartoum North",
      zone_khartoum_center: "Khartoum Center",
      zone_khartoum_south: "Khartoum South",
      zone_omdurman: "Omdurman",
      zone_bahri: "Bahri",
      zone_airport: "Airport",
      zone_riyadh: "Riyadh",
      zone_arkaweet: "Arkaweet",
      zone_burri: "Burri",
      zone_jabra: "Jabra",
      
      // Network
      no_internet: "No internet connection",
      weak_connection: "Weak connection",
      reconnecting: "Reconnecting...",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar', // Arabic is the base language
    fallbackLng: 'en',
    compatibilityJSON: 'v3', // Fix for React Native Intl API pluralResolver fallback warning
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
