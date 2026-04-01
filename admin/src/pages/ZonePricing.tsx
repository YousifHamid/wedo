import React, { useState } from 'react';
import { MapPin, Edit2 } from 'lucide-react';

const zones = [
  { id: 'z1', name: 'Khartoum North', nameAr: 'الخرطوم شمال', active: true },
  { id: 'z2', name: 'Khartoum Center', nameAr: 'وسط الخرطوم', active: true },
  { id: 'z3', name: 'Khartoum South', nameAr: 'الخرطوم جنوب', active: true },
  { id: 'z4', name: 'Omdurman', nameAr: 'أم درمان', active: true },
  { id: 'z5', name: 'Bahri', nameAr: 'بحري', active: true },
  { id: 'z6', name: 'Airport', nameAr: 'المطار', active: true },
  { id: 'z7', name: 'Arkaweet', nameAr: 'أركويت', active: true },
  { id: 'z8', name: 'Burri', nameAr: 'بري', active: true },
  { id: 'z9', name: 'Jabra', nameAr: 'جبرة', active: true },
  { id: 'z10', name: 'Riyadh', nameAr: 'الرياض', active: true },
];

const pricingMatrix = [
  { from: 'Khartoum North', to: 'Omdurman', standard: 4500, premium: 7000, commission: 15 },
  { from: 'Khartoum North', to: 'Bahri', standard: 2500, premium: 4000, commission: 15 },
  { from: 'Khartoum Center', to: 'Airport', standard: 4500, premium: 7500, commission: 15 },
  { from: 'Khartoum Center', to: 'Omdurman', standard: 4000, premium: 6000, commission: 15 },
  { from: 'Omdurman', to: 'Airport', standard: 6000, premium: 9000, commission: 15 },
  { from: 'Bahri', to: 'Khartoum Center', standard: 3500, premium: 5500, commission: 15 },
];

export default function ZonePricing() {
  const [activeTab, setActiveTab] = useState<'zones' | 'pricing'>('zones');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Zones & Pricing</h1>
        <p className="text-gray-500 mt-1">Manage zones and set fixed zone-to-zone fares</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setActiveTab('zones')} className={`px-6 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'zones' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Zones</button>
        <button onClick={() => setActiveTab('pricing')} className={`px-6 py-2.5 rounded-xl text-sm font-semibold ${activeTab === 'pricing' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Pricing Matrix</button>
      </div>

      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map(zone => (
            <div key={zone.id} className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mr-3">
                  <MapPin className="text-emerald-600" size={18} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{zone.name}</p>
                  <p className="text-sm text-gray-500">{zone.nameAr}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${zone.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {zone.active ? 'Active' : 'Inactive'}
                </span>
                <button className="p-2 text-gray-400 hover:text-gray-600"><Edit2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">From → To</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Standard (SDG)</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Premium (SDG)</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Commission %</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pricingMatrix.map((price, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{price.from} → {price.to}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-800">{price.standard.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-800">{price.premium.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{price.commission}%</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
