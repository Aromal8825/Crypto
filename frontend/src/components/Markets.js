import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Search, ArrowUpDown } from 'lucide-react';
import cryptoService from '../services/cryptoService';

const Markets = ({ currency }) => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('market_cap_desc');

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      // Fetch more coins for markets page
      const data = await cryptoService.getMarketData('bitcoin,ethereum,tether,binancecoin,solana,cardano,xrp,polkadot,chainlink,litecoin,polygon,avalanche-2,dogecoin,shiba-inu,stellar,internet-computer,vechain,filecoin,tron,ethereum-classic');
      setCoins(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price > 1 ? 2 : 6,
    }).format(price);
  };

  const formatPercentage = (percentage) => {
    return `${percentage > 0 ? '+' : ''}${percentage?.toFixed(2)}%`;
  };

  const formatMarketCap = (marketCap) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap?.toLocaleString()}`;
  };

  const filteredCoins = coins
    .filter(coin =>
      coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'market_cap_desc':
          return b.market_cap - a.market_cap;
        case 'market_cap_asc':
          return a.market_cap - b.market_cap;
        case 'price_desc':
          return b.current_price - a.current_price;
        case 'price_asc':
          return a.current_price - b.current_price;
        case 'change_desc':
          return b.price_change_percentage_24h - a.price_change_percentage_24h;
        case 'change_asc':
          return a.price_change_percentage_24h - b.price_change_percentage_24h;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Markets</h1>
          <p className="text-gray-400 mt-1">Live cryptocurrency market data</p>
        </div>
        
        <div className="flex space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search coins..."
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-10 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-white"
            >
              <option value="market_cap_desc">Market Cap (High to Low)</option>
              <option value="market_cap_asc">Market Cap (Low to High)</option>
              <option value="price_desc">Price (High to Low)</option>
              <option value="price_asc">Price (Low to High)</option>
              <option value="change_desc">24h Change (High to Low)</option>
              <option value="change_asc">24h Change (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-gray-400">Total Market Cap</div>
          <div className="text-2xl font-bold">
            {formatMarketCap(coins.reduce((sum, coin) => sum + (coin.market_cap || 0), 0))}
          </div>
        </div>
        
        <div className="card">
          <div className="text-sm text-gray-400">24h Volume</div>
          <div className="text-2xl font-bold">
            {formatMarketCap(coins.reduce((sum, coin) => sum + (coin.total_volume || 0), 0))}
          </div>
        </div>
        
        <div className="card">
          <div className="text-sm text-gray-400">BTC Dominance</div>
          <div className="text-2xl font-bold">
            {coins.length > 0 ? ((coins[0]?.market_cap || 0) / coins.reduce((sum, coin) => sum + (coin.market_cap || 0), 0) * 100).toFixed(1) : 0}%
          </div>
        </div>
        
        <div className="card">
          <div className="text-sm text-gray-400">Active Coins</div>
          <div className="text-2xl font-bold">{filteredCoins.length}</div>
        </div>
      </div>

      {/* Markets Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-4">#</th>
                <th className="text-left p-4">Name</th>
                <th className="text-right p-4">Price</th>
                <th className="text-right p-4">1h %</th>
                <th className="text-right p-4">24h %</th>
                <th className="text-right p-4">7d %</th>
                <th className="text-right p-4">Market Cap</th>
                <th className="text-right p-4">Volume (24h)</th>
                <th className="text-center p-4">Last 7 Days</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoins.map((coin, index) => (
                <tr
                  key={coin.id}
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="p-4 text-gray-400 font-medium">{coin.market_cap_rank || index + 1}</td>
                  
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <img src={coin.image} alt={coin.name} className="w-8 h-8" />
                      <div>
                        <div className="font-semibold text-white">{coin.name}</div>
                        <div className="text-sm text-gray-400 uppercase">{coin.symbol}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4 text-right font-semibold text-white">
                    {formatPrice(coin.current_price)}
                  </td>
                  
                  <td className={`p-4 text-right font-semibold ${
                    (coin.price_change_percentage_1h_in_currency || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatPercentage(coin.price_change_percentage_1h_in_currency || 0)}
                  </td>
                  
                  <td className={`p-4 text-right font-semibold ${
                    coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    <div className="flex items-center justify-end space-x-1">
                      {coin.price_change_percentage_24h >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{formatPercentage(coin.price_change_percentage_24h)}</span>
                    </div>
                  </td>
                  
                  <td className={`p-4 text-right font-semibold ${
                    (coin.price_change_percentage_7d_in_currency || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatPercentage(coin.price_change_percentage_7d_in_currency || 0)}
                  </td>
                  
                  <td className="p-4 text-right text-gray-300 font-medium">
                    {formatMarketCap(coin.market_cap)}
                  </td>
                  
                  <td className="p-4 text-right text-gray-300">
                    {formatMarketCap(coin.total_volume)}
                  </td>
                  
                  <td className="p-4 text-center">
                    {coin.sparkline_in_7d?.price && (
                      <div className="w-24 h-12 mx-auto">
                        <svg
                          viewBox="0 0 100 50"
                          className="w-full h-full"
                        >
                          <polyline
                            fill="none"
                            stroke={coin.price_change_percentage_7d_in_currency >= 0 ? "#10b981" : "#ef4444"}
                            strokeWidth="2"
                            points={coin.sparkline_in_7d.price
                              .slice(-20)
                              .map((price, i) => `${(i / 19) * 100},${50 - (price / Math.max(...coin.sparkline_in_7d.price.slice(-20))) * 40}`)
                              .join(' ')}
                          />
                        </svg>
                      </div>
                    )}
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

export default Markets;