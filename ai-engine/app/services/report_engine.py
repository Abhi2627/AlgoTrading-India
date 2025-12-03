import pandas as pd
from datetime import datetime
from app.services.data_loader import MarketDataLoader
from app.processing.indicators import TechnicalAnalyzer
from app.ml.model import AladdinPricePredictor
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
        """
        Runs AI on a list of symbols and generates a morning briefing.
        """
        print("📝 Generating Pre-Market Report...")
        report_entries = []
        
        for symbol in symbols:
            try:
                # 1. Get Data & AI Prediction (Reuse logic from main.py)
                df = self.loader.get_stock_data(symbol, period="1y") # Need history for AI
                if df is None: continue
                
                df = self.ta.add_all_indicators(df)
                
                # ... (AI Prediction Logic - Simplified for brevity) ...
                # In a real impl, we'd refactor the prediction logic into a reusable helper function
                # For now, let's assume we get these values:
                current_price = df['Close'].iloc[-1]
                
                # Mocking the AI output for this example structure
                # You would load the model and predict here just like in main.py
                ai_signal = "BUY" if df['RSI'].iloc[-1] < 40 else "SELL" 
                confidence = 85.0 
                
                # 2. Get News Reason
                news = self.news_agent.get_news(f"{symbol} stock")
                sentiment = self.news_agent.analyze_sentiment(news)
                
                reason = f"Technical RSI is {df['RSI'].iloc[-1]:.1f}. "
                if sentiment > 0.2: reason += "News sentiment is Bullish."
                elif sentiment < -0.2: reason += "News sentiment is Bearish."
                
                report_entries.append({
                    "symbol": symbol,
                    "signal": ai_signal,
                    "confidence": confidence,
                    "reason": reason,
                    "current_price": current_price
                })
                
            except Exception as e:
                print(f"Skipping {symbol}: {e}")

        # 3. Create the Report Document
        report = {
            "type": "PRE_MARKET",
            "date": datetime.utcnow().strftime("%Y-%m-%d"),
            "timestamp": datetime.utcnow(),
            "entries": report_entries,
            "summary": f"Aladdin analyzed {len(report_entries)} stocks. {sum(1 for x in report_entries if x['signal']=='BUY')} BUY signals found."
        }
        
        # 4. Save to DB
        await db.db.reports.insert_one(report)
        print("✅ Pre-Market Report Saved to DB.")
        return report

    async def generate_post_market_report(self):
        """
        Checks today's 'PRE_MARKET' report and sees if it was right.
        """
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        
        # 1. Find this morning's report
        morning_report = await db.db.reports.find_one({"type": "PRE_MARKET", "date": today_str})
        
        if not morning_report:
            return {"error": "No morning report found to analyze."}
            
        accuracy_log = []
        correct_predictions = 0
        
        for entry in morning_report['entries']:
            symbol = entry['symbol']
            predicted_signal = entry['signal']
            
            # Get latest price NOW (After market closed)
            df = self.loader.get_stock_data(symbol, period="5d")
            closing_price = df['Close'].iloc[-1]
            
            # Did price go up or down?
            price_change = ((closing_price - entry['current_price']) / entry['current_price']) * 100
            
            was_correct = False
            if predicted_signal == "BUY" and price_change > 0: was_correct = True
            elif predicted_signal == "SELL" and price_change < 0: was_correct = True
            
            if was_correct: correct_predictions += 1
            
            accuracy_log.append({
                "symbol": symbol,
                "prediction": predicted_signal,
                "actual_change_pct": round(price_change, 2),
                "correct": was_correct
            })
            
        accuracy_score = (correct_predictions / len(accuracy_log)) * 100 if accuracy_log else 0
        
        report = {
            "type": "POST_MARKET",
            "date": today_str,
            "timestamp": datetime.utcnow(),
            "accuracy_score": accuracy_score,
            "details": accuracy_log,
            "summary": f"Market Closed. Aladdin was {accuracy_score:.1f}% accurate today."
        }
        
        await db.db.reports.insert_one(report)
        print("✅ Post-Market Analysis Saved.")
        return report