const Portfolio = require('./models/Portfolio');
const marketDataService = require('./services/marketDataService');

class PortfolioManager {
    constructor() {
        this.portfolio = {
            capital: 1000,
            holdings: {},
            transactions: [],
        };
        this.currentPortfolio = null;
        this.loadFromDatabase(); // Load existing data from DB
    }

    async loadFromDatabase() {
        try {
            this.currentPortfolio = await Portfolio.findOne({ userId: 'default-user' });
            
            if (this.currentPortfolio) {
                console.log('📂 Loading portfolio from database...');
                
                // Convert database format to our working format
                this.portfolio.capital = this.currentPortfolio.capital;
                this.portfolio.holdings = {};
                this.portfolio.transactions = this.currentPortfolio.transactions;
                
                // Convert holdings array to object
                this.currentPortfolio.holdings.forEach(holding => {
                    this.portfolio.holdings[holding.symbol] = {
                        quantity: holding.quantity,
                        averagePrice: holding.averagePrice,
                        totalCost: holding.totalCost
                    };
                });
                
                console.log('✅ Portfolio loaded from database');
            } else {
                console.log('📝 No existing portfolio found, creating new one with 1000 capital');
                await this.saveToDatabase();
            }
        } catch (error) {
            console.error('❌ Error loading from database:', error.message);
        }
    }

    async saveToDatabase() {
        try {
            // Convert our holdings object to array for database
            const holdingsArray = Object.entries(this.portfolio.holdings).map(([symbol, holding]) => ({
                symbol: symbol,
                quantity: holding.quantity,
                averagePrice: holding.averagePrice,
                totalCost: holding.totalCost
            }));

            this.currentPortfolio = await Portfolio.findOneAndUpdate(
                { userId: 'default-user' },
                {
                    userId: 'default-user',
                    capital: this.portfolio.capital,
                    holdings: holdingsArray,
                    transactions: this.portfolio.transactions
                },
                { upsert: true, new: true }
            );
            
            console.log('💾 Portfolio saved to database');
        } catch (error) {
            console.error('❌ Error saving to database:', error.message);
        }
    }

    // ENHANCED: Calculate portfolio value using REAL market prices
    async getPortfolioSummary() {
        try {
            let totalHoldingsValue = 0;
            const holdingsWithPrices = {};
            
            // Calculate current value of each holding using real market prices
            for (const [symbol, holding] of Object.entries(this.portfolio.holdings)) {
                try {
                    const currentPrice = await marketDataService.getCurrentPrice(symbol);
                    const currentValue = holding.quantity * currentPrice;
                    
                    totalHoldingsValue += currentValue;
                    
                    // Add current price info to holdings data
                    holdingsWithPrices[symbol] = {
                        ...holding,
                        currentPrice: currentPrice,
                        currentValue: currentValue,
                        unrealizedPL: currentValue - (holding.quantity * holding.averagePrice),
                        unrealizedPLPercentage: ((currentValue - (holding.quantity * holding.averagePrice)) / (holding.quantity * holding.averagePrice)) * 100
                    };
                } catch (error) {
                    console.error(`Error getting price for ${symbol}:`, error.message);
                    // Fallback to book value if real price unavailable
                    const bookValue = holding.quantity * holding.averagePrice;
                    totalHoldingsValue += bookValue;
                    
                    holdingsWithPrices[symbol] = {
                        ...holding,
                        currentPrice: holding.averagePrice, // Use average price as fallback
                        currentValue: bookValue,
                        unrealizedPL: 0,
                        unrealizedPLPercentage: 0
                    };
                }
            }

            // CORRECTED: Calculate current total value properly
            const currentTotalValue = this.portfolio.capital + totalHoldingsValue;
            const totalInvested = this.calculateTotalInvested();
            const totalProfitLoss = currentTotalValue - 1000; // Based on initial 1000 capital

            return {
                // Basic portfolio info
                capital: this.portfolio.capital,
                currentTotalValue: currentTotalValue, // This should be capital + holdingsValue
                totalInvested: totalInvested,
                totalProfitLoss: totalProfitLoss,
                totalProfitLossPercentage: (totalProfitLoss / 1000) * 100,
                
                // Enhanced holdings data with real prices
                holdings: holdingsWithPrices,
                transactions: this.portfolio.transactions,
                
                // Performance metrics
                availableCapital: this.portfolio.capital,
                holdingsValue: totalHoldingsValue,
                
                // Metadata
                lastUpdated: new Date().toISOString(),
                initialCapital: 1000
            };
        } catch (error) {
            console.error('Error calculating portfolio summary:', error);
            // Fallback to basic calculation if real prices fail
            return this.getBasicPortfolioSummary();
        }
    }

    // Fallback method if real price fetching fails
    getBasicPortfolioSummary() {
        const totalInvested = this.calculateTotalInvested();
        const currentValue = this.portfolio.capital + totalInvested;
        
        return {
            capital: this.portfolio.capital,
            holdings: this.portfolio.holdings,
            currentValue: currentValue,
            totalInvested: totalInvested,
            profitLoss: currentValue - 1000,
            availableCapital: this.portfolio.capital,
            lastUpdated: new Date().toISOString(),
            note: 'Using book values - real prices unavailable'
        };
    }

