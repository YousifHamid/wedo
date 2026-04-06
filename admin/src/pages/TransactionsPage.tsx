import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Filter, RefreshCw, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import api from '../services/api';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Financial Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">Audit log of all wallet activities in the system.</p>
        </div>
        <button onClick={fetchTransactions} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex gap-4 items-center bg-gray-50/20">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search by name or description..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-full focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
            <Filter size={16} />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">User / Role</th>
                <th className="p-4 font-bold">Type</th>
                <th className="p-4 font-bold">Amount</th>
                <th className="p-4 font-bold">Balance After</th>
                <th className="p-4 font-bold">Description</th>
                <th className="p-4 font-bold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center text-gray-400">Loading transactions...</td></tr>
              ) : transactions.map((tx) => (
                <tr key={tx._id} className="hover:bg-gray-50/50">
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{tx.user?.name}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{tx.user?.role}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      {tx.type === 'credit' ? <ArrowUpCircle className="text-emerald-500" size={14} /> : <ArrowDownCircle className="text-red-500" size={14} />}
                      <span className={`font-bold capitalize ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 font-extrabold text-gray-800">
                    {tx.type === 'credit' ? '+' : '-'} {tx.amount.toLocaleString()}
                  </td>
                  <td className="p-4 text-gray-500 font-mono">SDG {tx.balanceAfter?.toLocaleString()}</td>
                  <td className="p-4 text-gray-600 max-w-xs truncate" title={tx.description}>{tx.description}</td>
                  <td className="p-4 text-gray-400 text-xs">{new Date(tx.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {!loading && transactions.length === 0 && (
                <tr><td colSpan={6} className="p-12 text-center text-gray-400">No transactions recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
