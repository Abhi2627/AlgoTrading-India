import pandas as pd
import numpy as np
import torch
import os
from typing import Dict, List, Tuple
from trading_environment import StockTradingEnvironment
from dqn_model import DQNAgent
from technical_analyzer import AdvancedTechnicalAnalyzer
from rag_system import FinancialRAGSystem
from historical_data_loader import HistoricalDataLoader
import time

class AITrainingPipeline:
    """Complete pipeline for training the DQN trading agent with real data & RAG"""
    
    def __init__(self, model_dir: str = "models"):
        self.model_dir = model_dir
        self.technical_analyzer = AdvancedTechnicalAnalyzer()
        self.rag_system = FinancialRAGSystem()
        self.data_loader = HistoricalDataLoader()
        os.makedirs(model_dir, exist_ok=True)
    
    def prepare_training_data(self, symbol: str, years: int = 3) -> pd.DataFrame:
        """Prepare comprehensive training data with technical indicators + RAG"""
        print(f"Preparing training data for {symbol}...")
        
        try:
            # Load real historical data
            historical_data = self.data_loader.load_training_dataset([symbol])
            hist_data = historical_data.get(symbol)
            
            if hist_data is None or hist_data.empty:
                print(f"No data for {symbol}")
                return None
            
            # Calculate technical indicators
            analyzed_data = self.technical_analyzer.calculate_all_indicators(hist_data)
            
            # Get market context from RAG system
            market_context = self.rag_system.get_market_context(symbol)
            
            # Add sentiment-based features
            analyzed_data = self._add_sentiment_features(analyzed_data, market_context)
            
            # Fill NaN values
            analyzed_data = analyzed_data.ffill().bfill()
            
            print(f"Prepared {len(analyzed_data)} data points for {symbol}")
            print(f"   Market Sentiment: {market_context['overall_sentiment']} "
                  f"(Score: {market_context['sentiment_score']})")
            
            return analyzed_data
            
        except Exception as e:
            print(f"Error preparing data for {symbol}: {e}")
            return None
    
    def _add_sentiment_features(self, data: pd.DataFrame, market_context: Dict) -> pd.DataFrame:
        """Add sentiment-based features to the dataset"""
        # Add sentiment score as a feature (constant for now, could be time-varying)
        data['market_sentiment'] = market_context['sentiment_score']
        data['news_impact'] = market_context['recent_news_impact']
        
        # Add volatility indicator (simplified)
        data['price_volatility'] = data['Close'].rolling(window=20).std() / data['Close'].rolling(window=20).mean()
        
        return data
    
    def train_agent(self, 
                   symbol: str,
                   episodes: int = 500,  # Increased for proper training
                   initial_capital: float = 10000.0) -> Dict:  # More realistic capital
        """Train the DQN agent with proper dataset"""
        print(f"Starting PROPER training for {symbol}...")
        
        # Prepare comprehensive data
        training_data = self.prepare_training_data(symbol)
        if training_data is None:
            return {"error": f"Could not prepare data for {symbol}"}
        
        # Create environment and agent
        env = StockTradingEnvironment(training_data, initial_capital=initial_capital)
        state_size = env.observation_space.shape[0]
        action_size = env.action_space.n
        
        agent = DQNAgent(state_size, action_size)
        
        # Training metrics
        episode_rewards = []
        episode_returns = []
        best_total_return = -float('inf')
        
        print(f"Training for {episodes} episodes with real market data...")
        
        for episode in range(episodes):
            state, _ = env.reset()
            total_reward = 0
            done = False
            
            while not done:
                action = agent.act(state)
                next_state, reward, done, truncated, info = env.step(action)
                agent.remember(state, action, reward, next_state, done)
                state = next_state
                total_reward += reward
                
                # Train the agent more frequently
                if len(agent.memory) > agent.batch_size:
                    loss = agent.replay()
            
            # Update target network periodically
            if episode % 20 == 0:
                agent.update_target_network()
            
            # Calculate performance metrics
            metrics = env.get_performance_metrics()
            episode_rewards.append(total_reward)
            episode_returns.append(metrics.get('total_return_percent', 0))
            
            # Save best model
            current_return = metrics.get('total_return_percent', 0)
            if current_return > best_total_return:
                best_total_return = current_return
                model_path = os.path.join(self.model_dir, f"{symbol.replace('.NS', '')}_best.pth")
                agent.save(model_path)
            
            if episode % 50 == 0:  # Less frequent logging
                print(f"Episode {episode:3d} | "
                      f"Return: {current_return:6.2f}% | "
                      f"Epsilon: {agent.epsilon:.3f} | "
                      f"Trades: {metrics.get('total_trades', 0)} | "
                      f"Final Value: ₹{env.total_value:.2f}")
        
        # Save final model
        final_model_path = os.path.join(self.model_dir, f"{symbol.replace('.NS', '')}_final.pth")
        agent.save(final_model_path)
        
        training_results = {
            'symbol': symbol,
            'episodes': episodes,
            'best_return': best_total_return,
            'final_epsilon': agent.epsilon,
            'final_portfolio_value': env.total_value,
            'training_data_points': len(training_data),
            'market_sentiment': training_data['market_sentiment'].iloc[-1] if 'market_sentiment' in training_data.columns else 0.5
        }
        
        print(f"PROPER training completed for {symbol}. Best return: {best_total_return:.2f}%")
        print(f"   Final Portfolio: ₹{env.total_value:.2f} "
              f"(Starting: ₹{initial_capital:.2f})")
        
        return training_results

# Test the improved training pipeline
if __name__ == "__main__":
    print("Testing IMPROVED AI Training Pipeline...")
    
    pipeline = AITrainingPipeline()
    
    # Test with proper training
    test_symbols = ['RELIANCE.NS']
    
    # Train with more episodes and real data
    results = pipeline.train_multiple_stocks(test_symbols, episodes_per_stock=100)
    
    print("IMPROVED Training pipeline test completed!")