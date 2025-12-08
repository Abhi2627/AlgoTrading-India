import pandas as pd
import numpy as np

class TechnicalAnalyzer:
    """
    Zero-Dependency Technical Analysis.
    Calculates indicators using pure Pandas/Numpy to avoid version conflicts.
    """
    
    def add_all_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        if df is None or df.empty: return df
        df = df.copy()

        # 1. SMA (Simple Moving Average)
        df['SMA_50'] = df['Close'].rolling(window=50).mean()
        df['SMA_200'] = df['Close'].rolling(window=200).mean()

        # 2. RSI (Relative Strength Index - 14)
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # Fill NaN RSI (start of data) with 50 (Neutral) to prevent crashes
        df['RSI'] = df['RSI'].fillna(50)

        # 3. MACD (12, 26, 9)
        # EMA = Exponential Moving Average
        k_12 = df['Close'].ewm(span=12, adjust=False).mean()
        k_26 = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = k_12 - k_26
        df['MACD_signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
        
        # Histogram (The important part for strategy)
        # Naming it specific to match old logic if needed, or simple
        df['MACDh_12_26_9'] = df['MACD'] - df['MACD_signal']

        # 4. Bollinger Bands (20, 2)
        sma_20 = df['Close'].rolling(window=20).mean()
        std_20 = df['Close'].rolling(window=20).std()
        df['BBL_20_2.0'] = sma_20 - (std_20 * 2) # Lower
        df['BBU_20_2.0'] = sma_20 + (std_20 * 2) # Upper

        # 5. OBV (On Balance Volume)
        # If Close > PrevClose, add Volume. Else subtract.
        df['OBV'] = (np.sign(df['Close'].diff()) * df['Volume']).fillna(0).cumsum()

        # Cleanup: Drop rows that need calculation window (first 50 days) 
        # unless it makes data too short
        if len(df) > 60:
            df = df.dropna()
        else:
            df = df.fillna(method='bfill') # Backfill if data is short

        return df

if __name__ == "__main__":
    # Quick Test
    print("🧪 Testing Manual Indicators...")
    data = {
        'Close': np.random.normal(100, 10, 200),
        'Volume': np.random.randint(100, 1000, 200)
    }
    df = pd.DataFrame(data)
    ta = TechnicalAnalyzer()
    df = ta.add_all_indicators(df)
    print(f"✅ Indicators Calculated. Columns: {list(df.columns)}")