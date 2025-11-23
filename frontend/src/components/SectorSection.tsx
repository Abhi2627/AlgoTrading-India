'use client';

import { useState } from 'react';
import StockCard from './StockCard';

interface Stock {
  symbol: string;
  name: string;
  current_price: number;
  change_percent: number;
  volume: number;
  market_cap: number;
}

interface SectorSectionProps {
  sector: string;
  stocks: Stock[];
}

export default function SectorSection({ sector, stocks }: SectorSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Mock AI conviction score calculation (based on price movement)
  const getTopStock = () => {
    if (!stocks.length) return null;
    return stocks.reduce((top, stock) => 
      stock.change_percent > (top?.change_percent || -100) ? stock : top
    );
  };

  const topStock = getTopStock();

  return (
    <div className="bg-white rounded-lg shadow-md border overflow-hidden mb-6">
      {/* Sector Header */}
      <div 
        className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">{sector}</h2>
            <p className="text-blue-100 text-sm">
              {stocks.length} stocks • Top Pick: {topStock?.symbol.replace('.NS', '')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-white font-bold text-lg">
              {isExpanded ? '▼' : '▶'}
            </div>
            <div className="text-blue-100 text-sm">
              AI Score: 92%
            </div>
          </div>
        </div>
      </div>

      {/* Sector Content */}
      {isExpanded && (
        <div className="p-4">
          {/* Top Stock Highlight */}
          {topStock && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <h3 className="font-bold text-gray-800 mb-2 flex items-center">
                🎯 AI Top Pick for {sector}
                <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  BUY
                </span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Stock:</span>
                  <div className="font-bold">{topStock.symbol.replace('.NS', '')}</div>
                </div>
                <div>
                  <span className="text-gray-600">Price:</span>
                  <div className="font-bold text-green-600">₹{topStock.current_price}</div>
                </div>
                <div>
                  <span className="text-gray-600">Change:</span>
                  <div className="font-bold text-green-600">+{topStock.change_percent}%</div>
                </div>
                <div>
                  <span className="text-gray-600">AI Confidence:</span>
                  <div className="font-bold text-purple-600">92%</div>
                </div>
              </div>
            </div>
          )}

          {/* Stocks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stocks.map((stock) => (
              <StockCard key={stock.symbol} stock={stock} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}