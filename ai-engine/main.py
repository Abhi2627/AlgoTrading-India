from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uvicorn
import random
import time

print("Starting AlgoTrade AI Engine - Fast Response Version")

# Create FastAPI app
app = FastAPI(
    title="AlgoTrade AI Engine",
    description="AI-Powered Trading System for Indian Markets",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pre-defined stock universe for instant responses
stock_universe = {
    'Technology & IT': [
        {'symbol': 'TCS.NS', 'name': 'Tata Consultancy Services Limited', 'base_price': 3450},
        {'symbol': 'INFY.NS', 'name': 'Infosys Limited', 'base_price': 1650},
        {'symbol': 'WIPRO.NS', 'name': 'Wipro Limited', 'base_price': 450},
        {'symbol': 'HCLTECH.NS', 'name': 'HCL Technologies Limited', 'base_price': 1250}
    ],
    'Banking & Financial': [
        {'symbol': 'HDFCBANK.NS', 'name': 'HDFC Bank Limited', 'base_price': 1650},
        {'symbol': 'ICICIBANK.NS', 'name': 'ICICI Bank Limited', 'base_price': 980},
        {'symbol': 'SBIN.NS', 'name': 'State Bank of India', 'base_price': 650},
        {'symbol': 'AXISBANK.NS', 'name': 'Axis Bank Limited', 'base_price': 1100}
    ],
    'Energy & Oil & Gas': [
        {'symbol': 'RELIANCE.NS', 'name': 'Reliance Industries Limited', 'base_price': 2450},
        {'symbol': 'ONGC.NS', 'name': 'Oil and Natural Gas Corporation', 'base_price': 180}
    ],
    'Pharma & Healthcare': [
        {'symbol': 'SUNPHARMA.NS', 'name': 'Sun Pharmaceutical Industries', 'base_price': 1250},
        {'symbol': 'DRREDDY.NS', 'name': 'Dr. Reddys Laboratories', 'base_price': 5800}
    ],
    'Automobile': [
        {'symbol': 'MARUTI.NS', 'name': 'Maruti Suzuki India Limited', 'base_price': 10500},
        {'symbol': 'TATAMOTORS.NS', 'name': 'Tata Motors Limited', 'base_price': 750}
    ]
}

def generate_instant_stock_data(stock_info):
    """Generate stock data instantly without external calls"""
    base_price = stock_info['base_price']
    change = random.uniform(-base_price * 0.05, base_price * 0.05)  # ±5% change
    current_price = base_price + change
    change_percent = (change / base_price) * 100
    
    # Generate realistic AI signals
    if change_percent > 2:
        ai_signal = 'BUY'
        confidence = random.uniform(75, 95)
    elif change_percent < -2:
        ai_signal = 'SELL' 
        confidence = random.uniform(75, 95)
    else:
        ai_signal = 'HOLD'
        confidence = random.uniform(60, 80)
    
    return {
        "symbol": stock_info['symbol'],
        "name": stock_info['name'],
        "current_price": round(current_price, 2),
        "change_percent": round(change_percent, 2),
        "volume": random.randint(100000, 5000000),
        "market_cap": round(current_price * random.randint(1000000, 50000000), 2),
        "ai_signal": ai_signal,
        "ai_confidence": round(confidence, 1),
        "signal_strength": round(random.uniform(-3, 3), 1),
        "rsi": round(random.uniform(30, 70), 1)
    }

@app.get("/")
async def root():
    """Root endpoint - instant response"""
    return {
        "message": "AlgoTrade AI Engine - Fast Response",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check - instant response"""
    return {
        "status": "healthy",
        "response_time": "instant",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/sectors")
async def get_sectors():
    """Get all sectors - instant response"""
    start_time = time.time()
    
    try:
        sectors_data = {}
        
        for sector, stocks in stock_universe.items():
            sectors_data[sector] = []
            for stock_info in stocks:
                stock_data = generate_instant_stock_data(stock_info)
                sectors_data[sector].append(stock_data)
        
        response_time = round((time.time() - start_time) * 1000, 2)  # ms
        
        return {
            "sectors": sectors_data,
            "last_updated": datetime.now().isoformat(),
            "response_time_ms": response_time,
            "total_stocks": sum(len(stocks) for stocks in sectors_data.values())
        }
        
    except Exception as e:
        return {
            "error": "Failed to fetch sectors data",
            "details": str(e)
        }

@app.get("/stocks")
async def get_all_stocks():
    """Get all stocks - instant response"""
    start_time = time.time()
    
    try:
        stocks_data = []
        
        for sector_stocks in stock_universe.values():
            for stock_info in sector_stocks:
                stock_data = generate_instant_stock_data(stock_info)
                stocks_data.append({
                    "symbol": stock_data["symbol"],
                    "name": stock_data["name"],
                    "current_price": stock_data["current_price"],
                    "day_high": round(stock_data["current_price"] * 1.02, 2),
                    "day_low": round(stock_data["current_price"] * 0.98, 2),
                    "volume": stock_data["volume"],
                    "ai_signal": stock_data["ai_signal"],
                    "ai_confidence": stock_data["ai_confidence"],
                    "signal_strength": stock_data["signal_strength"]
                })
        
        response_time = round((time.time() - start_time) * 1000, 2)
        
        return {
            "stocks": stocks_data,
            "count": len(stocks_data),
            "last_updated": datetime.now().isoformat(),
            "response_time_ms": response_time
        }
        
    except Exception as e:
        return {
            "error": "Failed to fetch stocks data",
            "details": str(e)
        }

@app.get("/ai/signal/{symbol}")
async def get_ai_signal(symbol: str):
    """Get AI signal - instant response"""
    start_time = time.time()
    
    try:
        if not symbol.endswith('.NS'):
            symbol += '.NS'
        
        # Find the stock in our universe
        stock_info = None
        for sector_stocks in stock_universe.values():
            for stock in sector_stocks:
                if stock['symbol'] == symbol:
                    stock_info = stock
                    break
            if stock_info:
                break
        
        if not stock_info:
            return {
                "error": f"Stock {symbol} not found",
                "symbol": symbol
            }
        
        stock_data = generate_instant_stock_data(stock_info)
        response_time = round((time.time() - start_time) * 1000, 2)
        
        return {
            "symbol": symbol,
            "signal": stock_data["ai_signal"],
            "confidence": stock_data["ai_confidence"],
            "current_price": stock_data["current_price"],
            "timestamp": datetime.now().isoformat(),
            "response_time_ms": response_time
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "symbol": symbol
        }

if __name__ == "__main__":
    print("Starting server on http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("Response Time: Instant")
    print("Total Stocks:", sum(len(stocks) for stocks in stock_universe.values()))
    uvicorn.run(app, host="0.0.0.0", port=8000)