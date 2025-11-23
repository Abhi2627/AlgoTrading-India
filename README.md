# AlgoTrade India - AI Powered Trading System

A full-stack algorithmic trading platform for Indian stock markets using Deep Reinforcement Learning. This system autonomously trades NSE stocks using AI signals combined with real-time market analysis.

![Python](https://img.shields.io/badge/Python-3.9-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![PyTorch](https://img.shields.io/badge/PyTorch-2.1-red)

## Features

### AI-Powered Trading
- **Deep Reinforcement Learning** (DQN) for autonomous decision making
- **Real-time Technical Analysis** with 20+ indicators (RSI, MACD, Bollinger Bands, etc.)
- **RAG System** for market sentiment analysis from financial news
- **Sector-wise Analysis** with AI confidence scores

### Full-Stack Architecture
- **Microservices**: Python FastAPI (AI Engine) + Node.js (Backend) + Next.js (Frontend)
- **Real-time Dashboard** with sector-based stock organization
- **Professional UI** with interactive charts and hover effects
- **RESTful API** with comprehensive documentation

### Professional Trading Features
- **Paper Trading** with virtual ₹1000 portfolio
- **Risk Management** with position sizing and stop losses
- **Performance Analytics** with Sharpe ratio and drawdown analysis
- **Market Reports** daily/weekly/monthly performance summaries

## System Architecture
Frontend (Next.js) → Backend (Node.js) → AI Engine (Python FastAPI) → Market Data
(Port 3000) (Port 3001) (Port 8000) (Yahoo Finance)


## Tech Stack

### AI Engine (Python)
- **FastAPI** - High-performance API framework
- **PyTorch** - Deep Learning framework
- **Gymnasium** - Reinforcement Learning environment
- **yFinance** - Market data acquisition
- **TA-Lib** - Technical analysis indicators

### Backend (Node.js)
- **Express.js** - Web application framework
- **Axios** - HTTP client for API communication
- **CORS** - Cross-origin resource sharing

### Frontend (Next.js)
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/algotrade-india.git
cd algotrade-india

Project Structure
algotrade-india/
├── ai-engine/                 # Python FastAPI AI Service
│   ├── src/
│   │   ├── main.py           # FastAPI server
│   │   ├── dqn_model.py      # Deep Q-Network implementation
│   │   ├── trading_environment.py  # Gymnasium trading environment
│   │   ├── technical_analyzer.py   # Technical analysis engine
│   │   ├── rag_system.py     # Retrieval Augmented Generation system
│   │   └── data_manager.py   # Data acquisition and management
│   ├── models/               # Trained AI models
│   ├── historical_data/      # Market data storage
│   └── requirements.txt
├── backend/                  # Node.js Express Server
│   ├── server.js
│   ├── package.json
│   └── routes/
├── frontend/                 # Next.js React Application
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── styles/
│   ├── package.json
│   └── next.config.js
├── docs/                     # Documentation
├── .gitignore
└── README.md