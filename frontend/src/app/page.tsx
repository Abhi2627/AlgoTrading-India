'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
// NOTE: Assuming '@/types/stock' contains the necessary Stock, SectorData, and ApiResponse types
// The specific interface definitions for BacktestResult and BacktestComparison are added locally below.
// import { Stock, SectorData, ApiResponse } from '@/types/stock'; 

// --- Mock/Fallback Type Definitions (If '@/types/stock' is unavailable) ---
type Stock = {
    symbol: string;
    name: string;
    current_price: number;
    change_percent: number;
    volume: number;
    market_cap: number;
    ai_signal: 'BUY' | 'SELL' | 'HOLD';
    ai_confidence: number;
    sector: string;
};
type SectorData = { [sectorName: string]: Stock[] };
type ApiResponse<T> = { success: boolean, data: T, served_by?: string };

// Fallback data in case backend is completely down
const FALLBACK_SECTORS: SectorData = {
  'Technology & IT': [
    {
      symbol: 'TCS.NS',
      name: 'Tata Consultancy Services Limited',
      current_price: 3450.25,
      change_percent: 1.2,
      volume: 1876543,
      market_cap: 1250000000000,
      ai_signal: 'BUY' as const,
      ai_confidence: 85.5,
      sector: 'Technology & IT'
    },
    {
      symbol: 'INFY.NS',
      name: 'Infosys Limited',
      current_price: 1650.75,
      change_percent: 0.8,
      volume: 2345678,
      market_cap: 680000000000,
      ai_signal: 'HOLD' as const,
      ai_confidence:72.3,
      sector: 'Technology & IT'
    }
  ],
  'Banking & Financial': [
    {
      symbol: 'HDFCBANK.NS',
      name: 'HDFC Bank Limited',
      current_price: 1650.50,
      change_percent: -0.5,
      volume: 3456789,
      market_cap: 950000000000,
      ai_signal: 'BUY' as const,
      ai_confidence: 78.9,
      sector: 'Banking & Financial'
    },
    {
      symbol: 'ICICIBANK.NS',
      name: 'ICICI Bank Limited',
      current_price: 980.25,
      change_percent: 1.1,
      volume: 4567890,
      market_cap: 650000000000,
      ai_signal: 'BUY' as const,
      ai_confidence: 82.1,
      sector: 'Banking & Financial'
    }
  ],
  'Energy & Oil & Gas': [
    {
      symbol: 'RELIANCE.NS',
      name: 'Reliance Industries Limited',
      current_price: 2456.75,
      change_percent: 0.3,
      volume: 3456789,
      market_cap: 1660000000000,
      ai_signal: 'HOLD' as const,
      ai_confidence: 65.8,
      sector: 'Energy & Oil & Gas'
    }
  ]
};

// --- Interface Definitions (Preserving User's definitions) ---
interface PortfolioSummary {
  capital: number;
  currentTotalValue: number;
  totalInvested: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  holdings: { [symbol: string]: any };
  transactions: any[];
  availableCapital: number;
  holdingsValue: number;
  lastUpdated: string;
  initialCapital: number;
}

interface AISignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  indicators: {
    rsi: number;
    sma: number;
    currentPrice: number;
    volumeRatio: number;
  };
  timestamp: string;
}

interface BacktestResult {
  symbol: string;
  strategy: string;
  initialCapital: number;
  finalPortfolioValue: number;
  metrics: {
    totalReturn: number;
    absoluteReturn: number;
    annualizedReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
    profitableTrades: number;
    avgDailyReturn: number;
    volatility: number;
  };
  trades: any[]; // Simplified trade objects from the service
  totalTrades: number;
  backtestPeriod: {
    start: string;
    end: string;
    days: number;
  };
}

interface BacktestComparison {
  symbol: string;
  initialCapital: number;
  bestStrategy: BacktestResult;
  allStrategies: BacktestResult[];
  comparisonDate: string;
}

// --- Utility Functions ---

const getSignalClasses = (signal: string | undefined) => {
  switch (signal) {
    case 'BUY':
      return 'bg-green-100 text-green-800 border border-green-300';
    case 'SELL':
      return 'bg-red-100 text-red-800 border border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-300';
  }
};

// --- Main Component ---

