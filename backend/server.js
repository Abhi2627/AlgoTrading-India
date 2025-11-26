const express = require('express');
const cors = require('cors');
const axios = require('axios');
const database = require('./config/database');
const marketDataService = require('./services/marketDataService'); // Correct and single import

console.log("Starting AlgoTrade Backend Server...");

// Create Express app
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// AI Engine API URL with timeout
const AI_ENGINE_URL = 'http://localhost:8000';
const AI_ENGINE_TIMEOUT = 5000; // 5 seconds

// ---------------------------------------------
// Database Connection
// ---------------------------------------------
async function connectToDatabase() {
    try {
        await database.connect(); // Assuming `database` module has a connect method
        console.log('Database connected successfully');
    } catch (error) {
        console.error('FATAL: Database connection failed:', error.message);
    }
}
connectToDatabase();

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'AlgoTrade Backend Server is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Import PortfolioManager Instance
// NOTE: Since PortfolioManager.js exports an already instantiated instance (module.exports = new PortfolioManager()), 
// we use require without the class reference.
const portfolioManager = require('./portfolioManager'); 

// ---------------------------------------------
// Portfolio Routes (AWAIT ADDED WHERE NECESSARY)
// ---------------------------------------------

app.get('/api/portfolio', async (req, res) => {
    try {
        // NOTE: The portfolio manager now fetches real prices internally, 
        // passing dummy prices here is vestigial but harmless.
        const portfolioSummary = await portfolioManager.getPortfolioSummary(); 
        
        res.json({
            success: true,
            data: portfolioSummary,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch portfolio data',
            details: error.message
        });
    }
});

app.post('/api/portfolio/trade', async (req, res) => {
    try {
        let { symbol, action, quantity } = req.body;
        quantity = parseFloat(quantity);
        
        if (!symbol || !action || isNaN(quantity) || quantity <= 0) {
            // Price check is removed as PM fetches it.
            return res.status(400).json({
                success: false,
                error: 'Invalid or missing fields. Ensure symbol, action, and positive numeric quantity are provided.'
            });
        }

        let result;
        const upperAction = action.toUpperCase();

        // The portfolio manager handles fetching the current price internally.
        if (upperAction === 'BUY') {
            result = await portfolioManager.buyStock(symbol, quantity);
        } else if (upperAction === 'SELL') {
            result = await portfolioManager.sellStock(symbol, quantity);
        } else {
            return res.status(400).json({
                success: false,
                error: 'Invalid action. Use BUY or SELL'
            });
        }
        
        // The result is the updated summary from the PM
        res.json({
            success: true,
            message: `${upperAction} trade executed successfully.`,
            portfolio: result 
        });

    } catch (error) {
        console.error('Error executing trade:', error);
        res.status(500).json({
            success: false,
            error: 'Trade execution failed',
            details: error.message
        });
    }
});

// Reset portfolio route
app.post('/api/portfolio/reset', async (req, res) => {
    try {
        let { capital } = req.body;
        capital = parseFloat(capital) || 1000; 

        const summary = await portfolioManager.resetPortfolio(capital);
        
        res.json({
            success: true,
            message: `Portfolio reset successfully with capital: ${capital}`,
            summary: summary
        });
    } catch (error) {
        console.error('Error resetting portfolio:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting portfolio',
            error: error.message
        });
    }
});

// Get portfolio summary
app.get('/api/portfolio/summary', async (req, res) => {
    try {
        const summary = await portfolioManager.getPortfolioSummary();
        res.json({
            success: true,
            summary: summary
        });
    } catch (error) {
        console.error('Error getting portfolio summary:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting portfolio summary',
            error: error.message
        });
    }
});

app.get('/api/portfolio/history', (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                trades: portfolioManager.portfolio.transactions,
                totalTrades: portfolioManager.portfolio.transactions.length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching trade history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trade history',
            details: error.message
        });
    }
});

// ==================== ENHANCED PORTFOLIO APIs ====================

// Get portfolio summary with real-time valuation
app.get('/api/portfolio/summary/live', async (req, res) => {
    try {
        console.log('📊 Generating live portfolio summary...');
        const summary = await portfolioManager.getPortfolioSummary();
        
        res.json({
            success: true,
            data: summary,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error generating live portfolio summary:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating portfolio summary',
            error: error.message
        });
    }
});

