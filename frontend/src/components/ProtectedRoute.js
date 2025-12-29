import AuthService from '../services/authService';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = AuthService.isAuthenticated();
  
  if (!isAuthenticated) {
    // This will trigger the parent App component to show the login page
    return null;
  }

  return children;
};

export default ProtectedRoute;