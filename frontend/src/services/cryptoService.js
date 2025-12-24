import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const cryptoService = {
  // Get market data for multiple coins
  getMarketData: async (coins = 'bitcoin,ethereum,cardano,polkadot,chainlink', currency = 'usd') => {
    const response = await api.get(`/market?coins=${coins}&currency=${currency}`);
    return response.data;
  },

  // Get historical data for a specific coin
  getCoinHistory: async (coinId, days = 30, currency = 'usd') => {
    const response = await api.get(`/coin/${coinId}/history?days=${days}&currency=${currency}`);
    return response.data;
  },

  // Get trending coins
  getTrendingCoins: async () => {
    const response = await api.get('/trending');
    return response.data;
  },

  // Get supported currencies
  getSupportedCurrencies: async () => {
    const response = await api.get('/supported-currencies');
    return response.data;
  },

  // Get price prediction
  getPrediction: async (coinId, hours = 24, currency = 'usd') => {
    const response = await api.get(`/predict/${coinId}?hours=${hours}&currency=${currency}`);
    return response.data;
  },

  // Portfolio management
  savePortfolio: async (portfolioData) => {
    const response = await api.post('/portfolio', portfolioData);
    return response.data;
  },

  getPortfolio: async (userId = 'default') => {
    const response = await api.get(`/portfolio/${userId}`);
    return response.data;
  },
};

export default cryptoService;