const express = require('express');
const cors = require('cors');
const axios = require('axios');

console.log("Starting AlgoTrade Backend Server...");

// Create Express app
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// AI Engine API URL (your Python FastAPI server)
const AI_ENGINE_URL = 'http://localhost:8000';

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'AlgoTrade Backend Server is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'backend',
    timestamp: new Date().toISOString()
  });
});

// Add this to backend/server.js
// Proxy to AI Engine - Get sectors data
app.get('/api/sectors', async (req, res) => {
  try {
    console.log('Fetching sectors data from AI engine...');
    
    const response = await axios.get(`${AI_ENGINE_URL}/sectors`);
    
    res.json({
      success: true,
      data: response.data,
      served_by: 'backend'
    });
    
  } catch (error) {
    console.error('Error fetching sectors:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sectors data',
      details: error.message
    });
  }
});

// Proxy to AI Engine - Get all stocks
app.get('/api/stocks', async (req, res) => {
  try {
    console.log('Fetching stocks from AI engine...');
    
    const response = await axios.get(`${AI_ENGINE_URL}/stocks`);
    
    res.json({
      success: true,
      data: response.data,
      served_by: 'backend'
    });
    
  } catch (error) {
    console.error('Error fetching stocks:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stocks data',
      details: error.message
    });
  }
});

// Proxy to AI Engine - Get specific stock
app.get('/api/stocks/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`Fetching details for ${symbol}...`);
    
    const response = await axios.get(`${AI_ENGINE_URL}/stocks/${symbol}`);
    
    res.json({
      success: true,
      data: response.data,
      served_by: 'backend'
    });
    
  } catch (error) {
    console.error(`Error fetching ${req.params.symbol}:`, error.message);
    
    res.status(500).json({
      success: false,
      error: `Failed to fetch data for ${req.params.symbol}`,
      details: error.message
    });
  }
});

// Portfolio simulation (basic version)
app.get('/api/portfolio', (req, res) => {
  // Mock portfolio data for now
  const mockPortfolio = {
    total_value: 1000,
    available_cash: 1000,
    stocks: [],
    performance: {
      today: 0,
      total: 0
    }
  };
  
  res.json({
    success: true,
    data: mockPortfolio
  });
});

// AI Endpoints

// Get AI signal for a stock
app.get('/api/ai/signal/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`Fetching AI signal for ${symbol}...`);
    
    const response = await axios.get(`${AI_ENGINE_URL}/ai/signal/${symbol}`);
    
    res.json({
      success: true,
      data: response.data,
      served_by: 'backend'
    });
    
  } catch (error) {
    console.error(`Error fetching AI signal for ${req.params.symbol}:`, error.message);
    
    res.status(500).json({
      success: false,
      error: `Failed to fetch AI signal for ${req.params.symbol}`,
      details: error.message
    });
  }
});

// Get batch AI signals
app.get('/api/ai/signals', async (req, res) => {
  try {
    console.log('Fetching batch AI signals...');
    
    const response = await axios.get(`${AI_ENGINE_URL}/ai/signals/batch`);
    
    res.json({
      success: true,
      data: response.data,
      served_by: 'backend'
    });
    
  } catch (error) {
    console.error('Error fetching batch AI signals:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch batch AI signals',
      details: error.message
    });
  }
});

// Get sectors with AI analysis
app.get('/api/sectors/ai', async (req, res) => {
  try {
    console.log('Fetching sectors with AI analysis...');
    
    const response = await axios.get(`${AI_ENGINE_URL}/sectors/ai`);
    
    res.json({
      success: true,
      data: response.data,
      served_by: 'backend'
    });
    
  } catch (error) {
    console.error('Error fetching AI sector analysis:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI sector analysis',
      details: error.message
    });
  }
});

// Train AI model
app.post('/api/ai/train/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { episodes = 50 } = req.body;
    
    console.log(`Training AI model for ${symbol}...`);
    
    const response = await axios.post(`${AI_ENGINE_URL}/ai/train/${symbol}`, {
      episodes: episodes
    });
    
    res.json({
      success: true,
      data: response.data,
      served_by: 'backend'
    });
    
  } catch (error) {
    console.error(`Error training AI model for ${req.params.symbol}:`, error.message);
    
    res.status(500).json({
      success: false,
      error: `Failed to train AI model for ${req.params.symbol}`,
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Stocks API: http://localhost:${PORT}/api/stocks`);
});