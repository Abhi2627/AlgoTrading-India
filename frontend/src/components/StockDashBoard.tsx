"use client";

import { useState, useEffect, useRef } from "react";
import { createChart, ColorType } from 'lightweight-charts';
import { fetchStockPrediction, placeTrade, fetchWalletBalance, StockPrediction } from "@/lib/api";
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, Loader2, History, PlayCircle } from "lucide-react";

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
    setBacktestData(null); // Reset backtest on symbol change
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
        
        // FIX: Check if backend sent an error
        if (result.error) {
            alert(`⚠️ Simulation Failed: ${result.error}`);
            setBacktestData(null);
        } else {
            setBacktestData(result);
        }
    } catch (e) {
        alert("Backtest failed. Is the AI Engine running?");
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
      
      // Add Area Series for Profit/Loss
      const areaSeries = chart.addAreaSeries({
        lineColor: '#3b82f6', topColor: 'rgba(59, 130, 246, 0.5)', bottomColor: 'rgba(59, 130, 246, 0.0)',
      });
      
      areaSeries.setData(backtestData.equity_curve);
      chart.timeScale().fitContent();
    }
  }, [backtestData]);

  // --- TRADE EXECUTION ---
  const handleTrade = async (action: "BUY" | "SELL") => {
    if (!data) return;
    setTradeLoading(true);
    try {
      const result = await placeTrade(data.symbol, action, data.current_price, quantity);
      alert(`✅ Success: ${result.message}`);
      setWalletBalance(result.new_balance);
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    }
    setTradeLoading(false);
  };

  if (loading || !data) return <div className="flex justify-center h-[50vh] items-center"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="text-slate-200 font-sans animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-end mb-8 bg-[#1e293b]/50 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">{data.symbol}</h1>
          <div className="flex items-baseline gap-4">
            <p className="text-5xl font-mono text-white">₹{data.current_price.toLocaleString()}</p>
            <span className={`text-lg font-bold ${data.expected_move_pct > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.expected_move_pct}% (Target: ₹{data.predicted_price})
            </span>
          </div>
        </div>
        <div className="bg-slate-900/80 px-6 py-3 rounded-xl border border-slate-700 flex items-center gap-4">
          <Wallet className="text-blue-400" />
          <div>
            <p className="text-xs text-slate-400 font-bold">FUNDS</p>
            <p className="text-xl font-mono font-bold text-white">₹{walletBalance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* MAIN CHART AREA */}
        <div className="lg:col-span-8 space-y-6">
          {/* Live Price Chart */}
          <div className="bg-[#0d1117] border border-slate-800 rounded-2xl p-1 h-[350px] shadow-xl overflow-hidden relative">
             <div ref={chartContainerRef} className="w-full h-full" />
             <div className="absolute top-4 left-4 bg-slate-800/80 px-2 py-1 rounded text-xs text-slate-300">
                Price Action (90 Days)
             </div>
          </div>

          {/* BACKTESTER PANEL (New Feature) */}
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <History size={18} className="text-purple-400"/> Strategy Backtest (6 Months)
                </h3>
                <button 
                    onClick={runBacktest}
                    disabled={backtestLoading}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                >
                    {backtestLoading ? <Loader2 className="animate-spin" size={16}/> : <PlayCircle size={16}/>}
                    Run Simulation
                </button>
            </div>

            {/* Results Area */}
            {backtestData ? (
                <div className="animate-in fade-in">
                    {/* FIX: Show warning if no trades were possible */}
                    {backtestData.trades_count === 0 && (
                        <div className="bg-yellow-900/20 border border-yellow-500/50 p-3 rounded-lg mb-4 flex items-center gap-3">
                            <div className="bg-yellow-500/20 p-2 rounded-full">
                                <Wallet size={16} className="text-yellow-500"/>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-yellow-200">Flat Graph Detected</p>
                                <p className="text-xs text-yellow-400/80">
                                    Your wallet (₹{backtestData.initial_capital}) is too small to buy 1 share of {symbol}. 
                                    No trades could be executed.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-slate-900 p-3 rounded-lg">
                            <p className="text-xs text-slate-400">Total Return</p>
                            <p className={`text-xl font-bold ${backtestData.return_pct >= 0 ? 'text-green-400':'text-red-400'}`}>
                                {backtestData.return_pct}%
                            </p>
                        </div>
                        <div className="bg-slate-900 p-3 rounded-lg">
                            <p className="text-xs text-slate-400">Trades Taken</p>
                            <p className="text-xl font-bold text-white">{backtestData.trades_count}</p>
                        </div>
                        <div className="bg-slate-900 p-3 rounded-lg">
                            <p className="text-xs text-slate-400">Final Equity</p>
                            {/* FIX: Check if final_value exists before formatting */}
                            <p className="text-xl font-bold text-blue-400">
                                ₹{backtestData.final_value?.toLocaleString() || "0"}
                            </p>
                        </div>
                    </div>
                    
                    {/* Equity Curve Chart */}
                    <div className="h-[200px] w-full bg-[#0d1117] rounded-lg overflow-hidden border border-slate-800">
                        <div ref={backtestChartRef} className="w-full h-full"/>
                    </div>
                </div>
            ) : (
                <div className="h-[100px] flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-lg">
                    <History className="mb-2 opacity-50"/>
                    <p>Click "Run Simulation" to test strategy.</p>
                </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* Trade Execution */}
            <div className="bg-[#161b22] border border-slate-700 p-5 rounded-2xl">
                <div className="flex justify-between mb-4">
                    <span className="text-gray-400 text-sm">Quantity</span>
                    <div className="flex items-center gap-2">
                        <button onClick={()=>setQuantity(q=>Math.max(1,q-1))} className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600">-</button>
                        <span className="w-8 text-center font-bold">{quantity}</span>
                        <button onClick={()=>setQuantity(q=>q+1)} className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600">+</button>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => handleTrade("SELL")} disabled={tradeLoading} className="flex-1 bg-red-900/30 text-red-400 border border-red-900 py-3 rounded-xl font-bold hover:bg-red-900/50">SELL</button>
                    <button onClick={() => handleTrade("BUY")} disabled={tradeLoading} className="flex-1 bg-green-900/30 text-green-400 border border-green-900 py-3 rounded-xl font-bold hover:bg-green-900/50">BUY</button>
                </div>
            </div>

            {/* Signal & Sentiment */}
            <div className={`p-6 rounded-2xl border ${data.signal === 'BUY' ? 'bg-green-900/10 border-green-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
                <h3 className="text-xs font-bold text-slate-400 uppercase">AI Signal</h3>
                <p className={`text-4xl font-black ${data.signal === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{data.signal}</p>
                
                <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                        <span>Sentiment Score</span>
                        <span>{data.sentiment_score.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full">
                        <div className={`h-full rounded-full ${data.sentiment_score > 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{width: `${Math.min(Math.abs(data.sentiment_score*100), 100)}%`}}/>
                    </div>
                </div>
            </div>

            {/* News */}
            <div className="bg-[#1e293b] border border-slate-800 p-5 rounded-2xl h-[300px] overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Market Intelligence</h3>
                <div className="space-y-3">
                    {data.recent_news.map((n, i) => (
                        <a key={i} href={n.link} target="_blank" className="block p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition text-xs text-slate-300">
                            {n.title}
                            <span className="block mt-1 text-[10px] text-slate-500">{n.source}</span>
                        </a>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}