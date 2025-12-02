import GlobalSearch from "./GlobalSearch"; 
// Make sure GlobalSearch.tsx is in the SAME folder (src/components)

export default function Header() {
  return (
    <header className="border-b border-gray-800 bg-[#050505]/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* 1. Logo */}
        <div className="flex items-center gap-2 cursor-pointer min-w-fit">
          <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-white">AlgoTrade.India</span>
        </div>

        {/* 2. Global Search Bar (This is what was missing) */}
        <div className="w-full md:flex-1 md:max-w-xl mx-4">
            <GlobalSearch />
        </div>

        {/* 3. User Profile / Wallet Placeholder */}
        <div className="flex items-center gap-4 min-w-fit">
           <div className="hidden md:flex items-center gap-2 text-right">
              <div className="text-xs text-gray-400">
                <p>Welcome back</p>
                <p className="text-white font-bold">Trader</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-linear-to-r from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white cursor-pointer ring-2 ring-black">
                AB
              </div>
           </div>
        </div>
      </div>
    </header>
  );
}