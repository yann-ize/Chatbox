import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  useTheme,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { Edit as EditIcon, Chat as ChatIcon } from '@mui/icons-material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useNavigate } from 'react-router-dom';
import chatboxLogo from "../assets/chatbox.svg";

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: {
      main: '#1565c0',
      light: '#1976d2',
      dark: '#0d47a1',
    },
    background: {
      default: mode === 'light' ? '#f5f5f5' : '#073b69',
      paper: mode === 'light' ? '#fff' : '#0d2a4a',
    },
    text: {
      primary: mode === 'light' ? '#1a1a1a' : '#fff',
      secondary: mode === 'light' ? '#666666' : 'rgba(255,255,255,0.7)',
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: mode === 'light' ? '#fff' : 'rgba(255,255,255,0.05)',
            '&:hover': {
              backgroundColor: mode === 'light' ? '#fff' : 'rgba(255,255,255,0.08)',
            },
            '&.Mui-focused': {
              backgroundColor: mode === 'light' ? '#fff' : 'rgba(255,255,255,0.08)',
            },
          },
        },
      },
    },
  },
});

const EditProfile = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('dark');
  const theme = React.useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  // Synchroniser le thème au chargement du composant
  useEffect(() => {
    const savedMode = localStorage.getItem('mode');
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);

  const [formData, setFormData] = useState({
    username: localStorage.getItem('username') || '',
    avatar: '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState({
    oldPassword: '',
    newPassword: false,
    confirmPassword: '',
    isMatching: false
  });

  const [tempUsername, setTempUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);

  useEffect(() => {
    // Récupérer l'avatar de l'utilisateur
    const username = localStorage.getItem('username');
    if (username) {
      fetch(`http://localhost:8080/user-avatar?username=${username}`)
        .then(response => response.json())
        .then(data => {
          if (data.profilePicture) {
            setFormData(prev => ({
              ...prev,
              avatar: data.profilePicture
            }));
          }
        })
        .catch(error => console.error('Error fetching avatar:', error));
    }
  }, []);

  const [openAvatarDialog, setOpenAvatarDialog] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // Gestionnaire pour cliquer en dehors du formulaire de mot de passe
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isEditingPassword && !event.target.closest('#password-form')) {
        setIsEditingPassword(false);
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setPasswordErrors({
          oldPassword: '',
          newPassword: false,
          confirmPassword: '',
          isMatching: false
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingPassword]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isEditingUsername && !event.target.closest('#username-form')) {
        if (tempUsername.trim()) {
          handleUsernameSubmit();
        } else {
          setTempUsername(formData.username);
          setIsEditingUsername(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingUsername, tempUsername, formData.username]);

  const handleAvatarClick = () => {
    setOpenAvatarDialog(true);
  };

  const handleCloseAvatarDialog = () => {
    setOpenAvatarDialog(false);
  };

  const handleSaveAvatar = () => {
    fetch('http://localhost:8080/update-profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: localStorage.getItem('username'),
        profilePicture: formData.avatar
      }),
    })
    .then(response => {
      if (response.ok) {
        setOpenAvatarDialog(false);
      } else {
        console.error('Failed to update avatar');
      }
    })
    .catch(error => console.error('Error updating avatar:', error));
  };

  const handlePasswordEdit = () => {
    setIsEditingPassword(true);
  };

  const handlePasswordSubmit = () => {
    // Reset des erreurs
    setPasswordErrors({
      oldPassword: '',
      newPassword: false,
      confirmPassword: '',
      isMatching: false
    });

    if (!passwordData.oldPassword) {
      setPasswordErrors(prev => ({
        ...prev,
        oldPassword: 'L\'ancien mot de passe est requis'
      }));
      return;
    }
    
    if (!passwordData.newPassword) {
      setPasswordErrors(prev => ({
        ...prev,
        newPassword: true,
        confirmPassword: 'Le nouveau mot de passe est requis',
        isMatching: false
      }));
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordErrors(prev => ({
        ...prev,
        newPassword: true,
        confirmPassword: 'Les mots de passe ne correspondent pas',
        isMatching: false
      }));
      return;
    }

    fetch('http://localhost:8080/update-profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: localStorage.getItem('username'),
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      }),
    })
    .then(response => {
      if (response.ok) {
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordErrors({
          oldPassword: '',
          newPassword: false,
          confirmPassword: '',
          isMatching: false
        });
        setIsEditingPassword(false);
      } else {
        response.text().then(text => {
          if (text.includes("Invalid old password")) {
            setPasswordErrors(prev => ({
              ...prev,
              oldPassword: 'Mot de passe incorrect'
            }));
          }
        });
      }
    })
    .catch(error => {
      console.error('Error updating password:', error);
    });
  };

  const handlePasswordUpdate = (e) => {
    if (e.key === 'Enter' && passwordData.oldPassword && passwordData.newPassword && passwordData.confirmPassword) {
      handlePasswordSubmit();
    }
  };

  const handleUsernameEdit = () => {
    setTempUsername(formData.username);
    setIsEditingUsername(true);
  };

  const handleUsernameSubmit = () => {
    const currentUsername = localStorage.getItem('username');
    if (tempUsername === currentUsername) {
      setIsEditingUsername(false);
      return;
    }

    fetch('http://localhost:8080/update-profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: currentUsername,
        newUsername: tempUsername
      }),
    })
    .then(response => {
      if (response.ok) {
        localStorage.setItem('username', tempUsername);
        setFormData(prev => ({
          ...prev,
          username: tempUsername
        }));
        setIsEditingUsername(false);
      } else {
        console.error('Failed to update username');
        setTempUsername(currentUsername);
        setIsEditingUsername(false);
      }
    })
    .catch(error => {
      console.error('Error updating username:', error);
      setTempUsername(currentUsername);
      setIsEditingUsername(false);
    });
  };

  const handleUsernameUpdate = (e) => {
    if (e.key === 'Enter' && tempUsername.trim()) {
      handleUsernameSubmit();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const toggleColorMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    localStorage.setItem('mode', newMode);
    setMode(newMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: 'background.default',
        color: 'text.primary',
      }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
            padding: "12px 24px",
            backgroundColor: "background.paper",
            borderBottom: "1px solid",
            borderColor: mode === 'light' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            overflow: 'visible'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img 
              src={chatboxLogo} 
              alt="Chatbox Logo"
              style={{ 
                width: '80px', 
                height: '80px',
                transform: 'scale(2)',
                transformOrigin: 'left center',
                filter: mode === 'dark' ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }} 
            />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: "600", 
                fontSize: "18px",
                letterSpacing: "0.3px",
                background: mode === 'dark' ? 'linear-gradient(45deg, #fff, #90caf9)' : 'linear-gradient(45deg, #1565c0, #1976d2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: mode === 'light' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Chatbox
            </Typography>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 2 
          }}>
            <IconButton 
              onClick={toggleColorMode} 
              sx={{ 
                color: 'text.secondary',
                '&:hover': {
                  color: 'text.primary',
                }
              }}
            >
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '14px'
              }}
            >
              {formData.username}
            </Typography>
            <Button
              variant="text"
              startIcon={<ChatIcon />}
              sx={{
                color: "text.secondary",
                textTransform: "none",
                transition: "all 0.2s",
                "&:hover": { 
                  color: "text.primary",
                  backgroundColor: 'background.paper',
                },
              }}
              onClick={() => navigate("/dashboard")}
            >
              Chat
            </Button>
            <Button
              variant="contained"
              startIcon={<ExitToAppIcon />}
              sx={{
                backgroundColor: "#e11d48",
                textTransform: "none",
                boxShadow: "0 4px 12px rgba(225, 29, 72, 0.3)",
                transition: "all 0.2s",
                "&:hover": { 
                  backgroundColor: "#be123c",
                  transform: "translateY(-1px)",
                  boxShadow: "0 6px 15px rgba(225, 29, 72, 0.4)",
                },
              }}
              onClick={handleLogout}
            >
              Déconnexion
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pt: 8,
            px: 4,
            height: 'calc(100vh - 64px)',
            backgroundColor: 'background.default',
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: '400px',
              p: 4,
              backgroundColor: "background.paper",
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                mb: 4,
              }}
            >
              <Avatar
                src={formData.avatar}
                onClick={handleAvatarClick}
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: '#1976d2',
                  fontSize: '2rem',
                  border: '4px solid',
                  borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  mb: 2,
                  transition: 'transform 0.2s, border-color 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                  },
                }}
              >
                {formData.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} id="username-form">
                {isEditingUsername ? (
                  <TextField
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    onKeyDown={handleUsernameUpdate}
                    size="small"
                    autoFocus
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#fff',
                      },
                    }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600 }}>
                      {formData.username}
                    </Typography>
                    <IconButton
                      onClick={handleUsernameEdit}
                      sx={{
                        padding: '4px',
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'text.primary',
                          backgroundColor: 'background.paper',
                        },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Box>

            <Box id="password-form" sx={{ width: '100%', mb: 3 }}>
              {isEditingPassword ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 400 }}>
                  <TextField
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, oldPassword: e.target.value });
                      setPasswordErrors(prev => ({ ...prev, oldPassword: '' }));
                    }}
                    onKeyDown={handlePasswordUpdate}
                    placeholder="Ancien mot de passe"
                    size="small"
                    error={!!passwordErrors.oldPassword}
                    helperText={passwordErrors.oldPassword}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#fff',
                      },
                    }}
                  />
                  <TextField
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setPasswordData({ ...passwordData, newPassword: newValue });
                      if (passwordData.confirmPassword) {
                        if (newValue === passwordData.confirmPassword) {
                          setPasswordErrors(prev => ({
                            ...prev,
                            newPassword: false,
                            confirmPassword: 'Les mots de passe correspondent ✅',
                            isMatching: true
                          }));
                        } else {
                          setPasswordErrors(prev => ({
                            ...prev,
                            newPassword: true,
                            confirmPassword: 'Les mots de passe ne correspondent pas ❌',
                            isMatching: false
                          }));
                        }
                      } else {
                        setPasswordErrors(prev => ({
                          ...prev,
                          newPassword: false,
                          confirmPassword: '',
                          isMatching: false
                        }));
                      }
                    }}
                    onKeyDown={handlePasswordUpdate}
                    placeholder="Nouveau mot de passe"
                    size="small"
                    error={!passwordErrors.isMatching && (passwordErrors.newPassword || (passwordData.newPassword && passwordData.confirmPassword))}
                    color={passwordErrors.isMatching ? "success" : "primary"}
                    focused={passwordErrors.isMatching}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#fff',
                      },
                    }}
                  />
                  <TextField
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setPasswordData({ ...passwordData, confirmPassword: newValue });
                      if (newValue === passwordData.newPassword) {
                        setPasswordErrors(prev => ({
                          ...prev,
                          newPassword: false,
                          confirmPassword: 'Les mots de passe correspondent ✅',
                          isMatching: true
                        }));
                      } else {
                        setPasswordErrors(prev => ({
                          ...prev,
                          newPassword: true,
                          confirmPassword: 'Les mots de passe ne correspondent pas',
                          isMatching: false
                        }));
                      }
                    }}
                    onKeyDown={handlePasswordUpdate}
                    placeholder="Confirmer le mot de passe"
                    size="small"
                    error={!passwordErrors.isMatching && (passwordErrors.newPassword || (passwordData.newPassword && passwordData.confirmPassword))}
                    helperText={passwordErrors.confirmPassword}
                    color={passwordErrors.isMatching ? "success" : "primary"}
                    focused={passwordErrors.isMatching}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#fff',
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button 
                      onClick={() => setIsEditingPassword(false)}
                      sx={{ 
                        color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                        '&:hover': {
                          backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                        },
                      }}
                    >
                      Annuler
                    </Button>
                    <Button 
                      onClick={handlePasswordSubmit}
                      variant="contained"
                      sx={{
                        backgroundColor: '#1976d2',
                        '&:hover': { backgroundColor: '#1565c0' },
                      }}
                    >
                      Sauvegarder
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    fullWidth
                    type="password"
                    value="********"
                    disabled
                    variant="outlined"
                  />
                  <IconButton
                    onClick={handlePasswordEdit}
                    edge="end"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'text.primary',
                      },
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        <Dialog 
          open={openAvatarDialog} 
          onClose={handleCloseAvatarDialog}
          PaperProps={{
            sx: {
              borderRadius: '12px',
              backgroundColor: mode === 'dark' ? '#1a1a1a' : '#fff',
              minWidth: '400px',
            }
          }}
        >
          <DialogContent sx={{ pt: 3, pb: 3 }}>
            <TextField
              autoFocus
              placeholder="Entrez l'URL de votre avatar"
              fullWidth
              variant="standard"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              sx={{
                '& .MuiInput-root': {
                  fontSize: '16px',
                  '&:before': {
                    borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  },
                  '&:hover:not(.Mui-disabled):before': {
                    borderBottom: mode === 'dark' ? '2px solid rgba(255, 255, 255, 0.2)' : '2px solid rgba(0, 0, 0, 0.2)',
                  },
                  '&.Mui-focused:after': {
                    borderBottom: '2px solid #1976d2',
                  },
                },
                '& .MuiInput-input': {
                  color: mode === 'dark' ? '#fff' : '#000',
                  '&::placeholder': {
                    color: mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    opacity: 1,
                  },
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button 
              onClick={handleCloseAvatarDialog}
              sx={{
                textTransform: 'none',
                color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                '&:hover': {
                  backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSaveAvatar}
              variant="contained"
              sx={{
                textTransform: 'none',
                backgroundColor: '#1976d2',
                '&:hover': { 
                  backgroundColor: '#1565c0',
                },
                borderRadius: '6px',
                px: 3,
              }}
            >
              Sauvegarder
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default EditProfile;