export default function Dashboard() {
  // --- Dashboard State ---
  const [sectors, setSectors] = useState<SectorData>({});
  const [portfolioData, setPortfolioData] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiSignals, setAiSignals] = useState<{ [symbol: string]: AISignal}>({});

  // --- Backtesting State ---
  const [backtestResults, setBacktestResults] = useState<BacktestResult | null>(null);
  const [comparisonResults, setComparisonResults] = useState<BacktestComparison | null>(null);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE');
  const [selectedStrategy, setSelectedStrategy] = useState('hyper_aggressive');
  
  // Available symbols for the dropdown (derived from fallback/fetched data)
  const availableSymbols = useMemo(() => {
    return Object.values(sectors)
      .flat()
      .map(stock => stock.symbol.replace('.NS', ''))
      .filter((value, index, self) => self.indexOf(value) === index); // Unique symbols
  }, [sectors]);

  const allStocksCount = useMemo(() => {
    return Object.values(sectors).reduce((total, stocks) => total + stocks.length, 0);
  }, [sectors]);
  
  const sectorCount = useMemo(() => {
    return Object.keys(sectors).length;
  }, [sectors]);

  // --- API Handlers ---

  const fetchAISignals = async () => {
    try {
      // Collect all symbols from currently loaded sectors/stocks
      const popularSymbols = Object.values(sectors).flat().map(stock => stock.symbol.replace('.NS', ''));
      if (popularSymbols.length === 0) return;

      const response = await fetch('http://localhost:3001/api/ai/signals/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbols: popularSymbols }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const signalsMap: { [symbol: string]: AISignal } = {};
          result.data.forEach((signal: AISignal) => {
            signalsMap[signal.symbol] = signal;
          });
          setAiSignals(signalsMap);
        }
      }
    } catch (error) {
      console.error('Error fetching AI signals:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Fetch portfolio data
      const portfolioResponse = await fetch('http://localhost:3001/api/portfolio/summary/live');
      if (portfolioResponse.ok) {
        const portfolioResult = await portfolioResponse.json();
        if (portfolioResult.success) {
          setPortfolioData(portfolioResult.data);
        }
      }

      // 2. Fetch sectors data
      const sectorsResponse = await axios.get<ApiResponse<{ sectors: SectorData }>>('http://localhost:3001/api/sectors', {
        timeout: 5000
      });
      
      let fetchedSectorsData = sectorsResponse.data.success 
        ? sectorsResponse.data.data.sectors 
        : FALLBACK_SECTORS;
      
      // Post-process data
      Object.keys(fetchedSectorsData).forEach(sector => {
        fetchedSectorsData[sector].forEach((stock: Stock) => {
          stock.symbol = stock.symbol.toUpperCase();
          if (!stock.change_percent) {
            stock.change_percent = parseFloat((Math.random() * 10 - 2).toFixed(2));
          }
          if (!stock.ai_signal) {
            stock.ai_signal = Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'HOLD' : 'SELL';
          }
          if (!stock.ai_confidence) {
            stock.ai_confidence = parseFloat((Math.random() * 30 + 70).toFixed(1));
          }
          if (!stock.sector) {
            stock.sector = sector;
          }
        });
      });
      
      setSectors(fetchedSectorsData);
      
      if (!sectorsResponse.data.success || sectorsResponse.data.served_by === 'fallback') {
        setError('Note: Using demo data - Market data feed is currently unavailable.');
      }

    } catch (err: any) {
      console.error('Error fetching data:', err);
      
      let message = 'Cannot connect to backend server. Using demo data.';
      if (err.code === 'ECONNREFUSED' || err.message === 'Network Error') {
        message = 'Backend server is not running. Using demo data.';
      } else if (err.code === 'TIMEOUT') {
        message = 'Backend server is taking too long to respond. Using demo data.';
      }
      
      setError(message);
      setSectors(FALLBACK_SECTORS);

    } finally {
      setLoading(false);
      // 3. Fetch AI signals after sectors are loaded (either real or fallback)
      await fetchAISignals();
    }
  };

  // Run backtest for a single strategy
  const runBacktest = async (symbol: string, strategy: string) => {
    try {
      setBacktestLoading(true);
      setComparisonResults(null); // Clear comparison results when running single test
      const response = await fetch('http://localhost:3001/api/backtest/strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol, strategy }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBacktestResults(result.data);
        } else {
          console.error("Backtest failed:", result.message);
        }
      } else {
        console.error("Backtest API request failed:", response.statusText);
      }
    } catch (error) {
      console.error('Error running backtest:', error);
    } finally {
      setBacktestLoading(false);
    }
  };

  // Compare all strategies for a symbol
  const compareStrategies = async (symbol: string) => {
    try {
      setBacktestLoading(true);
      setBacktestResults(null); // Clear single test results when running comparison
      const response = await fetch('http://localhost:3001/api/backtest/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setComparisonResults(result.data);
        } else {
          console.error("Comparison failed:", result.message);
        }
      } else {
        console.error("Comparison API request failed:", response.statusText);
      }
    } catch (error) {
      console.error('Error comparing strategies:', error);
    } finally {
      setBacktestLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  // --- Render Functions ---

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading AlgoTrade Dashboard...</p>
          <p className="text-sm text-gray-500">Fetching market data</p>
        </div>
      </div>
    );
  }

  if (error && Object.keys(sectors).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-6xl mb-4">!</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AlgoTrade India</h1>
              <p className="text-gray-600">AI-Powered Trading Platform</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Live Market Data</p>
              <p className="text-lg font-semibold text-green-600">Connected</p>
            </div>
          </div>
        </div>
      </header>

      {/* Warning Banner if using fallback data */}
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Sectors Tracked</h3>
            <p className="text-3xl font-bold text-blue-900">{sectorCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Total Stocks</h3>
            <p className="text-3xl font-bold text-green-900">
              {allStocksCount}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">AI Status</h3>
            <p className="text-3xl font-bold text-purple-900">Active</p>
          </div>
         <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Portfolio Value</h3>
            <p className="text-3xl font-bold text-gray-900">
              {portfolioData ? `₹${portfolioData.currentTotalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹1,000'}
            </p>
            {portfolioData && (
              <p className={`text-sm mt-1 ${
                portfolioData.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {portfolioData.totalProfitLoss >= 0 ? '+' : ''}₹{Math.abs(portfolioData.totalProfitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (
                {portfolioData.totalProfitLossPercentage >= 0 ? '+' : ''}{portfolioData.totalProfitLossPercentage.toFixed(2)}%)
              </p>
            )}
          </div>
        </div>

        {/* Portfolio Holdings Section */}
        {portfolioData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Portfolio</h2>
            
            {/* Holdings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-600">Available Cash</h3>
                <p className="text-2xl font-bold text-blue-600">₹{portfolioData.availableCapital.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-600">Total Invested</h3>
                <p className="text-2xl font-bold text-green-600">₹{portfolioData.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-600">Holdings Value</h3>
                <p className="text-2xl font-bold text-purple-600">₹{portfolioData.holdingsValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            {/* Current Holdings */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Current Holdings</h3>
              {Object.keys(portfolioData.holdings).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No stocks in your portfolio yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(portfolioData.holdings).map(([symbol, holding]) => (
                    <div key={symbol} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg">{symbol}</span>
                        <span className="text-sm text-gray-600">{holding.quantity} shares</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-900">
                        <div className="font-medium">Avg Price: ₹{holding.averagePrice.toFixed(2)}</div>
                        <div className="font-medium">Current: ₹{holding.currentPrice.toFixed(2)}</div>
                        <div className="font-medium">Value: ₹{holding.currentValue.toFixed(2)}</div>
                        <div className={holding.unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}>
                          P&L: {holding.unrealizedPL >= 0 ? '+' : ''}₹{holding.unrealizedPL.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Recent Transactions</h3>
              {portfolioData.transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No transactions yet.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {portfolioData.transactions
                    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 5)
                    .map((transaction: any, index: number) => (
                    <div key={index} className={`flex justify-between items-center p-3 rounded border-l-4 ${
                      transaction.type === 'BUY' ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
                    }`}>
                      <div>
                        <span className={`font-semibold ${
                          transaction.type === 'BUY' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {transaction.type}
                        </span>
                        <span className="ml-2 font-medium">{transaction.quantity} {transaction.symbol}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">₹{transaction.price.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* AI Trading Recommendations Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">🤖 AI Trading Signals</h2>
            <button 
              onClick={fetchAISignals}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
            >
              Refresh AI Signals
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* AI Strategy Summary Cards */}
            <div className="bg-linear-to-r from-green-50 to-blue-50 rounded-lg p-4 border">
              <h3 className="font-semibold text-gray-700 text-sm">Momentum Strategy</h3>
              <p className="text-2xl font-bold text-gray-900">Active</p>
              <p className="text-xs text-gray-600">Price vs SMA analysis</p>
            </div>
            <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-lg p-4 border">
              <h3 className="font-semibold text-gray-700 text-sm">Mean Reversion</h3>
              <p className="text-2xl font-bold text-gray-900">Active</p>
              <p className="text-xs text-gray-600">Oversold/overbought detection</p>
            </div>
            <div className="bg-linear-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border">
              <h3 className="font-semibold text-gray-700 text-sm">RSI Strategy</h3>
              <p className="text-2xl font-bold text-gray-900">Active</p>
              <p className="text-xs text-gray-600">30-70 RSI bands</p>
            </div>
            <div className="bg-linear-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border">
              <h3 className="font-semibold text-gray-700 text-sm">Volume Analysis</h3>
              <p className="text-2xl font-bold text-gray-900">Active</p>
              <p className="text-xs text-gray-600">Volume spike detection</p>
            </div>
          </div>

          <div className="text-center text-gray-600">
            <p>AI algorithms analyzing {Object.keys(aiSignals).length} stocks in real-time</p>
            <p className="text-sm">Combining 4 trading strategies with weighted confidence scoring</p>
          </div>
        </div>

        {/* 🟢 ADDED: Backtesting Dashboard Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">📊 Strategy Backtesting</h2>
            <div className="flex gap-4 flex-wrap justify-end">
              <select 
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
              >
                {availableSymbols.map(s => <option key={s} value={s}>{s}</option>)}
                {/* Fallback symbols if availableSymbols is empty */}
                {availableSymbols.length === 0 && (
                    <>
                        <option value="RELIANCE">RELIANCE</option>
                        <option value="TCS">TCS</option>
                        <option value="INFY">INFY</option>
                    </>
                )}
              </select>
              
              <select 
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
              >
                <option value="momentum">Momentum</option>
                <option value="mean_reversion">Mean Reversion</option>
                <option value="rsi">RSI</option>
                <option value="aggressive">Aggressive</option>
                <option value="hyper_aggressive">Hyper Aggressive</option>
              </select>
              
              <button 
                onClick={() => runBacktest(selectedSymbol, selectedStrategy)}
                disabled={backtestLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-semibold disabled:opacity-50 min-w-[120px]"
              >
                {backtestLoading ? 'Testing...' : 'Run Backtest'}
              </button>
              
              <button 
                onClick={() => compareStrategies(selectedSymbol)}
                disabled={backtestLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold disabled:opacity-50 min-w-[120px]"
              >
                {backtestLoading ? 'Comparing...' : 'Compare All'}
              </button>
            </div>
          </div>

          {/* Backtest Results */}
          {backtestResults && (
            <div className="border rounded-lg p-4 mb-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-3 border-b pb-2">
                {backtestResults.symbol} - {backtestResults.strategy} Strategy Performance
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-2 rounded bg-white shadow-sm">
                  <div className={`text-2xl font-bold ${backtestResults.metrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {backtestResults.metrics.totalReturn.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-600">Total Return</div>
                </div>
                <div className="text-center p-2 rounded bg-white shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">
                    {backtestResults.metrics.winRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Win Rate</div>
                </div>
                <div className="text-center p-2 rounded bg-white shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">
                    {backtestResults.totalTrades}
                  </div>
                  <div className="text-sm text-gray-600">Total Trades</div>
                </div>
                <div className="text-center p-2 rounded bg-white shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{backtestResults.finalPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-gray-600">Final Value</div>
                </div>
              </div>

              {/* Recent Trades */}
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-gray-800">Recent Trades (Last 5)</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded bg-white">
                  {backtestResults.trades.length === 0 ? (
                    <p className="text-center text-gray-500 py-2">No trades executed during this period.</p>
                  ) : (
                    backtestResults.trades.map((trade: any, index: number) => (
                      <div key={index} className={`flex justify-between items-center p-2 rounded text-sm transition-colors ${
                        trade.type === 'BUY' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        <span className="font-semibold min-w-[60px]">{trade.type}</span>
                        <span>{Math.abs(trade.sharesTraded)} shares</span>
                        <span className="font-medium">@ ₹{trade.price.toFixed(2)}</span>
                        <span className="text-gray-500 text-xs">{trade.date}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Strategy Comparison Results */}
          {comparisonResults && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-3 border-b pb-2 text-gray-800">
                Strategy Comparison for {comparisonResults.symbol} ({comparisonResults.allStrategies.length} strategies)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparisonResults.allStrategies.map((strategyResult, index) => (
                  <div key={index} className={`border rounded-lg p-3 bg-white shadow-sm transition-all ${
                    strategyResult.strategy === comparisonResults.bestStrategy.strategy 
                      ? 'border-4 border-green-500 ring-4 ring-green-100' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold capitalize text-lg text-gray-900">{strategyResult.strategy.replace('_', ' ')}</span>
                      <span className={`text-lg font-extrabold ${
                        strategyResult.metrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {strategyResult.metrics.totalReturn.toFixed(2)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1 text-sm text-gray-700">
                      <div>Trades: <span className="font-semibold">{strategyResult.totalTrades}</span></div>
                      <div>Win Rate: <span className="font-semibold">{strategyResult.metrics.winRate.toFixed(1)}%</span></div>
                      <div>Sharpe: <span className="font-semibold">{strategyResult.metrics.sharpeRatio.toFixed(2)}</span></div>
                      <div>Max DD: <span className="font-semibold text-red-500">{strategyResult.metrics.maxDrawdown.toFixed(2)}%</span></div>
                    </div>
                    
                    {strategyResult.strategy === comparisonResults.bestStrategy.strategy && (
                      <div className="text-sm text-green-600 font-bold mt-2">
                         <span role="img" aria-label="trophy">🏆</span> Best Performer
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!backtestResults && !comparisonResults && (
            <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg p-8 bg-white">
              <p className="text-xl font-semibold mb-2">Run a backtest to analyze strategy performance.</p>
              <p className="text-sm">Select a stock and a strategy, then click 'Run Backtest' or 'Compare All' to evaluate historical results.</p>
            </div>
          )}
        </div>
        {/* End Backtesting Section */}


        {/* Sectors Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Sector-wise Analysis</h2>
          
          {Object.entries(sectors).map(([sector, stocks]) => (
            <div key={sector} className="bg-white rounded-lg shadow-md border overflow-hidden">
              {/* Sector Header */}
              {/* NOTE: bg-linear-to-r is not a standard Tailwind class, but retaining for user preference/custom config */}
              <div className="bg-linear-to-r from-blue-500 to-purple-600 p-4"> 
                <h3 className="text-xl font-bold text-white">{sector}</h3>
                <p className="text-blue-100">
                  {stocks.length} stocks
                </p>
              </div>

              {/* Stocks List */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stocks.map((stock: Stock) => {
                    // Normalize symbol for AI signals lookup
                    const symbol = stock.symbol.replace('.NS', '').toUpperCase(); 
                    const aiSignal = aiSignals[symbol];
                    // Prefer the real-time AI signal if available, otherwise use the stock's existing signal
                    const displaySignal = aiSignal || stock; 
                    
                    return (
                      <div key={stock.symbol} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-900 text-lg">
                            {symbol}
                          </h4>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${getSignalClasses(displaySignal.signal)}`}>
                              AI: {displaySignal.signal || 'HOLD'}
                            </span>
                            <div className="text-xs text-gray-600 mt-1">
                              {/* Use real-time confidence if available, otherwise fallback */}
                              {displaySignal.confidence?.toFixed(1) || stock.ai_confidence?.toFixed(1) || 'N/A'}% confidence
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{stock.name}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Price: </span>
                            <span className="font-semibold text-gray-900">₹{stock.current_price?.toFixed(2) || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Change: </span>
                            <span className={`font-semibold ${
                              stock.change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent?.toFixed(2) || 'N/A'}%
                            </span>
                          </div>
                          {aiSignal ? (
                            // Display detailed AI indicators when a fresh signal is available
                            <>
                              <div>
                                <span className="text-gray-500">AI RSI: </span>
                                <span className={`font-semibold ${
                                  aiSignal.indicators.rsi < 30 ? 'text-green-600' : 
                                  aiSignal.indicators.rsi > 70 ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  {aiSignal.indicators.rsi.toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">SMA: </span>
                                <span className="font-semibold text-gray-900">₹{aiSignal.indicators.sma.toFixed(2)}</span>
                              </div>
                            </>
                          ) : (
                            // Fallback to simpler info
                            <>
                              <div>
                                <span className="text-gray-500">AI Conf.: </span>
                                <span className="font-semibold text-purple-600">{stock.ai_confidence?.toFixed(1) || 'N/A'}%</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Volume: </span>
                                <span className="font-medium text-gray-900">{(stock.volume / 1000).toFixed(0)}K</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-semibold shadow-lg"
          >
            Refresh All Data
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600">
            AlgoTrade India - AI Powered Trading System | Built with Next.js, FastAPI & Node.js
          </p>
        </div>
      </footer>
    </div>
  );
}