import data_loader
import features
import pandas as pd

symbol = "TCS.NS"
print(f"Testing for {symbol}...")

try:
    df = data_loader.download_data(symbol)
    if df is None or df.empty:
        print("ERROR: Data download failed (Empty DataFrame)")
    else:
        print("Data downloaded successfully!")
        print(df.head())
        print(df.columns)

        print("Adding features...")
        df_features = features.add_features(df)
        print("Features added successfully!")
        print(df_features.head())
        print(df_features.columns)

except Exception as e:
    print(f"EXCEPTION: {e}")
    import traceback
    traceback.print_exc()
