import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = () => {
    const token = localStorage.getItem('jwt');
    if (!token) return false;
    
    // Vérifier si le token est expiré
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        // Token expiré, nettoyer le localStorage
        localStorage.removeItem('jwt');
        localStorage.removeItem('username');
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  if (!isAuthenticated()) {
    return <Navigate to="/error" />;
  }

  return children;
};

export default ProtectedRoute;
