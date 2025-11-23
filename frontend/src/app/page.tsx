'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import SectorNav from '@/components/SectorNav';
import StockListItem from '@/components/StockListItem';
import HomeView from '@/components/HomeView';

interface Stock {
  symbol: string;
  name: string;
  current_price: number;
  change_percent: number;
  volume: number;
  market_cap: number;
}

interface SectorData {
  [sector: string]: Stock[];
}

export default function Dashboard() {
  const [sectors, setSectors] = useState<SectorData>({});
  const [activeSector, setActiveSector] = useState('home');
  const [expandedStock, setExpandedStock] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSectors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/sectors');
      
      if (response.data.success) {
        // Add mock change percentages for demo
        const sectorsData = response.data.data.sectors;
        Object.keys(sectorsData).forEach(sector => {
          sectorsData[sector].forEach((stock: Stock) => {
            stock.change_percent = parseFloat((Math.random() * 10 - 2).toFixed(2)); // keep it as number
          });
        });
        
        setSectors(sectorsData);
      } else {
        setError('Failed to fetch sectors data');
      }
    } catch (err) {
      setError('Cannot connect to server. Make sure backend is running on port 3001');
      console.error('Error fetching sectors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSectors();
  }, []);

  const handleStockToggle = (symbol: string) => {
    setExpandedStock(expandedStock === symbol ? null : symbol);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading AlgoTrade Dashboard...</p>
          <p className="text-sm text-gray-500">Fetching live market data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchSectors}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            🔄 Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🚀 AlgoTrade India</h1>
              <p className="text-gray-600 text-sm">AI-Powered Trading Platform</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Live Market Data</p>
              <p className="text-sm font-semibold text-green-600 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Connected
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Sector Navigation - Apple-style horizontal nav */}
      <SectorNav 
        sectors={Object.keys(sectors)} 
        activeSector={activeSector}
        onSectorChange={setActiveSector}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeSector === 'home' ? (
          <HomeView sectors={sectors} />
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Sector Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{activeSector} Sector</h1>
              <p className="text-gray-600">
                {sectors[activeSector]?.length || 0} stocks • AI Analysis Active
              </p>
            </div>

            {/* Stocks List - WhatsApp-style */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {sectors[activeSector]?.map((stock) => (
                <StockListItem
                  key={stock.symbol}
                  stock={stock}
                  isExpanded={expandedStock === stock.symbol}
                  onToggle={() => handleStockToggle(stock.symbol)}
                />
              ))}
            </div>

            {/* Sector Summary */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">📈 {activeSector} Sector Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-green-600 font-bold">
                    {sectors[activeSector]?.filter(s => s.change_percent > 0).length || 0}
                  </div>
                  <div className="text-gray-600">Gaining Stocks</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-red-600 font-bold">
                    {sectors[activeSector]?.filter(s => s.change_percent < 0).length || 0}
                  </div>
                  <div className="text-gray-600">Declining Stocks</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-blue-600 font-bold">92%</div>
                  <div className="text-gray-600">AI Confidence</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-purple-600 font-bold">BUY</div>
                  <div className="text-gray-600">Sector Signal</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 text-sm">
            🚀 AlgoTrade India - AI Powered Trading System | Built with Next.js, FastAPI & Node.js
          </p>
        </div>
      </footer>
    </div>
  );
}