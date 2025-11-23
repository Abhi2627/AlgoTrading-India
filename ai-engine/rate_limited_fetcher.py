import yfinance as yf
import time
import random
from datetime import datetime
import pandas as pd

class RateLimitedFetcher:
    def __init__(self, max_requests_per_minute=30):
        self.max_requests_per_minute = max_requests_per_minute
        self.request_times = []
        self.min_interval = 60.0 / max_requests_per_minute  # seconds between requests
    
    def _rate_limit(self):
        """Implement rate limiting"""
        current_time = time.time()
        
        # Remove requests older than 1 minute
        self.request_times = [t for t in self.request_times if current_time - t < 60]
        
        # If we've hit the limit, wait
        if len(self.request_times) >= self.max_requests_per_minute:
            oldest_request = min(self.request_times)
            sleep_time = 60 - (current_time - oldest_request) + 1
            print(f"⏳ Rate limit reached. Sleeping for {sleep_time:.1f} seconds...")
            time.sleep(sleep_time)
            self.request_times = []  # Reset after sleep
        
        # Add some random delay to be polite
        random_delay = random.uniform(0.5, 2.0)
        time.sleep(random_delay)
        
        self.request_times.append(time.time())
    
    def get_stock_data(self, symbol, period="3mo"):
        """Get stock data with rate limiting"""
        try:
            self._rate_limit()
            print(f"📡 Fetching {symbol}...")
            
            stock = yf.Ticker(symbol)
            
            # Get historical data (this is usually less restricted)
            hist_data = stock.history(period=period)
            
            if hist_data.empty:
                print(f"❌ No historical data for {symbol}")
                return None
            
            # Try to get current price with separate, slower calls
            time.sleep(1)  # Extra delay for current price
            info = stock.info
            
            return {
                'historical': hist_data,
                'info': info,
                'symbol': symbol
            }
            
        except Exception as e:
            print(f"❌ Error fetching {symbol}: {e}")
            return None
    
    def get_batch_data(self, symbols, batch_size=10):
        """Get data for multiple symbols in batches"""
        results = {}
        
        for i, symbol in enumerate(symbols):
            print(f"🔄 Processing {i+1}/{len(symbols)}: {symbol}")
            
            data = self.get_stock_data(symbol)
            if data:
                results[symbol] = data
            
            # Take a longer break between batches
            if (i + 1) % batch_size == 0:
                print(f"💤 Batch completed. Taking a longer break...")
                time.sleep(10)
        
        return results

# Test the rate limited fetcher
if __name__ == "__main__":
    fetcher = RateLimitedFetcher(max_requests_per_minute=20)
    
    test_symbols = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS']
    data = fetcher.get_batch_data(test_symbols)
    
    print(f"✅ Successfully fetched {len(data)} stocks")