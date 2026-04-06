import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Car, DollarSign } from 'lucide-react';
import api from '../services/api';

interface Stats {
  totalDrivers: number;
  onlineDrivers: number;
  pendingDrivers: number;
  blockedDrivers: number;
  tripsToday: number;
  activeTrips: number;
  totalTrips: number;
  pendingTopUps: number;
  todayCommissions: number;
}

interface TopUp {
  _id: string;
  userId: { name: string; phone: string };
  amount: number;
  reference: string;
  status: string;
}

export default function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topups, setTopups] = useState<TopUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await api.get('/admin/stats');
        const topupsRes = await api.get('/admin/wallet/topups');
        setStats(statsRes.data);
        setTopups(topupsRes.data.filter((t: any) => t.status === 'pending').slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTopUpAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.put(`/admin/wallet/topups/${id}/${action}`);
      setTopups(topups.filter(t => t._id !== id));
      if (action === 'approve') {
        const statsRes = await api.get('/admin/stats');
        setStats(statsRes.data);
      }
    } catch (err) {
      alert('Action failed');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading live dashboard...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">System Overview</h1>
        <p className="text-gray-500 mt-1">Real-time mobility orchestration</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Car className="text-emerald-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Active / Today Trips</p>
          <p className="text-4xl font-bold text-gray-800 mt-1">{stats?.activeTrips} / {stats?.tripsToday}</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Drivers (Online / Total)</p>
          <p className="text-4xl font-bold text-gray-800 mt-1">{stats?.onlineDrivers} / {stats?.totalDrivers}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-700 to-emerald-600 p-6 rounded-2xl shadow-sm text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Today's Commissions</p>
          <p className="text-4xl font-bold mt-2">SDG {stats?.todayCommissions.toLocaleString()}</p>
          <p className="text-sm opacity-80 mt-2">Target reached: {Math.round((stats?.todayCommissions || 0) / 10000)}% of hourly goal</p>
        </div>
      </div>

      {/* Pending Top-ups */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Pending Top-up Requests</h3>
            <p className="text-sm text-gray-500">Verify cash deposits from drivers</p>
          </div>
          <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Manage All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left">
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Driver</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Amount (SDG)</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Reference</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topups.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="py-4">
                    <p className="text-sm font-medium text-gray-800">{item.userId?.name}</p>
                    <p className="text-xs text-gray-400">{item.userId?.phone}</p>
                  </td>
                  <td className="py-4 font-bold text-gray-800">{item.amount.toLocaleString()}</td>
                  <td className="py-4 text-sm text-gray-600">{item.reference || 'N/A'}</td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => handleTopUpAction(item._id, 'approve')}
                      className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 mr-2"
                    >✓</button>
                    <button 
                      onClick={() => handleTopUpAction(item._id, 'reject')}
                      className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                    >✕</button>
                  </td>
                </tr>
              ))}
              {topups.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-gray-400">No pending top-up requests</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
