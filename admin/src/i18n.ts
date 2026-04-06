import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      overview: 'Overview',
      approvals: 'Approvals',
      drivers: 'Drivers',
      riders: 'Riders',
      wallet: 'Wallet Top-ups',
      trips: 'Trips',
      zones: 'Zones & Pricing',
      complaints: 'Complaints',
      financials: 'Financials',
      analytics: 'Analytics',
      search_placeholder: 'Search drivers, trips...',
      system_online: 'System Online',
      admin_user: 'Admin User',
      online: 'ONLINE',
      language: 'Language',
      direct_topup: 'Direct Top-up',
      phone_number: 'Phone Number',
      amount: 'Amount (SDG)',
      notes: 'Notes / Reason',
      topup_all: 'Apply to All Drivers',
      submit_topup: 'Perform Top-up',
      search_driver: 'Search by Phone',
      type_credit: 'Credit (Add)',
      type_debit: 'Debit (Subtract)',
      
      // Staff & Users
      staff_management: 'Staff Management',
      add_staff: 'Add New Staff',
      edit_staff: 'Edit Staff Member',
      role: 'Role',
      permissions: 'Permissions',
      actions: 'Actions',
      status: 'Status',
      active: 'Active',
      blocked: 'Blocked',
      suspended: 'Suspended',
      all: 'All Statuses',
      pending: 'Pending Approval',
      delete_confirm: 'Are you sure you want to delete this user?',
      save: 'Save Changes',
      cancel: 'Cancel',
      name: 'Full Name',
      password: 'Password',
      admin: 'Admin',
      super_admin: 'Super Admin',
      access_wallet: 'Access Wallet',
      access_zones: 'Access Zones',
      access_trips: 'Access Trips',
      access_complaints: 'Access Complaints',
      access_staff: 'Access Staff Management',
      access_riders: 'Access Riders',
      access_drivers: 'Access Drivers',
    }
  },
  ar: {
    translation: {
      overview: 'نظرة عامة',
      approvals: 'الموافقات',
      drivers: 'السائقين',
      riders: 'الركاب',
      wallet: 'شحن المحفظة',
      trips: 'الرحلات',
      zones: 'المناطق والتسعير',
      complaints: 'الشكاوى والبلاغات',
      financials: 'العمليات المالية',
      analytics: 'التحليلات',
      search_placeholder: 'ابحث عن سائقين، رحلات...',
      system_online: 'النظام متصل',
      admin_user: 'مدير النظام',
      online: 'متصل الآن',
      language: 'اللغة',
      direct_topup: 'شحن رصيد مباشر',
      phone_number: 'رقم الموبايل',
      amount: 'المبلغ (جنيه)',
      notes: 'ملاحظات / السبب',
      topup_all: 'شحن لجميع السائقين',
      submit_topup: 'تنفيذ العملية',
      search_driver: 'بحث برقم الهاتف',
      type_credit: 'إيداع (إضافة)',
      type_debit: 'خصم (سحب)',

      // Staff & Users
      staff_management: 'إدارة الموظفين',
      add_staff: 'إضافة موظف جديد',
      edit_staff: 'تعديل بيانات موظف',
      role: 'الصلاحية',
      permissions: 'الأذونات',
      actions: 'الإجراءات',
      status: 'الحالة',
      active: 'نشط',
      blocked: 'محظور',
      suspended: 'موقوف',
      all: 'الكل',
      pending: 'انتظار الموافقة',
      delete_confirm: 'هل أنت متأكد من حذف هذا المستخدم نهائياً؟',
      save: 'حفظ التعديلات',
      cancel: 'إلغاء',
      name: 'الاسم بالكامل',
      password: 'كلمة المرور',
      admin: 'مدير (Admin)',
      super_admin: 'مدير عام (Super Admin)',
      access_wallet: 'الوصول للمحفظة',
      access_zones: 'الوصول للمناطق',
      access_trips: 'الوصول للرحلات',
      access_complaints: 'الوصول للشكاوى',
      access_staff: 'إدارة الموظفين والصلاحيات',
      access_riders: 'الوصول للركاب',
      access_drivers: 'الوصول للسائقين',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export default i18n;
