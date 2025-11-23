import gymnasium as gym
from gymnasium import spaces
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any
import random

class StockTradingEnvironment(gym.Env):
    """Custom Gymnasium environment for stock trading with DRL"""
    
    def __init__(self, 
                 stock_data: pd.DataFrame,
                 initial_capital: float = 1000.0,
                 max_steps: int = 1000):
        
        super(StockTradingEnvironment, self).__init__()
        
        self.stock_data = stock_data
        self.initial_capital = initial_capital
        self.max_steps = max_steps
        
        # Action space: 0=Hold, 1=Buy, 2=Sell
        self.action_space = spaces.Discrete(3)
        
        # State space: [RSI, MACD, Price Change, Volume Change, Position, Cash]
        self.observation_space = spaces.Box(
            low=-np.inf, 
            high=np.inf, 
            shape=(10,),  # 10 features
            dtype=np.float32
        )
        
        # Trading parameters
        self.transaction_cost = 0.001  # 0.1% transaction cost
        self.max_position_size = 0.1   # Max 10% of capital per trade
        
        self.reset()
    
    def reset(self, seed=None, options=None):
        """Reset the environment to initial state"""
        super().reset(seed=seed)
        
        self.current_step = 0
        self.cash = self.initial_capital
        self.position = 0  # Number of shares held
        self.total_value = self.initial_capital
        self.done = False
        
        # Track portfolio history
        self.portfolio_history = [self.total_value]
        self.action_history = []
        
        return self._get_observation(), {}
    
    def _get_observation(self) -> np.ndarray:
        """Get current state observation"""
        if self.current_step >= len(self.stock_data):
            return np.zeros(10, dtype=np.float32)
        
        current_data = self.stock_data.iloc[self.current_step]
        
        # Normalized features for the AI
        observation = np.array([
            current_data.get('rsi', 50) / 100.0,           # RSI normalized
            current_data.get('macd', 0) / 10.0,           # MACD normalized
            current_data.get('macd_signal', 0) / 10.0,    # MACD signal normalized
            current_data.get('sma_20', 0) / current_data['Close'] - 1,  # Price vs SMA20
            current_data.get('sma_50', 0) / current_data['Close'] - 1,  # Price vs SMA50
            current_data.get('volume', 1) / 1e6,          # Volume in millions
            self.position / 100.0,                        # Position size normalized
            self.cash / self.initial_capital,             # Cash normalized
            (self.total_value - self.initial_capital) / self.initial_capital,  # P&L
            random.uniform(-1, 1)  # Noise for exploration
        ], dtype=np.float32)
        
        return observation
    
    def step(self, action: int) -> Tuple[np.ndarray, float, bool, bool, Dict]:
        """Execute one time step within the environment"""
        if self.done:
            return self._get_observation(), 0, True, False, {}
        
        current_data = self.stock_data.iloc[self.current_step]
        current_price = current_data['Close']
        prev_value = self.total_value
        
        # Execute action
        reward = 0
        if action == 1:  # BUY
            reward = self._execute_buy(current_price)
        elif action == 2:  # SELL
            reward = self._execute_sell(current_price)
        else:  # HOLD
            reward = self._execute_hold(current_price)
        
        # Calculate new total value
        self.total_value = self.cash + (self.position * current_price)
        self.portfolio_history.append(self.total_value)
        self.action_history.append(action)
        
        # Calculate reward based on portfolio performance
        reward = (self.total_value - prev_value) / prev_value * 100  # Percentage change
        
        # Add penalty for excessive trading
        if len(self.action_history) > 1 and action != 0:
            if self.action_history[-1] != 0:  # If previous action was also trade
                reward -= 0.1  # Small penalty for overtrading
        
        # Move to next step
        self.current_step += 1
        
        # Check if episode is done
        if self.current_step >= len(self.stock_data) - 1:
            self.done = True
        elif self.current_step >= self.max_steps:
            self.done = True
        
        # Check for bankruptcy
        if self.total_value <= 0:
            self.done = True
            reward = -100  # Large penalty for bankruptcy
        
        info = {
            'step': self.current_step,
            'total_value': self.total_value,
            'cash': self.cash,
            'position': self.position,
            'price': current_price,
            'action': action
        }
        
        return self._get_observation(), reward, self.done, False, info
    
    def _execute_buy(self, price: float) -> float:
        """Execute buy action"""
        if price <= 0:
            return -1  # Penalty for invalid price
        
        max_shares = int((self.cash * self.max_position_size) / price)
        if max_shares > 0:
            # Calculate transaction cost
            cost = max_shares * price * (1 + self.transaction_cost)
            
            if cost <= self.cash:
                self.position += max_shares
                self.cash -= cost
                return 0.1  # Small positive reward for taking position
            else:
                return -0.5  # Penalty for insufficient funds
        else:
            return -0.2  # Penalty for invalid trade size
    
    def _execute_sell(self, price: float) -> float:
        """Execute sell action"""
        if self.position > 0 and price > 0:
            # Sell all position
            proceeds = self.position * price * (1 - self.transaction_cost)
            self.cash += proceeds
            self.position = 0
            
            # Calculate profit/loss
            return 0.2  # Reward for realizing gains
        else:
            return -0.5  # Penalty for invalid sell
    
    def _execute_hold(self, price: float) -> float:
        """Execute hold action"""
        # Small negative reward for holding to encourage action
        return -0.01
    
    def render(self):
        """Render the current state (for debugging)"""
        if self.current_step < len(self.stock_data):
            current_data = self.stock_data.iloc[self.current_step]
            print(f"Step: {self.current_step}, "
                  f"Price: {current_data['Close']:.2f}, "
                  f"Cash: {self.cash:.2f}, "
                  f"Position: {self.position}, "
                  f"Total Value: {self.total_value:.2f}")
    
    def get_performance_metrics(self) -> Dict[str, float]:
        """Calculate performance metrics at the end of episode"""
        if len(self.portfolio_history) < 2:
            return {}
        
        returns = pd.Series(self.portfolio_history).pct_change().dropna()
        
        total_return = (self.portfolio_history[-1] - self.initial_capital) / self.initial_capital * 100
        
        if len(returns) > 1:
            sharpe_ratio = returns.mean() / returns.std() * np.sqrt(252) if returns.std() > 0 else 0
            max_drawdown = (pd.Series(self.portfolio_history) / pd.Series(self.portfolio_history).cummax() - 1).min() * 100
        else:
            sharpe_ratio = 0
            max_drawdown = 0
        
        return {
            'total_return_percent': total_return,
            'sharpe_ratio': sharpe_ratio,
            'max_drawdown_percent': max_drawdown,
            'final_portfolio_value': self.portfolio_history[-1],
            'total_trades': len([a for a in self.action_history if a != 0])
        }

