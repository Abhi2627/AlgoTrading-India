const axios = require('axios');

class MarketDataService {
    constructor() {
        this.baseURL = 'https://query1.finance.yahoo.com/v8/finance/chart';
        this.cache = new Map();
        this.cacheDuration = 60000; // 1 minute cache
    }

    // Get current price for a symbol (Indian stocks use .NS suffix)
    async getCurrentPrice(symbol) {
        try {
            const cacheKey = `price_${symbol}`;
            const cached = this.getFromCache(cacheKey);
            
            if (cached) {
                console.log(`📊 Using cached price for ${symbol}: $${cached}`);
                return cached;
            }

            console.log(`📡 Fetching live price for ${symbol}...`);
            const response = await axios.get(`${this.baseURL}/${symbol}.NS?interval=1m`, {
                timeout: 5000
            });
            
            if (response.data.chart.result && response.data.chart.result[0]) {
                const price = response.data.chart.result[0].meta.regularMarketPrice;
                console.log(`✅ Live price for ${symbol}: $${price}`);
                
                this.setCache(cacheKey, price);
                return price;
            } else {
                throw new Error('Price data not available from API');
            }
        } catch (error) {
            console.error(`❌ Error fetching price for ${symbol}:`, error.message);
            console.log(`🔄 Using mock price for ${symbol}`);
            // Fallback to mock data for development
            return this.getMockPrice(symbol);
        }
    }

    // Get historical data (for future backtesting)
    async getHistoricalData(symbol, period = '1mo') {
        try {
            console.log(`📡 Fetching historical data for ${symbol} (${period})...`);
            const response = await axios.get(
                `${this.baseURL}/${symbol}.NS?range=${period}&interval=1d`,
                { timeout: 10000 }
            );
            
            if (response.data.chart.result && response.data.chart.result[0]) {
                const result = response.data.chart.result[0];
                return {
                    symbol: symbol,
                    timestamps: result.timestamp,
                    prices: result.indicators.quote[0],
                    meta: result.meta
                };
            } else {
                throw new Error('Historical data not available');
            }
        } catch (error) {
            console.error(`❌ Error fetching historical data for ${symbol}:`, error.message);
            console.log(`🔄 Using mock historical data for ${symbol}`);
            return this.getMockHistoricalData(symbol);
        }
    }

    // Simple cache implementation
    getFromCache(key) {
        const item = this.cache.get(key);
        if (item && Date.now() - item.timestamp < this.cacheDuration) {
            return item.data;
        }
        this.cache.delete(key); // Remove expired cache
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    // Mock data fallback for development
    getMockPrice(symbol) {
        const mockPrices = {
            'RELIANCE': 2456.75,
            'TCS': 3315.20,
            'INFY': 1550.80,
            'HDFCBANK': 1445.60,
            'ICICIBANK': 910.35,
            'HDFC': 2650.45,
            'BHARTIARTL': 715.80,
            'ITC': 425.60,
            'KOTAKBANK': 1680.90,
            'LT': 3150.25
        };
        const price = mockPrices[symbol] || (1000 + Math.random() * 1000);
        console.log(`🤖 Mock price for ${symbol}: $${price.toFixed(2)}`);
        return price;
    }

    getMockHistoricalData(symbol) {
        const basePrice = this.getMockPrice(symbol);
        const timestamps = [];
        const prices = { open: [], high: [], low: [], close: [] };
        
        // Generate 30 days of mock data
        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            timestamps.push(Math.floor(date.getTime() / 1000));
            
            const variation = (Math.random() - 0.5) * 100;
            const dayPrice = basePrice + variation;
            
            prices.open.push(dayPrice - 10);
            prices.high.push(dayPrice + 15);
            prices.low.push(dayPrice - 15);
            prices.close.push(dayPrice);
        }

        return {
            symbol: symbol,
            timestamps: timestamps,
            prices: prices,
            meta: { 
                currency: 'INR', 
                exchangeName: 'NSE',
                instrumentType: 'EQUITY'
            }
        };
    }

    // Get multiple prices at once
    async getBulkPrices(symbols) {
        const pricePromises = symbols.map(symbol => this.getCurrentPrice(symbol));
        const prices = await Promise.all(pricePromises);
        
        return symbols.map((symbol, index) => ({
            symbol,
            price: prices[index],
            currency: 'INR',
            lastUpdated: new Date().toISOString()
        }));
    }
}

module.exports = new MarketDataService();