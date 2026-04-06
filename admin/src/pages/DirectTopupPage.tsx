import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, Search, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const DirectTopupPage = () => {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<'credit' | 'debit'>('credit');
  const [targetAll, setTargetAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/admin/wallet/direct-topup', {
        phone: targetAll ? null : phone,
        allDrivers: targetAll,
        amount: Number(amount),
        description: notes,
        type: type,
      });

      setMessage({ type: 'success', text: response.data.message });
      setPhone('');
      setAmount('');
      setNotes('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-emerald-100 rounded-2xl">
          <Wallet className="text-emerald-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('direct_topup')}</h1>
          <p className="text-sm text-gray-500">Add or subtract funds from driver wallets directly</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <button
                type="button"
                onClick={() => setType('credit')}
                className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${
                  type === 'credit' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-gray-50 text-gray-400'
                }`}
             >
                <span>{t('type_credit')}</span>
             </button>
             <button
                type="button"
                onClick={() => setType('debit')}
                className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${
                  type === 'debit' ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-gray-50 text-gray-400'
                }`}
             >
                <span>{t('type_debit')}</span>
             </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center space-x-3">
              <Users size={18} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{t('topup_all')}</span>
            </div>
            <input
              type="checkbox"
              checked={targetAll}
              onChange={(e) => setTargetAll(e.target.checked)}
              className="w-5 h-5 accent-emerald-600"
            />
          </div>

          {!targetAll && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('phone_number')}</label>
              <div className="relative">
                <Search className="absolute left-4 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09..."
                  className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500 font-medium"
                  required={!targetAll}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t('amount')}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5000"
              className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 font-bold text-xl"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t('notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-lg text-white transition-all shadow-xl ${
              loading ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
            }`}
          >
            {loading ? '...' : t('submit_topup')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DirectTopupPage;
