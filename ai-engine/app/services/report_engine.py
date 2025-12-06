import pandas as pd
import numpy as np
from datetime import datetime
from app.services.data_loader import MarketDataLoader
from app.processing.indicators import TechnicalAnalyzer
# UPDATE: Import the Transformer Model, not the old PricePredictor
from app.ml.transformer_model import TimeSeriesTransformer
from app.services.news_agent import NewsAgent
from app.services.mongo import db
import torch
from sklearn.preprocessing import MinMaxScaler
import os

class ReportEngine:
    def __init__(self):
        self.loader = MarketDataLoader()
        self.ta = TechnicalAnalyzer()
        self.news_agent = NewsAgent()
        
    async def generate_pre_market_report(self, symbols: list):
        print("📝 Generating Pre-Market Report with Universal Brain...")
        report_entries = []
        
        # Features used by the Transformer
        features = ['Close', 'RSI', 'SMA_50', 'SMA_200', 'OBV']
        
        # Load the Universal Brain ONCE
        model_path = "app/ml/models/universal_transformer.pth"
        if not os.path.exists(model_path):
            print(f"❌ Universal Model not found at {model_path}")
            return {"status": "error", "message": "Model missing"}
            
        # Initialize Transformer with correct dimensions
        model = TimeSeriesTransformer(input_dim=len(features), d_model=128, nhead=8, num_layers=4)
        try:
            model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
            model.eval()
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return {"status": "error", "message": "Model failed to load"}
        
        for symbol in symbols:
            try:
                # 1. Fetch Data (2y for indicators)
                df = self.loader.get_stock_data(symbol, period="2y") 
                if df is None or df.empty: continue
                
                # 2. Indicators & Cleanup
                df = self.ta.add_all_indicators(df)
                df = df.dropna()
                if len(df) < 60: continue

                # 3. AI Prediction (Transformer)
                data_values = df[features].values
                scaler = MinMaxScaler(feature_range=(0, 1))
                scaler.fit(data_values)
                
                last_60_days = data_values[-60:]
                scaled_input = scaler.transform(last_60_days)
                input_tensor = torch.from_numpy(scaled_input).float().unsqueeze(0)
                
                with torch.no_grad():
                    pred_scaled = model(input_tensor)
                    
                # Unscale Prediction
                dummy = np.zeros((1, len(features)))
                dummy[0, 0] = pred_scaled.item()
                prediction_actual = scaler.inverse_transform(dummy)[0, 0]
                
                current_price = df['Close'].iloc[-1]
                move_pct = ((prediction_actual - current_price) / current_price) * 100
                
                # 4. Sentiment & Reasoning
                rsi = df['RSI'].iloc[-1]
                search_term = f"{symbol.replace('.NS','')} stock news"
                news = self.news_agent.get_news(search_term)
                sentiment = self.news_agent.analyze_sentiment(news)
                
                reason = f"RSI is {rsi:.1f}. "
                if sentiment > 0.2: reason += "News is Positive."
                elif sentiment < -0.2: reason += "News is Negative."
                else: reason += "News is Neutral."
                
                signal = "HOLD"
                if move_pct > 1.0: signal = "BUY"
                elif move_pct < -1.0: signal = "SELL"
                
                report_entries.append({
                    "symbol": symbol,
                    "signal": signal,
                    "target": round(prediction_actual, 2),
                    "reason": reason,
                    "current_price": round(current_price, 2)
                })
                print(f"✅ Analyzed {symbol}: {signal} (Target: {prediction_actual:.2f})")
                
            except Exception as e:
                print(f"❌ Skipping {symbol}: {e}")

        # 5. Save Report
        if not report_entries:
            return {"status": "error", "message": "No stocks analyzed"}

        report = {
            "type": "PRE_MARKET",
            "date": datetime.utcnow().strftime("%Y-%m-%d"),
            "timestamp": datetime.utcnow(),
            "entries": report_entries,
            "summary": f"Analyzed {len(report_entries)} assets. {sum(1 for x in report_entries if x['signal']=='BUY')} BUY signals."
        }
        
        await db.db.reports.insert_one(report)
        return report

    async def generate_post_market_report(self):
        """
        Generates accuracy report based on morning predictions.
        """
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        morning_report = await db.db.reports.find_one({"type": "PRE_MARKET", "date": today_str})
        
        if not morning_report:
            return {"error": "No morning report found."}
            
        accuracy_log = []
        correct_count = 0
        
        for entry in morning_report['entries']:
            symbol = entry['symbol']
            signal = entry['signal']
            start_price = entry['current_price']
            
            df = self.loader.get_stock_data(symbol, period="5d")
            if df is None or df.empty: continue
            close_price = df['Close'].iloc[-1]
            
            actual_move = ((close_price - start_price) / start_price) * 100
            
            was_correct = False
            if signal == "BUY" and actual_move > 0: was_correct = True
            elif signal == "SELL" and actual_move < 0: was_correct = True
            elif signal == "HOLD" and abs(actual_move) < 1.0: was_correct = True
            
            if was_correct: correct_count += 1
            
            accuracy_log.append({
                "symbol": symbol,
                "signal": signal,
                "actual_move": round(actual_move, 2),
                "correct": was_correct
            })
            
        accuracy_score = (correct_count / len(accuracy_log)) * 100 if accuracy_log else 0
        
        report = {
            "type": "POST_MARKET",
            "date": today_str,
            "timestamp": datetime.utcnow(),
            "accuracy_score": round(accuracy_score, 1),
            "details": accuracy_log,
            "summary": f"Market Closed. AI Accuracy: {accuracy_score:.1f}%"
        }
        
        await db.db.reports.insert_one(report)
        return report