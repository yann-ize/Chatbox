import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorIcon from '@mui/icons-material/Error';

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: '#073b69',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center',
        padding: '20px',
      }}
    >
      <ErrorIcon sx={{ fontSize: 100, color: '#ff4444', marginBottom: '20px' }} />
      <Typography variant="h2" gutterBottom>
        Erreur 401
      </Typography>
      <Typography variant="h5" gutterBottom>
        Accès non autorisé
      </Typography>
      <Typography variant="body1" sx={{ maxWidth: 600, mb: 4 }}>
        Vous n'êtes pas autorisé à accéder à cette page. Veuillez vous connecter pour continuer.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/')}
        sx={{
          backgroundColor: '#ffffff',
          color: '#0d47a1',
          fontWeight: 'bold',
          padding: '10px 30px',
          '&:hover': {
            backgroundColor: '#e0e0e0',
          },
        }}
      >
        Retour à la connexion
      </Button>
    </Box>
  );
};

export default ErrorPage;
