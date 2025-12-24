# Crypto Dashboard

A modern cryptocurrency analytics platform with real-time market data, portfolio tracking, and predictive analytics.

## Features

- 📊 Real-time market data via CoinGecko API
- 💼 Portfolio tracking and P&L analysis
- 📈 Interactive charts with technical indicators
- 🔮 Price predictions with confidence intervals
- 📰 Sentiment analysis from crypto news
- 🎯 Custom alerts and watchlists

## Quick Start

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend (React)
```bash
cd frontend
npm install
npm start
```

## Tech Stack

- **Backend**: FastAPI, Python, Pandas, NumPy
- **Frontend**: React.js, Chart.js, TailwindCSS
- **Data**: CoinGecko API, Real-time WebSocket connections