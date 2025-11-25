import yfinance as yf
import pandas as pd
import os

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)

def download_data(ticker, period="2y", interval="1d"):
    """
    Download historical data for a given ticker.
    """
    print(f"Downloading data for {ticker}...")
    df = yf.download(ticker, period=period, interval=interval, progress=False)
    if df.empty:
        return None
    
    # Flatten MultiIndex columns if present (common in new yfinance versions)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    
    # Ensure standard columns
    df = df.reset_index()
    # Rename columns to standard lowercase
    df.columns = [c.lower() for c in df.columns]
    
    # Save raw data
    file_path = os.path.join(DATA_DIR, f"{ticker}_raw.parquet")
    df.to_parquet(file_path)
    return df

def load_data(ticker):
    """
    Load data from local storage or download if not exists.
    """
    file_path = os.path.join(DATA_DIR, f"{ticker}_raw.parquet")
    if os.path.exists(file_path):
        return pd.read_parquet(file_path)
    else:
        return download_data(ticker)
