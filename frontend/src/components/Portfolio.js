import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, Clock, Calendar } from 'lucide-react';
import cryptoService from '../services/cryptoService';

ChartJS.register(ArcElement, Tooltip, Legend);

const Portfolio = ({ currency }) => {
  const [portfolio, setPortfolio] = useState({ holdings: [], total_value: 0, total_change: 0 });
  const [marketData, setMarketData] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHolding, setNewHolding] = useState({
    coin_id: '',
    amount: '',
    purchase_price: ''
  });
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchMarketData();
      await fetchPortfolio();
    };
    init();
  }, [currency]);

  useEffect(() => {
    if (portfolio.holdings && portfolio.holdings.length > 0) {
      fetchPredictions(portfolio.holdings);
    }
  }, [portfolio.holdings]);

  const fetchPortfolio = async () => {
    try {
      const data = await cryptoService.getPortfolio();
      setPortfolio(data);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    }
  };

  const fetchMarketData = async () => {
    try {
      // Fetch a broad list of coins for the dropdown
      const data = await cryptoService.getMarketData('bitcoin,ethereum,tether,binancecoin,solana,cardano,xrp,polkadot,chainlink,litecoin,polygon,avalanche-2,dogecoin,shiba-inu,stellar,internet-computer,vechain,filecoin,tron,ethereum-classic,cosmos,tezos,eos,monero,bitcoin-cash', currency);
      setMarketData(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      setLoading(false);
    }
  };

  const fetchPredictions = async (holdings) => {
    setPredicting(true);
    const uniqueCoins = [...new Set(holdings.map(h => h.coin_id))];
    const newPredictions = {};
    
    try {
      await Promise.all(uniqueCoins.map(async (coinId) => {
        try {
          const [pred24h, pred7d] = await Promise.all([
            cryptoService.getPrediction(coinId, 24, currency),
            cryptoService.getPrediction(coinId, 168, currency)
          ]);
          newPredictions[coinId] = {
            '24h': pred24h,
            '7d': pred7d
          };
        } catch (e) {
          console.error(`Failed to predict for ${coinId}`, e);
        }
      }));
      setPredictions(newPredictions);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setPredicting(false);
    }
  };

  const addHolding = async (e) => {
    e.preventDefault();
    if (!newHolding.coin_id || !newHolding.amount || !newHolding.purchase_price) {
      alert('Please fill in all fields');
      return;
    }

    const coin = marketData.find(c => c.id === newHolding.coin_id);
    if (!coin) {
      alert('Coin not found');
      return;
    }

    const holding = {
      id: Date.now(),
      coin_id: newHolding.coin_id,
      coin_name: coin.name,
      coin_symbol: coin.symbol,
      coin_image: coin.image,
      amount: parseFloat(newHolding.amount),
      purchase_price: parseFloat(newHolding.purchase_price),
      current_price: coin.current_price,
      value: parseFloat(newHolding.amount) * coin.current_price,
      cost_basis: parseFloat(newHolding.amount) * parseFloat(newHolding.purchase_price),
    };

    const updatedHoldings = [...(portfolio.holdings || []), holding];
    const updatedPortfolio = {
      user_id: 'default',
      holdings: updatedHoldings,
      total_value: updatedHoldings.reduce((sum, h) => sum + h.value, 0),
      total_cost: updatedHoldings.reduce((sum, h) => sum + h.cost_basis, 0),
    };
    
    updatedPortfolio.total_pnl = updatedPortfolio.total_value - updatedPortfolio.total_cost;
    updatedPortfolio.total_pnl_percentage = updatedPortfolio.total_cost > 0 
      ? (updatedPortfolio.total_pnl / updatedPortfolio.total_cost) * 100 
      : 0;

    try {
      await cryptoService.savePortfolio(updatedPortfolio);
      setPortfolio(updatedPortfolio);
      setShowAddModal(false);
      setNewHolding({ coin_id: '', amount: '', purchase_price: '' });
    } catch (error) {
      console.error('Failed to save portfolio:', error);
    }
  };

  const removeHolding = async (holdingId) => {
    const updatedHoldings = portfolio.holdings.filter(h => h.id !== holdingId);
    const updatedPortfolio = {
      user_id: 'default',
      holdings: updatedHoldings,
      total_value: updatedHoldings.reduce((sum, h) => sum + h.value, 0),
      total_cost: updatedHoldings.reduce((sum, h) => sum + h.cost_basis, 0),
    };
    
    updatedPortfolio.total_pnl = updatedPortfolio.total_value - updatedPortfolio.total_cost;
    updatedPortfolio.total_pnl_percentage = updatedPortfolio.total_cost > 0 
      ? (updatedPortfolio.total_pnl / updatedPortfolio.total_cost) * 100 
      : 0;

    try {
      await cryptoService.savePortfolio(updatedPortfolio);
      setPortfolio(updatedPortfolio);
    } catch (error) {
      console.error('Failed to save portfolio:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const calculateProjectedValue = (timeframe) => {
    if (!portfolio.holdings) return 0;
    return portfolio.holdings.reduce((sum, holding) => {
      const pred = predictions[holding.coin_id]?.[timeframe];
      return sum + (pred ? pred.predicted_price * holding.amount : holding.value);
    }, 0);
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Holding</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">Current Balance</h3>
            <Wallet className="text-blue-500 h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(portfolio.total_value || 0)}
          </div>
          <div className={`text-sm mt-1 ${portfolio.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {portfolio.total_pnl >= 0 ? '+' : ''}{formatCurrency(portfolio.total_pnl || 0)} ({portfolio.total_pnl_percentage?.toFixed(2)}%)
          </div>
        </div>

        <div className="card bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">24h Projection</h3>
            <Clock className="text-purple-500 h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-white">
            {predicting ? '...' : formatCurrency(calculateProjectedValue('24h'))}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            Estimated value in 24 hours
          </div>
        </div>

        <div className="card bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">7d Projection</h3>
            <Calendar className="text-indigo-500 h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-white">
            {predicting ? '...' : formatCurrency(calculateProjectedValue('7d'))}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            Estimated value in 7 days
          </div>
        </div>

        <div className="card bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">Total Cost</h3>
            <div className="text-gray-500 h-5 w-5">$</div>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(portfolio.total_cost || 0)}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            Invested Capital
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="card overflow-hidden">
        <h2 className="text-xl font-bold mb-4">Your Assets</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 text-left">
                <th className="p-4 text-gray-400 font-medium">Asset</th>
                <th className="p-4 text-gray-400 font-medium text-right">Balance</th>
                <th className="p-4 text-gray-400 font-medium text-right">Price</th>
                <th className="p-4 text-gray-400 font-medium text-right">Value</th>
                <th className="p-4 text-gray-400 font-medium text-right">24h Forecast</th>
                <th className="p-4 text-gray-400 font-medium text-right">7d Forecast</th>
                <th className="p-4 text-gray-400 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.holdings && portfolio.holdings.map((holding) => {
                const pred24h = predictions[holding.coin_id]?.['24h'];
                const pred7d = predictions[holding.coin_id]?.['7d'];
                
                return (
                  <tr key={holding.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <img src={holding.coin_image} alt={holding.coin_name} className="w-8 h-8 rounded-full" />
                        <div>
                          <div className="font-bold text-white">{holding.coin_name}</div>
                          <div className="text-sm text-gray-400 uppercase">{holding.coin_symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-medium text-white">{holding.amount}</div>
                      <div className="text-sm text-gray-400">
                        Cost: {formatCurrency(holding.purchase_price)}
                      </div>
                    </td>
                    <td className="p-4 text-right font-medium text-white">
                      {formatCurrency(holding.current_price)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-bold text-white">{formatCurrency(holding.value)}</div>
                      <div className={`text-sm ${holding.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {holding.pnl >= 0 ? '+' : ''}{holding.pnl_percentage?.toFixed(2)}%
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {pred24h ? (
                        <div>
                          <div className="font-medium text-white">
                            {formatCurrency(pred24h.predicted_price * holding.amount)}
                          </div>
                          <div className={`text-xs ${pred24h.trend === 'bullish' ? 'text-green-400' : 'text-red-400'}`}>
                            {pred24h.trend === 'bullish' ? '▲' : '▼'} {Math.abs((pred24h.predicted_price - holding.current_price) / holding.current_price * 100).toFixed(2)}%
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(pred24h.prediction_timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      ) : (
                        <div className="animate-pulse h-4 w-16 bg-gray-700 rounded ml-auto"></div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {pred7d ? (
                        <div>
                          <div className="font-medium text-white">
                            {formatCurrency(pred7d.predicted_price * holding.amount)}
                          </div>
                          <div className={`text-xs ${pred7d.trend === 'bullish' ? 'text-green-400' : 'text-red-400'}`}>
                            {pred7d.trend === 'bullish' ? '▲' : '▼'} {Math.abs((pred7d.predicted_price - holding.current_price) / holding.current_price * 100).toFixed(2)}%
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(pred7d.prediction_timestamp).toLocaleDateString([], {month: 'short', day: 'numeric'})}
                          </div>
                        </div>
                      ) : (
                        <div className="animate-pulse h-4 w-16 bg-gray-700 rounded ml-auto"></div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => removeHolding(holding.id)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {(!portfolio.holdings || portfolio.holdings.length === 0) && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">
                    No holdings yet. Click "Add Holding" to start tracking your portfolio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Holding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Add New Holding</h2>
            <form onSubmit={addHolding} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Select Coin</label>
                <select
                  value={newHolding.coin_id}
                  onChange={(e) => setNewHolding({ ...newHolding, coin_id: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select a coin...</option>
                  {marketData.map(coin => (
                    <option key={coin.id} value={coin.id}>
                      {coin.name} ({coin.symbol.toUpperCase()}) - {formatCurrency(coin.current_price)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={newHolding.amount}
                    onChange={(e) => setNewHolding({ ...newHolding, amount: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="0.00000000"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Purchase Price</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={newHolding.purchase_price}
                    onChange={(e) => setNewHolding({ ...newHolding, purchase_price: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Value Summary */}
              {newHolding.coin_id && newHolding.amount && newHolding.purchase_price && (
                <div className="bg-gray-700/30 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Investment Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Bought For</div>
                      <div className="font-medium text-white">
                        {formatCurrency(parseFloat(newHolding.amount || 0) * parseFloat(newHolding.purchase_price || 0))}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Current Value</div>
                      {(() => {
                        const coin = marketData.find(c => c.id === newHolding.coin_id);
                        const currentValue = parseFloat(newHolding.amount || 0) * (coin?.current_price || 0);
                        const boughtFor = parseFloat(newHolding.amount || 0) * parseFloat(newHolding.purchase_price || 0);
                        const isProfit = currentValue >= boughtFor;
                        return (
                          <div className={`font-medium ${
                            isProfit ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(currentValue)}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  {(() => {
                    const coin = marketData.find(c => c.id === newHolding.coin_id);
                    if (!coin) return null;
                    const pred24h = predictions[newHolding.coin_id]?.['24h'];
                    const pred7d = predictions[newHolding.coin_id]?.['7d'];
                    const boughtFor = parseFloat(newHolding.amount || 0) * parseFloat(newHolding.purchase_price || 0);
                    
                    return (
                      <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-gray-600">
                        <div>
                          <div className="text-gray-400">24h Prediction</div>
                          {pred24h ? (
                            <div className={`font-medium ${
                              (pred24h.predicted_price * parseFloat(newHolding.amount || 0)) >= boughtFor ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {formatCurrency(pred24h.predicted_price * parseFloat(newHolding.amount || 0))}
                            </div>
                          ) : (
                            <div className="text-gray-500">Loading...</div>
                          )}
                        </div>
                        <div>
                          <div className="text-gray-400">7d Prediction</div>
                          {pred7d ? (
                            <div className={`font-medium ${
                              (pred7d.predicted_price * parseFloat(newHolding.amount || 0)) >= boughtFor ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {formatCurrency(pred7d.predicted_price * parseFloat(newHolding.amount || 0))}
                            </div>
                          ) : (
                            <div className="text-gray-500">Loading...</div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Holding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;