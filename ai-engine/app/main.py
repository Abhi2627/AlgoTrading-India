from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Union, Any
from contextlib import asynccontextmanager
from datetime import datetime
from app.services.backtester import BacktestEngine
from app.services.report_engine import ReportEngine
from app.services.data_loader import MarketDataLoader
import torch
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import os

# Custom Modules
from app.services.data_loader import MarketDataLoader
from app.processing.indicators import TechnicalAnalyzer
# CHANGE: Import the Transformer Model
from app.ml.transformer_model import TimeSeriesTransformer
from app.services.news_agent import NewsAgent
from app.services.mongo import db 

news_agent = NewsAgent()
# GLOBAL MODEL INSTANCE (Load once, use everywhere)
universal_model = None 

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Aladdin Engine Starting...")
    db.connect()
    
    # LOAD UNIVERSAL BRAIN
    global universal_model
    model_path = "app/ml/models/universal_transformer.pth"
    
    try:
        # Initialize with the EXACT same params used in Colab training
        universal_model = TimeSeriesTransformer(
            input_dim=5, 
            d_model=128, 
            nhead=8, 
            num_layers=4
        )
        universal_model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
        universal_model.eval()
        print(f"🧠 Universal Brain Loaded successfully from {model_path}")
    except Exception as e:
        print(f"⚠️ Failed to load Universal Model: {e}")
        print("Using dummy predictions until fixed.")
        
    yield
    await db.close()
    print("🛑 Aladdin Engine Stopped.")