// Enhanced buy endpoint (uses current market price)
app.post('/api/portfolio/buy', async (req, res) => {
    try {
        const { symbol, quantity } = req.body;
        
        if (!symbol || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Symbol and quantity are required'
            });
        }

        console.log(`🛒 Buy order: ${quantity} ${symbol}`);
        const result = await portfolioManager.buyStock(symbol.toUpperCase(), parseInt(quantity));
        
        res.json({
            success: true,
            message: `Successfully bought ${quantity} shares of ${symbol}`,
            data: result
        });
    } catch (error) {
        console.error('Error buying stock:', error);
        res.status(500).json({
            success: false,
            message: 'Error buying stock',
            error: error.message
        });
    }
});

// Enhanced sell endpoint (uses current market price)
app.post('/api/portfolio/sell', async (req, res) => {
    try {
        const { symbol, quantity } = req.body;
        
        if (!symbol || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Symbol and quantity are required'
            });
        }

        console.log(`🏷️ Sell order: ${quantity} ${symbol}`);
        const result = await portfolioManager.sellStock(symbol.toUpperCase(), parseInt(quantity));
        
        res.json({
            success: true,
            message: `Successfully sold ${quantity} shares of ${symbol}`,
            data: result
        });
    } catch (error) {
        console.error('Error selling stock:', error);
        res.status(500).json({
            success: false,
            message: 'Error selling stock',
            error: error.message
        });
    }
});

// Portfolio analytics endpoint
app.get('/api/portfolio/analytics', async (req, res) => {
    try {
        console.log('📈 Generating portfolio analytics...');
        const analytics = await portfolioManager.getPortfolioAnalytics();
        
        res.json({
            success: true,
            data: analytics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error generating portfolio analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating portfolio analytics',
            error: error.message
        });
    }
});

// Get transaction history
app.get('/api/portfolio/transactions', async (req, res) => {
    try {
        const { limit } = req.query;
        let transactions = portfolioManager.portfolio.transactions;
        
        // Sort by timestamp (newest first)
        transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Apply limit if provided
        if (limit) {
            transactions = transactions.slice(0, parseInt(limit));
        }
        
        res.json({
            success: true,
            data: transactions,
            count: transactions.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching transactions',
            error: error.message
        });
    }
});

// ---------------------------------------------
// Market Data Routes (Consolidated & Cleaned)
// ---------------------------------------------

// 1. Get current price for a single stock
app.get('/api/stocks/:symbol/price', async (req, res) => {
    try {
        const { symbol } = req.params;
        const price = await marketDataService.getCurrentPrice(symbol.toUpperCase());
        
        res.json({
            success: true,
            symbol: symbol.toUpperCase(),
            price: price,
            currency: 'INR',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching stock price:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching stock price',
            error: error.message
        });
    }
});

// 2. Get historical data for a stock
app.get('/api/stocks/:symbol/history', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { period = '1mo' } = req.query;
        
        const historicalData = await marketDataService.getHistoricalData(symbol.toUpperCase(), period);
        
        res.json({
            success: true,
            data: historicalData,
            period: period,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching historical data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching historical data',
            error: error.message
        });
    }
});

// 3. Bulk get prices for multiple stocks
app.post('/api/stocks/prices/bulk', async (req, res) => { // Renamed for clarity
    try {
        const { symbols } = req.body;
        
        if (!symbols || !Array.isArray(symbols)) {
            return res.status(400).json({
                success: false,
                message: 'Symbols array is required in request body'
            });
        }
        
        const prices = await marketDataService.getBulkPrices(symbols.map(s => s.toUpperCase()));
        
        res.json({
            success: true,
            data: prices,
            count: prices.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching bulk prices:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bulk prices',
            error: error.message
        });
    }
});

