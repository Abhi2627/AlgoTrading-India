'use client';

import { useState } from 'react';

interface Stock {
  symbol: string;
  name: string;
  current_price: number;
  change_percent: number;
  volume: number;
  market_cap: number;
}

interface StockCardProps {
  stock: Stock;
}

export default function StockCard({ stock }: StockCardProps) {
  const [isHovered, setIsHovered] = useState(false);

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
      className="bg-white rounded-lg shadow-sm border p-4 transition-all duration-300 hover:shadow-md hover:scale-105 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Content */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg">
            {stock.symbol.replace('.NS', '')}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {stock.name}
          </p>
          
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Price: </span>
              <span className="font-semibold text-green-600">
                {stock.current_price ? `₹${stock.current_price}` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Change: </span>
              <span className={`font-semibold ${stock.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stock.change_percent}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`w-3 h-3 rounded-full ${stock.change_percent >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
      </div>

      {/* Hover Preview */}
      {isHovered && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border rounded-lg shadow-xl z-10 p-4">
          <h4 className="font-bold text-gray-900 mb-2">Stock Details</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Symbol:</span>
              <span className="font-medium">{stock.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Company:</span>
              <span className="font-medium text-right">{stock.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Price:</span>
              <span className="font-bold text-green-600">
                {stock.current_price ? `₹${stock.current_price}` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Change:</span>
              <span className={`font-bold ${stock.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stock.change_percent}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Volume:</span>
              <span className="font-medium">{stock.volume?.toLocaleString('en-IN') || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Market Cap:</span>
              <span className="font-medium">{stock.market_cap ? formatNumber(stock.market_cap) : 'N/A'}</span>
            </div>
          </div>
          
          {/* Mock AI Analysis */}
          <div className="mt-3 p-2 bg-blue-50 rounded border">
            <h5 className="font-semibold text-blue-800 text-xs">AI ANALYSIS</h5>
            <p className="text-xs text-blue-700 mt-1">
              Strong bullish signals detected. High volume with positive momentum.
            </p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-600">AI Confidence:</span>
              <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded">85%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}