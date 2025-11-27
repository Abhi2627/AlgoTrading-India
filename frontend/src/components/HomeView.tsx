'use client';

import { useState, useMemo } from 'react';
// Assuming Stock and SectorData types are defined in '@/types/stock'
import { Stock, SectorData } from '@/types/stock';

interface HomeViewProps {
  sectors: SectorData;
  // Suggested props for dynamic data
  homeStats: {
    aiAccuracy: number;
    portfolioValue: number;
    marketSentiment: string;
    niftyChange: string;
    leadingSector: string;
    totalPredictions: number;
    accuracyRate: number;
    todaysSignals: { buy: number; sell: number };
  };
}

// Utility function to format large market cap numbers (e.g., to '1.2T' or '500Cr')
// NOTE: This is a placeholder; a real implementation would need more robust logic.
const formatMarketCap = (marketCap: number): string => {
  if (marketCap >= 1000000000000) {
    return `₹${(marketCap / 1000000000000).toFixed(2)}T`; // Trillion
  }
  if (marketCap >= 10000000) {
    return `₹${(marketCap / 10000000).toFixed(2)} Cr`; // Crore
  }
  return `₹${marketCap.toLocaleString('en-IN')}`;
};

// Utility function for centralized AI Signal styling
const getSignalClasses = (signal: string | undefined) => {
  switch (signal) {
    case 'BUY':
      return 'bg-green-100 text-green-800';
    case 'SELL':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function HomeView({ sectors, homeStats }: HomeViewProps) {
  const [expandedStock, setExpandedStock] = useState<string | null>(null);

  // Get top 5 stocks by market cap for home view, memoized for performance
  const topStocks = useMemo(() => {
    const allStocks = Object.values(sectors).flat();
    return allStocks
      .filter(stock => stock.market_cap)
      .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
      .slice(0, 5);
  }, [sectors]);

  const allStocksCount = Object.values(sectors).flat().length;
  const sectorCount = Object.keys(sectors).length;

  const handleStockToggle = (symbol: string) => {
    setExpandedStock(expandedStock === symbol ? null : symbol);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to AlgoTrade India
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          AI-Powered Trading Insights for Indian Markets
        </p>
        
        {/* Stats Grid - Using dynamic props */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{sectorCount}</div>
            <div className="text-gray-600">Sectors</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{allStocksCount}</div>
            <div className="text-gray-600">Stocks</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">{homeStats.aiAccuracy.toFixed(1)}%</div>
            <div className="text-gray-600">AI Accuracy</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-orange-600">
              ₹{homeStats.portfolioValue.toLocaleString('en-IN')}
            </div>
            <div className="text-gray-600">Portfolio</div>
          </div>
        </div>
      </div>

      {/* Top Stocks Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Top Stocks by Market Cap</h2>
        </div>

        {/* Stocks List */}
        <div className="divide-y divide-gray-100">
          {topStocks.map((stock) => (
            // Added aria-expanded for accessibility
            <div key={stock.symbol}>
              <div 
                className="flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleStockToggle(stock.symbol)}
                aria-expanded={expandedStock === stock.symbol}
                role="button"
              >
                <div className="shrink-0 w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-xs">
                    {stock.symbol.replace('.NS', '').substring(0, 2)}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      {stock.symbol.replace('.NS', '')}
                    </h3>
                    <span className={`font-bold ${
                      stock.change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent?.toFixed(2) || 'N/A'}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{stock.name}</p>
                </div>

                {/* Displaying actual Market Cap value */}
                <div className="text-right ml-4">
                  <div className="font-bold text-gray-900">
                    {formatMarketCap(stock.market_cap || 0)}
                  </div>
                  <div className="text-sm text-gray-500">Market Cap</div>
                </div>

                <div className="ml-4">
                  <svg 
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${
                      expandedStock === stock.symbol ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Card - Simplified for home view */}
              {expandedStock === stock.symbol && (
                <div className="px-4 pb-4">
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Current Price: </span>
                        <span className="font-bold text-green-600">
                          ₹{stock.current_price?.toLocaleString('en-IN') || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Change: </span>
                        <span className={`font-bold ${
                          stock.change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent?.toFixed(2) || 'N/A'}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Volume: </span>
                        <span className="font-medium">{stock.volume?.toLocaleString('en-IN') || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">AI Signal: </span>
                        {/* Using centralized styling helper */}
                        <span className={`font-bold px-2 py-1 rounded text-xs ${getSignalClasses(stock.ai_signal)}`}>
                          {stock.ai_signal || 'HOLD'}
                        </span>
                      </div>
                      {/* Placeholder for Sector Information */}
                      <div>
                        <span className="text-gray-600">Sector: </span>
                        <span className="font-medium">{stock.sector || 'N/A'}</span> 
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats - Using dynamic props */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Market Overview</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Market Sentiment:</span>
              <span className={`font-bold ${homeStats.marketSentiment === 'Bullish' ? 'text-green-600' : 'text-red-600'}`}>
                {homeStats.marketSentiment}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Nifty 50 Today:</span>
              <span className={`font-bold ${homeStats.niftyChange.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {homeStats.niftyChange}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Leading Sector:</span>
              <span className="font-bold text-blue-600">{homeStats.leadingSector}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">AI Insights</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Predictions:</span>
              <span className="font-bold text-purple-600">{homeStats.totalPredictions.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Accuracy Rate:</span>
              <span className="font-bold text-green-600">{homeStats.accuracyRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Today's Signals:</span>
              <span className="font-bold text-orange-600">
                {homeStats.todaysSignals.buy} BUY, {homeStats.todaysSignals.sell} SELL
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}