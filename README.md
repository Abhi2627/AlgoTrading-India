# 🧞‍♂️ Aladdin AI - Institutional-Grade Trading Intelligence

**Aladdin AI** is a next-generation algorithmic trading platform that combines **Quantitative Analysis** (LSTM Neural Networks) with **Semantic Intelligence** (Vector RAG) to provide institutional-grade buy/sell signals for Stocks, Crypto, and Forex.

Unlike traditional bots that rely solely on technical indicators, Aladdin "reads" the news using Vector Embeddings to understand market sentiment and "remembers" price patterns using Long Short-Term Memory networks.

---

## 🚀 Key Features

### 🧠 **Hybrid AI Brain**
* **Quantitative:** Uses **LSTM (Long Short-Term Memory)** neural networks trained on 5 years of historical data to predict price movements.
* **Semantic:** Uses **RAG (Retrieval-Augmented Generation)** with `all-MiniLM-L6-v2` vector embeddings to analyze news sentiment (Bullish/Bearish) contextually, not just by keywords.

### 🌍 **Multi-Asset Support**
* **Indian Stocks (NSE):** Real-time analysis of Nifty 50 & mid-cap stocks.
* **Crypto:** Live analysis of Bitcoin, Ethereum, Solana, etc.
* **Forex:** Major currency pairs (EUR/USD, GBP/USD).

### 💼 **Pro Trading Terminal**
* **Live Charts:** Interactive TradingView-style candlestick charts.
* **Smart Wallet:** Simulated trading account with a ₹1,000 monthly refill system.
* **Portfolio Tracking:** Real-time tracking of holdings, profit/loss, and transaction history.
* **Universal Search:** Google-style smart search for any asset class.

---

## 🛠️ Tech Stack

### **AI Engine (The Brain) - Python**
* **Framework:** FastAPI (High-performance Async API)
* **ML/AI:** PyTorch (LSTM), Sentence-Transformers (Vector RAG), Scikit-Learn
* **Data:** yfinance (Stocks), CCXT (Crypto), MFAPI (Mutual Funds)
* **Database:** MongoDB Atlas (Cloud Storage for User Data & Predictions)

### **Frontend (The Face) - TypeScript**
* **Framework:** Next.js 14 (App Router)
* **UI:** Tailwind CSS, Lucide Icons
* **Charts:** TradingView Lightweight Charts
* **State:** React Hooks for real-time updates

---

## 📂 Project Structure

```text
aladdin-ai/
├── ai-engine/                  # 🐍 Python AI Microservice
│   ├── app/
│   │   ├── ml/                 # LSTM Models & RAG Engine
│   │   ├── services/           # Data Loaders (Yahoo/Binance) & MongoDB
│   │   ├── processing/         # Technical Indicators (RSI, MACD)
│   │   └── main.py             # FastAPI Entry Point
│   ├── requirements.txt        # Python Dependencies
│   └── Procfile                # Render Deployment Config
│
└── frontend/                   # ⚛️ Next.js Web Application
    ├── src/
    │   ├── app/                # Pages & Dynamic Routing
    │   ├── components/         # Dashboard Widgets (Charts, Wallet)
    │   └── lib/                # API Connectors
    └── package.json            # JS Dependencies