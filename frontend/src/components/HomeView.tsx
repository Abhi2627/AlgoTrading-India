"use client";

import { useState, useEffect } from "react";
import { Wallet, History, ArrowUpRight, TrendingUp } from "lucide-react";
import { fetchWalletBalance, fetchTradeHistory } from "@/lib/api";

export default function HomeView() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [walletRes, tradesRes] = await Promise.all([
          fetchWalletBalance(),
          fetchTradeHistory()
        ]);
        setBalance(walletRes.balance);
        setHistory(tradesRes);
      } catch (e) {
        console.error("Failed to load home data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Portfolio Summary Card */}
      <div className="bg-linear-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h2 className="text-blue-300 font-medium mb-2 flex items-center gap-2 uppercase tracking-wide text-xs">
            <Wallet size={16} /> Available Buying Power
          </h2>
          <h1 className="text-6xl font-black text-white mb-6 tracking-tighter">
            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h1>
          
          <div className="flex flex-wrap gap-4">
            <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl text-green-400 text-sm font-bold flex items-center">
              <TrendingUp size={16} className="mr-2"/> Monthly Refill Active
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl text-blue-300 text-sm font-bold">
              {history.length} Lifetime Trades
            </div>
          </div>
        </div>
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      </div>

      {/* Transaction History Table */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <History size={20} className="text-gray-400"/> Order History
        </h3>
        
        <div className="bg-[#0e1117] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading records...</div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center text-gray-600">
              <p>No trades executed yet.</p>
              <p className="text-sm mt-2">Go to "Stocks" or "Crypto" tab to start trading.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#161b22] text-gray-200 uppercase font-bold text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4 text-right">Price</th>
                    <th className="px-6 py-4 text-right">Qty</th>
                    <th className="px-6 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {history.map((tx, i) => (
                    <tr key={i} className="hover:bg-gray-800/50 transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs">{tx.timestamp}</td>
                      <td className="px-6 py-4 font-bold text-white group-hover:text-blue-400 transition-colors">
                        {tx.symbol}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                          tx.action === 'BUY' ? 'bg-green-900/50 text-green-400 border border-green-500/30' : 'bg-red-900/50 text-red-400 border border-red-500/30'
                        }`}>
                          {tx.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">₹{tx.price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">{tx.quantity}</td>
                      <td className="px-6 py-4 text-right text-white font-bold font-mono">
                        ₹{tx.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}