import pandas as pd
import numpy as np
import ta # pyright: ignore[reportMissingImports]
from typing import Dict, List, Tuple
import warnings
warnings.filterwarnings('ignore')

class AdvancedTechnicalAnalyzer:
    def __init__(self):
        self.indicators_config = {
            'rsi_period': 14,
            'macd_fast': 12,
            'macd_slow': 26,
            'macd_signal': 9,
            'bb_period': 20,
            'bb_std': 2,
            'sma_short': 20,
            'sma_medium': 50,
            'sma_long': 200
        }
    
    def calculate_all_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate comprehensive technical indicators"""
        if df.empty or len(df) < 50:
            return df
        
        # Price-based indicators
        df = self._calculate_momentum_indicators(df)
        df = self._calculate_trend_indicators(df)
        df = self._calculate_volatility_indicators(df)
        df = self._calculate_volume_indicators(df)
        
        # Generate signals
        df = self._generate_trading_signals(df)
        
        return df
    
    def _calculate_momentum_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate momentum indicators"""
        # RSI
        df['rsi'] = ta.momentum.RSIIndicator(
            df['Close'], 
            window=self.indicators_config['rsi_period']
        ).rsi()
        
        # Stochastic
        stoch = ta.momentum.StochasticOscillator(
            df['High'], df['Low'], df['Close']
        )
        df['stoch_k'] = stoch.stoch()
        df['stoch_d'] = stoch.stoch_signal()
        
        # Williams %R
        df['williams_r'] = ta.momentum.WilliamsRIndicator(
            df['High'], df['Low'], df['Close']
        ).williams_r()
        
        # CCI
        df['cci'] = ta.trend.CCIIndicator(
            df['High'], df['Low'], df['Close']
        ).cci()
        
        return df
    
    def _calculate_trend_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate trend indicators"""
        # MACD
        macd = ta.trend.MACD(
            df['Close'],
            window_slow=self.indicators_config['macd_slow'],
            window_fast=self.indicators_config['macd_fast'],
            window_sign=self.indicators_config['macd_signal']
        )
        df['macd'] = macd.macd()
        df['macd_signal'] = macd.macd_signal()
        df['macd_histogram'] = macd.macd_diff()
        
        # Moving Averages
        df['sma_20'] = ta.trend.SMAIndicator(
            df['Close'], 
            window=self.indicators_config['sma_short']
        ).sma_indicator()
        
        df['sma_50'] = ta.trend.SMAIndicator(
            df['Close'], 
            window=self.indicators_config['sma_medium']
        ).sma_indicator()
        
        df['sma_200'] = ta.trend.SMAIndicator(
            df['Close'], 
            window=self.indicators_config['sma_long']
        ).sma_indicator()
        
        # EMA
        df['ema_12'] = ta.trend.EMAIndicator(df['Close'], window=12).ema_indicator()
        df['ema_26'] = ta.trend.EMAIndicator(df['Close'], window=26).ema_indicator()
        
        # ADX
        df['adx'] = ta.trend.ADXIndicator(
            df['High'], df['Low'], df['Close']
        ).adx()
        
        return df
    
    def _calculate_volatility_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate volatility indicators"""
        # Bollinger Bands
        bb = ta.volatility.BollingerBands(
            df['Close'],
            window=self.indicators_config['bb_period'],
            window_dev=self.indicators_config['bb_std']
        )
        df['bb_upper'] = bb.bollinger_hband()
        df['bb_lower'] = bb.bollinger_lband()
        df['bb_middle'] = bb.bollinger_mavg()
        df['bb_width'] = (df['bb_upper'] - df['bb_lower']) / df['bb_middle']
        
        # ATR
        df['atr'] = ta.volatility.AverageTrueRange(
            df['High'], df['Low'], df['Close']
        ).average_true_range()
        
        return df
    
    def _calculate_volume_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate volume-based indicators"""
        if 'Volume' not in df.columns:
            return df
        
        # Volume SMA
        df['volume_sma'] = ta.trend.SMAIndicator(
            df['Volume'], 
            window=20
        ).sma_indicator()
        
        # OBV
        df['obv'] = ta.volume.OnBalanceVolumeIndicator(
            df['Close'], df['Volume']
        ).on_balance_volume()
        
        # Volume Price Trend
        df['vpt'] = ta.volume.VolumePriceTrendIndicator(
            df['Close'], df['Volume']
        ).volume_price_trend()
        
        return df
    
    def _generate_trading_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate trading signals based on technical indicators"""
        if df.empty:
            return df
        
        # Initialize signal columns
        df['signal_strength'] = 0.0
        df['signal'] = 'HOLD'
        
        for i in range(1, len(df)):
            current = df.iloc[i]
            prev = df.iloc[i-1]
            
            signal_score = 0
            buy_signals = 0
            sell_signals = 0
            
            # RSI Signals
            if current['rsi'] < 30:
                signal_score += 2
                buy_signals += 1
            elif current['rsi'] > 70:
                signal_score -= 2
                sell_signals += 1
            
            # MACD Signals
            if (current['macd'] > current['macd_signal'] and 
                prev['macd'] <= prev['macd_signal']):
                signal_score += 1.5
                buy_signals += 1
            elif (current['macd'] < current['macd_signal'] and 
                  prev['macd'] >= prev['macd_signal']):
                signal_score -= 1.5
                sell_signals += 1
            
            # Moving Average Signals
            if (current['Close'] > current['sma_20'] and 
                current['sma_20'] > current['sma_50']):
                signal_score += 1
                buy_signals += 1
            elif (current['Close'] < current['sma_20'] and 
                  current['sma_20'] < current['sma_50']):
                signal_score -= 1
                sell_signals += 1
            
            # Bollinger Bands Signals
            if current['Close'] < current['bb_lower']:
                signal_score += 1
                buy_signals += 1
            elif current['Close'] > current['bb_upper']:
                signal_score -= 1
                sell_signals += 1
            
            # Determine final signal
            df.loc[df.index[i], 'signal_strength'] = signal_score
            
            if signal_score >= 2:
                df.loc[df.index[i], 'signal'] = 'BUY'
            elif signal_score <= -2:
                df.loc[df.index[i], 'signal'] = 'SELL'
            else:
                df.loc[df.index[i], 'signal'] = 'HOLD'
        
        return df
    
    def get_current_signal(self, df: pd.DataFrame) -> Dict:
        """Get current trading signal for the latest data point"""
        if df.empty or 'signal' not in df.columns:
            return {'signal': 'HOLD', 'strength': 0, 'confidence': 0}
        
        latest = df.iloc[-1]
        
        # Calculate confidence based on signal strength and recent consistency
        recent_signals = df['signal'].tail(5)
        buy_count = (recent_signals == 'BUY').sum()
        sell_count = (recent_signals == 'SELL').sum()
        
        confidence = min(100, abs(latest['signal_strength']) * 15 + 
                        max(buy_count, sell_count) * 10)
        
        return {
            'signal': latest['signal'],
            'strength': latest['signal_strength'],
            'confidence': round(confidence, 2),
            'rsi': latest.get('rsi', 0),
            'macd': latest.get('macd', 0),
            'price': latest['Close']
        }

# Test the technical analyzer
if __name__ == "__main__":
    # Mock data for testing
    dates = pd.date_range('2024-01-01', periods=100, freq='D')
    mock_data = pd.DataFrame({
        'Open': np.random.normal(100, 10, 100),
        'High': np.random.normal(105, 10, 100),
        'Low': np.random.normal(95, 10, 100),
        'Close': np.random.normal(100, 10, 100),
        'Volume': np.random.normal(1000000, 100000, 100)
    }, index=dates)
    
    analyzer = AdvancedTechnicalAnalyzer()
    analyzed_data = analyzer.calculate_all_indicators(mock_data)
    
    print("📊 Technical Analysis Test Results:")
    print(f"Latest Signal: {analyzer.get_current_signal(analyzed_data)}")
    print(f"Columns generated: {list(analyzed_data.columns)}")