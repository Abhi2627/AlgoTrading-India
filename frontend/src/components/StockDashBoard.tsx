"use client";

import { useState, useEffect, useRef } from "react";
import { createChart, ColorType } from 'lightweight-charts';
import { fetchStockPrediction, placeTrade, fetchWalletBalance, StockPrediction } from "@/lib/api";
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, Loader2 } from "lucide-react";

interface DashboardProps {
  activeTab?: string;
  initialSymbol?: string;
}

export default function StockDashBoard({ activeTab, initialSymbol }: DashboardProps) {
  // --- STATE ---
  const [symbol, setSymbol] = useState(initialSymbol || "RELIANCE.NS");
  const [data, setData] = useState<StockPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1); // NEW: Quantity State
  
  // Wallet State
  const [walletBalance, setWalletBalance] = useState(0);
  const [tradeLoading, setTradeLoading] = useState(false);

  // Chart Reference
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // --- 1. LOAD DATA ON MOUNT ---
  useEffect(() => {
    loadDashboard(symbol);
    updateWallet();
  }, [symbol]);

  const loadDashboard = async (sym: string) => {
    setLoading(true);
    const result = await fetchStockPrediction(sym);
    if (result) setData(result);
    setLoading(false);
  };

  const updateWallet = async () => {
    try {
      const res = await fetchWalletBalance();
      setWalletBalance(res.balance);
    } catch (e) {
      console.error("Wallet offline", e);
    }
  };

  // --- 2. CHART RENDERING ---
  useEffect(() => {
    if (data && data.chart_data && chartContainerRef.current) {
      chartContainerRef.current.innerHTML = ""; // Clear old chart

      const chart = createChart(chartContainerRef.current, {
        layout: { background: { type: ColorType.Solid, color: '#0d1117' }, textColor: '#64748b' },
        grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
        width: chartContainerRef.current.clientWidth,
        height: 350,
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#22c55e', downColor: '#ef4444', 
        borderVisible: false, wickUpColor: '#22c55e', wickDownColor: '#ef4444',
      });

      // @ts-ignore
      candleSeries.setData(data.chart_data);
      chart.timeScale().fitContent();

      const handleResize = () => chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    }
  }, [data]);

  // --- 3. TRADE EXECUTION ---
  const handleTrade = async (action: "BUY" | "SELL", tradeQty: number) => {
    if (!data) return;
    setTradeLoading(true);
    try {
      // Updated to pass quantity to the API
      const result = await placeTrade(data.symbol, action, data.current_price, tradeQty);
      alert(`✅ Success: ${result.message}`);
      setWalletBalance(result.new_balance); // Update UI instantly
    } catch (error: any) {
      alert(`❌ Trade Failed: ${error.message}`);
    }
    setTradeLoading(false);
  };

  // --- RENDER ---
  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p>Analyzing Market Data for {symbol}...</p>
      </div>
    );
  }

  return (
    <div className="text-slate-200 font-sans animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 bg-[#1e293b]/50 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black text-white">{data.symbol}</h1>
            <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded text-xs font-bold">
              {activeTab || "Asset"}
            </span>
          </div>
          <div className="flex items-baseline gap-4">
            <p className="text-5xl font-mono text-white">₹{data.current_price.toLocaleString()}</p>
            <p className={`text-lg font-bold flex items-center ${data.expected_move_pct > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.expected_move_pct > 0 ? <ArrowUpRight size={20}/> : <ArrowDownRight size={20}/>}
              {data.expected_move_pct}% (5D Target: ₹{data.predicted_price})
            </p>
          </div>
        </div>

        {/* Live Wallet Widget */}
        <div className="mt-4 lg:mt-0 bg-slate-900/80 px-6 py-3 rounded-xl border border-slate-700 flex items-center gap-4">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <Wallet className="text-blue-400" size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold">Available Funds</p>
            <p className="text-xl font-mono font-bold text-white">₹{walletBalance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART & ORDERS (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#0d1117] border border-slate-800 rounded-2xl p-1 h-[400px] shadow-xl overflow-hidden relative">
             <div ref={chartContainerRef} className="w-full h-full" />
             <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-slate-800/80 text-xs px-2 py-1 rounded text-slate-300 backdrop-blur-md">
                  Vol: {data.volume?.toLocaleString() || "N/A"}
                </span>
             </div>
          </div>

          {/* Trade Panel with Quantity Selector */}
          <div className="bg-[#161b22] border border-gray-800 p-4 rounded-xl">
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-400">Quantity</span>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                        className="w-8 h-8 bg-gray-800 rounded hover:bg-gray-700 text-white font-bold"
                    >
                        -
                    </button>
                    <input 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 bg-transparent text-center font-bold outline-none border-b border-gray-700 focus:border-blue-500 text-white"
                    />
                    <button 
                        onClick={() => setQuantity(q => q + 1)} 
                        className="w-8 h-8 bg-gray-800 rounded hover:bg-gray-700 text-white font-bold"
                    >
                        +
                    </button>
                </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mb-4">
                <span>Est. Cost:</span>
                <span className="text-white font-mono">₹{(data.current_price * quantity).toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => handleTrade("SELL", quantity)}
                    disabled={tradeLoading}
                    className="bg-red-500/10 border border-red-500/50 text-red-500 py-3 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                >
                    SELL
                </button>
                <button 
                    onClick={() => handleTrade("BUY", quantity)}
                    disabled={tradeLoading}
                    className="bg-green-500/10 border border-green-500/50 text-green-500 py-3 rounded-lg font-bold hover:bg-green-500 hover:text-white transition-all disabled:opacity-50"
                >
                    {tradeLoading ? "Executing..." : "BUY"}
                </button>
            </div>
          </div>

        </div>

        {/* ANALYSIS PANEL (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Signal Card */}
          <div className={`p-8 rounded-3xl border relative overflow-hidden ${
              data.signal.includes('BUY') ? 'bg-green-900/20 border-green-500/30' : 
              data.signal.includes('SELL') ? 'bg-red-900/20 border-red-500/30' : 'bg-yellow-900/20 border-yellow-500/30'
          }`}>
            <h3 className="text-slate-400 font-bold text-xs uppercase mb-2">AI Recommendation</h3>
            <p className={`text-5xl font-black tracking-tighter ${
                data.signal.includes('BUY') ? 'text-green-400' : 
                data.signal.includes('SELL') ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {data.signal}
            </p>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Confidence: <strong>{(data.confidence || 0).toFixed(1)}%</strong> based on 5-year historical pattern matching.
            </p>
          </div>

          {/* Sentiment */}
          <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-slate-400 font-bold text-sm mb-4 flex items-center gap-2">
              <Activity size={16}/> Market Sentiment
            </h3>
            <div className="w-full bg-slate-800 h-2 rounded-full mb-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${data.sentiment_score > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(Math.abs(data.sentiment_score * 100), 100)}%` }}
              />
            </div>
            <p className="text-xs text-right text-slate-500">
              {data.sentiment_score > 0 ? "Positive News Cycle" : "Negative News Cycle"}
            </p>
          </div>

          {/* News Headlines */}
          <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-2xl h-[280px] overflow-y-auto">
            <h3 className="text-slate-400 font-bold text-sm mb-4">Intelligence Feed</h3>
            <div className="space-y-4">
              {data.recent_news.map((news: any, i: number) => (
                <a key={i} href={news.link} target="_blank" className="block group">
                  <h4 className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-2">
                    {news.title}
                  </h4>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] bg-slate-900 text-slate-500 px-1.5 rounded">{news.source}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}