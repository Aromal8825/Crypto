import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import cryptoService from '../services/cryptoService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CoinDetail = ({ coinId, currency, onRemove }) => {
  const [chartData, setChartData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [chartPeriod, setChartPeriod] = useState(7);
  const [predictionTimeframe, setPredictionTimeframe] = useState(24);
  const [loading, setLoading] = useState(true);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price);
  };

  const fetchChartData = async () => {
    try {
      const apiDays = chartPeriod === '1H' ? 1 : chartPeriod;
      const history = await cryptoService.getCoinHistory(coinId, apiDays, currency);
      
      let filteredHistory = history;
      if (chartPeriod === '1H') {
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        filteredHistory = history.filter(item => item.timestamp >= oneHourAgo);
      }
      
      const chartConfig = {
        labels: filteredHistory.map(item => {
          const date = new Date(item.timestamp);
          return (chartPeriod === '1H' || chartPeriod <= 1) ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
                          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
          {
            label: `${coinId.charAt(0).toUpperCase() + coinId.slice(1)} Price`,
            data: filteredHistory.map(item => item.price),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            fill: true,
            tension: 0.1,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#3b82f6',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
          }
        ]
      };
      
      setChartData(chartConfig);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    }
  };

  const fetchPrediction = async () => {
    try {
      const pred = await cryptoService.getPrediction(coinId, predictionTimeframe, currency);
      setPrediction(pred);
    } catch (error) {
      console.error('Failed to fetch prediction:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchChartData(), fetchPrediction()]);
      setLoading(false);
    };
    loadData();
  }, [coinId, currency, chartPeriod, predictionTimeframe]);

  if (loading && !chartData && !prediction) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800/30 rounded-xl border border-gray-700">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-gray-800/20 p-4 rounded-xl border border-gray-700/50 relative group">
      <button 
        onClick={() => onRemove(coinId)}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
      >
        <X size={16} />
      </button>

      {/* Price Chart */}
      <div className="lg:col-span-2 card h-full border border-gray-700 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {coinId.charAt(0).toUpperCase() + coinId.slice(1)} 
              <span className="text-sm font-normal text-gray-400">Price Chart</span>
            </h2>
          </div>
          <div className="flex space-x-1 bg-gray-700/50 p-1 rounded-lg">
            {[
              { label: '1H', days: '1H' },
              { label: '1D', days: 1 },
              { label: '7D', days: 7 },
              { label: '30D', days: 30 },
              { label: '90D', days: 90 }
            ].map((period) => (
              <button
                key={period.label}
                onClick={() => setChartPeriod(period.days)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  chartPeriod === period.days
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-600'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
        
        {chartData ? (
          <div className="flex-1 min-h-[300px] w-full relative">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  intersect: false,
                  mode: 'index',
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#f9fafb',
                    bodyColor: '#f9fafb',
                    borderColor: '#374151',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                      label: function(context) {
                        return `Price: ${formatPrice(context.parsed.y)}`;
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    grid: {
                      display: false,
                      drawBorder: false,
                    },
                    ticks: {
                      color: '#6b7280',
                      maxTicksLimit: 6,
                      font: {
                        size: 10
                      }
                    },
                  },
                  y: {
                    position: 'right',
                    grid: {
                      color: 'rgba(55, 65, 81, 0.1)',
                      drawBorder: false,
                    },
                    ticks: {
                      color: '#6b7280',
                      callback: function(value) {
                        return formatPrice(value);
                      },
                      font: {
                        size: 10
                      }
                    },
                  },
                },
                elements: {
                  line: {
                    borderCapStyle: 'round',
                    borderJoinStyle: 'round',
                  },
                  point: {
                    radius: 0,
                    hitRadius: 10,
                    hoverRadius: 4,
                  }
                },
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Prediction Panel */}
      <div className="card h-full border border-gray-700 bg-gray-800/50 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-300 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-400" />
              Prediction
            </h2>
          </div>
          <select 
            value={predictionTimeframe} 
            onChange={(e) => setPredictionTimeframe(Number(e.target.value))}
            className="bg-gray-700 border border-gray-600 rounded-md text-xs px-2 py-1 text-white focus:outline-none focus:border-blue-500"
          >
            <option value={1}>1 Hour</option>
            <option value={24}>24 Hours</option>
            <option value={168}>7 Days</option>
          </select>
        </div>
        
        {prediction ? (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Current Price */}
            <div className="flex justify-between items-end border-b border-gray-700/50 pb-3">
              <div>
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Current Price</div>
                <div className="text-xl font-bold text-white">
                  {formatPrice(prediction.current_price)}
                </div>
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            
            {/* Main Prediction */}
            <div className="py-1">
              <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Target ({predictionTimeframe}h)</div>
              <div className="flex items-baseline gap-3">
                <div className="text-3xl font-bold text-blue-400">
                  {formatPrice(prediction.predicted_price)}
                </div>
                <div className={`text-sm font-medium px-2 py-0.5 rounded ${
                  prediction.trend === 'bullish' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {prediction.trend === 'bullish' ? '+' : ''}
                  {Math.abs(((prediction.predicted_price - prediction.current_price) / prediction.current_price) * 100).toFixed(2)}%
                </div>
              </div>
              
              {/* Prediction Timeline */}
              <div className="mt-2 flex justify-between items-center text-xs text-gray-400">
                <span>Target Date</span>
                <span className="text-white font-medium">
                  {new Date(prediction.prediction_timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Prediction Range */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-gray-700/30 border border-gray-700/50">
                <div className="text-gray-500 mb-1">Conservative</div>
                <div className="font-bold text-gray-300">
                  {formatPrice(prediction.conservative_prediction)}
                </div>
              </div>
              <div className="p-2 rounded bg-gray-700/30 border border-gray-700/50">
                <div className="text-gray-500 mb-1">Optimistic</div>
                <div className="font-bold text-gray-300">
                  {formatPrice(prediction.optimistic_prediction)}
                </div>
              </div>
            </div>
            
            {/* Confidence and Stats */}
            <div className="space-y-2 pt-2 border-t border-gray-700/50">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Confidence</span>
                <span className="font-medium text-blue-400">{prediction.confidence.toFixed(1)}%</span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${prediction.confidence}%` }}
                ></div>
              </div>
              
              {/* Market Stats */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <div className="text-gray-500">Volatility</div>
                  <div className="text-gray-300 font-medium">
                    {prediction.volatility?.toFixed(1)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-500">Daily Trend</div>
                  <div className={`font-medium ${
                    (prediction.average_daily_change || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(prediction.average_daily_change || 0) > 0 ? '+' : ''}
                    {prediction.average_daily_change?.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-4"></div>
            <div className="text-sm">Analyzing market data...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoinDetail;
