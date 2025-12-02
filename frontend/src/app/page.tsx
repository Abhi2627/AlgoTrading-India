"use client";

import { useState } from "react";
import Header from "@/components/Header";
import HomeView from "@/components/HomeView";
import MarketListView from "@/components/MarketListView";

export default function Home() {
  // Navigation State
  const [activeTab, setActiveTab] = useState("Stocks"); // Home, Stocks, Crypto, Forex

  const TABS = [
    { id: "Home", label: "🏠 Home" },
    { id: "Stocks", label: "📈 Stocks" },
    { id: "Crypto", label: "₿ Crypto" },
    { id: "Forex", label: "💱 Forex" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-gray-800">
        <Header />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto w-full scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[80vh]">
        
        <div className="animate-in fade-in duration-500">
          {/* If Tab is Home, show Wallet & History */}
          {activeTab === "Home" && <HomeView />}

          {/* If Tab is Market, show the Sector Grid */}
          {/* FIX: We removed 'onAssetClick' because MarketListView handles clicks internally now */}
          {activeTab !== "Home" && (
            <MarketListView category={activeTab} />
          )}
        </div>

      </main>
    </div>
  );
}