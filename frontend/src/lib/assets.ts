// frontend/src/lib/assets.ts

export const ASSETS = [
  // --- TOP NIFTY 50 STOCKS (India) ---
  { symbol: "RELIANCE.NS", name: "Reliance Industries", type: "Stocks", sector: "Energy" },
  { symbol: "TCS.NS", name: "Tata Consultancy Svc", type: "Stocks", sector: "IT" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", type: "Stocks", sector: "Banking" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", type: "Stocks", sector: "Banking" },
  { symbol: "INFY.NS", name: "Infosys", type: "Stocks", sector: "IT" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", type: "Stocks", sector: "Telecom" },
  { symbol: "ITC.NS", name: "ITC Limited", type: "Stocks", sector: "FMCG" },
  { symbol: "SBIN.NS", name: "State Bank of India", type: "Stocks", sector: "Banking" },
  { symbol: "LICI.NS", name: "LIC India", type: "Stocks", sector: "Insurance" },
  { symbol: "LT.NS", name: "Larsen & Toubro", type: "Stocks", sector: "Construction" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", type: "Stocks", sector: "FMCG" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", type: "Stocks", sector: "Auto" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", type: "Stocks", sector: "Finance" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", type: "Stocks", sector: "IT" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", type: "Stocks", sector: "Auto" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharma", type: "Stocks", sector: "Pharma" },
  { symbol: "TITAN.NS", name: "Titan Company", type: "Stocks", sector: "Consumer" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises", type: "Stocks", sector: "Metals" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra", type: "Stocks", sector: "Banking" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints", type: "Stocks", sector: "Consumer" },
  { symbol: "AXISBANK.NS", name: "Axis Bank", type: "Stocks", sector: "Banking" },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", type: "Stocks", sector: "Materials" },
  { symbol: "WIPRO.NS", name: "Wipro", type: "Stocks", sector: "IT" },
  { symbol: "POWERGRID.NS", name: "Power Grid Corp", type: "Stocks", sector: "Power" },
  { symbol: "NTPC.NS", name: "NTPC Limited", type: "Stocks", sector: "Power" },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra", type: "Stocks", sector: "Auto" },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel", type: "Stocks", sector: "Metals" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel", type: "Stocks", sector: "Metals" },
  { symbol: "COALINDIA.NS", name: "Coal India", type: "Stocks", sector: "Mining" },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports", type: "Stocks", sector: "Infrastructure" },

  // --- CRYPTO ---
  { symbol: "BTC-USD", name: "Bitcoin", type: "Crypto", sector: "Coin" },
  { symbol: "ETH-USD", name: "Ethereum", type: "Crypto", sector: "Smart Contract" },
  { symbol: "SOL-USD", name: "Solana", type: "Crypto", sector: "L1 Chain" },
  { symbol: "BNB-USD", name: "Binance Coin", type: "Crypto", sector: "Exchange" },
  { symbol: "XRP-USD", name: "Ripple", type: "Crypto", sector: "Payment" },
  { symbol: "DOGE-USD", name: "Dogecoin", type: "Crypto", sector: "Meme" },

  // --- FOREX ---
  { symbol: "EURUSD=X", name: "EUR/USD", type: "Forex", sector: "Major" },
  { symbol: "GBPUSD=X", name: "GBP/USD", type: "Forex", sector: "Major" },
  { symbol: "JPY=X", name: "USD/JPY", type: "Forex", sector: "Major" },
  { symbol: "INR=X", name: "USD/INR", type: "Forex", sector: "Domestic" },
];

export const SECTORS = ["All", "Banking", "IT", "Energy", "Auto", "FMCG", "Crypto"];