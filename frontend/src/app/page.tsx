"use client";

import { useState } from "react";
// FIX: Import the component that is actually crashing
import AssetNavBar from "@/components/AssetNavBar"; 
import HomeView from "@/components/HomeView";
import StockDashBoard from "@/components/StockDashBoard";
import MarketListView from "@/components/MarketListView";

export default function Home() {
  const [activeTab, setActiveTab] = useState("Home");
  const [selectedSymbol, setSelectedSymbol] = useState("");

  const handleAssetSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-[#0d1117] text-white pb-20">
      
      {/* FIX: Correct Prop Name (onTabChange) */}
      <AssetNavBar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* VIEW 1: HOME DASHBOARD */}
        {activeTab === "Home" && (
          <HomeView />
        )}

        {/* VIEW 2: TRADING INTERFACE */}
        {activeTab !== "Home" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Market List */}
            <div className="lg:col-span-3 lg:sticky lg:top-6 h-[500px] lg:h-[calc(100vh-100px)]">
               <MarketListView 
                  onSelect={handleAssetSelect} 
                  activeTab={activeTab} 
               />
            </div>

            {/* RIGHT COLUMN: Main Dashboard */}
            <div className="lg:col-span-9">
               <StockDashBoard 
                  activeTab={activeTab} 
                  initialSymbol={selectedSymbol || (activeTab === "Crypto" ? "BTC-USD" : activeTab === "Forex" ? "EURUSD=X" : "RELIANCE.NS")}
                  key={selectedSymbol} 
               />
            </div>

          </div>
        )}
      </div>
    </main>
  );
}