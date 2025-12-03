import os
import time
import argparse
from app.ml.train import train_model

# The "Universe" of stocks we want to support out-of-the-box
UNIVERSE = [
    # Top 10 Nifty
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "INFY.NS",
    "ITC.NS", "SBIN.NS", "BHARTIARTL.NS", "LICI.NS", "HINDUNILVR.NS",
    # Popular Crypto
    "BTC-USD", "ETH-USD", "SOL-USD",
    # Forex
    "EURUSD=X", "INR=X"
]

def train_all():
    print(f"🚀 Starting Mass Training for {len(UNIVERSE)} assets...")
    print("This allows the AI to have a 'Brain' for every major stock immediately.")
    
    for i, symbol in enumerate(UNIVERSE):
        print(f"\n[{i+1}/{len(UNIVERSE)}] Training Brain for {symbol}...")
        
        # Check if model already exists to save time
        if os.path.exists(f"app/ml/models/{symbol}_lstm.pth"):
            print(f"✅ Model for {symbol} already exists. Skipping.")
            continue
            
        try:
            train_model(symbol)
            print(f"✅ Successfully trained {symbol}")
        except Exception as e:
            print(f"❌ Failed to train {symbol}: {e}")
        
        # Sleep briefly to be polite to Yahoo Finance API
        time.sleep(2)

    print("\n🎉 Universe Training Complete! Aladdin is ready.")

if __name__ == "__main__":
    train_all()