/**
 * AutoTradingService Class
 * Handles the automated execution of trades based on AI signals
 * and manages portfolio state via the Portfolio Manager.
 */
const aiTradingService = require('./aiTradingService');
const portfolioManager = require('../portfolioManager');

class AutoTradingService {
    constructor() {
        this.isRunning = false;
        this.tradingInterval = null;
        this.settings = {
            maxPositionSize: 0.1, // 10% of portfolio per trade
            maxDailyTrades: 10,   // Increased trades for testing
            stopLossPercent: 0.05, // 5% stop loss (currently not implemented in executeTrade)
            takeProfitPercent: 0.10, // 10% take profit (currently not implemented in executeTrade)
            minConfidence: 55 // Lowered minimum AI confidence for more trades
        };
        this.dailyStats = {
            tradesToday: 0,
            lastTradeTime: null,
            dailyPnL: 0
        };
        console.log('✅ AutoTradingService initialized');
    }

    // Start automated trading
    async startTrading(symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK']) {
        if (this.isRunning) {
            console.log('⚠️ Auto trading already running');
            return { success: false, message: 'Auto trading already running' };
        }

        console.log('🚀 Starting automated trading...');
        this.isRunning = true;
        this.dailyStats.tradesToday = 0;
        this.dailyStats.lastTradeTime = new Date();

        // Run trading every 5 minutes
        this.tradingInterval = setInterval(async () => {
            await this.executeTradingCycle(symbols);
        }, 5 * 60 * 1000); // 5 minutes

        // Initial execution
        await this.executeTradingCycle(symbols);

        return { success: true, message: 'Auto trading started', symbols };
    }

    // Stop automated trading
    stopTrading() {
        if (this.tradingInterval) {
            clearInterval(this.tradingInterval);
            this.tradingInterval = null;
        }
        this.isRunning = false;
        console.log('🛑 Automated trading stopped');
        return { success: true, message: 'Auto trading stopped' };
    }

    // Main trading cycle
    async executeTradingCycle(symbols) {
        if (!this.isRunning) return;

        console.log(`🤖 Executing trading cycle for ${symbols.length} symbols...`);
        
        try {
            // Get portfolio summary
            const portfolio = await portfolioManager.getPortfolioSummary();
            console.log(`💰 Portfolio: ₹${portfolio.availableCapital?.toFixed(2) || 'N/A'} available`);
            
            // Reset daily stats if it's a new day
            this.resetDailyStatsIfNeeded();

            // Get AI signals for all symbols
            const signals = await aiTradingService.getBulkSignals(symbols, 'test_aggressive');
            console.log(`📡 AI Signals received:`, signals.map(s => `${s.symbol}: ${s.signal} (${s.confidence}%)`));
            
            let executedTrades = 0;
            
            // Execute trades based on signals
            for (const signal of signals) {
                if (this.dailyStats.tradesToday >= this.settings.maxDailyTrades) {
                    console.log('📊 Daily trade limit reached');
                    break;
                }

                console.log(`🎯 Evaluating ${signal.symbol}: ${signal.signal} with ${signal.confidence}% confidence (min: ${this.settings.minConfidence}%)`);
                
                if (signal.confidence >= this.settings.minConfidence) {
                    const result = await this.executeTrade(signal, portfolio);
                    if (result) {
                        executedTrades++;
                    }
                } else {
                    console.log(`⏭️  Skipping ${signal.symbol} - confidence too low`);
                }
            }

            console.log(`✅ Trading cycle completed. Executed ${executedTrades} trades. Total today: ${this.dailyStats.tradesToday}`);
            
        } catch (error) {
            console.error('❌ Error in trading cycle:', error);
        }
    }

    // Execute a single trade
    async executeTrade(signal, portfolio) {
        try {
            const { symbol, signal: action, confidence } = signal;
            
            // The PortfolioManager handles price fetching, so we just need the symbol and quantity.
            const currentPrice = 1; // Placeholder, as PM should fetch this.
            
            // Calculate position size based on portfolio and settings
            const positionSize = this.calculatePositionSize(portfolio, currentPrice);
            
            if (positionSize.quantity === 0) {
                console.log(`💰 Insufficient capital for significant trade size for ${symbol}`);
                return null;
            }

            let result;
            if (action === 'BUY') {
                if (portfolio.availableCapital < positionSize.cost) {
                    console.log(`💰 Insufficient capital to execute BUY order for ${symbol}`);
                    return null;
                }
                result = await portfolioManager.buyStock(symbol, positionSize.quantity);
                console.log(`✅ AUTO BUY: ${positionSize.quantity} ${symbol}`);

            } else if (action === 'SELL') {
                // Check if we have enough shares to sell
                const currentHolding = portfolio.holdings[symbol];
                
                // If we have holdings, sell the determined quantity (up to max holding)
                if (currentHolding && currentHolding.quantity >= positionSize.quantity) {
                    result = await portfolioManager.sellStock(symbol, positionSize.quantity);
                    console.log(`✅ AUTO SELL: ${positionSize.quantity} ${symbol}`);
                } else {
                    console.log(`📦 Insufficient holdings of ${symbol} to sell or no clear SELL signal`);
                    // This is not an error, just skipping a SELL action
                    return null;
                }
            } else {
                return null; // HOLD signal, do nothing
            }

            // Update daily stats upon successful trade execution
            this.dailyStats.tradesToday++;
            this.dailyStats.lastTradeTime = new Date();

            return result;

        } catch (error) {
            // Note: Error handling should be more robust here (e.g., catching 'Insufficient Capital' errors from PM)
            console.error(`❌ Error executing trade for ${signal.symbol}:`, error.message);
            return null;
        }
    }

    // Calculate position size based on risk management
    // Calculate position size based on risk management - UPDATED FOR REAL PRICES
    calculatePositionSize(portfolio, currentPrice) {
        const availableCapital = portfolio.availableCapital;
        const maxTradeValue = availableCapital * this.settings.maxPositionSize;
        
        const maxShares = Math.floor(maxTradeValue / currentPrice);
        const quantity = Math.max(1, Math.min(maxShares, 2)); // Reduced from 10 to 2 shares max
        
        return {
            quantity,
            cost: quantity * currentPrice,
            percentOfPortfolio: (quantity * currentPrice) / portfolio.currentTotalValue
        };
    }

    // Reset daily stats if it's a new day
    resetDailyStatsIfNeeded() {
        const now = new Date();
        const lastTradeDate = this.dailyStats.lastTradeTime ? 
            new Date(this.dailyStats.lastTradeTime) : new Date(0);
        
        if (now.toDateString() !== lastTradeDate.toDateString()) {
            console.log('📅 New trading day - resetting daily stats');
            this.dailyStats.tradesToday = 0;
            this.dailyStats.dailyPnL = 0;
        }
    }

    // Get trading status
    getStatus() {
        return {
            isRunning: this.isRunning,
            settings: this.settings,
            dailyStats: this.dailyStats,
            lastUpdate: new Date().toISOString()
        };
    }

    // Update trading settings
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        console.log('⚙️ Trading settings updated:', this.settings);
        return { success: true, settings: this.settings };
    }
}

module.exports = new AutoTradingService();