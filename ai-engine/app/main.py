from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Union, Any
from contextlib import asynccontextmanager
from datetime import datetime
import torch
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import os

# Custom Modules
from app.services.data_loader import MarketDataLoader
from app.processing.indicators import TechnicalAnalyzer
from app.ml.model import AladdinPricePredictor
from app.services.news_agent import NewsAgent
from app.services.mongo import db 

# --- FIX 1: GLOBAL INSTANCE (Prevents Double Loading) ---
news_agent = NewsAgent() 

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Aladdin Engine Starting...")
    db.connect()
    print("🧠 RAG Engine is ready.")
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

# --- MODELS ---
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

# --- ENDPOINTS ---

@app.get("/")
def health_check():
    return {"status": "online"}

@app.get("/predict/{symbol}", response_model=PredictionResponse)
async def predict_stock(symbol: str):
    try:
        loader = MarketDataLoader()
        df = loader.get_stock_data(symbol, period="5y")
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail="Stock data not found")
            
        ta = TechnicalAnalyzer()
        df = ta.add_all_indicators(df)
        
        # Prepare AI Data
        features = ['Close', 'RSI', 'SMA_50', 'SMA_200', 'OBV']
        data = df[features].values
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaler.fit(data)
        
        last_60_days = data[-60:]
        scaled_input = scaler.transform(last_60_days)
        input_tensor = torch.from_numpy(scaled_input).float().unsqueeze(0)
        
        # Load Model
        model_path = f"app/ml/models/{symbol}_lstm.pth"
        if not os.path.exists(model_path):
             if os.path.exists("app/ml/models/RELIANCE.NS_lstm.pth"):
                 print(f"⚠️ Warning: Using fallback model for {symbol}")
                 model_path = "app/ml/models/RELIANCE.NS_lstm.pth"
             else:
                 raise HTTPException(status_code=400, detail="No models trained.")

        model = AladdinPricePredictor(input_dim=len(features))
        model.load_state_dict(torch.load(model_path))
        model.eval()
        
        # FIX 2: Use the Global 'news_agent' variable
        search_term = f"{symbol} stock" if "USD" not in symbol else f"{symbol} crypto"
        news = news_agent.get_news(search_term) 
        sentiment_score = news_agent.analyze_sentiment(news)

        # Predict
        with torch.no_grad():
            prediction_scaled = model(input_tensor)
            
        dummy_row = np.zeros((1, len(features)))
        dummy_row[0, 0] = prediction_scaled.item()
        prediction_actual = scaler.inverse_transform(dummy_row)[0, 0]
        
        current_price = df['Close'].iloc[-1]
        move_pct = ((prediction_actual - current_price) / current_price) * 100
        
        final_signal = "HOLD"
        if move_pct > 1.0: final_signal = "BUY"
        elif move_pct < -1.0: final_signal = "SELL"
        
        if final_signal == "BUY" and sentiment_score < -0.2:
            final_signal = "HOLD (Risk Alert ⚠️)"

        # Chart Data
        history_df = df.tail(90).copy()
        chart_data = []
        for index, row in history_df.iterrows():
            chart_data.append({
                "time": row['Date'].strftime("%Y-%m-%d"),
                "open": row['Open'], "high": row['High'], "low": row['Low'], "close": row['Close'],
                "volume": row['Volume']
            })

        return {
            "symbol": symbol,
            "current_price": round(current_price, 2),
            "predicted_price": round(prediction_actual, 2),
            "expected_move_pct": round(move_pct, 2),
            "signal": final_signal,
            "confidence": 0.0,
            "sentiment_score": sentiment_score,
            "recent_news": news[:3],
            "chart_data": chart_data,
            "volume": float(df['Volume'].iloc[-1]),
            "market_cap": 0.0
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- WALLET & TRADING ---

@app.get("/wallet")
async def get_wallet():
    user_id = "demo_user"
    user = await db.db.users.find_one({"user_id": user_id})
    if not user:
        await db.db.users.insert_one({"user_id": user_id, "balance": 1000.0, "portfolio": {}})
        return {"balance": 1000.0, "holdings": []}
    
    holdings = []
    portfolio = user.get("portfolio", {})
    
    # FIX 3: Safe Portfolio Parsing (Handles dictionary corruption)
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
    user_id = "demo_user"
    cursor = db.db.trades.find({"user_id": user_id}).sort("timestamp", -1).limit(50)
    trades = []
    async for doc in cursor:
        trades.append({
            "symbol": doc["symbol"],
            "action": doc["action"],
            "price": doc["price"],
            "quantity": doc.get("quantity", 1),
            "timestamp": doc["timestamp"].strftime("%Y-%m-%d %H:%M"),
            "total": doc["price"] * doc.get("quantity", 1)
        })
    return {"trades": trades}

@app.post("/trade")
async def execute_trade(trade: TradeRequest):
    user_id = "demo_user"
    user = await db.db.users.find_one({"user_id": user_id})
    if not user: await get_wallet()
    
    # FIX 4: Explicitly Convert Quantity to Int to avoid Type Errors
    qty = int(trade.quantity)
    if qty <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

    total_cost = trade.price * qty
    
    # Get current holding safely
    current_portfolio = user.get("portfolio", {})
    raw_holding = current_portfolio.get(trade.symbol, 0)
    current_qty = int(raw_holding) if not isinstance(raw_holding, dict) else int(raw_holding.get('quantity', 0))

    if trade.action == "BUY":
        if user["balance"] < total_cost:
            # FIX 5: Better error message
            raise HTTPException(status_code=400, detail=f"Insufficient Funds. Need ₹{total_cost:,.2f}")
        
        new_balance = user["balance"] - total_cost
        new_qty = current_qty + qty
        
        await db.db.users.update_one(
            {"user_id": user_id},
            {
                "$set": {"balance": new_balance},
                "$set": {f"portfolio.{trade.symbol}": new_qty}
            }
        )

    elif trade.action == "SELL":
        if current_qty < qty:
            raise HTTPException(status_code=400, detail=f"Insufficient Holdings. You own {current_qty}.")
            
        new_balance = user["balance"] + total_cost
        new_qty = current_qty - qty
        
        await db.db.users.update_one(
            {"user_id": user_id},
            {
                "$set": {"balance": new_balance},
                "$set": {f"portfolio.{trade.symbol}": new_qty}
            }
        )

    await db.db.trades.insert_one({
        "user_id": user_id, "symbol": trade.symbol, "action": trade.action,
        "price": trade.price, "quantity": qty, "total": total_cost,
        "timestamp": datetime.utcnow()
    })

    return {"status": "success", "message": f"{trade.action} {qty} {trade.symbol}", "new_balance": new_balance}

# --- ADMIN / RESET ---

@app.post("/reset")
async def reset_account():
    """
    Wipes all data and resets to fresh state.
    """
    user_id = "demo_user"
    
    # 1. Delete all trade history
    await db.db.trades.delete_many({"user_id": user_id})
    
    # 2. Reset User Balance & Portfolio
    await db.db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "balance": 1000.0,
                "portfolio": {},  # Clear all stocks
                "last_refill": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    # 3. Optional: Clear AI Predictions history if you want a totally fresh start
    # await db.db.predictions.delete_many({}) 
    
    print("🧹 System Wiped. Reset to ₹1000.")
    return {"status": "success", "message": "Account reset to ₹1000. History cleared."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)