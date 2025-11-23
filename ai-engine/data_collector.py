import yfinance as yf
import pandas as pd
from datetime import datetime
import time

print("=== AlgoTrade India - Data Collector Test ===")

class SimpleDataCollector:
    def __init__(self):
        # Start with just 2 stocks to test
        self.test_symbols = ['RELIANCE.NS', 'TCS.NS']
    
    def get_stock_info(self, symbol):
        """Get basic info for a stock"""
        try:
            print(f"\n📊 Fetching data for {symbol}...")
            
            # Create ticker object
            stock = yf.Ticker(symbol)
            
            # Get historical data (last 7 days only)
            hist_data = stock.history(period="7d")
            
            if hist_data.empty:
                print(f"❌ No data found for {symbol}")
                return None
            
            # Get current price
            current_price = stock.info.get('currentPrice', 'N/A')
            
            # Get company name
            company_name = stock.info.get('longName', 'N/A')
            
            # Display results
            print(f"✅ Company: {company_name}")
            print(f"✅ Symbol: {symbol}")
            print(f"✅ Current Price: ₹{current_price}")
            print(f"✅ Data Points: {len(hist_data)} records")
            print(f"✅ Latest Close: ₹{hist_data['Close'].iloc[-1]}")
            
            return {
                'symbol': symbol,
                'name': company_name,
                'current_price': current_price,
                'data_points': len(hist_data)
            }
            
        except Exception as e:
            print(f"❌ Error fetching {symbol}: {e}")
            return None

def main():
    """Main test function"""
    collector = SimpleDataCollector()
    successful_collections = 0
    
    print("🚀 Starting data collection test...")
    print("This will test if we can fetch live Indian stock data.")
    
    for symbol in collector.test_symbols:
        result = collector.get_stock_info(symbol)
        if result:
            successful_collections += 1
        
        # Wait 2 seconds between requests to be polite
        time.sleep(2)
    
    print(f"\n🎯 Test Summary:")
    print(f"✅ Successful: {successful_collections}/{len(collector.test_symbols)}")
    
    if successful_collections > 0:
        print("🎉 Data collection is working! Ready to build the trading system.")
    else:
        print("❌ Issues with data collection. Let's debug.")

# Run the test
if __name__ == "__main__":
    main()