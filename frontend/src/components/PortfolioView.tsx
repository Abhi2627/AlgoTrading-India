import React, { useState, useEffect } from 'react';
import './PortfolioView.css'; // KEEP THIS - it's needed for styling

interface Holding {
  quantity: number;
  averagePrice: number;
  totalCost: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPL: number;
  unrealizedPLPercentage: number;
}

interface Transaction {
  type: 'BUY' | 'SELL';
  symbol: string;
  quantity: number;
  price: number;
  timestamp: string;
  _id?: string;
}

interface PortfolioData {
  capital: number;
  currentTotalValue: number;
  totalInvested: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  holdings: { [symbol: string]: Holding };
  transactions: Transaction[];
  availableCapital: number;
  holdingsValue: number;
  lastUpdated: string;
  initialCapital: number;
}

const PortfolioView: React.FC = () => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolioData = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:3001/api/portfolio/summary/live');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPortfolioData(data.data);
        console.log('✅ Portfolio data loaded:', data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch portfolio data');
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
    
    // Refresh every 30 seconds for live prices
    const interval = setInterval(fetchPortfolioData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Retry function for error state
  const handleRetry = () => {
    setLoading(true);
    fetchPortfolioData();
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading your portfolio data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <h3>⚠️ Unable to Load Portfolio</h3>
        <p>{error}</p>
        <button onClick={handleRetry} className="retry-button">
          Try Again
        </button>
        <div className="fallback-info">
          <p><strong>Backend URL:</strong> http://localhost:3001/api/portfolio/summary/live</p>
          <p><strong>Make sure your backend server is running on port 3001</strong></p>
        </div>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="error-state">
        <h3>No Portfolio Data</h3>
        <p>Unable to load your portfolio information.</p>
        <button onClick={handleRetry} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="portfolio-view">
      {/* Portfolio Summary Section */}
      <div className="portfolio-summary">
        <h2>Portfolio Overview</h2>
        <div className="last-updated">
          Last updated: {new Date(portfolioData.lastUpdated).toLocaleTimeString()}
        </div>
        <div className="summary-grid">
          <div className="summary-card total-value">
            <h3>Total Portfolio Value</h3>
            <div className="amount">₹{portfolioData.currentTotalValue.toFixed(2)}</div>
            <div className="card-subtitle">Initial: ₹{portfolioData.initialCapital.toFixed(2)}</div>
          </div>
          <div className="summary-card available-cash">
            <h3>Available Cash</h3>
            <div className="amount">₹{portfolioData.capital.toFixed(2)}</div>
            <div className="card-subtitle">Ready to invest</div>
          </div>
          <div className="summary-card profit-loss">
            <h3>Total P&L</h3>
            <div className={`amount ${portfolioData.totalProfitLoss >= 0 ? 'profit' : 'loss'}`}>
              ₹{Math.abs(portfolioData.totalProfitLoss).toFixed(2)} 
              <span className="percentage">({portfolioData.totalProfitLossPercentage >= 0 ? '+' : ''}{portfolioData.totalProfitLossPercentage.toFixed(2)}%)</span>
            </div>
            <div className="card-subtitle">
              {portfolioData.totalProfitLoss >= 0 ? 'Profit' : 'Loss'}
            </div>
          </div>
          <div className="summary-card invested">
            <h3>Invested Amount</h3>
            <div className="amount">₹{portfolioData.totalInvested.toFixed(2)}</div>
            <div className="card-subtitle">In stocks</div>
          </div>
        </div>
      </div>

      {/* Holdings Section */}
      <div className="holdings-section">
        <div className="section-header">
          <h3>Your Stock Holdings</h3>
          <span className="holdings-count">
            {Object.keys(portfolioData.holdings).length} stock(s)
          </span>
        </div>
        {Object.keys(portfolioData.holdings).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p>No stocks in your portfolio yet.</p>
            <p>Start by buying some stocks from the sectors page!</p>
          </div>
        ) : (
          <div className="holdings-grid">
            {Object.entries(portfolioData.holdings).map(([symbol, holding]) => (
              <div key={symbol} className="holding-card">
                <div className="holding-header">
                  <span className="symbol">{symbol}</span>
                  <span className="quantity">{holding.quantity} shares</span>
                </div>
                <div className="holding-details">
                  <div className="detail-row">
                    <span>Avg Price:</span>
                    <span className="price">₹{holding.averagePrice.toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Current Price:</span>
                    <span className="price current">₹{holding.currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Current Value:</span>
                    <span className="price">₹{holding.currentValue.toFixed(2)}</span>
                  </div>
                </div>
                <div className="pl-section">
                  <div className={`pl-amount ${holding.unrealizedPL >= 0 ? 'profit' : 'loss'}`}>
                    {holding.unrealizedPL >= 0 ? '▲' : '▼'} ₹{Math.abs(holding.unrealizedPL).toFixed(2)}
                  </div>
                  <div className={`pl-percentage ${holding.unrealizedPLPercentage >= 0 ? 'profit' : 'loss'}`}>
                    ({holding.unrealizedPLPercentage >= 0 ? '+' : ''}{holding.unrealizedPLPercentage.toFixed(2)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History Section */}
      <div className="transactions-section">
        <div className="section-header">
          <h3>Transaction History</h3>
          <span className="transactions-count">
            {portfolioData.transactions.length} transaction(s)
          </span>
        </div>
        {portfolioData.transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>No transactions yet.</p>
            <p>Your buy/sell history will appear here.</p>
          </div>
        ) : (
          <div className="transactions-list">
            {[...portfolioData.transactions]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((transaction, index) => (
                <div key={transaction._id || index} className={`transaction-item ${transaction.type.toLowerCase()}`}>
                  <div className="transaction-main">
                    <div className="transaction-type">
                      <span className={`type-badge ${transaction.type.toLowerCase()}`}>
                        {transaction.type}
                      </span>
                      <span className="symbol">{transaction.symbol}</span>
                    </div>
                    <div className="transaction-info">
                      <div className="quantity">{transaction.quantity} shares</div>
                      <div className="price">₹{transaction.price.toFixed(2)}</div>
                      <div className="total">₹{(transaction.quantity * transaction.price).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="transaction-meta">
                    <div className="timestamp">
                      {new Date(transaction.timestamp).toLocaleDateString()} at{' '}
                      {new Date(transaction.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioView;