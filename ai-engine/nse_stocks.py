import yfinance as yf
import pandas as pd
import time
import random
from typing import Dict, List
from data_manager import DataManager

class NSEStockUniverse:
    def __init__(self):
        # Use only reliable symbols that work with Yahoo Finance
        self.reliable_stocks = [
            'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
            'HINDUNILVR.NS', 'ITC.NS', 'KOTAKBANK.NS', 'SBIN.NS', 'ASIANPAINT.NS',
            'DMART.NS', 'BAJFINANCE.NS', 'WIPRO.NS', 'SUNPHARMA.NS', 'MARUTI.NS',
            'TITAN.NS', 'ULTRACEMCO.NS', 'NESTLEIND.NS', 'LT.NS', 'ADANIPORTS.NS',
            'AXISBANK.NS', 'TECHM.NS', 'HCLTECH.NS', 'POWERGRID.NS', 'ONGC.NS'
        ]
        
        # Enhanced sector mapping with reliable symbols only
        self.sector_mapping = {
            'Technology & IT': ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS'],
            
            'Banking & Financial': ['HDFCBANK.NS', 'ICICIBANK.NS', 'KOTAKBANK.NS', 
                                   'AXISBANK.NS', 'SBIN.NS', 'BAJFINANCE.NS'],
            
            'Pharma & Healthcare': ['SUNPHARMA.NS', 'DIVISLAB.NS'],
            
            'Automobile': ['MARUTI.NS', 'TATAMOTORS.NS'],
            
            'FMCG & Consumer': ['HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'ASIANPAINT.NS',
                               'TITAN.NS', 'BRITANNIA.NS'],
            
            'Energy & Oil & Gas': ['RELIANCE.NS', 'ONGC.NS'],
            
            'Infrastructure': ['LT.NS', 'ULTRACEMCO.NS'],
            
            'Retail': ['DMART.NS'],
            
            'Diversified': ['ADANIPORTS.NS', 'POWERGRID.NS']
        }
        
        self.data_manager = DataManager()
    
    def get_stock_universe(self) -> List[str]:
        """Get complete list of stocks to track"""
        return self.reliable_stocks
    
    def get_sectors(self) -> Dict[str, List[str]]:
        """Get sector mapping"""
        return self.sector_mapping
    
    def get_demo_stock_data(self, symbol: str) -> Dict:
        """Get demo data for a stock"""
        # Get real data if available, otherwise use mock
        real_data = self.data_manager.get_reliable_data(symbol, period="1mo")
        
        if real_data is not None and not real_data.empty:
            # Use real data
            latest = real_data.iloc[-1]
            prev = real_data.iloc[-2] if len(real_data) > 1 else latest
            
            change_percent = ((latest['Close'] - prev['Close']) / prev['Close']) * 100
            
            return {
                "symbol": symbol,
                "name": f"{symbol.replace('.NS', '')} Ltd",
                "current_price": latest['Close'],
                "previous_close": prev['Close'],
                "change_percent": round(change_percent, 2),
                "volume": latest['Volume'],
                "market_cap": latest['Close'] * random.randint(1000000, 50000000),
                "sector": self._get_sector_for_stock(symbol)
            }
        else:
            # Fallback to mock data
            base_price = 1000 + hash(symbol) % 2000
            change = random.uniform(-50, 50)
            
            return {
                "symbol": symbol,
                "name": f"{symbol.replace('.NS', '')} Company",
                "current_price": base_price + change,
                "previous_close": base_price,
                "change_percent": round((change / base_price) * 100, 2),
                "volume": random.randint(100000, 5000000),
                "market_cap": base_price * random.randint(1000000, 50000000),
                "sector": self._get_sector_for_stock(symbol)
            }
    
    def _get_sector_for_stock(self, symbol: str) -> str:
        """Find which sector a stock belongs to"""
        for sector, stocks in self.sector_mapping.items():
            if symbol in stocks:
                return sector
        return "Diversified"
    
    def get_working_symbols(self) -> List[str]:
        """Get list of symbols that actually work"""
        return self.reliable_stocks

# Test the updated stock universe
if __name__ == "__main__":
    universe = NSEStockUniverse()
    print(f"Total reliable stocks: {len(universe.reliable_stocks)}")
    print(f"Sectors covered: {len(universe.sector_mapping)}")
    
    for sector, stocks in universe.sector_mapping.items():
        print(f"  {sector}: {len(stocks)} stocks")
    
    # Test data fetching
    print("\nTesting data fetching:")
    test_symbol = 'RELIANCE.NS'
    demo_data = universe.get_demo_stock_data(test_symbol)
    print(f"  {test_symbol}: ₹{demo_data['current_price']} ({demo_data['change_percent']}%)")