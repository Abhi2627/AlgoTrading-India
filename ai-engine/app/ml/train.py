import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from app.services.data_loader import MarketDataLoader
from app.processing.indicators import TechnicalAnalyzer
from app.ml.model import AladdinPricePredictor
import time

# Configuration
LOOKBACK = 60    # Look at past 60 days
EPOCHS = 50      # How many times to study the data
LR = 0.001       # Learning Rate (Speed of learning)

def prepare_data(df):
    """Turns raw data into 'Sequences' for the LSTM"""
    # 1. Add Technical Indicators
    ta = TechnicalAnalyzer()
    df = ta.add_all_indicators(df)
    
    # 2. Select Features (What the AI sees)
    features = ['Close', 'RSI', 'SMA_50', 'SMA_200', 'OBV']
    data = df[features].values
    
    # 3. Scale Data (Normalize between 0 and 1)
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(data)
    
    # 4. Create Sequences (Sliding Window)
    X, y = [], []
    for i in range(LOOKBACK, len(scaled_data)):
        # Input: Day (i-60) to Day (i-1)
        X.append(scaled_data[i-LOOKBACK:i])
        # Target: Day (i) Close Price (index 0)
        y.append(scaled_data[i, 0]) 
        
    return np.array(X), np.array(y), scaler

def train_model(symbol="RELIANCE.NS"):
    print(f"🎓 Starting Training Session for {symbol}...")
    
    # 1. Get Data
    loader = MarketDataLoader()
    df = loader.get_stock_data(symbol, period="5y") # 5 Years of history
    
    if df is None: return
    
    # 2. Prepare Data
    X, y, scaler = prepare_data(df)
    
    # Convert to PyTorch Tensors
    X_train = torch.from_numpy(X).float()
    y_train = torch.from_numpy(y).float()
    
    # 3. Initialize Model
    model = AladdinPricePredictor(input_dim=X.shape[2])
    criterion = nn.MSELoss() # Loss function (Mean Squared Error)
    optimizer = torch.optim.Adam(model.parameters(), lr=LR)
    
    # 4. Training Loop
    print(f"🧠 Training on {len(X)} sequences...")
    start_time = time.time()
    
    for epoch in range(EPOCHS):
        model.train()
        outputs = model(X_train)
        loss = criterion(outputs, y_train.unsqueeze(1))
        
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        if (epoch+1) % 10 == 0:
            print(f"   Epoch [{epoch+1}/{EPOCHS}], Loss: {loss.item():.6f}")
            
    print(f"✅ Training Complete in {time.time() - start_time:.2f}s")
    
    # Save the trained brain
    torch.save(model.state_dict(), f"app/ml/models/{symbol}_lstm.pth")
    print(f"💾 Model saved to app/ml/models/{symbol}_lstm.pth")

if __name__ == "__main__":
    import argparse
    import os
    
    # Create the models folder if it doesn't exist
    os.makedirs("app/ml/models", exist_ok=True)
    
    # Allow passing arguments from command line
    parser = argparse.ArgumentParser()
    parser.add_argument("--symbol", type=str, default="RELIANCE.NS", help="Stock/Crypto symbol to train")
    args = parser.parse_args()
    
    train_model(args.symbol)