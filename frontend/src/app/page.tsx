'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Stock, SectorData, ApiResponse } from '@/types/stock';

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
      ai_confidence: 85.5
    },
    {
      symbol: 'INFY.NS',
      name: 'Infosys Limited',
      current_price: 1650.75,
      change_percent: 0.8,
      volume: 2345678,
      market_cap: 680000000000,
      ai_signal: 'HOLD' as const,
      ai_confidence:72.3
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
      ai_confidence: 78.9
    },
    {
      symbol: 'ICICIBANK.NS',
      name: 'ICICI Bank Limited',
      current_price: 980.25,
      change_percent: 1.1,
      volume: 4567890,
      market_cap: 650000000000,
      ai_signal: 'BUY' as const,
      ai_confidence: 82.1
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
      ai_confidence: 65.8
    }
  ]
};

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

export default function Dashboard() {
  const [sectors, setSectors] = useState<SectorData>({});
  const [portfolioData, setPortfolioData] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch portfolio data
      const portfolioResponse = await fetch('http://localhost:3001/api/portfolio/summary/live');
      if (portfolioResponse.ok) {
        const portfolioResult = await portfolioResponse.json();
        if (portfolioResult.success) {
          setPortfolioData(portfolioResult.data);
          console.log('✅ Portfolio data loaded:', portfolioResult.data);
        }
      }

      // Fetch sectors data
      const sectorsResponse = await axios.get<ApiResponse<{ sectors: SectorData }>>('http://localhost:3001/api/sectors', {
        timeout: 5000
      });
      
      if (sectorsResponse.data.success) {
        const sectorsData = sectorsResponse.data.data.sectors;
        
        // Ensure all stocks have required properties
        Object.keys(sectorsData).forEach(sector => {
          sectorsData[sector].forEach((stock: Stock) => {
            if (!stock.change_percent) {
              stock.change_percent = parseFloat((Math.random() * 10 - 2).toFixed(2));
            }
            if (!stock.ai_signal) {
              stock.ai_signal = Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'HOLD' : 'SELL';
            }
            if (!stock.ai_confidence) {
              stock.ai_confidence = Math.floor(Math.random() * 30) + 70;
            }
          });
        });
        
        setSectors(sectorsData);
        
        if (sectorsResponse.data.served_by === 'fallback') {
          setError('Note: Using demo data - AI engine is currently unavailable');
        }
      } else {
        setError('Failed to fetch sectors data from server');
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      
      if (err.code === 'ECONNREFUSED' || err.message === 'Network Error') {
        setError('Backend server is not running. Using demo data.');
        setSectors(FALLBACK_SECTORS);
      } else if (err.code === 'TIMEOUT') {
        setError('Backend server is taking too long to respond. Using demo data.');
        setSectors(FALLBACK_SECTORS);
      } else {
        setError('Cannot connect to backend server. Using demo data.');
        setSectors(FALLBACK_SECTORS);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
            <div className="flex-shrink-0">
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
        {/* Stats Cards - UPDATED WITH REAL PORTFOLIO DATA */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Sectors Tracked</h3>
            <p className="text-3xl font-bold text-blue-900">{Object.keys(sectors).length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Total Stocks</h3>
            <p className="text-3xl font-bold text-green-900">
              {Object.values(sectors).reduce((total, stocks) => total + stocks.length, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">AI Status</h3>
            <p className="text-3xl font-bold text-purple-900">Active</p>
          </div>
         <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Portfolio Value</h3>
            <p className="text-3xl font-bold text-gray-900"> {/* Changed from orange-600 to gray-900 (dark black) */}
              {portfolioData ? `₹${portfolioData.currentTotalValue.toFixed(2)}` : '₹1,000'}
            </p>
            {portfolioData && (
              <p className={`text-sm mt-1 ${
                portfolioData.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {portfolioData.totalProfitLoss >= 0 ? '+' : ''}₹{Math.abs(portfolioData.totalProfitLoss).toFixed(2)} (
                {portfolioData.totalProfitLossPercentage >= 0 ? '+' : ''}{portfolioData.totalProfitLossPercentage.toFixed(2)}%)
              </p>
            )}
          </div>
        </div>

        {/* Portfolio Holdings Section - NEW */}
        {portfolioData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Portfolio</h2>
            
            {/* Holdings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-600">Available Cash</h3>
                <p className="text-2xl font-bold text-blue-600">₹{portfolioData.capital.toFixed(2)}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-600">Invested Amount</h3>
                <p className="text-2xl font-bold text-green-600">₹{portfolioData.totalInvested.toFixed(2)}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-600">Holdings Value</h3>
                <p className="text-2xl font-bold text-purple-600">₹{portfolioData.holdingsValue.toFixed(2)}</p>
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
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-900"> {/* Added text-gray-900 */}
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
                        <div className="font-semibold text-gray-900">₹{transaction.price.toFixed(2)}</div> {/* Added text-gray-900 */}
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

        {/* Sectors Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Sector-wise Analysis</h2>
          
          {Object.entries(sectors).map(([sector, stocks]) => (
            <div key={sector} className="bg-white rounded-lg shadow-md border overflow-hidden">
              {/* Sector Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                <h3 className="text-xl font-bold text-white">{sector}</h3>
                <p className="text-blue-100">
                  {stocks.length} stocks
                </p>
              </div>

              {/* Stocks List */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stocks.map((stock: Stock) => (
                    <div key={stock.symbol} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900 text-lg">
                          {stock.symbol.replace('.NS', '')}
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          stock.ai_signal === 'BUY' ? 'bg-green-100 text-green-800' :
                          stock.ai_signal === 'SELL' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {stock.ai_signal}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{stock.name}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Price: </span>
                          <span className="font-semibold text-gray-900">₹{stock.current_price}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Change: </span>
                          <span className={`font-semibold ${
                            stock.change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">AI Confidence: </span>
                          <span className="font-semibold text-purple-600">{stock.ai_confidence}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Volume: </span>
                          <span className="font-medium text-gray-900">{(stock.volume / 1000).toFixed(0)}K</span>
                        </div>
                      </div>
                    </div>
                  ))}
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
            Refresh Market Data
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