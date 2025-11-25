import yfinance as yf
import pandas as pd
import traceback

def debug_download(ticker):
    print(f"Downloading {ticker}...")
    try:
        df = yf.download(ticker, period="2y", interval="1d", progress=False)
        print("Raw columns:", df.columns)
        print("Raw head:\n", df.head())
        
        if isinstance(df.columns, pd.MultiIndex):
            print("MultiIndex detected. Levels:", df.columns.nlevels)
            df.columns = df.columns.get_level_values(0)
            print("Flattened columns:", df.columns)
            
        df = df.reset_index()
        df.columns = [c.lower() for c in df.columns]
        print("Final columns:", df.columns)
        print("Final head:\n", df.head())
        
        return df
    except Exception:
        traceback.print_exc()

if __name__ == "__main__":
    debug_download("NVDA")
