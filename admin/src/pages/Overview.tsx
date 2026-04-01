import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Users, Car, DollarSign, AlertCircle, Wifi } from 'lucide-react';

const weeklyData = [
  { name: 'Mon', trips: 120 },
  { name: 'Tue', trips: 150 },
  { name: 'Wed', trips: 180 },
  { name: 'Thu', trips: 140 },
  { name: 'Fri', trips: 220 },
  { name: 'Sat', trips: 310 },
  { name: 'Sun', trips: 280 },
];

export default function Overview() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">System Overview</h1>
          <p className="text-gray-500 mt-1">Real-time mobility orchestration</p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Car className="text-emerald-600" size={24} />
            </div>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">+12% vs last hr</span>
          </div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Active Trips</p>
          <p className="text-4xl font-bold text-gray-800 mt-1">1,428</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Users className="text-emerald-600" size={24} />
            </div>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">94% Efficiency</span>
          </div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Online Drivers</p>
          <p className="text-4xl font-bold text-gray-800 mt-1">382</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-700 to-emerald-600 p-6 rounded-2xl shadow-sm text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Total Commissions Today</p>
          <p className="text-4xl font-bold mt-2">SDG 842,500</p>
          <p className="text-sm opacity-80 mt-2">Goal: 1.2M SDG (70% reached)</p>
          <div className="flex gap-4 mt-4">
            <div className="bg-white/10 rounded-xl px-4 py-3">
              <p className="text-xs uppercase font-semibold opacity-80">Avg. Per Trip</p>
              <p className="text-lg font-bold">590 SDG</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3">
              <p className="text-xs uppercase font-semibold opacity-80">Peak Hour Lift</p>
              <p className="text-lg font-bold">+22%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top-up Requests */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Top-up Requests</h3>
              <p className="text-sm text-gray-500">Pending cash deposit verifications</p>
            </div>
            <a href="/wallet" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View All</a>
          </div>
          <table className="min-w-full">
            <thead>
              <tr className="text-left">
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { initials: 'MA', name: 'Mohammed Ahmed', id: 'DR-9921', amount: '15,000', ref: 'REF-8422-X' },
                { initials: 'OK', name: 'Omer Khalid', id: 'DR-2204', amount: '25,500', ref: 'REF-9011-Z' },
                { initials: 'SB', name: 'Sara Bashir', id: 'DR-4412', amount: '8,000', ref: 'REF-1123-W' },
              ].map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">{item.initials}</div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-400">ID: {item.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="text-sm font-bold text-gray-800">{item.amount} SDG</p>
                    <p className="text-xs text-emerald-600 font-semibold">CASH DEPOSIT</p>
                  </td>
                  <td className="py-4 text-sm text-gray-600">{item.ref}</td>
                  <td className="py-4 text-right">
                    <button className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 inline-flex items-center justify-center hover:bg-emerald-200 mr-2">✓</button>
                    <button className="w-8 h-8 rounded-full bg-red-100 text-red-600 inline-flex items-center justify-center hover:bg-red-200">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Zone Map placeholder */}
          <div className="bg-gray-800 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-xs text-gray-400">Live Traffic</span>
            </div>
            <h3 className="text-lg font-bold mt-4">Khartoum Central</h3>
            <p className="text-sm text-gray-400">82 active drivers in this zone</p>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Core Infrastructure</h3>
            <div className="space-y-3">
              {[
                { name: 'API Gateway', status: 'STABLE', color: 'emerald' },
                { name: 'Database Master', status: 'STABLE', color: 'emerald' },
                { name: 'SMS Gateway', status: 'RETRIED', color: 'yellow' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full bg-${item.color}-500 mr-3`}></div>
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded bg-${item.color}-100 text-${item.color}-700`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm h-80">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Weekly Trips Trend</h3>
        <ResponsiveContainer width="100%" height="80%">
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Line type="monotone" dataKey="trips" stroke="#059669" strokeWidth={3} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
