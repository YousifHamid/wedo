import React, { useState } from 'react';
import { CheckCircle, XCircle, Wallet as WalletIcon, Search } from 'lucide-react';

const mockTopUps = [
  { id: 1, driver: 'Mohammed Ahmed', driverId: 'DR-9921', amount: 15000, reference: 'REF-8422-X', date: '2h ago', status: 'pending' },
  { id: 2, driver: 'Omer Khalid', driverId: 'DR-2204', amount: 25500, reference: 'REF-9011-Z', date: '4h ago', status: 'pending' },
  { id: 3, driver: 'Sara Bashir', driverId: 'DR-4412', amount: 8000, reference: 'REF-1123-W', date: '5h ago', status: 'pending' },
  { id: 4, driver: 'Ali Hassan', driverId: 'DR-1102', amount: 12000, reference: 'REF-5521-A', date: '1d ago', status: 'approved' },
  { id: 5, driver: 'Fatima Omar', driverId: 'DR-3301', amount: 5000, reference: 'REF-6742-B', date: '1d ago', status: 'rejected' },
];

export default function WalletApprovals() {
  const [topUps, setTopUps] = useState(mockTopUps);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const handleApprove = (id: number) => {
    setTopUps(topUps.map(t => t.id === id ? { ...t, status: 'approved' } : t));
  };
  const handleReject = (id: number) => {
    setTopUps(topUps.map(t => t.id === id ? { ...t, status: 'rejected' } : t));
  };

  const filtered = filter === 'all' ? topUps : topUps.filter(t => t.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Wallet Top-up Approvals</h1>
          <p className="text-gray-500 mt-1">Verify and approve driver cash deposits</p>
        </div>
        <span className="bg-emerald-100 text-emerald-800 py-2 px-4 rounded-full text-sm font-bold">
          {topUps.filter(t => t.status === 'pending').length} Pending
        </span>
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
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      {item.driver.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-semibold text-gray-800">{item.driver}</p>
                      <p className="text-xs text-gray-400">ID: {item.driverId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-800">{item.amount.toLocaleString()} SDG</p>
                  <p className="text-xs text-emerald-600 font-semibold">CASH DEPOSIT</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.reference}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.date}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-red-100 text-red-700'
                  }`}>{item.status}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  {item.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(item.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold mr-2">Approve</button>
                      <button onClick={() => handleReject(item.id)} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold">Reject</button>
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