    calculateTotalInvested() {
        return Object.values(this.portfolio.holdings).reduce((total, holding) => {
            return total + (holding.quantity * holding.averagePrice);
        }, 0);
    }

    // ENHANCED: Buy stock using current market price
    async buyStock(symbol, quantity) {
        try {
            console.log(`🛒 Buying ${quantity} shares of ${symbol}...`);
            
            // Get current market price
            const currentPrice = await marketDataService.getCurrentPrice(symbol);
            console.log(`💰 Current market price for ${symbol}: $${currentPrice}`);
            
            return await this.buyStockAtPrice(symbol, quantity, currentPrice);
        } catch (error) {
            throw new Error(`Cannot fetch current price for ${symbol}: ${error.message}`);
        }
    }

    async buyStockAtPrice(symbol, quantity, price) {
        const cost = quantity * price;
        
        // Validation
        if (cost > this.portfolio.capital) {
            throw new Error(`Insufficient capital. Needed: $${cost.toFixed(2)}, Available: $${this.portfolio.capital.toFixed(2)}`);
        }

        if (quantity <= 0) {
            throw new Error('Quantity must be positive');
        }

        // Update capital
        this.portfolio.capital -= cost;
        
        // Initialize holding if it doesn't exist
        if (!this.portfolio.holdings[symbol]) {
            this.portfolio.holdings[symbol] = {
                quantity: 0,
                averagePrice: 0,
                totalCost: 0
            };
        }

        // Update holding with new purchase
        const holding = this.portfolio.holdings[symbol];
        const totalCost = holding.totalCost + cost;
        const totalQuantity = holding.quantity + quantity;
        
        holding.quantity = totalQuantity;
        holding.averagePrice = totalCost / totalQuantity;
        holding.totalCost = totalCost;

        // Record transaction
        this.portfolio.transactions.push({
            type: 'BUY',
            symbol,
            quantity,
            price,
            totalCost: cost,
            timestamp: new Date()
        });

        // Save to database
        await this.saveToDatabase();
        
        console.log(`✅ Successfully bought ${quantity} ${symbol} at $${price} each (Total: $${cost.toFixed(2)})`);
        
        return this.getPortfolioSummary();
    }

    // ENHANCED: Sell stock using current market price
    async sellStock(symbol, quantity) {
        try {
            console.log(`🏷️ Selling ${quantity} shares of ${symbol}...`);
            
            // Get current market price
            const currentPrice = await marketDataService.getCurrentPrice(symbol);
            console.log(`💰 Current market price for ${symbol}: $${currentPrice}`);
            
            return await this.sellStockAtPrice(symbol, quantity, currentPrice);
        } catch (error) {
            throw new Error(`Cannot fetch current price for ${symbol}: ${error.message}`);
        }
    }

    async sellStockAtPrice(symbol, quantity, price) {
        // Validation
        if (!this.portfolio.holdings[symbol]) {
            throw new Error(`No holdings found for ${symbol}`);
        }

        const holding = this.portfolio.holdings[symbol];
        
        if (holding.quantity < quantity) {
            throw new Error(`Insufficient holdings. Requested: ${quantity}, Available: ${holding.quantity}`);
        }

        if (quantity <= 0) {
            throw new Error('Quantity must be positive');
        }

        // Calculate revenue and update capital
        const revenue = quantity * price;
        this.portfolio.capital += revenue;

        // Update holding
        holding.quantity -= quantity;

        // Remove holding if quantity becomes zero
        if (holding.quantity === 0) {
            delete this.portfolio.holdings[symbol];
        }

        // Record transaction
        this.portfolio.transactions.push({
            type: 'SELL',
            symbol,
            quantity,
            price,
            totalRevenue: revenue,
            timestamp: new Date()
        });

        // Save to database
        await this.saveToDatabase();
        
        console.log(`✅ Successfully sold ${quantity} ${symbol} at $${price} each (Total: $${revenue.toFixed(2)})`);
        
        return this.getPortfolioSummary();
    }

    async resetPortfolio(capital = 1000) {
        this.portfolio = {
            capital: capital,
            holdings: {},
            transactions: [],
        };
        
        await this.saveToDatabase();
        console.log('✅ Portfolio reset and saved to database');
        return this.getPortfolioSummary();
    }

    // NEW: Get portfolio performance analytics
    async getPortfolioAnalytics() {
        const summary = await this.getPortfolioSummary();
        
        // Calculate additional analytics
        const totalHoldings = Object.keys(summary.holdings).length;
        const sectors = {}; // We'll enhance this later with sector data
        
        return {
            ...summary,
            analytics: {
                totalHoldings: totalHoldings,
                diversificationScore: totalHoldings > 5 ? 'Good' : totalHoldings > 2 ? 'Moderate' : 'Low',
                riskLevel: this.calculateRiskLevel(summary.holdings),
                sectors: sectors
            }
        };
    }

    calculateRiskLevel(holdings) {
        // Simple risk calculation based on number of holdings
        const count = Object.keys(holdings).length;
        if (count >= 10) return 'Low';
        if (count >= 5) return 'Medium';
        if (count >= 1) return 'High';
        return 'No Holdings';
    }
}

module.exports = new PortfolioManager();