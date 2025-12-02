import yfinance as yf
import pandas as pd
import ccxt
import requests
import time # Needed for sleep
from datetime import datetime, timedelta

class MarketDataLoader:
    """
    The 'Fuel Pump' of the AI Engine.
    Robust version with Auto-Retry for Yahoo Finance.
    """
    
    def __init__(self):
        self.crypto_exchange = ccxt.binance({
            'enableRateLimit': True
        })

    def get_stock_data(self, symbol: str, period: str = "2y", retries: int = 3):
        """
        Fetches Stocks/Forex with Auto-Retry logic.
        """
        print(f"📡 Fetching Stock/Forex: {symbol}...")
        
        for attempt in range(retries):
            try:
                # Attempt download
                df = yf.download(
                    tickers=symbol, 
                    period=period, 
                    interval="1d", 
                    progress=False,
                    timeout=20 # Set explicit timeout
                )
                
                # Check if data is valid
                if df.empty:
                    # If empty, it might be a glitch, wait and retry
                    raise ValueError("Received empty data")

                # FIX: Handle Multi-Level Columns
                if isinstance(df.columns, pd.MultiIndex):
                    df.columns = df.columns.get_level_values(0)
                
                df.reset_index(inplace=True)
                
                required_cols = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
                available_cols = [c for c in required_cols if c in df.columns]
                df = df[available_cols]
                
                # If we succeeded, return immediately
                return df
                
            except Exception as e:
                print(f"⚠️ Attempt {attempt + 1}/{retries} failed for {symbol}: {str(e)}")
                if attempt < retries - 1:
                    time.sleep(2) # Wait 2 seconds before retrying
                else:
                    print(f"❌ All retries failed for {symbol}.")
                    return None

    def get_crypto_data(self, symbol: str, timeframe: str = '1d', limit: int = 365):
        print(f"🪙 Fetching Crypto: {symbol}...")
        try:
            ohlcv = self.crypto_exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
            df = pd.DataFrame(ohlcv, columns=['timestamp', 'Open', 'High', 'Low', 'Close', 'Volume'])
            df['Date'] = pd.to_datetime(df['timestamp'], unit='ms')
            df.drop(columns=['timestamp'], inplace=True)
            return df
        except Exception as e:
            print(f"⚠️ Critical Error fetching Crypto {symbol}: {str(e)}")
            return None

    def get_mutual_fund_data(self, scheme_code: str):
        print(f"📈 Fetching Mutual Fund: {scheme_code}...")
        try:
            url = f"https://api.mfapi.in/mf/{scheme_code}"
            response = requests.get(url, timeout=10) # Added timeout
            data = response.json()
            
            if not data.get('data'): return None

            df = pd.DataFrame(data['data'])
            df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y')
            df['nav'] = df['nav'].astype(float)
            df = df.sort_values('date')
            df = df.rename(columns={'nav': 'Close', 'date': 'Date'})
            
            df['Open'] = df['Close']
            df['High'] = df['Close']
            df['Low'] = df['Close']
            df['Volume'] = 1000 
            return df
        except Exception as e:
            print(f"⚠️ Error fetching Mutual Fund: {str(e)}")
            return None

if __name__ == "__main__":
    loader = MarketDataLoader()
    stock = loader.get_stock_data("RELIANCE.NS")
    if stock is not None:
        print(f"✅ Stock Success! Last Price: {stock['Close'].iloc[-1]:.2f}")