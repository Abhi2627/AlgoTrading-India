// frontend/src/lib/assets.ts

export const ASSETS = [
  // --- TOP NIFTY 50 STOCKS (India) ---
  // FIX: Changed type to "Stocks" (plural) to match the Tab ID
  // FIX: Added 'price' and 'change' placeholders to prevent crashes
  { symbol: "RELIANCE.NS", name: "Reliance Industries", type: "Stocks", sector: "Energy", price: 2987.50, change: 1.2 },
  { symbol: "TCS.NS", name: "Tata Consultancy Svc", type: "Stocks", sector: "IT", price: 3980.00, change: -0.5 },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", type: "Stocks", sector: "Banking", price: 1450.00, change: -1.1 },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", type: "Stocks", sector: "Banking", price: 1080.00, change: 0.8 },
  { symbol: "INFY.NS", name: "Infosys", type: "Stocks", sector: "IT", price: 1650.00, change: 1.5 },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", type: "Stocks", sector: "Telecom", price: 1200.00, change: 2.1 },
  { symbol: "ITC.NS", name: "ITC Limited", type: "Stocks", sector: "FMCG", price: 430.00, change: 0.2 },
  { symbol: "SBIN.NS", name: "State Bank of India", type: "Stocks", sector: "Banking", price: 760.00, change: 1.8 },
  { symbol: "LICI.NS", name: "LIC India", type: "Stocks", sector: "Insurance", price: 980.00, change: -0.3 },
  { symbol: "LT.NS", name: "Larsen & Toubro", type: "Stocks", sector: "Construction", price: 3600.00, change: 1.1 },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", type: "Stocks", sector: "FMCG", price: 2400.00, change: -0.8 },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", type: "Stocks", sector: "Auto", price: 980.00, change: 3.4 },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", type: "Stocks", sector: "Finance", price: 6800.00, change: 0.1 },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", type: "Stocks", sector: "IT", price: 1500.00, change: 0.9 },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", type: "Stocks", sector: "Auto", price: 11500.00, change: 1.2 },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharma", type: "Stocks", sector: "Pharma", price: 1500.00, change: 0.5 },
  { symbol: "TITAN.NS", name: "Titan Company", type: "Stocks", sector: "Consumer", price: 3600.00, change: -1.2 },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises", type: "Stocks", sector: "Metals", price: 3200.00, change: 4.5 },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra", type: "Stocks", sector: "Banking", price: 1750.00, change: -0.4 },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints", type: "Stocks", sector: "Consumer", price: 2900.00, change: 0.3 },
  { symbol: "AXISBANK.NS", name: "Axis Bank", type: "Stocks", sector: "Banking", price: 1100.00, change: 0.7 },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", type: "Stocks", sector: "Materials", price: 9800.00, change: 1.1 },
  { symbol: "WIPRO.NS", name: "Wipro", type: "Stocks", sector: "IT", price: 480.00, change: -0.9 },
  { symbol: "POWERGRID.NS", name: "Power Grid Corp", type: "Stocks", sector: "Power", price: 280.00, change: 0.6 },
  { symbol: "NTPC.NS", name: "NTPC Limited", type: "Stocks", sector: "Power", price: 340.00, change: 1.4 },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra", type: "Stocks", sector: "Auto", price: 1900.00, change: 2.2 },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel", type: "Stocks", sector: "Metals", price: 850.00, change: 0.4 },
  { symbol: "TATASTEEL.NS", name: "Tata Steel", type: "Stocks", sector: "Metals", price: 150.00, change: 0.8 },
  { symbol: "COALINDIA.NS", name: "Coal India", type: "Stocks", sector: "Mining", price: 450.00, change: 1.3 },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports", type: "Stocks", sector: "Infrastructure", price: 1300.00, change: 3.1 },

  // --- CRYPTO ---
  { symbol: "BTC-USD", name: "Bitcoin", type: "Crypto", sector: "Coin", price: 67000.00, change: 4.5 },
  { symbol: "ETH-USD", name: "Ethereum", type: "Crypto", sector: "Smart Contract", price: 3500.00, change: 2.1 },
  { symbol: "SOL-USD", name: "Solana", type: "Crypto", sector: "L1 Chain", price: 145.00, change: -5.2 },
  { symbol: "BNB-USD", name: "Binance Coin", type: "Crypto", sector: "Exchange", price: 580.00, change: 1.1 },
  { symbol: "XRP-USD", name: "Ripple", type: "Crypto", sector: "Payment", price: 0.60, change: 0.5 },
  { symbol: "DOGE-USD", name: "Dogecoin", type: "Crypto", sector: "Meme", price: 0.15, change: 8.4 },

  // --- FOREX ---
  { symbol: "EURUSD=X", name: "EUR/USD", type: "Forex", sector: "Major", price: 1.08, change: 0.01 },
  { symbol: "GBPUSD=X", name: "GBP/USD", type: "Forex", sector: "Major", price: 1.26, change: -0.02 },
  { symbol: "JPY=X", name: "USD/JPY", type: "Forex", sector: "Major", price: 151.00, change: 0.3 },
  { symbol: "INR=X", name: "USD/INR", type: "Forex", sector: "Domestic", price: 83.40, change: 0.05 },
];

export const SECTORS = ["All", "Banking", "IT", "Energy", "Auto", "FMCG", "Crypto"];