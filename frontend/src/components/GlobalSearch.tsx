"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { ASSETS } from "@/lib/assets";

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter assets based on input
  const suggestions = query.length > 0 
    ? ASSETS.filter(a => 
        a.symbol.toLowerCase().includes(query.toLowerCase()) || 
        a.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const goToAsset = (symbol: string) => {
    if (!symbol) return;
    setShowDropdown(false);
    setQuery("");
    // Navigate to the dynamic asset page
    router.push(`/asset/${encodeURIComponent(symbol)}`);
  };

  return (
    <div className="relative w-full max-w-xl group z-50 text-white">
      {/* Search Input */}
      <div className="flex items-center bg-[#1e293b] border border-gray-700 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-sm">
        <div className="pl-3 text-gray-400">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
               const target = suggestions.length > 0 ? suggestions[0].symbol : query;
               goToAsset(target);
            }
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
          className="bg-transparent border-none outline-none text-sm w-full py-2.5 px-3 text-white placeholder-gray-500"
          placeholder="Search Stocks, Crypto, Forex..."
        />
        <button 
          onClick={() => goToAsset(query)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 mr-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1"
        >
          GO <ArrowRight size={12} />
        </button>
      </div>

      {/* Dropdown Results */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e293b] border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {suggestions.map((asset) => (
            <div 
              key={asset.symbol} 
              onMouseDown={() => goToAsset(asset.symbol)}
              className="px-4 py-3 hover:bg-blue-600/20 hover:border-l-4 hover:border-blue-500 cursor-pointer flex justify-between items-center border-b border-gray-700/50 last:border-0 transition-all"
            >
              <div>
                <span className="font-bold text-white block">{asset.symbol}</span>
                <span className="text-xs text-gray-400">{asset.name}</span>
              </div>
              <span className="text-[10px] uppercase bg-gray-800 text-gray-300 px-2 py-1 rounded font-bold">
                {asset.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}