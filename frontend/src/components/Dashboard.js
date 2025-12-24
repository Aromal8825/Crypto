import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import cryptoService from '../services/cryptoService';
import CoinDetail from './CoinDetail';

const Dashboard = ({ currency, setCurrency }) => {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [trackedCoins, setTrackedCoins] = useState('bitcoin,ethereum,cardano,polkadot,chainlink,litecoin,dogecoin,stellar,ripple,matic-network');
  const [supportedCurrencies, setSupportedCurrencies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const currencies = await cryptoService.getSupportedCurrencies();
        setSupportedCurrencies(currencies.sort());
      } catch (error) {
        console.error('Failed to fetch supported currencies:', error);
        setSupportedCurrencies(['usd', 'eur', 'gbp', 'jpy', 'inr', 'aud', 'cad', 'chf', 'cny']);
      }
    };
    fetchCurrencies();
  }, []);

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

  const filteredMarketData = marketData.filter(coin => 
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price);
  };

  const formatPercentage = (percentage) => {
    return `${percentage > 0 ? '+' : ''}${percentage?.toFixed(2)}%`;
  };

  const formatLargeNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(num);
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
      {/* Market Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {marketData.slice(0, 4).map((coin) => (
          <div 
            key={coin.id} 
            className={`card cursor-pointer transition-all duration-200 hover:shadow-xl ${
              selectedCoin === coin.id ? 'ring-2 ring-blue-500 bg-blue-900/20' : 'hover:bg-gray-700'
            }`}
            onClick={() => setSelectedCoin(coin.id)}
          >
            <div className="flex items-center space-x-3 mb-3">
              <img src={coin.image} alt={coin.name} className="w-10 h-10" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white truncate">{coin.name}</h3>
                <p className="text-sm text-gray-400 uppercase">{coin.symbol}</p>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-lg font-bold text-white">
                {formatPrice(coin.current_price)}
              </div>
              <div className={`flex items-center space-x-1 text-sm ${
                coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {coin.price_change_percentage_24h >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{formatPercentage(coin.price_change_percentage_24h)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Detailed Analysis</h2>
          <div className="flex gap-4">
             <select
                value={selectedCoin}
                onChange={(e) => setSelectedCoin(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                {marketData.map((coin) => (
                  <option key={coin.id} value={coin.id}>
                    {coin.name}
                  </option>
                ))}
              </select>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 w-24"
              >
                {supportedCurrencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr.toUpperCase()}
                  </option>
                ))}
              </select>
          </div>
        </div>
        <CoinDetail 
          coinId={selectedCoin} 
          currency={currency}
          onRemove={() => {}} // No remove in single view
        />
      </div>

      {/* Market Table */}
      <div className="card">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-bold">Market Overview</h2>
          <input
            type="text"
            placeholder="Search coins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 w-full md:w-64"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Coin</th>
                <th className="text-right p-3">Price</th>
                <th className="text-right p-3">24h Change</th>
                <th className="text-right p-3">Market Cap</th>
                <th className="text-right p-3">Volume</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarketData.map((coin, index) => (
                <tr
                  key={coin.id}
                  className={`border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer ${
                    selectedCoin === coin.id ? 'bg-blue-900/10' : ''
                  }`}
                  onClick={() => setSelectedCoin(coin.id)}
                >
                  <td className="p-3 text-gray-400">{index + 1}</td>
                  <td className="p-3">
                    <div className="flex items-center space-x-3">
                      <img src={coin.image} alt={coin.name} className="w-6 h-6" />
                      <div>
                        <div className="font-semibold">{coin.name}</div>
                        <div className="text-sm text-gray-400 uppercase">{coin.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right font-semibold">
                    {formatPrice(coin.current_price)}
                  </td>
                  <td className={`p-3 text-right font-semibold ${
                    coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatPercentage(coin.price_change_percentage_24h)}
                  </td>
                  <td className="p-3 text-right text-gray-400">
                    {formatLargeNumber(coin.market_cap)}
                  </td>
                  <td className="p-3 text-right text-gray-400">
                    {formatLargeNumber(coin.total_volume)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;