app = FastAPI(title="Aladdin AI Engine", version="1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PortfolioItem(BaseModel):
    symbol: str
    quantity: int
    average_price: float
    current_price: float
    current_value: float
    pnl: float

# ... (Keep PredictionResponse, TradeRequest models SAME as before) ...
class PredictionResponse(BaseModel):
    symbol: str
    current_price: float
    predicted_price: float
    expected_move_pct: float
    signal: str
    confidence: float
    sentiment_score: float
    recent_news: List[Dict[str, str]]
    chart_data: List[Dict[str, Any]] 
    market_cap: float
    volume: float

class TradeRequest(BaseModel):
    symbol: str
    action: str
    price: float
    quantity: int

def calculate_confidence(signal: str, sentiment: float, rsi: float, macd_hist: float) -> float:
    score = 50.0 # Start at 50% instead of 40%

    # 1. Sentiment (Lower threshold to 0.1 from 0.15)
    if signal == "BUY" and sentiment > 0.1: score += 20
    elif signal == "SELL" and sentiment < -0.1: score += 20
    
    # 2. RSI (Widen range)
    if signal == "BUY" and rsi < 50: score += 10 # Any RSI below 50 supports buy
    elif signal == "SELL" and rsi > 50: score += 10 # Any RSI above 50 supports sell

    # 3. MACD (Keep same)
    if signal == "BUY" and macd_hist > 0: score += 10
    elif signal == "SELL" and macd_hist < 0: score += 10
    
    return min(99.0, max(10.0, score))

@app.get("/portfolio", response_model=List[PortfolioItem])
async def get_portfolio():
    """Calculates current holdings based on trade history."""
    trades = await db.db.trades.find({"user_id": "demo_user"}).to_list(length=1000)

    holdings = {}

    for t in trades:
        sym = t['symbol']
        qty = t['quantity']
        price = t['price']
        action = t['action']

        if sym not in holdings:
            holdings[sym] = {"qty": 0, "total_cost": 0.0}

        if action == "BUY":
            holdings[sym]["qty"] += qty
            holdings[sym]["total_cost"] += (qty * price)
        elif action == "SELL":
            # FIFO logic is complex, using simple average cost for now
            if holdings[sym]["qty"] > 0:
                avg_cost = holdings[sym]["total_cost"] / holdings[sym]["qty"]
                holdings[sym]["total_cost"] -= (qty * avg_cost)
                holdings[sym]["qty"] -= qty

    # Convert to list and filter zero qty
    portfolio = []
    loader = MarketDataLoader()

    for sym, data in holdings.items():
        if data["qty"] > 0:
            # Fetch live price for PnL
            try:
                df = loader.get_stock_data(sym, period="1d")
                current_price = df['Close'].iloc[-1]
            except:
                current_price = data["total_cost"] / data["qty"] # Fallback

            avg_price = data["total_cost"] / data["qty"]
            current_val = data["qty"] * current_price
            pnl = current_val - data["total_cost"]

            portfolio.append({
                "symbol": sym,
                "quantity": int(data["qty"]),
                "average_price": round(avg_price, 2),
                "current_value": round(current_val, 2),
                "current_price": round(current_price, 2),
                "pnl": round(pnl, 2)
            })

    return portfolio

@app.get("/")
def health_check():
    return {"status": "online"}

@app.get("/predict/{symbol}", response_model=PredictionResponse)
async def predict_stock(symbol: str):
    try:
        loader = MarketDataLoader()
        df = loader.get_stock_data(symbol, period="2y")
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail="Stock data not found")
            
        ta = TechnicalAnalyzer()
        df = ta.add_all_indicators(df)
        df = df.dropna()

        # PREPARE DATA FOR UNIVERSAL BRAIN
        features = ['Close', 'RSI', 'SMA_50', 'SMA_200', 'OBV']
        data_values = df[features].values
        
        # Normalize (CRITICAL for Universal Model)
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaler.fit(data_values)
        
        last_60_days = data_values[-60:]
        scaled_input = scaler.transform(last_60_days)
        input_tensor = torch.from_numpy(scaled_input).float().unsqueeze(0)
        
        # PREDICT USING GLOBAL MODEL
        if universal_model:
            with torch.no_grad():
                pred_scaled = universal_model(input_tensor)
            
            # Unscale
            dummy = np.zeros((1, len(features)))
            dummy[0, 0] = pred_scaled.item()
            prediction_actual = scaler.inverse_transform(dummy)[0, 0]
        else:
            # Fallback if model failed to load
            prediction_actual = df['Close'].iloc[-1]
            
        current_price = df['Close'].iloc[-1]
        move_pct = ((prediction_actual - current_price) / current_price) * 100
        
        # Logic
        search_term = f"{symbol} stock" if "USD" not in symbol else f"{symbol} crypto"
        news = news_agent.get_news(search_term) 
        sentiment_score = news_agent.analyze_sentiment(news)
        
        market_signal = "HOLD"
        if move_pct > 0.5: market_signal = "BUY"
        elif move_pct < -0.5: market_signal = "SELL"

        # 2. Check User Holdings (Context Awareness)
        # Fetch all trades for this symbol
        trades = await db.db.trades.find({"user_id": "demo_user", "symbol": symbol}).to_list(length=1000)
        holding_qty = 0
        for t in trades:
            if t['action'] == "BUY": holding_qty += t['quantity']
            elif t['action'] == "SELL": holding_qty -= t['quantity']

        # 3. Refine Signal based on Ownership
        final_signal = market_signal
        reason_suffix = ""

        if market_signal == "SELL" and holding_qty <= 0:
            final_signal = "AVOID"  # Changing SELL to AVOID
            reason_suffix = " (Bearish, but you don't own it)"
        elif market_signal == "HOLD" and holding_qty <= 0:
            final_signal = "WATCH"  # Changing HOLD to WATCH
            reason_suffix = " (Wait for better entry)"

        # Risk Check
        if final_signal == "BUY" and sentiment_score < -0.2:
            final_signal = "WATCH (High Risk ⚠️)"

        # Confidence
        current_rsi = df['RSI'].iloc[-1]
        macd_hist_col = [c for c in df.columns if 'MACDh' in c]
        current_macd_hist = df[macd_hist_col[0]].iloc[-1] if macd_hist_col else 0
        
        confidence_score = calculate_confidence(
            signal=final_signal.split()[0], 
            sentiment=sentiment_score,
            rsi=current_rsi,
            macd_hist=current_macd_hist
        )

        # Chart Data
        history_df = df.tail(90).copy()
        chart_data = []
        for index, row in history_df.iterrows():
            chart_data.append({
                "time": row['Date'].strftime("%Y-%m-%d"),
                "open": row['Open'], "high": row['High'], "low": row['Low'], "close": row['Close'],
                "volume": row['Volume']
            })

        # Save to DB
        try:
            await db.save_prediction({
                "symbol": symbol,
                "price": float(current_price),
                "predicted": float(prediction_actual),
                "signal": final_signal,
                "confidence": float(confidence_score),
                "timestamp": datetime.utcnow()
            })
        except: pass

        return {
            "symbol": symbol,
            "current_price": round(current_price, 2),
            "predicted_price": round(prediction_actual, 2),
            "expected_move_pct": round(move_pct, 2),
            "signal": final_signal,
            "confidence": round(confidence_score, 1),
            "sentiment_score": sentiment_score,
            "recent_news": news[:3],
            "chart_data": chart_data,
            "volume": float(df['Volume'].iloc[-1]),
            "market_cap": 0.0
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/wallet")
async def get_wallet():
    user_id = "demo_user"
    user = await db.db.users.find_one({"user_id": user_id})
    if not user:
        await db.db.users.insert_one({"user_id": user_id, "balance": 1000.0, "portfolio": {}})
        return {"balance": 1000.0, "holdings": []}
    
    holdings = []
    portfolio = user.get("portfolio", {})
    for sym, raw_qty in portfolio.items():
        try:
            qty = int(raw_qty) if not isinstance(raw_qty, dict) else int(raw_qty.get('quantity', 0))
            if qty > 0:
                holdings.append({"symbol": sym, "quantity": qty})
        except:
            continue
    return {"balance": user["balance"], "holdings": holdings}

@app.get("/trades")
async def get_trade_history():
    trades = await db.db.trades.find({"user_id": "demo_user"}).sort("timestamp", -1).to_list(length=100)
    
    formatted_trades = []
    for doc in trades:
        # FIX: Handle both String and Datetime objects safely
        ts = doc["timestamp"]
        if hasattr(ts, "strftime"):
            ts = ts.strftime("%Y-%m-%d %H:%M")
        
        formatted_trades.append({
            "symbol": doc["symbol"],
            "action": doc["action"],
            "price": doc["price"],
            "quantity": doc["quantity"],
            "total": doc["total"],
            "timestamp": str(ts) # Ensure it's always a string
        })
        
    return {"trades": formatted_trades}

@app.post("/trade")
async def trade_stock(trade: TradeRequest):
    user_id = "demo_user"
    
    # 1. Get Current Wallet Balance
    user = await db.db.users.find_one({"user_id": user_id})
    if not user:
        # Create user if not exists (for first run)
        user = {"user_id": user_id, "balance": 100000}
        await db.db.users.insert_one(user)
    
    current_balance = user.get("balance", 100000)
    total_cost = trade.price * trade.quantity

    # 2. BUY Logic
    if trade.action == "BUY":
        if current_balance < total_cost:
            raise HTTPException(status_code=400, detail="Insufficient funds")
        
        new_balance = current_balance - total_cost
        await db.db.users.update_one(
            {"user_id": user_id},
            {"$set": {"balance": new_balance}}
        )

    # 3. SELL Logic (The Fix)
    elif trade.action == "SELL":
        # Calculate Net Holdings (Buys - Sells)
        trades = await db.db.trades.find({"user_id": user_id, "symbol": trade.symbol}).to_list(length=1000)
        
        current_qty = 0
        for t in trades:
            if t['action'] == "BUY":
                current_qty += t['quantity']
            elif t['action'] == "SELL":
                current_qty -= t['quantity']
        
        # Validation Check
        if current_qty < trade.quantity:
            print(f"❌ Sell Rejected. Owned: {current_qty}, Requested: {trade.quantity}")
            raise HTTPException(status_code=400, detail=f"Insufficient quantity. You own {current_qty}.")

        new_balance = current_balance + total_cost
        await db.db.users.update_one(
            {"user_id": user_id},
            {"$set": {"balance": new_balance}}
        )

    # 4. Log the Trade
    trade_doc = {
        "user_id": user_id,
        "symbol": trade.symbol,
        "action": trade.action,
        "price": trade.price,
        "quantity": trade.quantity,
        "total": total_cost,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }
    await db.db.trades.insert_one(trade_doc)
    
    return {"status": "success", "new_balance": new_balance}

@app.post("/reset")
async def reset_account():
    user_id = "demo_user"
    await db.db.trades.delete_many({"user_id": user_id})
    await db.db.users.update_one(
        {"user_id": user_id},
        {"$set": {"balance": 1000.0, "portfolio": {}, "last_refill": datetime.utcnow()}},
        upsert=True
    )
    return {"status": "success", "message": "Account reset to ₹1000"}

# --- REPORT SYSTEM ---

@app.post("/reports/generate/{type}")
async def generate_report_api(type: str):
    """
    Triggers generation of a Daily Report.
    type: 'pre' (Morning) or 'post' (Evening)
    """
    engine = ReportEngine()
    
    # Define your "Watchlist" for the daily report
    watchlist = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "BTC-USD"]
    
    if type == "pre":
        report = await engine.generate_pre_market_report(watchlist)
        return {"status": "success", "summary": report['summary']}
    elif type == "post":
        report = await engine.generate_post_market_report()
        return {"status": "success", "summary": report.get('summary', 'Report Generated')}
    else:
        raise HTTPException(status_code=400, detail="Invalid type. Use 'pre' or 'post'.")

@app.get("/reports/latest")
async def get_latest_reports():
    """
    Fetches the most recent reports for the dashboard.
    """
    pre = await db.db.reports.find_one({"type": "PRE_MARKET"}, sort=[("timestamp", -1)])
    post = await db.db.reports.find_one({"type": "POST_MARKET"}, sort=[("timestamp", -1)])
    
    # Helper to convert ObjectId to string
    def clean_id(doc):
        if doc: 
            doc["_id"] = str(doc["_id"])
        return doc

    return {"pre_market": clean_id(pre), "post_market": clean_id(post)}

# Backtest Endpoint
@app.get("/backtest/{symbol}")
async def run_backtest(symbol: str):
    """
    Runs a simulation on historical data to verify AI performance.
    """
    user_id = "demo_user"
    user = await db.db.users.find_one({"user_id": user_id})
    current_capital = user["balance"] if user else 1000.0

    engine = BacktestEngine()
    result = await engine.run_backtest(symbol, current_capital)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)