import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Wallet, MapPin, Car, BarChart3, Bell, ShieldAlert, DollarSign, Globe, Settings, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DashboardLayout = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isRTL = i18n.language === 'ar';
  
  // Mocking user role and permissions for display (in a real app, this would come from a context/auth store)
  const [user, setUser] = useState<any>({
    name: 'Super Admin',
    role: 'super_admin',
    permissions: ['all'] 
  });

  useEffect(() => {
    document.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language, isRTL]);

  const hasAccess = (perm: string) => {
    if (user.role === 'super_admin') return true;
    return user.permissions?.includes(perm);
  };

  const navItems = [
    { path: '/', label: t('overview'), icon: LayoutDashboard, access: true },
    { path: '/drivers', label: t('drivers'), icon: Users, perm: 'access_drivers' },
    { path: '/users', label: t('riders'), icon: Users, perm: 'access_riders' },
    { path: '/wallet', label: t('wallet'), icon: Wallet, perm: 'access_wallet' },
    { path: '/trips', label: t('trips'), icon: Car, perm: 'access_trips' },
    { path: '/zones', label: t('zones'), icon: MapPin, perm: 'access_zones' },
    { path: '/complaints', label: t('complaints'), icon: ShieldAlert, perm: 'access_complaints' },
    { path: '/transactions', label: t('financials'), icon: DollarSign, access: true },
    { path: '/direct-topup', label: t('direct_topup'), icon: Wallet, perm: 'access_wallet' },
    { path: '/notifications', label: t('notifications', { defaultValue: isRTL ? 'تنبيهات الدفع' : 'Push Notifications' }), icon: Bell, perm: 'access_notifications' },
    { path: '/staff', label: t('staff_management'), icon: Settings, role: 'super_admin' },
  ];

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className={`flex h-screen w-full bg-gray-50 ${isRTL ? 'font-arabic' : ''}`}>
      <aside className={`w-64 bg-white border-r border-gray-100 flex flex-col ${isRTL ? 'border-l' : 'border-r'}`}>
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">
            Wedo<span className="text-emerald-600">Admin</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">Admin Panel v2.5</p>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            if (item.role && user.role !== item.role) return null;
            if (item.perm && !hasAccess(item.perm)) return null;

            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'} px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} px-2`}>
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-gray-500">{t('system_online')}</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-8 justify-between">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              className={`bg-gray-50 rounded-xl px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${isRTL ? 'text-right' : ''}`}
            />
          </div>
          <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
            <button 
              onClick={toggleLanguage}
              className="flex items-center px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Globe size={16} className={isRTL ? 'ml-2' : 'mr-2'} />
              <span>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
            </button>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{t('online')}</span>
            <div className="flex items-center gap-2">
               <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-gray-800 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-tighter font-bold">{user.role}</p>
               </div>
               <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                 {user.name[0]}
               </div>
            </div>
            <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
               <LogOut size={20} />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
