class AITradingService {
    constructor() {
        this.strategies = {
            momentum: this.momentumStrategy.bind(this),
            meanReversion: this.meanReversionStrategy.bind(this),
            rsiStrategy: this.rsiStrategy.bind(this),
            volumeStrategy: this.volumeStrategy.bind(this)
        };
    }

    // Generate trading signals based on historical data
    // Generate trading signals based on historical data
    async generateSignals(symbol, historicalData) {
        try {
            const signals = [];
            
            // Calculate technical indicators (simplified versions)
            const rsi = this.calculateSimpleRSI(historicalData);
            const sma = this.calculateSimpleSMA(historicalData);
            const volumeAvg = this.calculateVolumeAverage(historicalData);
            
            // Apply different strategies
            const momentumSignal = this.strategies.momentum(historicalData, sma);
            const meanReversionSignal = this.strategies.meanReversion(historicalData, sma);
            const rsiSignal = this.strategies.rsiStrategy(rsi);
            const volumeSignal = this.strategies.volumeStrategy(historicalData, volumeAvg);
            
            // Combine signals with confidence scores
            const combinedSignal = this.combineSignals([
                { signal: momentumSignal, weight: 0.3 },
                { signal: meanReversionSignal, weight: 0.25 },
                { signal: rsiSignal, weight: 0.25 },
                { signal: volumeSignal, weight: 0.2 }
            ]);

            // ADD TEST AGGRESSIVE MODE - Always generate trading signals for testing
            const testAggressiveMode = true; // Set to true to enable test mode
            
            if (testAggressiveMode) {
                // Override with aggressive test signals
                const testSignals = ['BUY', 'SELL', 'BUY', 'SELL', 'HOLD'];
                const randomSignal = testSignals[Math.floor(Math.random() * testSignals.length)];
                const testConfidence = randomSignal === 'HOLD' ? 60 : 80;
                
                console.log(`🎯 TEST MODE: ${symbol} -> ${randomSignal} (${testConfidence}%)`);
                
                return {
                    symbol,
                    signal: randomSignal,
                    confidence: testConfidence,
                    indicators: {
                        rsi: rsi.current,
                        sma: sma.current,
                        currentPrice: historicalData.close[historicalData.close.length - 1],
                        volumeRatio: volumeSignal.volumeRatio
                    },
                    strategies: {
                        momentum: momentumSignal,
                        meanReversion: meanReversionSignal,
                        rsi: rsiSignal,
                        volume: volumeSignal
                    },
                    timestamp: new Date().toISOString(),
                    note: 'TEST MODE - Aggressive signals'
                };
            }
            
            return {
                symbol,
                signal: combinedSignal.signal,
                confidence: combinedSignal.confidence,
                indicators: {
                    rsi: rsi.current,
                    sma: sma.current,
                    currentPrice: historicalData.close[historicalData.close.length - 1],
                    volumeRatio: volumeSignal.volumeRatio
                },
                strategies: {
                    momentum: momentumSignal,
                    meanReversion: meanReversionSignal,
                    rsi: rsiSignal,
                    volume: volumeSignal
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error(`Error generating signals for ${symbol}:`, error);
            throw error;
        }
    }

    // Momentum Strategy: Buy when price is above moving average
    momentumStrategy(historicalData, sma) {
        const prices = historicalData.close;
        const currentPrice = prices[prices.length - 1];
        const currentSMA = sma.current;
        
        const priceToSMA = currentPrice / currentSMA;
        
        if (priceToSMA > 1.03) { // 3% above SMA - strong momentum
            return { signal: 'BUY', confidence: 75, priceToSMA };
        } else if (priceToSMA < 0.97) { // 3% below SMA - weak momentum
            return { signal: 'SELL', confidence: 65, priceToSMA };
        } else {
            return { signal: 'HOLD', confidence: 50, priceToSMA };
        }
    }

    // Mean Reversion Strategy: Buy when price is significantly below average
    meanReversionStrategy(historicalData, sma) {
        const prices = historicalData.close;
        const currentPrice = prices[prices.length - 1];
        const currentSMA = sma.current;
        const deviation = (currentPrice - currentSMA) / currentSMA;
        
        if (deviation < -0.06) { // 6% below SMA - oversold
            return { signal: 'BUY', confidence: 80, deviation };
        } else if (deviation > 0.06) { // 6% above SMA - overbought
            return { signal: 'SELL', confidence: 70, deviation };
        } else {
            return { signal: 'HOLD', confidence: 55, deviation };
        }
    }

    // Simple RSI Strategy
    rsiStrategy(rsi) {
        if (rsi.current < 25) {
            return { signal: 'BUY', confidence: 85, rsi: rsi.current };
        } else if (rsi.current > 75) {
            return { signal: 'SELL', confidence: 75, rsi: rsi.current };
        } else if (rsi.current < 35) {
            return { signal: 'BUY', confidence: 70, rsi: rsi.current };
        } else if (rsi.current > 65) {
            return { signal: 'SELL', confidence: 65, rsi: rsi.current };
        } else {
            return { signal: 'HOLD', confidence: 60, rsi: rsi.current };
        }
    }

    // Volume Strategy: High volume indicates strong moves
    volumeStrategy(historicalData, volumeAvg) {
        const volumes = historicalData.volume;
        const currentVolume = volumes[volumes.length - 1];
        const volumeRatio = currentVolume / volumeAvg;
        
        const prices = historicalData.close;
        const priceChange = prices[prices.length - 1] / prices[prices.length - 2] - 1;
        
        if (volumeRatio > 1.5 && priceChange > 0.02) { // High volume + price increase
            return { signal: 'BUY', confidence: 70, volumeRatio };
        } else if (volumeRatio > 1.5 && priceChange < -0.02) { // High volume + price decrease
            return { signal: 'SELL', confidence: 70, volumeRatio };
        } else {
            return { signal: 'HOLD', confidence: 50, volumeRatio };
        }
    }

    // Simplified Technical Indicator Calculations
    calculateSimpleRSI(historicalData, period = 14) {
        const prices = historicalData.close;
        
        if (prices.length < period + 1) {
            return { current: 50, trend: 'neutral' }; // Default neutral RSI
        }
        
        let gains = 0;
        let losses = 0;
        
        for (let i = prices.length - period; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        
        return {
            current: Math.round(rsi * 100) / 100,
            trend: rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'
        };
    }

    calculateSimpleSMA(historicalData, period = 20) {
        const prices = historicalData.close;
        
        if (prices.length < period) {
            return { current: prices[prices.length - 1], trend: 'neutral' };
        }
        
        const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
        const sma = sum / period;
        const currentPrice = prices[prices.length - 1];
        const trend = currentPrice > sma ? 'bullish' : currentPrice < sma ? 'bearish' : 'neutral';
        
        return {
            current: Math.round(sma * 100) / 100,
            trend: trend
        };
    }

    calculateVolumeAverage(historicalData, period = 10) {
        const volumes = historicalData.volume;
        
        if (volumes.length < period) {
            return volumes[volumes.length - 1] || 100000;
        }
        
        const sum = volumes.slice(-period).reduce((a, b) => a + b, 0);
        return sum / period;
    }

    // Combine multiple signals with weighted confidence
    // In the combineSignals method, increase confidence scores:
    // In the combineSignals method, make it more aggressive:
    combineSignals(signals) {
        let buyScore = 0;
        let sellScore = 0;
        let holdScore = 0;
        let totalWeight = 0;

        signals.forEach(({ signal, weight }) => {
            totalWeight += weight;
            
            // Make signals more aggressive for testing
            const aggressiveConfidence = Math.min(95, signal.confidence + 25); // Boost by 25%
            
            if (signal.signal === 'BUY') buyScore += aggressiveConfidence * weight;
            else if (signal.signal === 'SELL') sellScore += aggressiveConfidence * weight;
            else holdScore += aggressiveConfidence * weight;
        });

        const maxScore = Math.max(buyScore, sellScore, holdScore);
        
        // Much lower thresholds for more trading
        if (maxScore === buyScore && buyScore > 40) { // Lowered from 55 to 40
            return { signal: 'BUY', confidence: Math.round(buyScore / totalWeight) };
        } else if (maxScore === sellScore && sellScore > 40) { // Lowered from 55 to 40
            return { signal: 'SELL', confidence: Math.round(sellScore / totalWeight) };
        } else {
            return { signal: 'HOLD', confidence: Math.round(holdScore / totalWeight) };
        }
    }

    // Get AI recommendations for multiple stocks
    // Get AI recommendations for multiple stocks
    async getBulkSignals(symbols, strategy = 'default') {
        const signals = [];
        
        for (const symbol of symbols) {
            try {
                const signal = await this.generateSignals(symbol, await this.getMockHistoricalData(symbol), strategy);
                signals.push(signal);
            } catch (error) {
                console.error(`Error processing ${symbol}:`, error);
                // Continue with other symbols
            }
        }
        
        return signals;
    }

    // Mock data for development
    async getMockHistoricalData(symbol) {
        const basePrice = this.getBasePrice(symbol);
        const baseVolume = 1000000;
        
        const close = [];
        const open = [];
        const high = [];
        const low = [];
        const volume = [];
        
        // Generate 50 days of historical data
        for (let i = 50; i >= 0; i--) {
            const randomFactor = 1 + (Math.random() - 0.5) * 0.1; // ±5% variation
            const price = basePrice * randomFactor;
            const vol = baseVolume * (0.5 + Math.random()); // 50% to 150% volume
            
            close.push(Math.round(price * 100) / 100);
            open.push(Math.round(price * 0.99 * 100) / 100);
            high.push(Math.round(price * 1.02 * 100) / 100);
            low.push(Math.round(price * 0.98 * 100) / 100);
            volume.push(Math.round(vol));
        }
        
        return { close, open, high, low, volume };
    }

    getBasePrice(symbol) {
        const priceMap = {
            'RELIANCE': 2450,
            'TCS': 3350,
            'INFY': 1550,
            'HDFCBANK': 1650,
            'ICICIBANK': 980,
            'HINDUNILVR': 2400,
            'ITC': 400,
            'SBIN': 600,
            'HDFC': 2650,
            'BHARTIARTL': 720,
            'KOTAKBANK': 1680,
            'LT': 3150
        };
        
        return priceMap[symbol] || 1000;
    }

    // Get market sentiment analysis
    async getMarketSentiment(symbols) {
        const signals = await this.getBulkSignals(symbols);
        
        const sentiment = {
            bullish: signals.filter(s => s.signal === 'BUY').length,
            bearish: signals.filter(s => s.signal === 'SELL').length,
            neutral: signals.filter(s => s.signal === 'HOLD').length,
            total: signals.length
        };
        
        sentiment.score = (sentiment.bullish - sentiment.bearish) / sentiment.total;
        sentiment.overall = sentiment.score > 0.1 ? 'BULLISH' : 
                           sentiment.score < -0.1 ? 'BEARISH' : 'NEUTRAL';
        
        return sentiment;
    }
}

module.exports = new AITradingService();