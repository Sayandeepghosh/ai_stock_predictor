import data_loader
import features
import model
import traceback
import pandas as pd

def debug_pipeline(symbol):
    print(f"--- Debugging Pipeline for {symbol} ---")
    
    # 1. Load Data
    print("1. Loading Data...")
    try:
        df = data_loader.download_data(symbol)
        if df is None or df.empty:
            print("Error: Data is empty")
            return
        print("Data loaded. Shape:", df.shape)
        print("Columns:", df.columns.tolist())
        print(df.head(2))
    except Exception:
        traceback.print_exc()
        return

    # 2. Features
    print("\n2. Generating Features...")
    try:
        df_features = features.add_features(df)
        print("Features generated. Shape:", df_features.shape)
        print("Columns:", df_features.columns.tolist())
        print(df_features.tail(2))
    except Exception:
        traceback.print_exc()
        return

    # 3. Model
    print("\n3. Training/Predicting...")
    try:
        predictor = model.StockPredictor(symbol)
        predictor.train(df_features)
        result = predictor.predict_next(df_features)
        print("Prediction result:", result)
    except Exception:
        traceback.print_exc()
        return

if __name__ == "__main__":
    debug_pipeline("NVDA")