// 4. Get popular Indian stocks
app.get('/api/stocks/popular/indian', async (req, res) => {
    try {
        const popularStocks = [
            'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR',
            'HDFC', 'ICICIBANK', 'KOTAKBANK', 'ITC', 'SBIN',
            'BHARTIARTL', 'LT', 'ASIANPAINT', 'HCLTECH', 'MARUTI',
            'SUNPHARMA', 'TITAN', 'AXISBANK', 'ULTRACEMCO', 'M&M'
        ];
        
        const stockData = await marketDataService.getBulkPrices(popularStocks);
        
        res.json({
            success: true,
            data: stockData,
            count: stockData.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching popular stocks:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching popular stocks',
            error: error.message
        });
    }
});

// ---------------------------------------------
// Health & AI Engine Routes
// ---------------------------------------------

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'backend',
    timestamp: new Date().toISOString()
  });
});

// Enhanced AI engine health check
app.get('/ai-health', async (req, res) => {
  try {
    console.log('Checking AI engine health...');
    const response = await axios.get(`${AI_ENGINE_URL}/health`, {
      timeout: AI_ENGINE_TIMEOUT
    });
    
    res.json({
      ai_engine_status: 'connected',
      ai_response: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI engine health check failed:', error.message);
    res.status(503).json({ 
      ai_engine_status: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Fallback sectors data
const FALLBACK_SECTORS = {
    // ... (FALLBACK_SECTORS object remains unchanged)
    'Technology & IT': [
        {
          symbol: 'TCS.NS',
          name: 'Tata Consultancy Services Limited',
          current_price: 3450.25,
          change_percent: 1.2,
          volume: 1876543,
          market_cap: 1250000000000,
          ai_signal: 'BUY',
          ai_confidence: 85.5,
          signal_strength: 2.1,
          rsi: 65.3
        },
        {
          symbol: 'INFY.NS',
          name: 'Infosys Limited',
          current_price: 1650.75,
          change_percent: 0.8,
          volume: 2345678,
          market_cap: 680000000000,
          ai_signal: 'HOLD',
          ai_confidence: 72.3,
          signal_strength: 0.5,
          rsi: 58.7
        }
      ],
      'Banking & Financial': [
        {
          symbol: 'HDFCBANK.NS',
          name: 'HDFC Bank Limited',
          current_price: 1650.50,
          change_percent: -0.5,
          volume: 3456789,
          market_cap: 950000000000,
          ai_signal: 'BUY',
          ai_confidence: 78.9,
          signal_strength: 1.8,
          rsi: 45.2
        },
        {
          symbol: 'ICICIBANK.NS',
          name: 'ICICI Bank Limited',
          current_price: 980.25,
          change_percent: 1.1,
          volume: 4567890,
          market_cap: 650000000000,
          ai_signal: 'BUY',
          ai_confidence: 82.1,
          signal_strength: 2.3,
          rsi: 62.8
        }
      ],
      'Energy & Oil & Gas': [
        {
          symbol: 'RELIANCE.NS',
          name: 'Reliance Industries Limited',
          current_price: 2456.75,
          change_percent: 0.3,
          volume: 3456789,
          market_cap: 1660000000000,
          ai_signal: 'HOLD',
          ai_confidence: 65.8,
          signal_strength: 0.2,
          rsi: 55.4
        }
      ]
};

// Proxy to AI Engine - Get sectors data with robust error handling
app.get('/api/sectors', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('Fetching sectors data from AI engine...');
    
    const response = await axios.get(`${AI_ENGINE_URL}/sectors`, {
      timeout: AI_ENGINE_TIMEOUT
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Successfully fetched sectors data (${responseTime}ms)`);
    
    const aiData = response.data.sectors || response.data;
    
    res.json({
      success: true,
      data: {
          sectors: aiData,
          last_updated: new Date().toISOString()
      },
      served_by: 'ai_engine',
      response_time_ms: responseTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Error fetching sectors (${responseTime}ms):`, error.message);
    
    // Use fallback data immediately
    console.log('🔄 Using fallback sectors data');
    
    res.json({
      success: true, 
      data: {
        sectors: FALLBACK_SECTORS,
        last_updated: new Date().toISOString(),
        served_by: 'fallback'
      },
      served_by: 'fallback',
      response_time_ms: responseTime,
      note: 'Using fallback data - AI engine unavailable or timed out',
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`AI Health check: http://localhost:${PORT}/ai-health`);
  console.log(`Stocks API: http://localhost:${PORT}/api/sectors`);
});