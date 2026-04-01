import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Wallet, MapPin, Car, BarChart3, Bell } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/approvals', label: 'Approvals', icon: Bell },
  { path: '/drivers', label: 'Drivers', icon: Users },
  { path: '/wallet', label: 'Wallet Top-ups', icon: Wallet },
  { path: '/trips', label: 'Trips', icon: Car },
  { path: '/zones', label: 'Zones & Pricing', icon: MapPin },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const DashboardLayout = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">
            Mashi<span className="text-emerald-600">Admin</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">Admin Panel v2.4</p>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
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
          <div className="flex items-center space-x-2 px-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-gray-500">System Online</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-8 justify-between">
          <div>
            <input 
              type="text" 
              placeholder="Search drivers, trips..." 
              className="bg-gray-50 rounded-xl px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">ONLINE</span>
            <span className="text-sm font-medium text-gray-600">Admin User</span>
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">A</div>
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
