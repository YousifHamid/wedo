import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/complaints');
      setComplaints(response.data.complaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolve = async (id: string) => {
    if (!window.confirm('Mark this complaint as resolved?')) return;
    try {
      await api.put(`/admin/complaints/${id}/resolve`);
      setComplaints(complaints.map(c => c._id === id ? { ...c, status: 'resolved' } : c));
    } catch (err) {
      alert('Failed to resolve complaint');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Complaints & Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and resolve user and driver complaints.</p>
        </div>
        <button 
          onClick={fetchComplaints}
          className="flex items-center space-x-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by trip ID or name..." 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Trip / Date</th>
                <th className="p-4 font-medium">Reporter (Role)</th>
                <th className="p-4 font-medium">Reported (Role)</th>
                <th className="p-4 font-medium">Reason & Details</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading complaints...</td></tr>
              ) : complaints.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No complaints found.</td></tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900 border border-gray-200 bg-gray-100 px-2 py-1 rounded text-xs inline-block mb-1">
                        ID: {c.tripId?._id?.substring(0, 8)}...
                      </div>
                      <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{c.reporterId?.name || 'Unknown'}</div>
                      <div className="text-xs text-emerald-600 font-semibold">{c.reporterId?.role?.toUpperCase()}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{c.reportedId?.name || 'Unknown'}</div>
                      <div className="text-xs text-amber-600 font-semibold">{c.reportedId?.role?.toUpperCase()}</div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-gray-800 mb-1">{c.reason}</div>
                      <div className="text-xs text-gray-500 truncate" title={c.details}>{c.details || 'No details provided'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        c.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                        c.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleResolve(c._id)}
                          disabled={c.status === 'resolved'}
                          className={`p-1.5 rounded ${c.status === 'resolved' ? 'text-gray-300' : 'text-emerald-600 hover:bg-emerald-50'}`}
                          title="Resolve"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded" title="Dismiss">
                          <XCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
