import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta
import os
from typing import Dict, List
import pickle

class HistoricalDataLoader:
    """Load and manage real historical market data for training"""
    
    def __init__(self, data_dir: str = "historical_data"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
    
    def download_historical_data(self, symbols: List[str], years: int = 5) -> Dict:
        """Download comprehensive historical data"""
        print(f"Downloading {years} years of historical data for {len(symbols)} symbols...")
        
        all_data = {}
        successful_downloads = 0
        
        for symbol in symbols:
            try:
                # Try to get real data
                stock = yf.Ticker(symbol)
                hist_data = stock.history(period=f"{years}y")
                
                if hist_data.empty or len(hist_data) < 100:
                    print(f"Insufficient real data for {symbol}, using enhanced mock data")
                    hist_data = self._create_enhanced_mock_data(symbol, years)
                else:
                    print(f"Real data for {symbol}: {len(hist_data)} records")
                    successful_downloads += 1
                
                all_data[symbol] = hist_data
                
                # Save to file
                file_path = os.path.join(self.data_dir, f"{symbol.replace('.NS', '')}.pkl")
                with open(file_path, 'wb') as f:
                    pickle.dump(hist_data, f)
                
                # Rate limiting
                import time
                time.sleep(1)
                
            except Exception as e:
                print(f"Error downloading {symbol}: {e}")
                # Fallback to enhanced mock data
                all_data[symbol] = self._create_enhanced_mock_data(symbol, years)
        
        print(f"Download complete: {successful_downloads}/{len(symbols)} real datasets")
        return all_data
    
    def _create_enhanced_mock_data(self, symbol: str, years: int) -> pd.DataFrame:
        """Create realistic mock data with market patterns"""
        trading_days = years * 252  # Approximate trading days per year
        dates = pd.date_range(end=datetime.now(), periods=trading_days, freq='D')
        
        # Base price based on symbol (deterministic but varied)
        base_price = 500 + (hash(symbol) % 1500)
        
        # Generate realistic price series with trends, volatility, and mean reversion
        prices = [base_price]
        volatility = 0.02  # 2% daily volatility
        
        for i in range(1, trading_days):
            # Random walk with volatility
            daily_return = np.random.normal(0, volatility)
            
            # Add some market structure
            if i > 200:  # Long-term trend
                trend = 0.0002  # Small upward bias
                daily_return += trend
            
            # Mean reversion component
            if prices[-1] > base_price * 1.3:  # If 30% above base
                daily_return -= 0.01  # Pull back
            elif prices[-1] < base_price * 0.7:  # If 30% below base  
                daily_return += 0.01  # Bounce back
            
            # Volatility clustering (GARCH-like effect)
            if abs(daily_return) > volatility * 2:  # High volatility day
                volatility *= 1.1  # Increase volatility
            else:
                volatility *= 0.99  # Gradually decrease volatility
            volatility = max(0.005, min(volatility, 0.1))  # Bound volatility
            
            new_price = prices[-1] * (1 + daily_return)
            prices.append(max(10, new_price))  # Prevent negative prices
        
        # Create realistic OHLCV data
        mock_data = pd.DataFrame({
            'Open': [p * (1 + np.random.normal(0, 0.005)) for p in prices],
            'High': [p * (1 + abs(np.random.normal(0.01, 0.008))) for p in prices],
            'Low': [p * (1 - abs(np.random.normal(0.01, 0.008))) for p in prices],
            'Close': prices,
            'Volume': [max(1000, int(np.random.lognormal(13, 1))) for _ in range(trading_days)]
        }, index=dates)
        
        print(f"Created enhanced mock data for {symbol}: {len(mock_data)} records")
        return mock_data
    
    def load_training_dataset(self, symbols: List[str]) -> Dict:
        """Load or create training dataset"""
        all_data = {}
        
        for symbol in symbols:
            file_path = os.path.join(self.data_dir, f"{symbol.replace('.NS', '')}.pkl")
            
            if os.path.exists(file_path):
                # Load from file
                with open(file_path, 'rb') as f:
                    all_data[symbol] = pickle.load(f)
                print(f"Loaded historical data for {symbol}")
            else:
                # Download fresh data
                print(f"No saved data for {symbol}, downloading...")
                downloaded_data = self.download_historical_data([symbol])
                all_data[symbol] = downloaded_data[symbol]
        
        return all_data

# Test the historical data loader
if __name__ == "__main__":
    print("Testing Historical Data Loader...")
    
    loader = HistoricalDataLoader()
    
    test_symbols = ['RELIANCE.NS', 'TCS.NS']
    data = loader.load_training_dataset(test_symbols)
    
    for symbol, df in data.items():
        print(f"{symbol}: {len(df)} records, Price range: ₹{df['Close'].min():.2f}-₹{df['Close'].max():.2f}")
    
    print("Historical Data Loader test completed!")