import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Wallet as WalletIcon, Search, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function WalletApprovals() {
  const [topUps, setTopUps] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);

  const fetchTopUps = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/wallet/topups');
      setTopUps(response.data);
    } catch (error) {
      console.error('Failed to fetch topups', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopUps();
  }, []);

  const handleApprove = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من الموافقة على تحويل هذا المبلغ للكابتن؟')) return;
    try {
      await api.put(`/admin/wallet/topups/${id}/approve`);
      fetchTopUps();
    } catch (error) {
      alert('حدث خطأ أثناء الموافقة');
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رفض هذه الحوالة؟')) return;
    try {
      await api.put(`/admin/wallet/topups/${id}/reject`);
      fetchTopUps();
    } catch (error) {
      alert('حدث خطأ أثناء الرفض');
    }
  };

  const filtered = filter === 'all' ? topUps : topUps.filter(t => t.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Wallet Top-up Approvals</h1>
          <p className="text-gray-500 mt-1">Verify and approve driver cash deposits (مراجعة واعتماد حوالات السائقين)</p>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={fetchTopUps} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="تحديث">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <span className="bg-emerald-100 text-emerald-800 py-2 px-4 rounded-full text-sm font-bold">
            {topUps.filter(t => t.status === 'pending').length} Pending
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === f ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">Loading requests...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">No requests found.</td></tr>
            ) : filtered.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      {item.driver?.name ? item.driver.name.charAt(0) : 'U'}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-semibold text-gray-800">{item.driver?.name || 'Unknown Driver'}</p>
                      <p className="text-xs text-gray-400">{item.driver?.phone || 'No Phone'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-800">{item.amount.toLocaleString()} SDG</p>
                  <p className="text-xs text-emerald-600 font-semibold">CASH DEPOSIT</p>
                </td>
                <td className="px-6 py-4 text-sm font-mono font-bold text-gray-600">{item.reference}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.createdAt).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-red-100 text-red-700'
                  }`}>{item.status.toUpperCase()}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  {item.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(item._id)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold mr-2 transition-all">Approve (موافقة)</button>
                      <button onClick={() => handleReject(item._id)} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all">Reject (رفض)</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
