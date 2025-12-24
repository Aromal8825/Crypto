import React, { useState, useEffect } from 'react';
import cryptoService from '../services/cryptoService';
import CoinDetail from './CoinDetail';

const MultiChart = ({ currency }) => {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoins, setSelectedCoins] = useState(['bitcoin', 'ethereum']);
  const [trackedCoins, setTrackedCoins] = useState('bitcoin,ethereum,cardano,polkadot,chainlink,litecoin,dogecoin,stellar,ripple,matic-network');
  const [newCoin, setNewCoin] = useState('');

  const toggleCoin = (coinId) => {
    setSelectedCoins(prev => {
      if (prev.includes(coinId)) {
        // Don't remove if it's the last one
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== coinId);
      } else {
        return [...prev, coinId];
      }
    });
  };

  useEffect(() => {
    fetchMarketData();
  }, [trackedCoins, currency]);

  const fetchMarketData = async () => {
    try {
      const data = await cryptoService.getMarketData(trackedCoins, currency);
      setMarketData(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price);
  };

  const handleAddCoin = (e) => {
    e.preventDefault();
    if (newCoin && !trackedCoins.includes(newCoin.toLowerCase())) {
      setTrackedCoins(prev => `${prev},${newCoin.toLowerCase()}`);
      setNewCoin('');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Multi-Chart View</h1>
      
      {/* Controls Section */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-end">
          {/* Add Coin Section */}
          <div className="flex-1 w-full">
            <h2 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Add Cryptocurrency</h2>
            <form onSubmit={handleAddCoin} className="flex gap-4">
              <input
                type="text"
                value={newCoin}
                onChange={(e) => setNewCoin(e.target.value)}
                placeholder="Enter coin ID (e.g., solana)"
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Cryptocurrency Selector */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Select Cryptocurrencies</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {marketData.map((coin) => (
            <button
              key={coin.id}
              onClick={() => toggleCoin(coin.id)}
              className={`p-3 rounded-lg border transition-all duration-200 flex flex-col items-center space-y-2 ${
                selectedCoins.includes(coin.id)
                  ? 'bg-blue-600 border-blue-500 shadow-lg'
                  : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
              }`}
            >
              <img src={coin.image} alt={coin.name} className="w-8 h-8" />
              <div className="text-center">
                <div className="text-sm font-semibold">{coin.name}</div>
                <div className="text-xs text-gray-400 uppercase">{coin.symbol}</div>
                <div className="text-xs font-medium text-white">
                  {formatPrice(coin.current_price)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Multi-View Charts */}
      <div className="space-y-8">
        {selectedCoins.map(coinId => (
          <div key={coinId} className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 shadow-lg">
            <CoinDetail 
              coinId={coinId} 
              currency={currency}
              onRemove={(id) => toggleCoin(id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiChart;