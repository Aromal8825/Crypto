import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { TrendingUp, Wallet, BarChart3, Home, Grid, LogOut, User } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import Markets from './components/Markets';
import MultiChart from './components/MultiChart';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import AuthService from './services/authService';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalCurrency, setGlobalCurrency] = useState('usd');
  const [isAuthenticated, setIsAuthenticated] = useState(AuthService.isAuthenticated());
  const [user, setUser] = useState(AuthService.getUser());

  useEffect(() => {
    // Check authentication status on app load
    const checkAuth = () => {
      const authStatus = AuthService.isAuthenticated();
      setIsAuthenticated(authStatus);
      setUser(AuthService.getUser());
    };

    checkAuth();
  }, []);

  const handleLogin = (loginData) => {
    setIsAuthenticated(true);
    setUser(loginData.user);
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab('dashboard');
  };

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

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
              
              <div className="flex items-center space-x-4">
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

                {/* User Menu */}
                <div className="flex items-center space-x-4 border-l border-gray-600 pl-4">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{user?.full_name || 'User'}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard currency={globalCurrency} setCurrency={setGlobalCurrency} />
              </ProtectedRoute>
            } />
            <Route path="/multi-chart" element={
              <ProtectedRoute>
                <MultiChart currency={globalCurrency} />
              </ProtectedRoute>
            } />
            <Route path="/markets" element={
              <ProtectedRoute>
                <Markets currency={globalCurrency} />
              </ProtectedRoute>
            } />
            <Route path="/portfolio" element={
              <ProtectedRoute>
                <Portfolio currency={globalCurrency} />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;