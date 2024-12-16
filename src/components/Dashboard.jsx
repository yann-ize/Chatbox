import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Grid,
  IconButton,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SendIcon from "@mui/icons-material/Send";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EmojiPicker from 'emoji-picker-react';
import { InsertEmoticon as InsertEmoticonIcon } from '@mui/icons-material';
import Microlink from '@microlink/react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
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
});

const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

const MessageContent = ({ content }) => {
  const words = content.split(' ');
  return (
    <>
      {words.map((word, index) => {
        if (isValidUrl(word)) {
          return (
            <Box key={index} sx={{ my: 0.75 }}>
              <Microlink 
                url={word}
                size="large"
                media={['image', 'logo']}
                style={{ 
                  borderRadius: '10px',
                  overflow: 'hidden',
                  maxWidth: '400px',
                  maxHeight: '400px'
                }}
              />
            </Box>
          );
        }
        return word + ' ';
      })}
    </>
  );
};

function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [ws, setWs] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [mode, setMode] = useState('dark');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const username = localStorage.getItem("username");
  const navigate = useNavigate();

  const theme = React.useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  // Synchroniser le thème au chargement du composant
  useEffect(() => {
    const savedMode = localStorage.getItem('mode');
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      localStorage.clear();
      navigate('/login', { replace: true });
      return;
    }

    const websocket = new WebSocket("ws://localhost:8080/ws");

    websocket.onopen = () => {
      console.log("WebSocket connected");
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prevMessages) => {
        const messageExists = prevMessages.some(
          (msg) =>
            msg.username === message.username &&
            msg.message === message.message &&
            msg.timestamp === message.timestamp
        );

        if (messageExists) {
          return prevMessages;
        }
        return [...prevMessages, message];
      });
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
      setWs(null);
    };

    return () => {
      websocket.close();
    };
  }, []);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const response = await fetch("http://localhost:8080/online-users");
        if (response.ok) {
          const users = await response.json();
          setConnectedUsers(users);
        } else {
          console.error("Erreur lors de la récupération des utilisateurs connectés");
        }
      } catch (error) {
        console.error("Erreur réseau:", error);
      }
    };

    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !ws) return;

    const messageData = {
      type: "message",
      username: username,
      message: newMessage,
      timestamp: Date.now()
    };

    ws.send(JSON.stringify(messageData));
    setNewMessage("");
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prevMessage => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:8080/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("jwt")}`
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        if (ws) {
          ws.close();
        }
        localStorage.removeItem("jwt");
        localStorage.removeItem("username");
        navigate("/");
      } else {
        console.error("Erreur lors de la déconnexion");
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const toggleColorMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    localStorage.setItem('mode', newMode);
    setMode(newMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{
        height: "100vh",
        backgroundColor: "background.default",
        display: "flex",
        flexDirection: "column",
        color: "text.primary",
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
            borderColor: mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
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
                filter: mode === 'light' ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }} 
            />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: "600", 
                fontSize: "18px",
                letterSpacing: "0.3px",
                background: mode === 'light' ? 'linear-gradient(45deg, #1565c0, #1976d2)' : 'linear-gradient(45deg, #fff, #90caf9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
                transition: 'all 0.2s',
                '&:hover': {
                  color: 'text.primary',
                  transform: 'rotate(180deg)'
                }
              }}
            >
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '14px'
              }}
            >
              {username}
            </Typography>
            <Button
              variant="text"
              startIcon={<AccountCircleIcon />}
              sx={{
                color: "text.secondary",
                textTransform: "none",
                transition: "all 0.2s",
                "&:hover": { 
                  color: "text.primary",
                  backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
                },
              }}
              onClick={() => navigate("/edit")}
            >
              Profil
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

        <Grid container spacing={0} sx={{ flex: 1, overflow: "hidden" }}>
          <Grid
            item
            xs={2.5}
            sx={{ 
              backgroundColor: "background.paper",
              padding: "20px",
              overflowY: "auto",
              borderRight: "1px solid",
              borderColor: mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
            }}
          >
            <Typography variant="h6" sx={{ 
              fontWeight: "500", 
              fontSize: "14px",
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "16px" 
            }}>
              Utilisateurs en ligne
            </Typography>
            <List>
              {connectedUsers.length > 0 ? (
                connectedUsers.map((user, index) => (
                  <ListItem 
                    key={index}
                    sx={{
                      padding: "8px",
                      borderRadius: "8px",
                      transition: "all 0.2s",
                      "&:hover": {
                        backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
                        transform: "translateX(4px)",
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{ 
                          width: 36, 
                          height: 36,
                          fontSize: "15px",
                          backgroundColor: "#1565c0",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        }}
                        src={user.profile_picture}
                      >
                        {!user.profile_picture && user.username.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={user.username} 
                      sx={{ 
                        "& .MuiListItemText-primary": {
                          color: "text.primary",
                          fontSize: "14px",
                          fontWeight: "500"
                        }
                      }} 
                    />
                  </ListItem>
                ))
              ) : (
                <Typography sx={{ 
                  color: "text.secondary",
                  fontSize: "14px",
                  fontStyle: "italic"
                }}>
                  Aucun utilisateur connecté.
                </Typography>
              )}
            </List>
          </Grid>

          <Grid item xs={9.5} sx={{ 
            padding: "0",
            display: "flex", 
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
            backgroundColor: "background.default",
            maxWidth: "100%",
            '& > *': {
              maxWidth: '100%'
            }
          }}>
            <Paper
              ref={chatContainerRef}
              onScroll={handleScroll}
              sx={{
                flex: 1,
                backgroundColor: "transparent",
                overflowY: "auto",
                overflowX: "hidden",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                position: "relative",
                boxShadow: "none",
                maxWidth: '100%',
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  background: mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                },
                "&::-webkit-scrollbar-thumb": {
                  background: mode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb:hover": {
                  background: mode === 'light' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
                },
              }}
            >
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      flexDirection: msg.username === username ? "row-reverse" : "row",
                      alignItems: "flex-start",
                      marginBottom: "16px",
                      transition: "all 0.2s",
                      "&:hover": {
                        backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
                        transform: "translateY(-1px)",
                      },
                      padding: "12px",
                      borderRadius: "8px"
                    }}
                  >
                    <Avatar
                      sx={{ 
                        width: 38, 
                        height: 38,
                        margin: msg.username === username ? "0 0 0 12px" : "0 12px 0 0",
                        fontSize: "16px",
                        backgroundColor: "#1565c0",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      }}
                      src={msg.profile_picture}
                    >
                      {!msg.profile_picture && msg.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ 
                      maxWidth: "85%",
                      display: "flex",
                      flexDirection: "column"
                    }}>
                      <Typography sx={{ 
                        fontWeight: "500",
                        color: "text.secondary",
                        fontSize: "14px",
                        marginBottom: "4px",
                        letterSpacing: "0.3px"
                      }}>
                        {msg.username}
                      </Typography>
                      <Box sx={{ 
                        color: "text.primary",
                        fontSize: "15px",
                        lineHeight: "1.5",
                        letterSpacing: "0.2px"
                      }}>
                        <MessageContent content={msg.message} />
                      </Box>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography
                  sx={{ 
                    textAlign: "center",
                    color: "text.secondary",
                    fontSize: "14px",
                    fontStyle: "italic",
                    marginTop: "20px"
                  }}
                >
                  Aucun message pour le moment.
                </Typography>
              )}
              <div ref={messagesEndRef} />
            </Paper>

            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              width: '100%',
              padding: "16px 16px",
              backgroundColor: "background.paper",
              borderTop: "1px solid",
              borderColor: mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
            }}>
              {showScrollButton && (
                <Box
                  onClick={scrollToBottom}
                  sx={{
                    position: "absolute",
                    top: "-48px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "#1565c0",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "24px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                    zIndex: 1,
                    transition: "all 0.2s",
                    "&:hover": {
                      backgroundColor: "#1976d2",
                      transform: "translateX(-50%) translateY(-2px)",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                    }
                  }}
                >
                  <ArrowDownwardIcon fontSize="small" />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: "500",
                      letterSpacing: "0.3px"
                    }}
                  >
                    Voir les derniers messages
                  </Typography>
                </Box>
              )}
              <Box sx={{ 
                display: 'flex',
                gap: 1,
                width: '100%',
                position: 'relative',
                paddingRight: '8px'
              }}>
                <Box sx={{ position: 'relative' }}>
                  <IconButton 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    sx={{ 
                      color: 'text.secondary',
                      transition: 'all 0.2s',
                      '&:hover': {
                        color: 'text.primary',
                        backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    <InsertEmoticonIcon />
                  </IconButton>
                  {showEmojiPicker && (
                    <Box sx={{ 
                      position: 'absolute',
                      bottom: '100%',
                      left: '0',
                      marginBottom: '8px',
                      zIndex: 1000,
                      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                      borderRadius: '8px',
                      backgroundColor: mode === 'light' ? '#fff' : '#1e1e1e',
                    }}>
                      <EmojiPicker onEmojiClick={onEmojiClick} />
                    </Box>
                  )}
                </Box>
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    display: "flex",
                    flex: 1,
                    gap: "12px"
                  }}
                >
                  <Box sx={{ flex: '1 1 auto', maxWidth: 'calc(100% - 120px)' }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez un message..."
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                          color: "text.primary",
                          transition: "all 0.2s",
                          borderRadius: "8px",
                          "&:hover": {
                            backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
                          },
                          "& fieldset": {
                            borderColor: mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                            transition: "all 0.2s"
                          },
                          "&:hover fieldset": {
                            borderColor: mode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#1976d2"
                          }
                        },
                        "& .MuiOutlinedInput-input": {
                          padding: "12px 16px",
                          fontSize: "14px",
                          letterSpacing: "0.3px",
                          "&::placeholder": {
                            color: "text.secondary",
                            opacity: 1
                          }
                        }
                      }}
                    />
                  </Box>
                  <Button
                    type="submit"
                    variant="contained"
                    endIcon={<SendIcon />}
                    disabled={!newMessage.trim()}
                    sx={{
                      backgroundColor: "#1565c0",
                      color: "white",
                      textTransform: "none",
                      padding: "8px 20px",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                      transition: "all 0.2s",
                      "&:hover": { 
                        backgroundColor: "#1976d2",
                        transform: "translateY(-1px)",
                        boxShadow: "0 6px 15px rgba(0,0,0,0.3)",
                      },
                      "&.Mui-disabled": {
                        backgroundColor: "rgba(21, 101, 192, 0.4)",
                        color: "rgba(255,255,255,0.4)"
                      }
                    }}
                  >
                    Envoyer
                  </Button>
                </form>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
}

export default Dashboard;
