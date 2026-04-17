import React, { useState } from 'react';
import { Car, MapPin, Clock, DollarSign } from 'lucide-react';

const mockTrips = [
  { id: 'T-001', rider: 'Omar Youssef', driver: 'Ahmed K.', from: 'Khartoum North', to: 'Omdurman', fare: 4500, type: 'Standard', status: 'completed', time: '14 min ago' },
  { id: 'T-002', rider: 'Fatima Ali', driver: 'Sara M.', from: 'Airport', to: 'Khartoum Center', fare: 6500, type: 'Premium', status: 'active', time: '5 min ago' },
  { id: 'T-003', rider: 'Hassan M.', driver: 'Khaled S.', from: 'Bahri', to: 'Omdurman', fare: 5000, type: 'Standard', status: 'completed', time: '1 hour ago' },
  { id: 'T-004', rider: 'Amira S.', driver: null, from: 'Jabra', to: 'Airport', fare: 3500, type: 'Standard', status: 'cancelled', time: '2 hours ago' },
  { id: 'T-005', rider: 'Youssef H.', driver: 'Ali H.', from: 'Arkaweet', to: 'Khartoum South', fare: 4200, type: 'Premium', status: 'completed', time: '3 hours ago' },
];

export default function TripsPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const filtered = filter === 'all' ? mockTrips : mockTrips.filter(t => t.status === filter);

  const statusColors: Record<string, string> = {
    active: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Trips</h1>
          <p className="text-gray-500 mt-1">Monitor and manage all trips</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white rounded-xl px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500 font-semibold">Today's Trips</p>
            <p className="text-xl font-bold text-gray-800">1,428</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500 font-semibold">Revenue</p>
            <p className="text-xl font-bold text-emerald-600">SDG 842k</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'active', 'completed', 'cancelled'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-semibold ${filter === f ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trip ID</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rider</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Route</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fare</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(trip => (
              <tr key={trip.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono text-gray-600">{trip.id}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{trip.rider}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{trip.driver || '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{trip.from} → {trip.to}</td>
                <td className="px-6 py-4 text-sm font-semibold text-emerald-700">{trip.type}</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-800">{trip.fare.toLocaleString()} SDG</td>
                <td className="px-6 py-4"><span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[trip.status]}`}>{trip.status}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500">{trip.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
