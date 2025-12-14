"use client";

import { useState, useEffect, useRef } from "react";
import { createChart, ColorType } from 'lightweight-charts';
import { fetchStockPrediction, executeTrade, fetchWalletBalance, StockPrediction } from "@/lib/api";
// FIX: Added 'Activity' and 'ArrowUpRight' to the imports
import { Wallet, Loader2, History, PlayCircle, AlertCircle, CheckCircle2, Activity, ArrowUpRight } from "lucide-react";

interface DashboardProps {
  activeTab?: string;
  initialSymbol?: string;
}

// Define Backtest Result Type
interface BacktestResult {
  initial_capital: number;
  final_value: number;
  return_pct: number;
  max_drawdown_pct: number;
  trades_count: number;
  equity_curve: { time: string; value: number }[];
}

export default function StockDashBoard({ activeTab, initialSymbol }: DashboardProps) {
  const [symbol, setSymbol] = useState(initialSymbol || "RELIANCE.NS");
  const [data, setData] = useState<StockPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [walletBalance, setWalletBalance] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tradeLoading, setTradeLoading] = useState(false);

  // New UI State for Messages (No more Alerts!)
  const [tradeStatus, setTradeStatus] = useState<{type: 'success' | 'error' | null, msg: string}>({ type: null, msg: '' });

  // Backtest State
  const [backtestData, setBacktestData] = useState<BacktestResult | null>(null);
  const [backtestLoading, setBacktestLoading] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const backtestChartRef = useRef<HTMLDivElement>(null);

  // --- LOAD DATA ---
  useEffect(() => {
    loadDashboard(symbol);
    updateWallet();
  }, [symbol]);

  const loadDashboard = async (sym: string) => {
    setLoading(true);
    setBacktestData(null); 
    setTradeStatus({ type: null, msg: '' }); // Clear messages
    const result = await fetchStockPrediction(sym);
    if (result) setData(result);
    setLoading(false);
  };

  const updateWallet = async () => {
    try {
      const res = await fetchWalletBalance();
      setWalletBalance(res.balance);
    } catch (e) { console.error(e); }
  };

  // --- RUN BACKTEST ---
  const runBacktest = async () => {
    setBacktestLoading(true);
    try {
        const res = await fetch(`http://127.0.0.1:8000/backtest/${symbol}`);
        const result = await res.json();
        
        if (result.error) {
            setTradeStatus({ type: 'error', msg: `Simulation Failed: ${result.error}` });
            setBacktestData(null);
        } else {
            setBacktestData(result);
        }
    } catch (e) {
        setTradeStatus({ type: 'error', msg: "Backtest failed. Is the AI Engine running?" });
    }
    setBacktestLoading(false);
  };

  // --- CHART 1: PRICE (Main) ---
  useEffect(() => {
    if (data && data.chart_data && chartContainerRef.current) {
      chartContainerRef.current.innerHTML = "";
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
    }
  }, [data]);

  // --- CHART 2: EQUITY CURVE (Backtest) ---
  useEffect(() => {
    if (backtestData && backtestChartRef.current) {
      backtestChartRef.current.innerHTML = "";
      const chart = createChart(backtestChartRef.current, {
        layout: { background: { type: ColorType.Solid, color: '#0d1117' }, textColor: '#64748b' },
        grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
        width: backtestChartRef.current.clientWidth,
        height: 200,
      });
      
      const areaSeries = chart.addAreaSeries({
        lineColor: '#3b82f6', topColor: 'rgba(59, 130, 246, 0.5)', bottomColor: 'rgba(59, 130, 246, 0.0)',
      });
      
      areaSeries.setData(backtestData.equity_curve);
      chart.timeScale().fitContent();
    }
  }, [backtestData]);

  // --- TRADE EXECUTION (Improved) ---
  const handleTrade = async (action: "BUY" | "SELL") => {
    if (!data) return;
    setTradeLoading(true);
    setTradeStatus({ type: null, msg: '' }); // Reset status

    try {
      // Calls the API we fixed to throw correct errors
      await executeTrade({
        symbol: data.symbol,
        action: action,
        price: data.current_price,
        quantity: Number(quantity)
      });

      // Success Logic
      setTradeStatus({ 
        type: 'success', 
        msg: `Successfully ${action === 'BUY' ? 'bought' : 'sold'} ${quantity} ${data.symbol}` 
      });
      updateWallet(); // Refresh funds immediately
      
    } catch (error: any) {
      // Error Logic (Displays the Backend message)
      let errorMsg = "Trade Failed";
      if (error.message) errorMsg = error.message; 
      setTradeStatus({ type: 'error', msg: errorMsg });
    }
    setTradeLoading(false);
  };

  if (loading || !data) return <div className="flex justify-center h-[50vh] items-center"><Loader2 className="animate-spin text-blue-500"/></div>;

  return (
    <div className="text-slate-200 font-sans animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-end mb-8 bg-[#1e293b]/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">{data.symbol}</h1>
          <div className="flex items-baseline gap-4">
            <p className="text-5xl font-mono text-white font-medium">₹{data.current_price.toLocaleString()}</p>
            <span className={`text-lg font-bold px-3 py-1 rounded-lg ${data.expected_move_pct > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {data.expected_move_pct > 0 ? '+' : ''}{data.expected_move_pct}% Exp.
            </span>
          </div>
        </div>
        <div className="bg-slate-900/80 px-6 py-4 rounded-xl border border-slate-700 flex items-center gap-4 shadow-lg">
          <div className="bg-blue-500/20 p-2 rounded-lg">
             <Wallet className="text-blue-400" size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold tracking-wider">AVAILABLE FUNDS</p>
            <p className="text-xl font-mono font-bold text-white">₹{walletBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: CHART & BACKTESTER */}
        <div className="lg:col-span-8 space-y-6">
          {/* Live Price Chart */}
          <div className="bg-[#0d1117] border border-slate-800 rounded-2xl p-1 h-[350px] shadow-xl overflow-hidden relative group">
             <div ref={chartContainerRef} className="w-full h-full" />
             <div className="absolute top-4 left-4 bg-slate-800/90 px-3 py-1.5 rounded-lg text-xs text-slate-300 font-medium border border-slate-700">
                AI Price Action (90 Days)
             </div>
          </div>

          {/* BACKTESTER PANEL */}
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700/50 pb-4">
                <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                    <History size={20} className="text-purple-400"/> Strategy Simulator
                </h3>
                <button 
                    onClick={runBacktest}
                    disabled={backtestLoading}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-purple-900/20"
                >
                    {backtestLoading ? <Loader2 className="animate-spin" size={16}/> : <PlayCircle size={16}/>}
                    Run Backtest
                </button>
            </div>

            {/* Results Area */}
            {backtestData ? (
                <div className="animate-in fade-in">
                    {backtestData.trades_count === 0 && (
                        <div className="bg-yellow-900/20 border border-yellow-500/50 p-3 rounded-lg mb-4 flex items-center gap-3">
                            <AlertCircle className="text-yellow-500" size={20}/>
                            <div>
                                <p className="text-sm font-bold text-yellow-200">Insufficient Capital</p>
                                <p className="text-xs text-yellow-400/80">
                                    Could not buy 1 share of {symbol} with ₹{backtestData.initial_capital}.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-slate-900/50 border border-slate-700 p-4 rounded-xl">
                            <p className="text-xs text-slate-400 font-bold uppercase">Total Return</p>
                            <p className={`text-2xl font-black ${backtestData.return_pct >= 0 ? 'text-green-400':'text-red-400'}`}>
                                {backtestData.return_pct}%
                            </p>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-700 p-4 rounded-xl">
                            <p className="text-xs text-slate-400 font-bold uppercase">Trades Taken</p>
                            <p className="text-2xl font-black text-white">{backtestData.trades_count}</p>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-700 p-4 rounded-xl">
                            <p className="text-xs text-slate-400 font-bold uppercase">Final Equity</p>
                            <p className="text-2xl font-black text-blue-400">
                                ₹{backtestData.final_value?.toLocaleString() || "0"}
                            </p>
                        </div>
                    </div>
                    
                    <div className="h-[200px] w-full bg-[#0d1117] rounded-xl overflow-hidden border border-slate-800">
                        <div ref={backtestChartRef} className="w-full h-full"/>
                    </div>
                </div>
            ) : (
                <div className="h-[150px] flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/30">
                    <History className="mb-3 opacity-50" size={32}/>
                    <p>Click "Run Backtest" to see AI performance history.</p>
                </div>
            )}
          </div>
        </div>

        {/* RIGHT: TRADING & SIGNALS */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* 1. Trade Execution Panel */}
            <div className="bg-[#161b22] border border-slate-700 p-6 rounded-2xl shadow-xl">
                <h3 className="text-slate-400 font-bold text-xs uppercase mb-4 tracking-wider">Execute Trade</h3>
                
                <div className="flex justify-between items-center mb-6 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <span className="text-gray-300 font-bold text-sm">Quantity</span>
                    <div className="flex items-center gap-3">
                        <button onClick={()=>setQuantity(q=>Math.max(1,q-1))} className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded hover:bg-slate-600 transition">-</button>
                        <span className="w-12 text-center font-mono font-bold text-lg">{quantity}</span>
                        <button onClick={()=>setQuantity(q=>q+1)} className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded hover:bg-slate-600 transition">+</button>
                    </div>
                </div>

                {/* STATUS MESSAGE BOX (Replaces Alert) */}
                {tradeStatus.msg && (
                  <div className={`p-3 rounded-lg mb-4 text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 ${
                    tradeStatus.type === 'success' 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                     {tradeStatus.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                     <span className="flex-1">{tradeStatus.msg}</span>
                  </div>
                )}

                <div className="flex gap-3">
                    <button 
                        onClick={() => handleTrade("SELL")} 
                        disabled={tradeLoading} 
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-red-900/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                        SELL
                    </button>
                    <button 
                        onClick={() => handleTrade("BUY")} 
                        disabled={tradeLoading} 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-green-900/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                        BUY
                    </button>
                </div>
                <p className="text-center text-xs text-slate-500 mt-4">
                    Est. Cost: <span className="text-slate-300">₹{(data.current_price * quantity).toLocaleString()}</span>
                </p>
            </div>

            {/* 2. Signal & Sentiment */}
            <div className={`p-6 rounded-2xl border shadow-lg relative overflow-hidden ${
                data.signal.includes('BUY') ? 'bg-green-900/10 border-green-500/20' : 
                data.signal.includes('SELL') ? 'bg-red-900/10 border-red-500/20' : 'bg-slate-800/50 border-slate-700'
            }`}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">AI Recommendation</h3>
                <p className={`text-4xl font-black mb-4 ${
                    data.signal.includes('BUY') ? 'text-green-400' : 
                    data.signal.includes('SELL') ? 'text-red-400' : 'text-slate-200'
                }`}>
                    {data.signal}
                </p>
                
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between text-xs mb-2 font-medium">
                        <span className="text-slate-400">Market Sentiment</span>
                        <span className={data.sentiment_score > 0 ? "text-green-400" : "text-red-400"}>
                            {data.sentiment_score > 0 ? "Bullish" : "Bearish"} ({data.sentiment_score.toFixed(2)})
                        </span>
                    </div>
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${data.sentiment_score > 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                            style={{width: `${Math.min(Math.abs(data.sentiment_score*100), 100)}%`}}
                        />
                    </div>
                </div>
            </div>

            {/* 3. News Feed */}
            <div className="bg-[#1e293b] border border-slate-800 p-5 rounded-2xl h-[300px] overflow-hidden flex flex-col">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider flex items-center gap-2">
                    <Activity size={14} className="text-blue-400"/> Live News Intelligence
                </h3>
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    {data.recent_news.map((n, i) => (
                        <a key={i} href={n.link} target="_blank" className="block p-3 bg-slate-900/50 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-blue-500/30 transition group">
                            <p className="text-xs text-slate-300 font-medium group-hover:text-blue-300 transition-colors line-clamp-2">
                                {n.title}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">{n.source}</span>
                                <ArrowUpRight size={12} className="text-slate-600 group-hover:text-blue-400"/>
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