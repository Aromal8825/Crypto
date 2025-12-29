from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import requests
try:
    import pandas as pd
    import numpy as np
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    pd = None
    np = None
from datetime import datetime, timedelta
import asyncio
from typing import List, Dict, Optional
import json
from auth import AuthService, get_current_active_user, ACCESS_TOKEN_EXPIRE_MINUTES

app = FastAPI(title="Crypto Dashboard API", version="1.0.0")

# Pydantic models for authentication
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication endpoints
@app.post("/api/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """Authenticate user and return JWT token"""
    user = AuthService.authenticate_user(login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "is_active": user["is_active"]
        }
    }

@app.post("/api/auth/register", response_model=LoginResponse)
async def register(register_data: RegisterRequest):
    """Register a new user and return JWT token"""
    # Check if user already exists
    if AuthService.get_user_by_email(register_data.email):
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )
    
    # Validate password length
    if len(register_data.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters long",
        )
    
    # Create new user
    new_user = AuthService.create_user(
        email=register_data.email,
        password=register_data.password,
        full_name=register_data.full_name
    )
    
    # Generate JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": new_user["email"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user["id"],
            "email": new_user["email"],
            "full_name": new_user["full_name"],
            "is_active": new_user["is_active"]
        }
    }

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user

@app.post("/api/auth/logout")
async def logout():
    """Logout endpoint (client should remove token)"""
    return {"message": "Successfully logged out"}

# CoinGecko API configuration
COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"
COINGECKO_API_KEY = "CG-5VhkXfcW7gnqegfBnxFSiwv3"

class CryptoService:
    def __init__(self):
        self.session = requests.Session()
        # Set API key header
        self.session.headers.update({
            'x-cg-demo-api-key': COINGECKO_API_KEY
        })
    
    async def get_market_data(self, coins: str = "bitcoin,ethereum,cardano,polkadot,chainlink", vs_currency: str = "usd"):
        """Get real-time market data for specified coins"""
        try:
            url = f"{COINGECKO_BASE_URL}/coins/markets"
            params = {
                "vs_currency": vs_currency,
                "ids": coins,
                "order": "market_cap_desc",
                "per_page": 50,
                "page": 1,
                "sparkline": True,
                "price_change_percentage": "1h,24h,7d"
            }
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")
    
    async def get_coin_history(self, coin_id: str, days: int = 30, vs_currency: str = "usd"):
        """Get historical price data for a specific coin"""
        try:
            url = f"{COINGECKO_BASE_URL}/coins/{coin_id}/market_chart"
            params = {"vs_currency": vs_currency, "days": days}
            response = self.session.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Format data for frontend charts
            formatted_data = []
            for i, price in enumerate(data["prices"]):
                formatted_data.append({
                    "timestamp": price[0],
                    "date": datetime.fromtimestamp(price[0] / 1000).strftime("%Y-%m-%d %H:%M"),
                    "price": price[1],
                    "volume": data["total_volumes"][i][1] if i < len(data["total_volumes"]) else 0
                })
            
            return formatted_data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch coin history: {str(e)}")
    
    async def get_supported_currencies(self):
        """Get list of supported vs_currencies"""
        try:
            url = f"{COINGECKO_BASE_URL}/simple/supported_vs_currencies"
            response = self.session.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch supported currencies: {str(e)}")

    async def get_trending_coins(self):
        """Get trending coins from CoinGecko"""
        try:
            url = f"{COINGECKO_BASE_URL}/search/trending"
            response = self.session.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch trending coins: {str(e)}")

# Initialize services
crypto_service = CryptoService()

# Portfolio storage (in production, use a database)
portfolios = {}

@app.get("/")
async def root():
    return {"message": "Crypto Dashboard API", "status": "running"}

@app.get("/api/supported-currencies")
async def get_supported_currencies():
    """Get list of supported currencies"""
    return await crypto_service.get_supported_currencies()

@app.get("/api/market")
async def get_market_data(coins: str = "bitcoin,ethereum,cardano,polkadot,chainlink", currency: str = "usd"):
    """Get current market data for specified coins"""
    return await crypto_service.get_market_data(coins, currency)

@app.get("/api/coin/{coin_id}/history")
async def get_coin_history(coin_id: str, days: int = 30, currency: str = "usd"):
    """Get historical data for a specific coin"""
    return await crypto_service.get_coin_history(coin_id, days, currency)

@app.get("/api/trending")
async def get_trending():
    """Get trending coins"""
    return await crypto_service.get_trending_coins()

@app.post("/api/portfolio")
async def create_portfolio(portfolio_data: Dict):
    """Create or update a portfolio"""
    user_id = portfolio_data.get("user_id", "default")
    portfolios[user_id] = portfolio_data
    return {"message": "Portfolio saved successfully", "portfolio": portfolio_data}

@app.get("/api/portfolio/{user_id}")
async def get_portfolio(user_id: str = "default"):
    """Get user portfolio"""
    if user_id not in portfolios:
        return {"holdings": [], "total_value": 0, "total_change": 0}
    return portfolios[user_id]

@app.get("/api/predict/{coin_id}")
async def predict_price(coin_id: str, hours: int = 24, currency: str = "usd"):
    """Enhanced price prediction with timestamp"""
    try:
        # Get historical data (30 days gives us hourly data)
        history = await crypto_service.get_coin_history(coin_id, 30, currency)
        
        if len(history) < 24:
            raise HTTPException(status_code=400, detail="Insufficient data for prediction")
        
        # Use last 24 hours for short-term trend analysis
        recent_history = history[-24:]
        prices = [item["price"] for item in recent_history]
        
        if PANDAS_AVAILABLE and np is not None:
            # Calculate hourly volatility
            volatility = np.std(prices) / np.mean(prices)
        else:
            # Simple volatility calculation
            mean_price = sum(prices) / len(prices)
            variance = sum((p - mean_price) ** 2 for p in prices) / len(prices)
            volatility = (variance ** 0.5) / mean_price
        
        # Calculate average hourly change (momentum)
        hourly_changes = []
        for i in range(1, len(prices)):
            change = (prices[i] - prices[i-1]) / prices[i-1]
            hourly_changes.append(change)
        
        avg_hourly_change = sum(hourly_changes) / len(hourly_changes) if hourly_changes else 0
        
        # Calculate trend direction
        current_price = history[-1]["price"]
        
        # Predict price based on hourly momentum
        # Apply a damping factor to avoid unrealistic linear extrapolation over long periods
        damping_factor = 0.8
        projected_change = avg_hourly_change * hours * damping_factor
        
        base_prediction = current_price * (1 + projected_change)
        
        # Calculate prediction timestamp
        from datetime import datetime, timedelta
        prediction_date = datetime.now() + timedelta(hours=hours)
        
        # Enhanced confidence calculation
        # Lower volatility and more consistent trend = higher confidence
        consistency = 1.0 - (volatility * 10) # Heuristic
        confidence = max(min(consistency * 100, 95), 10)
        
        # Generate multiple prediction scenarios
        # Conservative: assumes momentum slows down significantly
        conservative_prediction = current_price * (1 + projected_change * 0.5)
        # Optimistic: assumes momentum continues or accelerates slightly
        optimistic_prediction = current_price * (1 + projected_change * 1.5)
        
        trend_direction = "bullish" if projected_change > 0 else "bearish"
        
        return {
            "coin_id": coin_id,
            "current_price": current_price,
            "predicted_price": base_prediction,
            "conservative_prediction": conservative_prediction,
            "optimistic_prediction": optimistic_prediction,
            "confidence": confidence,
            "trend": trend_direction,
            "prediction_timestamp": prediction_date.isoformat(),
            "days_to_target": round(hours / 24, 2), # Return as days for compatibility or display
            "hours_to_target": hours,
            "prediction_date": prediction_date.strftime("%Y-%m-%d"),
            "prediction_time": prediction_date.strftime("%H:%M"),
            "volatility": volatility * 100,
            "average_daily_change": avg_hourly_change * 24 * 100, # Projected daily change
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)