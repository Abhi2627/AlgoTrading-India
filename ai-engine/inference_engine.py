import torch
import numpy as np
import pandas as pd
import os
from typing import Dict, List, Optional
from dqn_model import DQNAgent
from trading_environment import StockTradingEnvironment
from technical_analyzer import AdvancedTechnicalAnalyzer
import yfinance as yf

class AIInferenceEngine:
    """Engine for making real-time predictions using trained models"""
    
    def __init__(self, model_dir: str = "models"):
        self.model_dir = model_dir
        self.technical_analyzer = AdvancedTechnicalAnalyzer()
        self.loaded_models: Dict[str, DQNAgent] = {}
    
    def load_model(self, symbol: str) -> Optional[DQNAgent]:
        """Load trained model for a symbol"""
        model_name = symbol.replace('.NS', '')
        model_path = os.path.join(self.model_dir, f"{model_name}_best.pth")
        
        if not os.path.exists(model_path):
            print(f"No trained model found for {symbol}")
            return None
        
        try:
            # Create agent and load weights
            env = StockTradingEnvironment(pd.DataFrame())  # Dummy env for dimensions
            agent = DQNAgent(
                state_size=env.observation_space.shape[0],
                action_size=env.action_space.n
            )
            agent.load(model_path)
            agent.epsilon = 0.01  # Minimal exploration for inference
            
            self.loaded_models[symbol] = agent
            print(f"Loaded model for {symbol}")
            return agent
            
        except Exception as e:
            print(f"Error loading model for {symbol}: {e}")
            return None
    
    def get_ai_signal(self, symbol: str, lookback_days: int = 60) -> Dict:
        """Get AI trading signal for a symbol"""
        print(f"Generating AI signal for {symbol}...")
        
        try:
            # Load or get cached model
            if symbol not in self.loaded_models:
                agent = self.load_model(symbol)
                if agent is None:
                    return self._get_fallback_signal(symbol)
            else:
                agent = self.loaded_models[symbol]
            
            # Get recent data
            stock = yf.Ticker(symbol)
            hist_data = stock.history(period=f"{lookback_days}d")
            
            if hist_data.empty:
                return self._get_fallback_signal(symbol)
            
            # Calculate technical indicators
            analyzed_data = self.technical_analyzer.calculate_all_indicators(hist_data)
            analyzed_data = analyzed_data.ffill().bfill()
            
            if analyzed_data.empty:
                return self._get_fallback_signal(symbol)
            
            # Create environment for current state
            env = StockTradingEnvironment(analyzed_data, initial_capital=1000)
            current_state = env._get_observation()
            
            # Get AI prediction
            action = agent.act(current_state)
            q_values = agent.q_network(
                torch.FloatTensor(current_state).unsqueeze(0).to(agent.device)
            ).cpu().data.numpy()[0]
            
            # Interpret action
            action_map = {0: "HOLD", 1: "BUY", 2: "SELL"}
            signal = action_map[action]
            
            # Calculate confidence from Q-values
            max_q = np.max(q_values)
            min_q = np.min(q_values)
            confidence = (max_q - min_q) / (abs(max_q) + abs(min_q) + 1e-8) * 100
            confidence = min(100, max(0, confidence * 2))  # Scale to 0-100
            
            # Get additional context
            latest_data = analyzed_data.iloc[-1]
            current_price = latest_data['Close']
            
            signal_info = {
                'symbol': symbol,
                'signal': signal,
                'confidence': round(confidence, 2),
                'action_probabilities': {
                    'HOLD': float(q_values[0]),
                    'BUY': float(q_values[1]),
                    'SELL': float(q_values[2])
                },
                'current_price': current_price,
                'timestamp': pd.Timestamp.now().isoformat(),
                'model_used': 'DQN',
                'signal_strength': abs(q_values[action] - np.mean(q_values))
            }
            
            print(f"AI Signal for {symbol}: {signal} (Confidence: {confidence:.1f}%)")
            return signal_info
            
        except Exception as e:
            print(f"Error generating AI signal for {symbol}: {e}")
            return self._get_fallback_signal(symbol)
    
    def _get_fallback_signal(self, symbol: str) -> Dict:
        """Fallback to technical analysis if AI model fails"""
        print(f"🔄 Using fallback technical analysis for {symbol}")
        
        try:
            stock = yf.Ticker(symbol)
            hist_data = stock.history(period="60d")
            
            if hist_data.empty:
                return {
                    'symbol': symbol,
                    'signal': 'HOLD',
                    'confidence': 50.0,
                    'current_price': 0,
                    'timestamp': pd.Timestamp.now().isoformat(),
                    'model_used': 'Technical Fallback',
                    'error': 'No data available'
                }
            
            analyzed_data = self.technical_analyzer.calculate_all_indicators(hist_data)
            technical_signal = self.technical_analyzer.get_current_signal(analyzed_data)
            
            return {
                'symbol': symbol,
                'signal': technical_signal['signal'],
                'confidence': technical_signal['confidence'],
                'current_price': analyzed_data['Close'].iloc[-1],
                'timestamp': pd.Timestamp.now().isoformat(),
                'model_used': 'Technical Analysis',
                'signal_strength': technical_signal['strength']
            }
            
        except Exception as e:
            return {
                'symbol': symbol,
                'signal': 'HOLD',
                'confidence': 0.0,
                'current_price': 0,
                'timestamp': pd.Timestamp.now().isoformat(),
                'model_used': 'Error Fallback',
                'error': str(e)
            }
    
    def get_batch_signals(self, symbols: List[str]) -> Dict:
        """Get AI signals for multiple symbols"""
        signals = {}
        
        for symbol in symbols:
            signals[symbol] = self.get_ai_signal(symbol)
            # Small delay to be nice to the API
            import time
            time.sleep(1)
        
        # Calculate overall market sentiment
        buy_signals = sum(1 for s in signals.values() if s['signal'] == 'BUY')
        sell_signals = sum(1 for s in signals.values() if s['signal'] == 'SELL')
        total_stocks = len(symbols)
        
        market_sentiment = {
            'bullish_percentage': (buy_signals / total_stocks) * 100,
            'bearish_percentage': (sell_signals / total_stocks) * 100,
            'neutral_percentage': ((total_stocks - buy_signals - sell_signals) / total_stocks) * 100,
            'total_analyzed': total_stocks,
            'buy_signals': buy_signals,
            'sell_signals': sell_signals
        }
        
        return {
            'signals': signals,
            'market_sentiment': market_sentiment,
            'timestamp': pd.Timestamp.now().isoformat()
        }

# Test the inference engine
if __name__ == "__main__":
    print("Testing AI Inference Engine...")
    
    engine = AIInferenceEngine()
    
    # Test with a symbol (will use fallback since no trained model yet)
    test_symbol = 'RELIANCE.NS'
    signal = engine.get_ai_signal(test_symbol)
    
    print(f"AI Signal for {test_symbol}:")
    for key, value in signal.items():
        print(f"   {key}: {value}")
    
    print("Inference engine test completed!")