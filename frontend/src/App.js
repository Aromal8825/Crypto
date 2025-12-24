import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { TrendingUp, Wallet, BarChart3, Home, Grid } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import Markets from './components/Markets';
import MultiChart from './components/MultiChart';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalCurrency, setGlobalCurrency] = useState('usd');

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-blue-500" />
                <h1 className="text-xl font-bold">Crypto Dashboard</h1>
              </div>
              
              <nav className="flex space-x-8">
                <Link
                  to="/"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'dashboard' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/multi-chart"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'multi-chart' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab('multi-chart')}
                >
                  <Grid className="h-4 w-4" />
                  <span>Multi-View</span>
                </Link>
                
                <Link
                  to="/markets"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'markets' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab('markets')}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Markets</span>
                </Link>
                
                <Link
                  to="/portfolio"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'portfolio' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTab('portfolio')}
                >
                  <Wallet className="h-4 w-4" />
                  <span>Portfolio</span>
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard currency={globalCurrency} setCurrency={setGlobalCurrency} />} />
            <Route path="/multi-chart" element={<MultiChart currency={globalCurrency} />} />
            <Route path="/markets" element={<Markets currency={globalCurrency} />} />
            <Route path="/portfolio" element={<Portfolio currency={globalCurrency} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;