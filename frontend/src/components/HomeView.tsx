"use client";

import { useState, useEffect } from "react";
import { Wallet, History, TrendingUp, Sun, Moon, Briefcase, RefreshCcw } from "lucide-react";
import { fetchWalletBalance, fetchTradeHistory, fetchPortfolio } from "@/lib/api";

// ... (keep fetchReport helper same as before) ...
async function fetchReport(){
  const res = await fetch("http://127.0.0.1:8000/reports/latest", { cache: 'no-store'})
  return await res.json();
}

export default function HomeView() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]); // New State
  const [loading, setLoading] = useState(true);
  
  // State for Briefing
  const [briefingType, setBriefingType] = useState<"MORNING" | "EVENING" | "NONE">("NONE");
  const [activeReport, setActiveReport] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [walletRes, tradesRes, portfolioRes, reportRes] = await Promise.all([
          fetchWalletBalance(),
          fetchTradeHistory(),
          fetchPortfolio(), // Fetch Holdings
          fetchReport()
        ]);
        
        setBalance(walletRes.balance);
        setHistory(tradesRes);
        setPortfolio(portfolioRes);
        
        // ... (Keep Briefing Logic same as before) ...
        const pre = reportRes.pre_market;
        const post = reportRes.post_market;
        const preTime = pre ? new Date(pre.timestamp).getTime() : 0;
        const postTime = post ? new Date(post.timestamp).getTime() : 0;
        
        if (preTime === 0 && postTime === 0) {
            setBriefingType("NONE");
        } else if (preTime > postTime) {
            setBriefingType("MORNING");
            setActiveReport(pre);
        } else {
            setBriefingType("EVENING");
            setActiveReport(post);
        }

      } catch (e) {
        console.error("Failed to load home data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* 1. Portfolio Summary & Holdings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Wallet Card (Takes 2 columns) */}
        <div className="lg:col-span-2 bg-linear-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 p-8 rounded-3xl relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[220px]">
            <div className="relative z-10">
              <h2 className="text-blue-300 font-medium mb-2 flex items-center gap-2 uppercase tracking-wide text-xs">
                <Wallet size={16} /> Available Buying Power
              </h2>
              <h1 className="text-6xl font-black text-white mb-6 tracking-tighter">
                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h1>
              <div className="flex gap-3">
                <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg text-blue-300 text-xs font-bold">
                  {history.length} Trades Executed
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        </div>

        {/* Current Holdings Card (Takes 1 column) */}
        <div className="lg:col-span-1 bg-[#1e293b] border border-gray-700 p-6 rounded-3xl relative overflow-hidden flex flex-col">
            <h3 className="text-gray-400 font-bold mb-4 flex items-center gap-2 text-sm uppercase">
               <Briefcase size={16}/> Your Assets
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-40 custom-scrollbar">
               {portfolio.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-600 text-xs text-center">
                   <p>No assets owned.</p>
                   <p>Start trading to build your portfolio.</p>
                 </div>
               ) : (
                 portfolio.map((item, i) => (
                   <div key={i} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-gray-800">
                      <div>
                        <span className="font-bold text-white block">{item.symbol}</span>
                        <span className="text-[10px] text-gray-500">{item.quantity} Qty @ ₹{item.average_price}</span>
                      </div>
                      <div className="text-right">
                         <span className="block text-white font-bold text-sm">₹{item.current_value.toLocaleString()}</span>
                         <span className={`text-[10px] font-bold ${item.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                           {item.pnl >= 0 ? '+' : ''}₹{item.pnl}
                         </span>
                      </div>
                   </div>
                 ))
               )}
            </div>
        </div>
      </div>

      {/* 2. SMART BRIEFING (Keep existing code) */}
      <div className="w-full">
         {/* ... (Paste the Smart Briefing code from previous step here) ... */}
         {/* If you replaced the whole file, just use the logic from the previous answer for this section */}
         
         {/* RE-INSERTING BRIEFING CODE FOR COMPLETENESS */}
         {briefingType === "MORNING" && activeReport && (
            <div className="bg-[#1e293b] border border-yellow-500/20 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    <Sun size={24} className="text-yellow-400 fill-yellow-400"/> Morning Outlook
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">AI Market Predictions for {activeReport.date}</p>
                </div>
                <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                    Market Open
                </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {activeReport.entries.slice(0, 4).map((entry: any, i: number) => (
                    <div key={i} className="bg-[#0d1117]/60 border border-slate-700/50 p-4 rounded-xl hover:border-yellow-500/30 transition-all flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg text-white">{entry.symbol}</span>
                        <span className={`text-xs px-2 py-1 rounded font-black uppercase ${
                        entry.signal === 'BUY' ? 'bg-green-500/20 text-green-400' : 
                        entry.signal === 'SELL' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'
                        }`}>
                        {entry.signal}
                        </span>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Target Price</p>
                            <p className="text-sm font-mono text-slate-300">₹{entry.target}</p>
                        </div>
                        <p className="text-xs text-slate-500 max-w-[60%] text-right leading-tight">{entry.reason}</p>
                    </div>
                    </div>
                ))}
                </div>
            </div>
        )}

        {briefingType === "EVENING" && activeReport && (
            <div className="bg-[#1e293b] border border-purple-500/20 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    <Moon size={24} className="text-purple-400 fill-purple-400"/> Evening Review
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">Performance Analysis for {activeReport.date}</p>
                </div>
                <div className="text-right">
                    <span className={`block text-2xl font-black ${
                        activeReport.accuracy_score > 60 ? 'text-green-400' : 'text-orange-400'
                    }`}>
                        {activeReport.accuracy_score}%
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Accuracy Score</span>
                </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {activeReport.details.slice(0, 4).map((entry: any, i: number) => (
                    <div key={i} className={`border p-4 rounded-xl flex justify-between items-center transition-all ${
                        entry.correct 
                        ? 'bg-green-900/10 border-green-500/20' 
                        : 'bg-red-900/10 border-red-500/20'
                    }`}>
                    <div>
                        <span className="font-bold text-white text-lg block">{entry.symbol}</span>
                        <span className="text-xs text-slate-400">
                        AI said <strong className="text-slate-300">{entry.prediction || entry.signal}</strong>
                        </span>
                    </div>
                    <div className="text-right">
                        <span className={`block text-lg font-bold ${entry.actual_move > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.actual_move > 0 ? '+' : ''}{entry.actual_move}%
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            entry.correct ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {entry.correct ? "Correct" : "Missed"}
                        </span>
                    </div>
                    </div>
                ))}
                </div>
            </div>
        )}

        {briefingType === "NONE" && !loading && (
            <div className="bg-[#1e293b] border border-dashed border-slate-700 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
                <div className="bg-slate-800 p-4 rounded-full mb-4">
                    <RefreshCcw size={24} className="text-slate-400"/>
                </div>
                <h3 className="text-lg font-bold text-slate-300">No Briefing Available</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-md">
                    Aladdin hasn't generated a report for today yet. Check back after market hours.
                </p>
            </div>
        )}
      </div>

      {/* 3. Transaction History */}
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
                    <tr key={i} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{tx.timestamp}</td>
                      <td className="px-6 py-4 font-bold text-white">{tx.symbol}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                          tx.action === 'BUY' ? 'bg-green-900/50 text-green-400 border border-green-500/30' : 'bg-red-900/50 text-red-400 border border-red-500/30'
                        }`}>
                          {tx.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">₹{tx.price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">{tx.quantity}</td>
                      <td className="px-6 py-4 text-right text-white">₹{tx.total.toLocaleString()}</td>
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