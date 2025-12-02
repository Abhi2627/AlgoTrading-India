export const ASSETS = [
  // --- STOCKS: TECHNOLOGY ---
  { symbol: "TCS.NS", name: "Tata Consultancy Svc", type: "Stocks", sector: "Technology", price: 3980, change: 1.2 },
  { symbol: "INFY.NS", name: "Infosys Limited", type: "Stocks", sector: "Technology", price: 1650, change: -0.5 },
  { symbol: "TECHM.NS", name: "Tech Mahindra", type: "Stocks", sector: "Technology", price: 1200, change: 0.8 },

  // --- STOCKS: FINANCE ---
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd", type: "Stocks", sector: "Finance", price: 1450, change: -1.1 },
  { symbol: "SBIN.NS", name: "State Bank of India", type: "Stocks", sector: "Finance", price: 760, change: 2.3 },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", type: "Stocks", sector: "Finance", price: 6800, change: 0.1 },

  // --- STOCKS: ENERGY/POWER ---
  { symbol: "RELIANCE.NS", name: "Reliance Industries", type: "Stocks", sector: "Energy", price: 2980, change: 0.5 },
  { symbol: "TATAPOWER.NS", name: "Tata Power Co", type: "Stocks", sector: "Power", price: 380, change: 3.4 },
  { symbol: "NTPC.NS", name: "NTPC Limited", type: "Stocks", sector: "Power", price: 340, change: 1.2 },

  // --- CRYPTO ---
  { symbol: "BTC-USD", name: "Bitcoin", type: "Crypto", sector: "Coin", price: 65000, change: 4.5 },
  { symbol: "ETH-USD", name: "Ethereum", type: "Crypto", sector: "Smart Contract", price: 3500, change: 2.1 },
  { symbol: "SOL-USD", name: "Solana", type: "Crypto", sector: "L1", price: 145, change: -5.2 },

  // --- FOREX ---
  { symbol: "EURUSD=X", name: "EUR/USD", type: "Forex", sector: "Major", price: 1.08, change: 0.01 },
  { symbol: "GBPUSD=X", name: "GBP/USD", type: "Forex", sector: "Major", price: 1.26, change: -0.02 },
];

export const SECTORS = ["Technology", "Finance", "Energy", "Power"];