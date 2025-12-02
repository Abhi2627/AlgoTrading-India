import torch
import numpy as np
import pandas as pd
from app.services.data_loader import MarketDataLoader
from app.processing.indicators import TechnicalAnalyzer
from app.ml.model import AladdinPricePredictor
from sklearn.preprocessing import MinMaxScaler

def predict_next_day(symbol="RELIANCE.NS"):
    print(f"🔮 Gazing into the crystal ball for {symbol}...")
    
    # 1. Load the same 5 years of data (to fit the scaler correctly)
    loader = MarketDataLoader()
    df = loader.get_stock_data(symbol, period="5y")
    
    if df is None: return

    # 2. Add Indicators
    ta = TechnicalAnalyzer()
    df = ta.add_all_indicators(df)
    
    # 3. Prepare Data (Same scaling as training)
    features = ['Close', 'RSI', 'SMA_50', 'SMA_200', 'OBV']
    data = df[features].values
    
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaler.fit(data) # Learn the scale from history
    
    # 4. Get the last 60 days (The "Sequence" we need to predict tomorrow)
    last_60_days = data[-60:] 
    scaled_input = scaler.transform(last_60_days)
    
    # Convert to Tensor [Batch Size, Seq Len, Features]
    input_tensor = torch.from_numpy(scaled_input).float().unsqueeze(0)
    
    # 5. Load the Trained Brain
    model = AladdinPricePredictor(input_dim=len(features))
    try:
        model.load_state_dict(torch.load(f"app/ml/models/{symbol}_lstm.pth"))
        model.eval() # Set to evaluation mode (no learning, just predicting)
    except FileNotFoundError:
        print("❌ Model not found! Train it first.")
        return

    # 6. Predict
    with torch.no_grad():
        prediction_scaled = model(input_tensor)
        
    # 7. Un-scale the prediction to get the actual price
    # We need to construct a dummy row to inverse_transform because scaler expects 5 columns
    dummy_row = np.zeros((1, len(features)))
    dummy_row[0, 0] = prediction_scaled.item() # Put predicted Close in 1st column
    
    prediction_actual = scaler.inverse_transform(dummy_row)[0, 0]
    current_price = df['Close'].iloc[-1]
    
    change_percent = ((prediction_actual - current_price) / current_price) * 100
    signal = "BUY 🟢" if change_percent > 1 else "SELL 🔴" if change_percent < -1 else "HOLD 🟡"
    
    print(f"\n📢 ALADDIN AI PREDICTION for {symbol}:")
    print(f"   Current Price: ₹{current_price:.2f}")
    print(f"   Predicted Next Close: ₹{prediction_actual:.2f}")
    print(f"   Expected Move: {change_percent:.2f}%")
    print(f"   AI Recommendation: {signal}")

if __name__ == "__main__":
    predict_next_day("RELIANCE.NS")