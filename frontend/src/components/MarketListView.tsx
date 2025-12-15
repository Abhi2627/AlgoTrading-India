"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, ArrowRight, Search, Zap } from "lucide-react";
import { ASSETS } from "@/lib/assets";

interface MarketListProps {
  onSelect: (symbol: string) => void;
  activeTab: string;
}

export default function MarketListView({ onSelect, activeTab }: MarketListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");

  // 1. Filter Assets based on Tab AND Search AND Sector
  const filteredAssets = ASSETS.filter(asset => {
    const matchesTab = asset.type === activeTab;
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          asset.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === "All" || asset.sector === selectedSector;
    
    return matchesTab && matchesSearch && matchesSector;
  });

  // Get unique sectors for the current tab
  const availableSectors = ["All", ...Array.from(new Set(ASSETS.filter(a => a.type === activeTab).map(a => a.sector)))];

  return (
    <div className="bg-[#1e293b]/50 border border-slate-800 rounded-2xl p-6 h-full flex flex-col">
      
      {/* Header & Search */}
      <div className="mb-6 space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Zap size={14} className="text-yellow-500"/> Market Explorer
            </h3>
            <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-1 rounded-full font-bold">
                {filteredAssets.length}
            </span>
        </div>

        <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={16}/>
            <input 
                type="text" 
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
            />
        </div>

        {/* Sector Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {availableSectors.map(sector => (
                <button
                    key={sector}
                    onClick={() => setSelectedSector(sector)}
                    className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedSector === sector 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                    {sector}
                </button>
            ))}
        </div>
      </div>

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {filteredAssets.length === 0 ? (
            <div className="text-center text-slate-600 py-10 text-sm">
                No assets found.
            </div>
        ) : (
            filteredAssets.map((asset, i) => (
                <button
                    key={i}
                    onClick={() => onSelect(asset.symbol)}
                    // FIX 1: Used CSS Grid (grid-cols-[1fr_auto]) to strictly separate content from the arrow
                    className="w-full text-left bg-slate-900/50 hover:bg-blue-900/10 border border-slate-800 hover:border-blue-500/30 p-3 rounded-xl transition-all group grid grid-cols-[1fr_auto] items-center gap-3"
                >
                    {/* Left Side: Symbol, Tag, Name */}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white text-sm truncate">{asset.symbol}</span>
                            
                            {/* FIX 2: Fixed padding and vertical alignment for the Tag */}
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider whitespace-nowrap">
                                {asset.sector}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 group-hover:text-blue-300 transition-colors truncate">
                            {asset.name}
                        </p>
                    </div>

                    {/* Right Side: Arrow Box */}
                    {/* FIX 3: Fixed width/height (w-8 h-8) ensures a perfect square circle every time */}
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 group-hover:bg-blue-600 group-hover:text-white text-slate-500 transition-all">
                        {(asset as any).price ? (
                             <ArrowRight size={16} className="-rotate-45"/> // If price exists (future)
                        ) : (
                             <ArrowRight size={16}/>
                        )}
                    </div>
                </button>
            ))
        )}
      </div>
    </div>
  );
}