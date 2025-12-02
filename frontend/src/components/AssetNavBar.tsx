'use client';

interface AssetNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AssetNavBar({ activeTab, onTabChange }: AssetNavBarProps) {
  const assets = [
    { id: 'Stocks', label: 'Stocks', icon: '📈' },
    { id: 'Mutual Funds', label: 'Mutual Funds', icon: '💰' },
    { id: 'Bonds', label: 'Bonds', icon: '📜' },
    { id: 'Securities', label: 'Securities', icon: '🛡️' },
    { id: 'IPOs', label: 'IPOs', icon: '🚀' },
    { id: 'Forex', label: 'Forex', icon: '💱' },
    { id: 'Crypto', label: 'Crypto', icon: '₿' },
  ];

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-3">
          {assets.map((asset) => {
            const isActive = activeTab === asset.id;
            return (
              <button
                key={asset.id}
                onClick={() => onTabChange(asset.id)}
                className={`relative flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out whitespace-nowrap ${isActive ? 'text-white bg-slate-800 shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                <span className="mr-2 opacity-80">{asset.icon}</span>
                {asset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}