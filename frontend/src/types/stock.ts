// Centralized type definitions for the application

export interface Stock {
  symbol: string;
  name: string;
  current_price: number;
  previous_close?: number;
  change_percent: number;
  day_high?: number;
  day_low?: number;
  volume: number;
  market_cap: number;
  sector?: string;
  ai_signal: 'BUY' | 'SELL' | 'HOLD';
  ai_confidence: number;
  signal_strength?: number;
  rsi?: number;
}

export interface SectorData {
  [sector: string]: Stock[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  served_by?: string;
  note?: string;
  timestamp?: string;
}

// Add to existing types/stock.ts

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface PortfolioSummary {
  portfolioValue: number;
  availableCash: number;
  totalInvested: number;
  totalPnl: number;
  totalPnlPercent: number;
  positions: PortfolioPosition[];
  totalTrades: number;
  initialCapital: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
}

export interface Trade {
  type: 'BUY' | 'SELL';
  symbol: string;
  quantity: number;
  price: number;
  totalCost?: number;
  totalValue?: number;
  timestamp: string;
}

export interface TradeRequest {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
}