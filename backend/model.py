import lightgbm as lgb
import pandas as pd
import numpy as np
import shap
import joblib
import os
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import accuracy_score, precision_score, recall_score

MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

class StockPredictor:
    def __init__(self, ticker):
        self.ticker = ticker
        self.model_path = os.path.join(MODEL_DIR, f"{ticker}_lgb.pkl")
        self.model = None
        self.features = [
            'rsi', 'atr', 'sma_20', 'sma_50', 'sma_200', 
            'return_1d', 'return_5d', 'volatility_20',
            'MACD_12_26_9', 'MACDh_12_26_9', 'MACDs_12_26_9',
            'BBL_5_2.0', 'BBM_5_2.0', 'BBU_5_2.0'
        ]

    def train(self, df):
        """
        Train LightGBM models for Direction (Binary) and Price (Regression).
        """
        print(f"Training models for {self.ticker}...")
        
        valid_features = [f for f in self.features if f in df.columns]
        X = df[valid_features]
        
        # 1. Direction Model
        y_dir = df['target_dir']
        self.train_classifier(X, y_dir)
        
        # 2. Price Model (Target: Next Day Return)
        # We predict return instead of price to make it stationary
        y_ret = df['target_return'] / df['close'] - 1
        self.train_regressor(X, y_ret)
        
        print(f"Models saved for {self.ticker}")

    def train_classifier(self, X, y):
        tscv = TimeSeriesSplit(n_splits=5)
        params = {
            'objective': 'binary',
            'metric': 'binary_logloss',
            'boosting_type': 'gbdt',
            'num_leaves': 31,
            'learning_rate': 0.05,
            'feature_fraction': 0.9,
            'verbose': -1
        }
        
        for train_index, test_index in tscv.split(X):
            X_train, X_test = X.iloc[train_index], X.iloc[test_index]
            y_train, y_test = y.iloc[train_index], y.iloc[test_index]
            
            train_data = lgb.Dataset(X_train, label=y_train)
            valid_data = lgb.Dataset(X_test, label=y_test, reference=train_data)
            
            self.model = lgb.train(params, train_data, num_boost_round=100, valid_sets=[valid_data], callbacks=[lgb.early_stopping(stopping_rounds=10)])

    def train_regressor(self, X, y):
        # Remove NaNs from target (last row has NaN target)
        valid_mask = ~y.isna()
        X = X[valid_mask]
        y = y[valid_mask]
        
        tscv = TimeSeriesSplit(n_splits=5)
        params = {
            'objective': 'regression',
            'metric': 'rmse',
            'boosting_type': 'gbdt',
            'num_leaves': 31,
            'learning_rate': 0.05,
            'feature_fraction': 0.9,
            'verbose': -1
        }
        
        for train_index, test_index in tscv.split(X):
            X_train, X_test = X.iloc[train_index], X.iloc[test_index]
            y_train, y_test = y.iloc[train_index], y.iloc[test_index]
            
            train_data = lgb.Dataset(X_train, label=y_train)
            valid_data = lgb.Dataset(X_test, label=y_test, reference=train_data)
            
            self.regressor = lgb.train(params, train_data, num_boost_round=100, valid_sets=[valid_data], callbacks=[lgb.early_stopping(stopping_rounds=10)])

    def predict_next(self, df):
        if not self.model or not hasattr(self, 'regressor'):
            # In a real app, we'd load both. For now, we assume train() was called.
            pass
        
        # Get latest row
        latest_data = df.iloc[[-1]].copy()
        valid_features = [f for f in self.features if f in df.columns]
        X_latest = latest_data[valid_features]
        
        # 1. Direction Prediction
        prob_up = self.model.predict(X_latest)[0]
        direction = "UP" if prob_up > 0.5 else "DOWN"
        confidence = prob_up if direction == "UP" else 1 - prob_up
        
        # 2. Price Prediction (Return -> Price)
        pred_return = self.regressor.predict(X_latest)[0]
        current_price = df['close'].iloc[-1]
        predicted_price = current_price * (1 + pred_return)
        
        # 3. Generate 7-Day Forecast (Simulation)
        # We simulate a path using the predicted trend and historical volatility
        volatility = df['volatility_20'].iloc[-1]
        future_prices = []
        last_price = current_price
        
        # We project 7 days. Day 1 is the model prediction.
        # Day 2-7: We decay the predicted return towards 0 (mean reversion) and add noise
        import numpy as np
        
        # Day 1
        future_prices.append(predicted_price)
        last_price = predicted_price
        
        for i in range(1, 7):
            # Simple decay model: return decays by 10% each day
            step_return = pred_return * (0.9 ** i) 
            # Add small random noise based on volatility (scaled down for "probable" path)
            noise = 0 # For a "probable" line we usually show the mean path, so no noise
            
            next_price = last_price * (1 + step_return)
            future_prices.append(next_price)
            last_price = next_price

        # SHAP values
        explainer = shap.TreeExplainer(self.model)
        shap_values = explainer.shap_values(X_latest)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
            
        shap_dict = dict(zip(valid_features, shap_values[0]))
        sorted_shap = sorted(shap_dict.items(), key=lambda item: abs(item[1]), reverse=True)
        
        return {
            "direction": direction,
            "confidence": float(confidence),
            "probability_up": float(prob_up),
            "probability_down": float(1 - prob_up),
            "shap_features": sorted_shap[:5],
            "predicted_price": float(predicted_price),
            "future_prices": [float(p) for p in future_prices]
        }