# Test the environment
if __name__ == "__main__":
    # Create mock data for testing
    dates = pd.date_range('2024-01-01', periods=100, freq='D')
    mock_data = pd.DataFrame({
        'Open': np.random.normal(100, 10, 100),
        'High': np.random.normal(105, 10, 100),
        'Low': np.random.normal(95, 10, 100),
        'Close': 100 + np.cumsum(np.random.normal(0, 2, 100)),
        'Volume': np.random.normal(1000000, 100000, 100),
        'rsi': np.random.uniform(20, 80, 100),
        'macd': np.random.normal(0, 1, 100),
        'macd_signal': np.random.normal(0, 1, 100),
        'sma_20': 100 + np.cumsum(np.random.normal(0, 1, 100)),
        'sma_50': 100 + np.cumsum(np.random.normal(0, 0.5, 100))
    }, index=dates)
    
    print("Testing Trading Environment...")
    env = StockTradingEnvironment(mock_data, initial_capital=1000)
    
    observation, _ = env.reset()
    print(f"Initial observation: {observation}")
    
    # Test a few steps
    for i in range(5):
        action = env.action_space.sample()  # Random action
        observation, reward, done, truncated, info = env.step(action)
        print(f"Step {i}: Action={action}, Reward={reward:.3f}, Value={info['total_value']:.2f}")
        
        if done:
            break
    
    print("Trading Environment test completed!")