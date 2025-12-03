import pandas as pd
import numpy as np
import torch
from sklearn.preprocessing import MinMaxScaler
import os

# Imports
from app.services.data_loader import MarketDataLoader
from app.processing.indicators import TechnicalAnalyzer
# Note: We load the saved LSTM models for now, as they are already trained.
# Once you train Transformers, swap this import to TimeSeriesTransformer
from app.ml.model import AladdinPricePredictor 

class BacktestEngine:
    def __init__(self, initial_capital=100000):
        self.loader = MarketDataLoader()
        self.ta = TechnicalAnalyzer()
        self.initial_capital = initial_capital
        self.features = ['Close', 'RSI', 'SMA_50', 'SMA_200', 'OBV']
        
    async def run_backtest(self, symbol: str, days: int = 180):
        """
        Simulates trading over the last 'days' using the trained AI.
        """
        print(f"⏳ Starting Backtest for {symbol} ({days} days)...")
        
        # 1. Fetch History (Need extra data for the 60-day lookback window)
        lookback_window = 60
        total_days_needed = days + lookback_window + 50 # Buffer for indicators
        
        df = self.loader.get_stock_data(symbol, period="2y")
        
        if df is None or len(df) < total_days_needed:
            return {"error": f"Not enough historical data. Got {len(df) if df is not None else 0}, need {total_days_needed}"}
            
        # 2. Prep Data
        df = self.ta.add_all_indicators(df)
        df = df.dropna()
        
        # Prepare Data for AI (Scaling)
        data_values = df[self.features].values
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaler.fit(data_values)
        scaled_data = scaler.transform(data_values)
        
        # 3. Load the AI Brain
        model_path = f"app/ml/models/{symbol}_lstm.pth"
        if not os.path.exists(model_path):
             # Fallback to Reliance if specific model missing (for demo)
             model_path = "app/ml/models/RELIANCE.NS_lstm.pth"
             if not os.path.exists(model_path):
                 return {"error": "No trained models found."}

        model = AladdinPricePredictor(input_dim=len(self.features))
        model.load_state_dict(torch.load(model_path))
        model.eval()
        
        # 4. Simulation Loop
        cash = self.initial_capital
        holdings = 0
        trade_log = []
        equity_curve = []
        
        # Slice the data for the simulation period
        sim_start_index = len(df) - days
        
        for i in range(sim_start_index, len(df) - 1):
            # Data for Today
            current_price = df['Close'].iloc[i]
            date = df['Date'].iloc[i]
            
            # Prepare Input Sequence (Last 60 days relative to 'i')
            seq = scaled_data[i-lookback_window:i]
            input_tensor = torch.from_numpy(seq).float().unsqueeze(0)
            
            # AI Prediction
            with torch.no_grad():
                pred_scaled = model(input_tensor)
            
            # Unscale Prediction
            dummy = np.zeros((1, len(self.features)))
            dummy[0, 0] = pred_scaled.item()
            predicted_price = scaler.inverse_transform(dummy)[0, 0]
            
            # Strategy Logic
            move_pct = ((predicted_price - current_price) / current_price) * 100
            
            signal = "HOLD"
            if move_pct > 1.5: signal = "BUY"   # Aggressive Buy
            elif move_pct < -1.5: signal = "SELL" # Aggressive Sell
            
            # Execution
            if signal == "BUY" and cash > current_price:
                qty = int(cash // current_price)
                cost = qty * current_price
                cash -= cost
                holdings += qty
                trade_log.append({
                    "date": date.strftime("%Y-%m-%d"), 
                    "action": "BUY", 
                    "price": round(current_price, 2), 
                    "qty": qty,
                    "balance": round(cash, 2)
                })
                
            elif signal == "SELL" and holdings > 0:
                revenue = holdings * current_price
                cash += revenue
                trade_log.append({
                    "date": date.strftime("%Y-%m-%d"), 
                    "action": "SELL", 
                    "price": round(current_price, 2), 
                    "qty": holdings,
                    "balance": round(cash, 2)
                })
                holdings = 0
                
            # Track Daily Value
            total_value = cash + (holdings * current_price)
            equity_curve.append({"time": date.strftime("%Y-%m-%d"), "value": round(total_value, 2)})
            
        # 5. Final Metrics
        final_value = equity_curve[-1]['value']
        total_return = ((final_value - self.initial_capital) / self.initial_capital) * 100
        
        return {
            "symbol": symbol,
            "initial_capital": self.initial_capital,
            "final_value": final_value,
            "return_pct": round(total_return, 2),
            "trades_count": len(trade_log),
            "equity_curve": equity_curve,
            "trade_log": trade_log
        }