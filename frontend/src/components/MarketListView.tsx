"use client";
import { useRouter } from "next/navigation";
import { ASSETS } from "@/lib/assets";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  category: string;
}

export default function MarketListView({ category }: Props) {
  const router = useRouter();
  const filteredAssets = ASSETS.filter(a => a.type === category);
  const sectors = category === 'Stocks' ? Array.from(new Set(filteredAssets.map(a => a.sector))) : ['All Assets'];

  return (
    <div className="space-y-8">
      {sectors.map((sector) => (
        <div key={sector}>
          <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{sector}</h3>
            <button className="text-xs text-blue-500 hover:text-blue-400 font-bold">See All &rarr;</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAssets.filter(a => category !== 'Stocks' || a.sector === sector).map((asset) => (
                <div 
                  key={asset.symbol}
                  onClick={() => router.push(`/asset/${asset.symbol}`)}
                  className="bg-[#0e1117] border border-gray-800 p-3 rounded-lg hover:border-blue-500/50 cursor-pointer flex justify-between items-center group transition-all"
                >
                  {/* Left: Symbol & Name */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center font-bold text-xs text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {asset.symbol[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-sm">{asset.symbol}</span>
                      <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{asset.name}</span>
                    </div>
                  </div>

                  {/* Right: Price & Change */}
                  <div className="text-right">
                    <div className={`text-xs font-bold flex items-center justify-end ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.change > 0 ? '+' : ''}{asset.change}%
                      {asset.change >= 0 ? <TrendingUp size={12} className="ml-1"/> : <TrendingDown size={12} className="ml-1"/>}
                    </div>
                    <p className="text-sm font-mono text-white mt-0.5">₹{asset.price.toLocaleString()}</p>
                  </div>
                </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}