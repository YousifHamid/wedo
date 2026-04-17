import React, { useState, useEffect } from 'react';
import { Users, Search, Ban, Trash2, ShieldCheck, RefreshCw, Car, Star, Navigation, Edit, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

export default function DriversPage() {
  const { t, i18n } = useTranslation();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, active, blocked
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', reliabilityScore: 0 });
  const isRTL = i18n.language === 'ar';

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/drivers${filter !== 'all' ? `?status=${filter}` : ''}`);
      setDrivers(response.data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [filter]);

  const handleAction = async (id: string, action: 'approve' | 'block' | 'unblock') => {
    try {
       const endpoint = action === 'approve' ? 'approve' : 'block';
       await api.put(`/admin/drivers/${id}/${endpoint}`);
       fetchDrivers();
    } catch (error) {
       alert('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('delete_confirm'))) return;
    try {
      await api.delete(`/admin/drivers/${id}`);
      fetchDrivers();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleEditClick = (driver: any) => {
    setEditingDriver(driver);
    setEditForm({ name: driver.name, phone: driver.phone, reliabilityScore: driver.reliabilityScore });
  };

  const handleUpdateDriver = async () => {
    try {
      // Endpoint depends on your backend logic; assuming generic users API edit
      await api.put(`/admin/users/${editingDriver._id}`, editForm);
      setEditingDriver(null);
      fetchDrivers();
    } catch (err) {
      alert('Update failed');
    }
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : ''}`}>
      <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('drivers')}</h1>
          <p className="text-gray-500 text-sm mt-1">{isRTL ? 'إدارة الكباتن، مراجعة الوثائق، والتحكم في حالة الحسابات.' : 'Manage captains, review docs, and account status.'}</p>
        </div>
        <div className="flex gap-2">
            <button onClick={fetchDrivers} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {['all', 'active', 'pending', 'blocked'].map((status) => (
           <TouchableOpacity 
             key={status} 
             onClick={() => setFilter(status)}
             className={`p-4 rounded-2xl border-2 transition-all ${filter === status ? 'bg-emerald-50 border-emerald-500 shadow-emerald-100 shadow-md' : 'bg-white border-transparent hover:bg-gray-50'}`}
           >
              <p className="text-[10px] font-bold text-gray-400 uppercase">{t(status) || status}</p>
              <div className="flex items-center justify-between mt-1">
                 <span className="text-2xl font-black text-gray-800">{status === 'all' ? drivers.length : drivers.filter(d => d.driverStatus === status).length}</span>
                 {status === 'active' && <ShieldCheck size={18} className="text-emerald-500" />}
                 {status === 'pending' && <RefreshCw size={18} className="text-amber-500" />}
              </div>
           </TouchableOpacity>
        ))}
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
                <th className="p-4 font-bold">{isRTL ? 'السائق' : 'Captain'}</th>
                <th className="p-4 font-bold">{isRTL ? 'السيارة' : 'Vehicle'}</th>
                <th className="p-4 font-bold">{isRTL ? 'المحفظة' : 'Wallet'}</th>
                <th className="p-4 font-bold">{isRTL ? 'التقييم' : 'Rating'}</th>
                <th className="p-4 font-bold">{t('status')}</th>
                <th className={`p-4 font-bold ${isRTL ? 'text-left' : 'text-right'}`}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center text-gray-400 font-bold italic">Loading Drivers...</td></tr>
              ) : drivers.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-gray-400">{isRTL ? 'لا يوجد سائقين في هذا القسم' : 'No drivers in this section'}</td></tr>
              ) : drivers.map((driver) => (
                <tr key={driver._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold ${isRTL ? 'ml-3' : 'mr-3'}`}>
                        {driver.isOnline && <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />}
                        {driver.name[0]}
                      </div>
                      <div className={isRTL ? 'text-right' : ''}>
                        <div className="font-bold text-gray-900">{driver.name}</div>
                        <div className="text-[10px] text-gray-500 font-bold">{driver.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <Car size={14} className="text-gray-400" />
                       <span className="text-xs font-bold text-gray-700">{driver.vehicleDetails?.make} {driver.vehicleDetails?.model}</span>
                    </div>
                    <div className="text-[9px] text-gray-400 mt-0.5">{driver.vehicleDetails?.plateNumber}</div>
                  </td>
                  <td className="p-4 text-sm font-black text-emerald-700">{driver.walletBalance.toLocaleString()} {isRTL ? 'جنيه' : 'SDG'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                       <Star size={12} className="text-amber-400 fill-amber-400" />
                       <span className="text-xs font-black">{driver.reliabilityScore / 20 || '5.0'}</span>
                    </div>
                    <div className="text-[9px] text-gray-400 font-bold">{driver.totalTrips || 0} {t('trips')}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg ${
                       driver.driverStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                       driver.driverStatus === 'pending' ? 'bg-amber-100 text-amber-600' :
                       'bg-red-100 text-red-600'
                    }`}>
                      {isRTL ? (
                         driver.driverStatus === 'active' ? 'نشط' : 
                         driver.driverStatus === 'pending' ? 'بانتظار الموافقة' : 'محظور'
                      ) : driver.driverStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className={`flex gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                      {driver.driverStatus === 'pending' && (
                         <button onClick={() => handleAction(driver._id, 'approve')} className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors font-bold text-[10px]">
                            {isRTL ? 'تفعيل' : 'Approve'}
                         </button>
                      )}
                      <button onClick={() => handleEditClick(driver)} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg transition-colors">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleAction(driver._id, driver.driverStatus === 'blocked' ? 'unblock' : 'block')} className={`p-1.5 rounded-lg ${driver.driverStatus === 'blocked' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                        {driver.driverStatus === 'blocked' ? <ShieldCheck size={18} /> : <Ban size={18} />}
                      </button>
                      <button onClick={() => handleDelete(driver._id)} className="p-1.5 text-red-600 bg-red-50 rounded-lg">
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

      {editingDriver && (
        <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ${isRTL ? 'text-right' : 'text-left'}`}>
           <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className={`flex justify-between items-center mb-6 border-b border-gray-100 pb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                 <h2 className="text-xl font-bold text-gray-800">{isRTL ? 'تعديل بيانات السائق' : 'Edit Driver'}</h2>
                 <button onClick={() => setEditingDriver(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{isRTL ? 'الاسم' : 'Name'}</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className={`w-full px-4 py-2 border rounded-xl outline-none focus:border-emerald-500 ${isRTL ? 'text-right' : ''}`} />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</label>
                    <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className={`w-full px-4 py-2 border rounded-xl outline-none focus:border-emerald-500 ${isRTL ? 'text-right' : ''}`} />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{isRTL ? 'نقاط الموثوقية (التقييم الأصلي × 20)' : 'Reliability Score (Rating x 20)'}</label>
                    <input type="number" value={editForm.reliabilityScore} onChange={e => setEditForm({...editForm, reliabilityScore: Number(e.target.value)})} className={`w-full px-4 py-2 border rounded-xl outline-none focus:border-emerald-500 ${isRTL ? 'text-right' : ''}`} />
                 </div>
              </div>
              <div className={`mt-8 flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                 <button onClick={handleUpdateDriver} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition">
                    {isRTL ? 'حفظ التعديلات' : 'Save Changes'}
                 </button>
                 <button onClick={() => setEditingDriver(null)} className="px-6 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition">
                    {isRTL ? 'إلغاء' : 'Cancel'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

const TouchableOpacity = ({ children, onClick, className, ...props }: any) => (
  <div onClick={onClick} className={`cursor-pointer active:scale-95 transition-transform ${className}`} {...props}>
     {children}
  </div>
);
