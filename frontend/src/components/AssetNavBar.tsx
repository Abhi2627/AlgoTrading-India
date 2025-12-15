// frontend/src/components/AssetNavBar.tsx
"use client";

import { Home, TrendingUp, Bitcoin, DollarSign } from "lucide-react";

interface AssetNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AssetNavBar({ activeTab, onTabChange }: AssetNavBarProps) {
  
  const navItems = [
    { id: "Home", label: "Home", icon: <Home size={18}/> },
    { id: "Stocks", label: "Stocks", icon: <TrendingUp size={18}/> },
    { id: "Crypto", label: "Crypto", icon: <Bitcoin size={18}/> },
    { id: "Forex", label: "Forex", icon: <DollarSign size={18}/> },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#0d1117]/80 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
                <TrendingUp className="text-white" size={20}/>
            </div>
            <span className="text-xl font-black tracking-tight text-white hidden md:block">
                AlgoTrading<span className="text-blue-500">.INDIA</span>
            </span>
        </div>

        <div className="flex gap-2 bg-[#1e293b] p-1 rounded-full border border-slate-700">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        activeTab === item.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                >
                    {item.icon}
                    <span className="hidden sm:block">{item.label}</span>
                </button>
            ))}
        </div>
      </div>
    </nav>
  );
}