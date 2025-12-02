// frontend/src/lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// 1. Define the Data Types
export interface StockPrediction {
  symbol: string;
  current_price: number;
  predicted_price: number;
  expected_move_pct: number;
  signal: string;
  confidence: number;
  sentiment_score: number;
  recent_news: { title: string; source: string; link: string }[];
  chart_data: { 
    time: string; 
    open: number; 
    high: number; 
    low: number; 
    close: number; 
    volume: number;
  }[];
  volume: number;
  market_cap: number;
}

// 2. Fetch Stock Data (Price + AI + Charts)
export async function fetchStockPrediction(symbol: string): Promise<StockPrediction | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/predict/${symbol}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store' 
    });

    if (!response.ok) throw new Error("Aladdin is offline");
    return await response.json();
  } catch (error) {
    console.error("Error asking Aladdin:", error);
    return null;
  }
}

// 3. Fetch Wallet Balance
export async function fetchWalletBalance() {
  try {
    const res = await fetch(`${API_BASE_URL}/wallet`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch wallet");
    return await res.json();
  } catch (error) {
    console.error("Wallet Error:", error);
    return { balance: 0 }; // Fallback
  }
}

// 4. Execute Trade (Buy/Sell)
export async function placeTrade(symbol: string, action: "BUY" | "SELL", price: number, quantity: number) {
  const res = await fetch(`${API_BASE_URL}/trade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, action, price, quantity }) // Send actual quantity
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Trade Failed");
  }
  return await res.json();
}

export async function fetchTradeHistory() {
  try {
    const res = await fetch(`${API_BASE_URL}/trades`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.trades;
  } catch (error) {
    console.error("History Error:", error);
    return [];
  }
}