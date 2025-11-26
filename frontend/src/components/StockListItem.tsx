'use client';

import { useState } from 'react';
import { Stock } from '@/types/stock';

interface StockListItemProps {
  stock: Stock;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function StockListItem({ stock, isExpanded, onToggle }: StockListItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Added logic to handle missing data gracefully (defaulting to 0 for calculations)
  const currentPrice = stock.current_price ?? 0;
  const changePercent = stock.change_percent ?? 0;
  const volume = stock.volume ?? 0;
  const marketCap = stock.market_cap ?? 0;
  const aiConfidence = stock.ai_confidence ?? 0;
  const aiSignal = stock.ai_signal;
  const signalStrength = stock.signal_strength ?? 'Moderate';


  const formatNumber = (num: number) => {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)}Cr`;
    } else if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)}L`;
    }
    return `₹${num?.toLocaleString('en-IN')}`;
  };

  return (
    <div 
      className={`border-b border-gray-100 transition-all duration-200 ${
        isExpanded ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main List Item - WhatsApp-like */}
      <div 
        className="flex items-center p-4 cursor-pointer"
        onClick={onToggle}
      >
        {/* Stock Icon/Initial */}
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
          <span className="text-white font-bold text-sm">
            {stock.symbol.replace('.NS', '').substring(0, 2)}
          </span>
        </div>

        {/* Stock Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {stock.symbol.replace('.NS', '')}
            </h3>
            <span className={`text-sm font-bold ${
              changePercent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate">{stock.name}</p>
        </div>

        {/* Current Price and Volume - Applied consistent dark color (text-gray-900) */}
        <div className="text-right ml-4">
          <div className="text-lg font-bold text-gray-900">
            {currentPrice ? `₹${currentPrice.toFixed(2)}` : 'N/A'}
          </div>
          <div className="text-sm text-gray-700"> {/* Changed to text-gray-700 for better contrast against 900 */}
            {volume ? `${(volume / 1000).toFixed(0)}K` : 'N/A'} vol
          </div>
        </div>

        {/* Expand Indicator */}
        <div className="ml-4 transform transition-transform duration-200">
          <svg 
            className={`w-5 h-5 text-gray-400 ${
              isExpanded ? 'rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Card View - Appears below when clicked */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {/* Basic Info */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Basic Info</h4>
                <div>
                  <span className="text-gray-600">Symbol: </span>
                  <span className="font-medium text-gray-800">{stock.symbol}</span> {/* Ensured dark color */}
                </div>
                <div>
                  <span className="text-gray-600">Company: </span>
                  <span className="font-medium text-right text-gray-800">{stock.name}</span> {/* Ensured dark color */}
                </div>
                <div>
                  <span className="text-gray-600">Market Cap: </span>
                  <span className="font-medium text-gray-800">{marketCap ? formatNumber(marketCap) : 'N/A'}</span> {/* Ensured dark color */}
                </div>
              </div>

              {/* Price Info */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Price Data</h4>
                <div>
                  <span className="text-gray-600">Current: </span>
                  <span className="font-bold text-gray-900">₹{currentPrice.toFixed(2) || 'N/A'}</span> {/* Ensured dark color */}
                </div>
                <div>
                  <span className="text-gray-600">Change: </span>
                  <span className={`font-bold ${
                    changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Volume: </span>
                  <span className="font-medium text-gray-800">{volume?.toLocaleString('en-IN') || 'N/A'}</span> {/* Ensured dark color */}
                </div>
              </div>

              {/* AI Analysis */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">AI Analysis</h4>
                <div>
                  <span className="text-gray-600">Signal: </span>
                  <span className={`font-bold px-2 py-1 rounded text-xs ${
                    aiSignal === 'BUY' ? 'bg-green-100 text-green-800' :
                    aiSignal === 'SELL' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {aiSignal}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Confidence: </span>
                  <span className="font-bold text-purple-600">{aiConfidence.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Signal Strength: </span>
                  <span className="font-bold text-blue-600">{signalStrength}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Actions</h4>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-green-700 transition">
                    Buy
                  </button>
                  <button className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-red-700 transition">
                    Sell
                  </button>
                </div>
                <button className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700 transition">
                  View Details
                </button>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <h5 className="font-semibold text-blue-800 text-sm mb-1">AI Reasoning</h5>
              <p className="text-xs text-blue-700">
                {aiSignal === 'BUY' ? 'Strong bullish momentum with high volume. RSI indicates oversold conditions with potential reversal. Sector outlook positive for next quarter.' :
                 aiSignal === 'SELL' ? 'Bearish signals detected with declining volume. Technical indicators suggest potential downturn. Consider profit booking.' :
                 'Neutral market conditions. Waiting for clearer signals. Monitor key support and resistance levels.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}