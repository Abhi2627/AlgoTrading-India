import pandas as pd
import pandas_ta_classic as ta

class TechnicalAnalyzer:
    """
    The 'Analytical Brain'. 
    Takes raw price data and adds mathematical indicators.
    """
    
    def add_all_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Adds RSI, MACD, Bollinger Bands, and SMA to the dataframe.
        """
        if df is None or df.empty:
            return df
            
        # Ensure we are working on a copy to avoid warnings
        df = df.copy()

        # 1. RSI (Relative Strength Index)
        df['RSI'] = df.ta.rsi(length=14)

        # 2. MACD
        macd = df.ta.macd(fast=12, slow=26, signal=9)
        if macd is not None:
            df = pd.concat([df, macd], axis=1)

        # 3. Bollinger Bands
        bbands = df.ta.bbands(length=20, std=2.0)
        if bbands is not None:
            df = pd.concat([df, bbands], axis=1)

        # 4. Simple Moving Averages (SMA)
        df['SMA_50'] = df.ta.sma(length=50)
        df['SMA_200'] = df.ta.sma(length=200)

        # 5. Volume Trends
        df['OBV'] = df.ta.obv()

        # Clean up: Drop rows with NaN values (due to calculations)
        df.dropna(inplace=True)
        
        return df

# --- Quick Test Block ---
if __name__ == "__main__":
    import numpy as np 
    
    print("🧪 Testing Technical Analysis Layer...")
    
    # FIX: Generating 300 days of data so SMA_200 can be calculated
    days = 300
    
    data = {
        'Close': np.random.normal(100, 10, days).tolist(),
        'Volume': np.random.randint(1000, 5000, days).tolist(),
        'High': np.random.normal(105, 10, days).tolist(),
        'Low': np.random.normal(95, 10, days).tolist(),
        'Open': np.random.normal(100, 10, days).tolist(),
    }
    
    df_test = pd.DataFrame(data)
    
    analyzer = TechnicalAnalyzer()
    
    # Add indicators
    enriched_df = analyzer.add_all_indicators(df_test)
    
    if not enriched_df.empty and 'SMA_200' in enriched_df.columns:
        print(f"✅ Success! Calculated Indicators for {len(enriched_df)} rows.")
        print(f"   Latest RSI: {enriched_df['RSI'].iloc[-1]:.2f}")
        print(f"   Latest SMA_200: {enriched_df['SMA_200'].iloc[-1]:.2f}")
        print(f"   Columns: {list(enriched_df.columns)}")
    else:
        print("❌ Error: Indicators were not calculated.")