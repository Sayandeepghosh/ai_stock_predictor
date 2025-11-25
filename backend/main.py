from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import data_loader
import features
import model
import pandas as pd
import os
import yfinance as yf
from stocks import STOCKS

app = FastAPI(title="AI Stock Predictor")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionResponse(BaseModel):
    symbol: str
    company_name: str
    currency: str
    direction: str
    confidence: float
    probability_up: float
    probability_down: float
    shap_features: list
    current_price: float
    predicted_price: float
    future_prices: list
    chart_data: list

@app.get("/")
def read_root():
    return {
        "message": "AI Stock Predictor API is running!",
        "documentation": "/docs",
        "frontend_url": "http://localhost:5173"
    }

@app.get("/api/predict/{symbol}")
def predict(symbol: str):
    symbol = symbol.upper()
    
    # 1. Load Data
    try:
        df = data_loader.download_data(symbol) # Always download fresh for now
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail="Stock not found")
            
        # Get Ticker Info
        ticker = yf.Ticker(symbol)
        info = {}
        try:
            info = ticker.info
        except:
            pass
            
        # 1. Get Currency (Robust Check)
        if symbol.endswith('.NS') or symbol.endswith('.BO'):
            currency = 'INR'
        else:
            currency = info.get('currency', 'USD')

        # 2. Get Company Name
        company_name = info.get('shortName') or info.get('longName') or symbol
                
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    # 2. Feature Engineering
    try:
        df_features = features.add_features(df)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Feature engineering failed: {str(e)}")

    # 3. Train/Load Model & Predict
    try:
        predictor = model.StockPredictor(symbol)
        # For demo, we train on the fly if model doesn't exist or just retrain to be safe
        # In prod, this would be async
        predictor.train(df_features) 
        
        result = predictor.predict_next(df_features)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    # 4. Prepare Response
    latest_price = df['close'].iloc[-1]
    
    # Chart data (last 100 points for lightweight chart)
    chart_df = df.tail(100).reset_index()
    chart_data = []
    for _, row in chart_df.iterrows():
        chart_data.append({
            "time": row['date'].strftime('%Y-%m-%d'),
            "open": row['open'],
            "high": row['high'],
            "low": row['low'],
            "close": row['close']
        })

    return {
        "symbol": symbol,
        "company_name": company_name,
        "currency": currency,
        "direction": result["direction"],
        "confidence": result["confidence"],
        "probability_up": result["probability_up"],
        "probability_down": result["probability_down"],
        "shap_features": result["shap_features"],
        "current_price": latest_price,
        "predicted_price": result["predicted_price"],
        "future_prices": result["future_prices"],
        "chart_data": chart_data
    }

@app.get("/api/search")
def search_stocks(query: str):
    query = query.lower()
    results = []
    for stock in STOCKS:
        if query in stock['symbol'].lower() or query in stock['name'].lower():
            results.append(stock)
    return results[:10] # Limit to 10 results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
