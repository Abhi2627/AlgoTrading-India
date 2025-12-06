```markdown
# Architecture Documentation

## System Design
Aladdin AI follows a modern **Microservices Architecture**, separating the "Brain" (Computation) from the "Face" (Presentation).

### 1. AI Engine (Python FastAPI)
* **Role:** The decision-making core. It handles all data ingestion, processing, and storage.
* **Key Components:**
    * `transformer_model.py`: The Universal Time-Series Transformer. It uses Multi-Head Attention to detect complex price patterns across different asset classes.
    * `rag_engine.py`: Converts news headlines into 384-dimensional vectors to perform semantic sentiment analysis.
    * `backtester.py`: A simulation engine that runs the AI on historical data to calculate ROI and Drawdown.
    * `report_engine.py`: Automates daily market analysis and accuracy tracking.

### 2. The Database (MongoDB Atlas)
* **Role:** Central persistent storage.
* **Collections:**
    * `users`: Stores wallet balance, holdings, and portfolio history.
    * `trades`: Immutable ledger of all executed buy/sell orders.
    * `reports`: Daily Pre-market and Post-market AI analysis logs.

### 3. The Frontend (Next.js 14)
* **Role:** Interactive user interface.
* **Key Features:**
    * **Dynamic Routing:** `/asset/[symbol]` pages are generated on the fly for any requested stock.
    * **Global Search:** Instant search across Stocks, Crypto, and Forex using a unified index.
    * **Real-time Charts:** Renders interactive candlestick charts using `lightweight-charts`.

## Data Flow Diagram

1.  **User Input:** User searches for "Tata Motors".
2.  **Frontend:** Navigates to `/asset/TATAMOTORS.NS`.
3.  **API Call:** Frontend requests `GET /predict/TATAMOTORS.NS` from Python Engine.
4.  **AI Processing:**
    * Checks for cached data.
    * Fetches live price & news.
    * Runs Transformer Model (Inference).
    * Runs RAG Model (Sentiment).
    * Calculates Confidence Score.
5.  **Response:** Returns detailed JSON (Price, Signal, News, Chart Data).
6.  **User Action:** User clicks "BUY".
7.  **Transaction:**
    * Backend verifies funds in MongoDB.
    * Updates Wallet Balance.
    * Logs Trade.