import React from 'react';
import { Navigate } from 'react-router-dom';

const AuthRoute = ({ children }) => {
  const isAuthenticated = () => {
    const token = localStorage.getItem('jwt');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('jwt');
        localStorage.removeItem('username');
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AuthRoute;
