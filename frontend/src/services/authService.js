// Authentication service for frontend
class AuthService {
  static TOKEN_KEY = 'crypto_token';
  static USER_KEY = 'crypto_user';

  // Check if user is authenticated
  static isAuthenticated() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return false;
    
    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Get stored token
  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Get stored user data
  static getUser() {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  // Store authentication data
  static setAuth(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Clear authentication data
  static clearAuth() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Login API call
  static async login(email, password) {
    const response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    this.setAuth(data.access_token, data.user);
    return data;
  }

  // Register API call
  static async register(email, password, fullName) {
    const response = await fetch('http://localhost:8000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        password, 
        full_name: fullName 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    const data = await response.json();
    this.setAuth(data.access_token, data.user);
    return data;
  }

  // Logout
  static logout() {
    this.clearAuth();
  }

  // Get current user info from API
  static async getCurrentUser() {
    const token = this.getToken();
    if (!token) throw new Error('No token available');

    const response = await fetch('http://localhost:8000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearAuth();
        throw new Error('Authentication expired');
      }
      throw new Error('Failed to fetch user data');
    }

    return await response.json();
  }

  // Add Authorization header to API requests
  static getAuthHeaders() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}

export default AuthService;