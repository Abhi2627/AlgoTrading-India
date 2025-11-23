AlgoTrade India – AI Powered NSE Trading Platform

AlgoTrade India is a full-stack algorithmic trading platform for the Indian stock markets. It uses deep reinforcement learning, real-time analytics, and AI-driven decisions for autonomous NSE stock trading.

Features:

Autonomous AI stock trading with Deep Q-Network learning.

More than 20 technical indicators, including RSI, MACD, and Bollinger Bands.

Market news sentiment analysis with a RAG system.

Sector-wise analysis with AI-based confidence scores.

Portfolio risk management with dynamic position sizes and stops.

Paper trading mode with a simulated INR 1000 portfolio.

Sharpe ratio and drawdown analytics.

Real-time interactive dashboard and detailed market summaries.

Tech Stack:

AI Engine: FastAPI, PyTorch, Gymnasium, TA-Lib, yFinance

Backend: Node.js, Express.js, Axios, CORS

Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion

Project Structure:
algotrade-india/
ai-engine/
src/
models/
historical_data/
requirements.txt
backend/
frontend/
docs/
.gitignore
README.md

Getting Started:

Clone the repository:
git clone https://github.com/yourusername/algotrade-india.git
cd algotrade-india

Set up the Python virtual environment:
python -m venv algotrade-env
source algotrade-env/bin/activate

Install the AI engine dependencies:
cd ai-engine
pip install -r requirements.txt

Set up the backend:
cd ../backend
npm install

Set up the frontend:
cd ../frontend
npm install

Running the Platform:
Open three terminals, one for each major component.

AI Engine:
cd ai-engine
source ../algotrade-env/bin/activate
python main.py

Backend:
cd backend
npm run dev

Frontend:
cd frontend
npm run dev

Use http://localhost:3000 for the dashboard
API docs are at http://localhost:8000/docs

API Endpoints:

/ai/signal/{symbol} for single AI trading signal

/ai/signals/batch for multiple AI signals

/stocks, /sectors, /stocks/{symbol} for market data

/portfolio and /trade for paper trading functions

/ai/train/{symbol} to start training for one stock

Contributing:
Fork the repository, create a feature branch, commit your changes, and open a pull request.

License:
MIT License, see LICENSE file.

Credits:

Yahoo Finance for financial data

Gymnasium for reinforcement learning environment

FastAPI and PyTorch for AI development

Next.js and React for frontend development

This project is maintained by a team of fintech engineers passionate about AI and trading automation.