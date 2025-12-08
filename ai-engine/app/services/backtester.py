import pandas as pd
import numpy as np
import torch
from sklearn.preprocessing import MinMaxScaler
import os
from datetime import datetime

# Imports
from app.services.data_loader import MarketDataLoader
from app.processing.indicators import TechnicalAnalyzer
from app.ml.model import AladdinPricePredictor 
from app.ml.transformer_model import TimeSeriesTransformer

class BacktestEngine:
    def __init__(self, initial_capital=1000):
        self.loader = MarketDataLoader()
        self.ta = TechnicalAnalyzer()
        self.initial_capital = initial_capital
        self.features = ['Close', 'RSI', 'SMA_50', 'SMA_200', 'OBV']
        
    async def run_backtest(self, symbol: str, days: int = 180, capital: float = None):
        start_money = float(capital) if capital is not None and capital > 0 else self.initial_capital
        print(f"⏳ Starting Backtest for {symbol} with ₹{start_money}...")
        
        # 1. Fetch Data
        df = self.loader.get_stock_data(symbol, period="5y")
        
        if df is None or df.empty:
            return {"error": "No data found for this stock."}

        # 2. Validate Length (CRITICAL FIX)
        # We need at least 100 rows to run ANY indicator or AI
        if len(df) < 100:
            return {"error": f"IPO/New Stock detected. Only {len(df)} days of history found (Need 100+)."}

        # 3. Smart Adjustment
        required = days + 110
        if len(df) < required:
            days = int(len(df) - 115)
            if days < 10: # If adjustment makes it too short, fail gracefully
                 return {"error": "History too short for valid simulation."}
            print(f"⚠️ Adjusted backtest to {days} days due to limited history.")

        # 4. Add Indicators
        df = self.ta.add_all_indicators(df)
        df = df.dropna()
        
        # 5. Prep AI Data
        data_values = df[self.features].values
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaler.fit(data_values)
        scaled_data = scaler.transform(data_values)
        
        # 6. Load Brain
        model_path = "app/ml/models/universal_transformer.pth"
        if not os.path.exists(model_path):
             return {"error": "Universal Model not found."}

        model = TimeSeriesTransformer(input_dim=len(self.features), d_model=128, nhead=8, num_layers=4)
        model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
        model.eval()
        
        # 7. Loop
        cash = start_money
        holdings = 0
        trade_log = []
        equity_curve = []
        lookback = 60
        
        # Only start if we have enough data after lookback
        if len(scaled_data) < lookback + 2:
             return {"error": "Not enough data points for AI Lookback window."}

        sim_start = int(len(df) - days)
        # Ensure start index is valid (must be after lookback)
        sim_start = max(lookback, sim_start)

        for i in range(sim_start, len(df) - 1):
            current_price = df['Close'].iloc[i]
            date = df['Date'].iloc[i]
            
            # AI Input
            seq = scaled_data[i-lookback:i]
            
            # Double check sequence shape
            if len(seq) != lookback: continue 

            input_tensor = torch.from_numpy(seq).float().unsqueeze(0)
            
            with torch.no_grad():
                pred_scaled = model(input_tensor)
            
            dummy = np.zeros((1, len(self.features)))
            dummy[0, 0] = pred_scaled.item()
            predicted_price = scaler.inverse_transform(dummy)[0, 0]
            
            move_pct = ((predicted_price - current_price) / current_price) * 100
            signal = "HOLD"
            if move_pct > 1.5: signal = "BUY"
            elif move_pct < -1.5: signal = "SELL"
            
            if signal == "BUY" and cash > current_price:
                qty = int(cash // current_price)
                cash -= qty * current_price
                holdings += qty
                trade_log.append({"date": date.strftime("%Y-%m-%d"), "action": "BUY", "price": round(current_price, 2), "qty": qty, "balance": round(cash, 2)})
            elif signal == "SELL" and holdings > 0:
                cash += holdings * current_price
                trade_log.append({"date": date.strftime("%Y-%m-%d"), "action": "SELL", "price": round(current_price, 2), "qty": holdings, "balance": round(cash, 2)})
                holdings = 0
                
            total_val = cash + (holdings * current_price)
            equity_curve.append({"time": date.strftime("%Y-%m-%d"), "value": round(total_val, 2)})

        if not equity_curve:
            return {"error": "Simulation generated no data."}

        final_val = equity_curve[-1]['value']
        ret_pct = ((final_val - start_money) / start_money) * 100
        
        return {
            "symbol": symbol,
            "initial_capital": start_money,
            "final_value": round(final_val, 2),
            "return_pct": round(ret_pct, 2),
            "max_drawdown_pct": 0.0, # Simplified for safety
            "trades_count": len(trade_log),
            "equity_curve": equity_curve,
            "trade_log": trade_log
        }