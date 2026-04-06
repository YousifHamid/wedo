import React, { useState, useEffect } from 'react';
import { Users, Search, Ban, Trash2, ShieldCheck, RefreshCw, Plus, Edit2, X, CheckSquare, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

export default function StaffPage() {
  const { t, i18n } = useTranslation();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'admin',
    permissions: [] as string[]
  });

  const isRTL = i18n.language === 'ar';

  const PERMISSIONS = [
    { id: 'access_drivers', label: t('access_drivers') },
    { id: 'access_riders', label: t('access_riders') },
    { id: 'access_wallet', label: t('access_wallet') },
    { id: 'access_zones', label: t('access_zones') },
    { id: 'access_trips', label: t('access_trips') },
    { id: 'access_complaints', label: t('access_complaints') },
    { id: 'access_staff', label: t('access_staff') },
  ];

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleTogglePermission = (id: string) => {
    setFormData(prev => {
      const perms = prev.permissions.includes(id) 
        ? prev.permissions.filter(p => p !== id)
        : [...prev.permissions, id];
      return { ...prev, permissions: perms };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await api.put(`/admin/staff/${editingStaff._id}`, formData);
      } else {
        await api.post('/admin/staff', formData);
      }
      setShowModal(false);
      setEditingStaff(null);
      setFormData({ name: '', phone: '', password: '', role: 'admin', permissions: [] });
      fetchStaff();
    } catch (err) {
      alert('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('delete_confirm'))) return;
    try {
      await api.delete(`/admin/staff/${id}`);
      setStaff(staff.filter(s => s._id !== id));
    } catch (err) {
      alert('Delete failed');
    }
  };

  const openEdit = (member: any) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      phone: member.phone,
      password: '',
      role: member.role,
      permissions: member.permissions || []
    });
    setShowModal(true);
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : ''}`}>
      <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('staff_management')}</h1>
          <p className="text-gray-500 text-sm mt-1">{isRTL ? 'إدارة الموظفين والمدراء وتوزيع الصلاحيات.' : 'Manage administrative staff and permissions.'}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchStaff} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => { setEditingStaff(null); setFormData({ name: '', phone: '', password: '', role: 'admin', permissions: [] }); setShowModal(true); }}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus size={18} />
            {t('add_staff')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
            <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-4 font-bold">{t('name')}</th>
                <th className="p-4 font-bold">{t('phone_number')}</th>
                <th className="p-4 font-bold">{t('role')}</th>
                <th className="p-4 font-bold">{t('permissions')}</th>
                <th className={`p-4 font-bold ${isRTL ? 'text-left' : 'text-right'}`}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-400">Loading...</td></tr>
              ) : staff.map((member) => (
                <tr key={member._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-bold text-gray-900">{member.name}</td>
                  <td className="p-4 text-sm font-medium text-gray-600">{member.phone}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-lg ${member.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {t(member.role)}
                    </span>
                  </td>
                  <td className="p-4">
                     <div className="flex flex-wrap gap-1">
                        {member.role === 'super_admin' ? (
                          <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-bold italic">Full Access</span>
                        ) : (
                          member.permissions?.map((p: string) => (
                            <span key={p} className="text-[9px] bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">
                              {t(p)}
                            </span>
                          ))
                        )}
                     </div>
                  </td>
                  <td className="p-4">
                    <div className={`flex gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                      <button onClick={() => openEdit(member)} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(member._id)} className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
           <div className={`bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl ${isRTL ? 'text-right' : ''}`}>
              <div className={`p-6 border-b border-gray-100 flex justify-between items-center ${isRTL ? 'flex-row-reverse bg-emerald-50/20' : 'bg-emerald-50/20'}`}>
                 <h2 className="text-xl font-bold text-gray-800">{editingStaff ? t('edit_staff') : t('add_staff')}</h2>
                 <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter block mb-1">{t('name')}</label>
                    <input 
                      type="text" required 
                      className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none ${isRTL ? 'text-right' : ''}`}
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter block mb-1">{t('phone_number')}</label>
                        <input 
                          type="tel" required 
                          className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none ${isRTL ? 'text-right' : ''}`}
                          value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter block mb-1">{t('password')}</label>
                        <input 
                          type="password" required={!editingStaff} 
                          placeholder={editingStaff ? '••••••' : ''}
                          className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none ${isRTL ? 'text-right' : ''}`}
                          value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter block mb-1">{t('role')}</label>
                    <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                       {['admin', 'super_admin'].map(r => (
                         <button 
                            key={r} type="button"
                            onClick={() => setFormData({...formData, role: r})}
                            className={`flex-1 p-2 rounded-xl border text-xs font-bold transition-all ${formData.role === r ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                         >
                           {t(r)}
                         </button>
                       ))}
                    </div>
                 </div>

                 {formData.role === 'admin' && (
                   <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter block mb-2">{t('permissions')}</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                         {PERMISSIONS.map(p => (
                            <TouchableOpacity key={p.id} type="button" 
                               onClick={() => handleTogglePermission(p.id)}
                               className={`flex items-center p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                               {formData.permissions.includes(p.id) ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} className="text-gray-300" />}
                               <span className={`text-[13px] font-medium text-gray-700 ${isRTL ? 'mr-3' : 'ml-3'}`}>{p.label}</span>
                            </TouchableOpacity>
                         ))}
                      </div>
                   </div>
                 )}

                 <div className="pt-4 flex gap-3">
                    <button type="submit" className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
                       {t('save')}
                    </button>
                    <button type="button" onClick={() => setShowModal(false)} className="px-6 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all">
                       {t('cancel')}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

// Minimal helper to treat div as button in some cases for UX consistency
const TouchableOpacity = ({ children, onClick, className, ...props }: any) => (
  <div onClick={onClick} className={`cursor-pointer active:scale-95 transition-transform ${className}`} {...props}>
     {children}
  </div>
);
