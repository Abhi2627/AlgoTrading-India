# Project Structure Documentation

## Architecture Overview

AlgoTrade India follows a microservices architecture with three main services:

### 1. AI Engine (Python FastAPI)
- **Port**: 8000
- **Role**: AI signal generation and technical analysis
- **Key Files**:
  - `main.py` - FastAPI server and endpoints
  - `dqn_model.py` - Deep Q-Network implementation
  - `trading_environment.py` - Custom Gymnasium environment
  - `technical_analyzer.py` - Technical analysis calculations
  - `rag_system.py` - News sentiment analysis
  - `data_manager.py` - Data acquisition and management

### 2. Backend Server (Node.js Express)
- **Port**: 3001
- **Role**: Business logic and API orchestration
- **Key Files**:
  - `server.js` - Express server and routing
  - API routes for frontend communication

### 3. Frontend Dashboard (Next.js)
- **Port**: 3000
- **Role**: User interface and visualization
- **Key Files**:
  - `src/app/page.tsx` - Main dashboard
  - `src/components/` - React components
  - Sector navigation, stock lists, portfolio views

## Data Flow

1. **Frontend** → Requests data from Backend
2. **Backend** → Proxies requests to AI Engine
3. **AI Engine** → Fetches market data → Calculates signals
4. **AI Engine** → Returns AI signals to Backend
5. **Backend** → Formats data → Sends to Frontend
6. **Frontend** → Displays data with interactive UI

## Key Features Implementation

### AI Training Pipeline
- Uses Deep Reinforcement Learning (DQN)
- Trains on historical market data
- Incorporates technical indicators and market sentiment
- Saves trained models for real-time inference

### Real-time Dashboard
- Sector-based stock organization
- AI confidence scores and signals
- Interactive hover previews
- Portfolio performance tracking