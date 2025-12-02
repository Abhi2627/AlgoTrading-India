"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import StockDashboard from "@/components/StockDashBoard"; 
import Header from "@/components/Header";

export default function AssetDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = decodeURIComponent(params.symbol as string);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <button 
          // FIX: Explicitly go to the Home URL instead of 'back()'
          onClick={() => router.push('/')}
          className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors text-sm font-bold bg-[#1e293b] px-4 py-2 rounded-lg w-fit"
        >
          <ArrowLeft size={16} className="mr-2"/> Back to Market
        </button>

        <StockDashboard initialSymbol={symbol} />
      </main>
    </div>
  );
}