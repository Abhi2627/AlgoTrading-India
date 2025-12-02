This file is now redundant because the README covers the structure well, but if you want to keep it for technical depth, here is the updated version matching the Microservices architecture.

```markdown
# Architecture & Design Documentation

## System Architecture
Aladdin AI uses a decoupled **Microservices Architecture**. The heavy lifting (AI/ML) is handled by Python, while the user experience is handled by Next.js. They communicate via REST API and share a cloud database.

### 1. The AI Engine (Python FastAPI)
* **Responsibility:** The core logic center. It does not store user sessions but handles all data processing.
* **Data Pipeline:**
    * **Ingestion:** Fetches raw OHLCV data via `yfinance` (Stocks) and `ccxt` (Crypto).
    * **Processing:** `pandas-ta` calculates 20+ technical indicators (RSI, Bollinger, MACD).
    * **Inference:**
        * **LSTM:** Predicts the next day's closing price based on the last 60 days.
        * **RAG:** Scrapes Google News, vectorizes headlines using `all-MiniLM-L6-v2`, and calculates a Sentiment Score (-1 to +1).
* **Storage:** Saves prediction logs and trade execution orders to MongoDB.

### 2. The Database (MongoDB Atlas)
* **Role:** The "Source of Truth" for persistence.
* **Collections:**
    * `users`: Stores wallet balance (`₹1000`), portfolio holdings, and monthly refill timestamps.
    * `trades`: Immutable ledger of every buy/sell transaction.
    * `predictions`: Historical log of AI signals (used for backtesting accuracy later).

### 3. The Frontend (Next.js 14)
* **Responsibility:** Visualization and Interaction.
* **Key Components:**
    * `StockDashboard.tsx`: The main trading terminal. Uses `lightweight-charts` for rendering financial data.
    * `GlobalSearch.tsx`: Smart autocomplete for assets.
    * `HomeView.tsx`: Displays wallet balance and trade history.
* **Routing:** Uses Dynamic Routing (`/asset/[symbol]`) to generate pages for any asset on the fly.

## Data Flow: "The Trading Loop"

1.  **User Search:** User types "BTC" → Frontend routes to `/asset/BTC-USD`.
2.  **Analysis Request:** Frontend calls `GET /predict/BTC-USD`.
3.  **AI Execution:**
    * Backend checks if a trained model exists.
    * Fetches live price.
    * Runs LSTM prediction.
    * Scrapes news & runs Vector Sentiment analysis.
    * Returns JSON (Price, Signal, Confidence, News).
4.  **Decision:** User clicks "BUY".
5.  **Execution:**
    * Frontend calls `POST /trade`.
    * Backend verifies funds in MongoDB `users` collection.
    * Backend updates Balance & Portfolio.
    * Backend logs transaction to `trades`.
6.  **Feedback:** Frontend updates the Wallet UI instantly.