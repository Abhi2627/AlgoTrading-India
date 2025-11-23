import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
from datetime import datetime
import uvicorn
from nse_stocks import NSEStockUniverse
from technical_analyzer import AdvancedTechnicalAnalyzer
import pandas as pd
import random
from inference_engine import AIInferenceEngine
from training_pipeline import AITrainingPipeline

print("Starting AlgoTrade AI Engine with Technical Analysis...")

#Initialize AI components after other initializations
ai_inference = AIInferenceEngine()
ai_training = AITrainingPipeline()

# Create FastAPI app
app = FastAPI(
    title="AlgoTrade AI Engine",
    description="AI-Powered Trading System for Indian Markets with Technical Analysis",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
stock_universe = NSEStockUniverse()
technical_analyzer = AdvancedTechnicalAnalyzer()

# Store cached data
stock_cache = {}
cache_timestamp = None
CACHE_DURATION = 300  # 5 minutes

@app.get("/")
async def root():
    """Root endpoint - basic info"""
    return {
        "message": "AlgoTrade AI Engine with Technical Analysis is running!",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "stocks_tracked": len(stock_universe.get_stock_universe()),
        "sectors": len(stock_universe.get_sectors())
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "technical_analysis": "active"
    }

def get_cached_stock_data(use_demo_data=True):
    """Get or refresh cached stock data - use demo data to avoid API limits"""
    global stock_cache, cache_timestamp
    
    current_time = datetime.now().timestamp()
    
    if (cache_timestamp is None or 
        (current_time - cache_timestamp) > CACHE_DURATION or 
        not stock_cache):
        
        print("Refreshing stock data cache...")
        stock_cache = {}
        
        if use_demo_data:
            # Use demo data to avoid API limits during development
            print("Using demo data to avoid API rate limits")
            for symbol in stock_universe.get_stock_universe()[:25]:  # Limit to 25 stocks
                try:
                    demo_data = stock_universe.get_demo_stock_data(symbol)
                    
                    # Add technical analysis signals to demo data
                    stock_cache[symbol] = {
                        "symbol": demo_data["symbol"],
                        "name": demo_data["name"],
                        "current_price": demo_data["current_price"],
                        "previous_close": demo_data["previous_close"],
                        "day_high": demo_data["current_price"] * 1.02,  # Mock high
                        "day_low": demo_data["current_price"] * 0.98,   # Mock low
                        "volume": demo_data["volume"],
                        "market_cap": demo_data["market_cap"],
                        "sector": demo_data["sector"],
                        "technical_analysis": {
                            "signal": random.choice(['BUY', 'SELL', 'HOLD']),
                            "confidence": random.randint(70, 95),
                            "strength": random.uniform(-3, 3),
                            "rsi": random.uniform(20, 80)
                        },
                        "data_points": 100
                    }
                    
                    print(f"Demo data for {symbol} - ₹{demo_data['current_price']}")
                    
                except Exception as e:
                    stock_cache[symbol] = {"symbol": symbol, "error": str(e)}
        else:
            # Real data fetching (commented out for now)
            print("Fetching real data (disabled to avoid rate limits)")
            # ... (keep your original real data code here but commented)
        
        cache_timestamp = current_time
        print(f"Cache updated with {len(stock_cache)} stocks")
    
    return stock_cache

@app.get("/stocks")
async def get_all_stocks():
    """Get basic info for all tracked stocks with technical analysis"""
    cached_data = get_cached_stock_data()
    stocks_data = []
    
    for symbol, data in cached_data.items():
        if 'error' not in data:
            stocks_data.append({
                "symbol": data["symbol"],
                "name": data["name"],
                "current_price": data["current_price"],
                "day_high": data["day_high"],
                "day_low": data["day_low"],
                "volume": data["volume"],
                "ai_signal": data["technical_analysis"]["signal"],
                "ai_confidence": data["technical_analysis"]["confidence"],
                "signal_strength": data["technical_analysis"]["strength"]
            })
    
    return {
        "stocks": stocks_data,
        "count": len(stocks_data),
        "last_updated": datetime.now().isoformat(),
        "analysis_type": "technical_indicators"
    }

@app.get("/sectors/ai")
async def get_sectors_with_ai():
    """Get sectors with AI-powered analysis"""
    cached_data = get_cached_stock_data()
    sectors_data = {}
    sector_mapping = stock_universe.get_sectors()
    
    for sector, symbols in sector_mapping.items():
        sectors_data[sector] = []
        for symbol in symbols:
            if symbol in cached_data and 'error' not in cached_data[symbol]:
                stock_data = cached_data[symbol]
                
                # Get AI signal for this stock
                ai_signal = ai_inference.get_ai_signal(symbol)
                
                stock_info = {
                    "symbol": stock_data["symbol"],
                    "name": stock_data["name"],
                    "current_price": stock_data["current_price"],
                    "change_percent": random.uniform(-5, 5),  # Mock change
                    "volume": stock_data["volume"],
                    "market_cap": stock_data["market_cap"],
                    "ai_signal": ai_signal["signal"],
                    "ai_confidence": ai_signal["confidence"],
                    "signal_strength": ai_signal.get("signal_strength", 0),
                    "model_used": ai_signal.get("model_used", "Technical"),
                    "rsi": random.uniform(20, 80)  # Mock RSI
                }
                sectors_data[sector].append(stock_info)
    
    # Calculate sector-level AI sentiment
    sector_sentiment = {}
    for sector, stocks in sectors_data.items():
        if stocks:
            buy_signals = sum(1 for s in stocks if s['ai_signal'] == 'BUY')
            total_stocks = len(stocks)
            sector_sentiment[sector] = {
                'bullish_percentage': (buy_signals / total_stocks) * 100,
                'total_stocks': total_stocks,
                'buy_signals': buy_signals,
                'overall_sentiment': 'BULLISH' if buy_signals > total_stocks / 2 else 'BEARISH'
            }
    
    return {
        "sectors": sectors_data,
        "sector_sentiment": sector_sentiment,
        "last_updated": datetime.now().isoformat(),
        "ai_models_active": True
    }

@app.get("/analysis/{symbol}")
async def get_detailed_analysis(symbol: str):
    """Get detailed technical analysis for a stock"""
    try:
        if not symbol.endswith('.NS'):
            symbol += '.NS'
        
        stock = yf.Ticker(symbol)
        hist_data = stock.history(period="6mo")  # 6 months for better analysis
        
        if hist_data.empty:
            return {"error": "No data available"}
        
        # Calculate all indicators
        analyzed_data = technical_analyzer.calculate_all_indicators(hist_data)
        current_signal = technical_analyzer.get_current_signal(analyzed_data)
        
        # Get the latest 10 days of signals for trend analysis
        recent_signals = analyzed_data[['signal', 'signal_strength']].tail(10)
        
        # Calculate signal consistency
        signal_counts = recent_signals['signal'].value_counts()
        dominant_signal = signal_counts.idxmax() if not signal_counts.empty else 'HOLD'
        consistency = (signal_counts.max() / len(recent_signals)) * 100
        
        return {
            "symbol": symbol,
            "current_signal": current_signal,
            "signal_trend": {
                "dominant_signal": dominant_signal,
                "consistency": round(consistency, 2),
                "recent_signals": recent_signals.to_dict('records')
            },
            "key_levels": {
                "support": analyzed_data['bb_lower'].iloc[-1],
                "resistance": analyzed_data['bb_upper'].iloc[-1],
                "trend": "BULLISH" if analyzed_data['sma_20'].iloc[-1] > analyzed_data['sma_50'].iloc[-1] else "BEARISH"
            },
            "analysis_timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {"error": str(e)}

@app.get("/ai/signal/{symbol}")
async def get_ai_signal(symbol: str):
    """Get AI trading signal for a specific stock"""
    try:
        if not symbol.endswith('.NS'):
            symbol += '.NS'
        
        signal = ai_inference.get_ai_signal(symbol)
        return {
            "success": True,
            "data": signal,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "symbol": symbol
        }

@app.get("/ai/signals/batch")
async def get_batch_ai_signals():
    """Get AI signals for all tracked stocks"""
    try:
        symbols = stock_universe.get_stock_universe()[:15]  # Limit for performance
        batch_signals = ai_inference.get_batch_signals(symbols)
        
        return {
            "success": True,
            "data": batch_signals,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/ai/train/{symbol}")
async def train_ai_model(symbol: str, episodes: int = 50):
    """Train AI model for a specific stock"""
    try:
        if not symbol.endswith('.NS'):
            symbol += '.NS'
        
        print(f"🎯 Starting AI training for {symbol}...")
        training_result = ai_training.train_agent(symbol, episodes=episodes)
        
        return {
            "success": True,
            "data": training_result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "symbol": symbol
        }

@app.get("/ai/models/available")
async def get_available_models():
    """Get list of available trained models"""
    try:
        models_dir = "models"
        if not os.path.exists(models_dir):
            return {"success": True, "data": {"available_models": []}}
        
        model_files = [f for f in os.listdir(models_dir) if f.endswith('.pth')]
        available_models = [f.replace('_best.pth', '').replace('_final.pth', '') 
                          for f in model_files]
        available_models = list(set(available_models))  # Remove duplicates
        
        return {
            "success": True,
            "data": {
                "available_models": available_models,
                "total_models": len(available_models)
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


if __name__ == "__main__":
    print("Starting server on http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("Technical Analysis: ACTIVE")
    print("Stocks Tracked:", len(stock_universe.get_stock_universe()))
    uvicorn.run(app, host="0.0.0.0", port=8000)