import React, { useEffect, useState } from 'react';
import { MapPin, Edit2, Plus, X } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/admin';

interface Zone {
  _id: string;
  name: string;
  nameAr: string;
  isActive: boolean;
  order: number;
}

interface Pricing {
  _id: string;
  fromZone: { _id: string; name: string };
  toZone: { _id: string; name: string };
  baseFare: number;
  premiumFare: number;
  commissionRate: number;
  isActive: boolean;
}

export default function ZonePricing() {
  const [activeTab, setActiveTab] = useState<'zones' | 'pricing'>('zones');
  const [zones, setZones] = useState<Zone[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [zonesRes, pricingRes] = await Promise.all([
        axios.get(`${API_BASE}/zones`),
        axios.get(`${API_BASE}/pricing`)
      ]);
      setZones(zonesRes.data);
      setPricing(pricingRes.data);
    } catch (err) {
      console.error('Error fetching zone/pricing data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateZone = async (id: string, data: any) => {
    try {
      await axios.put(`${API_BASE}/zones/${id}`, data);
      setEditingZone(null);
      fetchData();
    } catch (err) {
      alert('Update failed');
    }
  };

  const handleUpdatePricing = async (id: string, data: any) => {
    try {
      await axios.put(`${API_BASE}/pricing/${id}`, data);
      setEditingPricing(null);
      fetchData();
    } catch (err) {
      alert('Update failed');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading zones and pricing...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Zones & Pricing</h1>
          <p className="text-gray-500 mt-1">Real-time control over city coverage and fixed fares</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700">
          <Plus size={20} />
          {activeTab === 'zones' ? 'Add New Zone' : 'Add New Route'}
        </button>
      </div>

      <div className="flex gap-2 bg-gray-100/50 p-1 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('zones')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'zones' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Zones</button>
        <button onClick={() => setActiveTab('pricing')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'pricing' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Pricing Matrix</button>
      </div>

      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map(zone => (
            <div key={zone._id} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex items-center justify-between hover:scale-[1.02] transition-transform">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mr-4">
                  <MapPin className="text-emerald-600" size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-800">{zone.name}</p>
                  <p className="text-xs text-gray-400 font-medium">{zone.nameAr}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-lg ${zone.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {zone.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => setEditingZone(zone)} className="p-1.5 text-gray-400 hover:text-emerald-600 bg-gray-50 rounded-lg"><Edit2 size={14} /></button>
              </div>
            </div>
          ))}
          {zones.length === 0 && <p className="text-gray-400 p-8 text-center col-span-3 italic">No zones defined yet.</p>}
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">From → To Route</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Standard (SDG)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Premium (SDG)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Comm. %</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pricing.map((price) => (
                <tr key={price._id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-800">{price.fromZone?.name} → {price.toZone?.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-extrabold text-emerald-700">SDG {price.baseFare.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-extrabold text-blue-700">SDG {price.premiumFare.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-bold">{price.commissionRate}%</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${price.isActive ? 'text-emerald-600' : 'text-red-500'}`}>{price.isActive ? 'ACTIVE' : 'DISABLED'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setEditingPricing(price)} className="text-emerald-600 hover:text-emerald-700 text-sm font-bold">Edit</button>
                  </td>
                </tr>
              ))}
              {pricing.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 italic">No pricing entries defined yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Zone Modal */}
      {editingZone && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Edit Zone</h3>
              <button onClick={() => setEditingZone(null)} className="text-gray-400 font-bold"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <input 
                className="w-full bg-gray-50 border-0 p-4 rounded-2xl font-bold" 
                defaultValue={editingZone.name}
                id="edit-zone-name"
                placeholder="English Name"
              />
              <input 
                className="w-full bg-gray-50 border-0 p-4 rounded-2xl font-bold text-right" 
                defaultValue={editingZone.nameAr}
                id="edit-zone-name-ar"
                placeholder="الاسم بالعربي"
              />
              <button 
                onClick={() => {
                  const name = (document.getElementById('edit-zone-name') as HTMLInputElement).value;
                  const nameAr = (document.getElementById('edit-zone-name-ar') as HTMLInputElement).value;
                  handleUpdateZone(editingZone._id, { name, nameAr });
                }}
                className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-emerald-600/20"
              >Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
