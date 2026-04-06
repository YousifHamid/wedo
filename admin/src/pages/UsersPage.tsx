import React, { useState, useEffect } from 'react';
import { Users, Search, Ban, Trash2, ShieldCheck, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

export default function UsersPage() {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isRTL = i18n.language === 'ar';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSuspend = async (id: string) => {
    try {
      await api.put(`/admin/users/${id}/suspend`);
      setUsers(users.map(u => u._id === id ? { ...u, isBlocked: !u.isBlocked } : u));
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('delete_confirm'))) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : ''}`}>
      <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('riders')}</h1>
          <p className="text-gray-500 text-sm mt-1">
             {isRTL ? 'عرض وإدارة حسابات المسافرين المسجلين في النظام.' : 'View and manage registered passenger accounts.'}
          </p>
        </div>
        <button onClick={fetchUsers} className={`flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {isRTL ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className={`p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
            <input type="text" placeholder={t('search_placeholder')} className={`pr-4 ${isRTL ? 'pr-10 pl-4' : 'pl-10'} py-2 border border-gray-200 rounded-xl text-sm w-80 focus:ring-2 focus:ring-emerald-500 outline-none`} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-4 font-bold">{t('riders')}</th>
                <th className="p-4 font-bold">{t('phone_number')}</th>
                <th className="p-4 font-bold">{isRTL ? 'المحفظة' : 'Wallet'}</th>
                <th className="p-4 font-bold">{t('status')}</th>
                <th className={`p-4 font-bold ${isRTL ? 'text-left' : 'text-right'}`}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-400">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-400">{isRTL ? 'لا يوجد ركاب حالياً' : 'No riders found'}</td></tr>
              ) : users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold ${isRTL ? 'ml-3' : 'mr-3'}`}>{user.name[0]}</div>
                      <div className={isRTL ? 'text-right' : ''}>
                        <div className="font-bold text-gray-900">{user.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold">{user.email || 'No email set'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-600">{user.phone}</td>
                  <td className="p-4 text-sm font-bold text-gray-800">{user.walletBalance.toLocaleString()} {isRTL ? 'جنيه' : 'SDG'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-lg ${user.isBlocked ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                      {user.isBlocked ? t('suspended') : t('active')}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className={`flex gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                      <button onClick={() => handleSuspend(user._id)} className={`p-1.5 rounded-lg ${user.isBlocked ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`} title={user.isBlocked ? "Unsuspend" : "Suspend"}>
                        {user.isBlocked ? <ShieldCheck size={18} /> : <Ban size={18} />}
                      </button>
                      <button onClick={() => handleDelete(user._id)} className="p-1.5 text-red-600 bg-red-50 rounded-lg" title="Delete Account">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
