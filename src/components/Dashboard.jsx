import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SendIcon from "@mui/icons-material/Send";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const Dashboard = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [connectedUsers, setConnectedUsers] = useState([]);
  const username = localStorage.getItem("username");
  const navigate = useNavigate();

  useEffect(() => {
    // Connexion WebSocket
    const ws = new WebSocket("ws://localhost:8080/ws");

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const response = await fetch("http://localhost:8080/online-users");
        if (response.ok) {
          const users = await response.json();
          setConnectedUsers(users);
        } else {
          console.error("Erreur lors de la récupération des utilisateurs connectés.");
        }
      } catch (error) {
        console.error("Erreur réseau :", error);
      }
    };

    fetchOnlineUsers();

    // Actualise la liste toutes les 5 secondes
    const interval = setInterval(fetchOnlineUsers, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const ws = new WebSocket("ws://localhost:8080/ws");
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "message",
          username: username,
          message: newMessage,
        })
      );
      setNewMessage("");
    };
  };

  const handleLogout = () => {
    fetch("http://localhost:8080/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    })
      .then(() => {
        localStorage.removeItem("jwt");
        localStorage.removeItem("username");
        window.location.href = "/";
      })
      .catch((error) => console.error("Erreur lors de la déconnexion :", error));
  };

  const handleEditProfile = () => {
    navigate("/edit"); // Redirige vers la page d'édition du profil
  };

  return (
    <Box
      sx={{
        height: "100vh",
        backgroundColor: "#073b69",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: "#0d2a4a",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          Bienvenue {username}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<AccountCircleIcon />}
            sx={{
              color: "#fff",
              borderColor: "#fff",
              marginRight: "10px",
              "&:hover": { backgroundColor: "#1565c0", borderColor: "#1565c0" },
            }}
            onClick={() => window.location.href = "/edit"} // Redirige vers la page /edit
          >
            Modifier Profil
          </Button>
          <Button
            variant="contained"
            startIcon={<ExitToAppIcon />}
            sx={{
              backgroundColor: "#d32f2f",
              color: "#fff",
              "&:hover": { backgroundColor: "#b71c1c" },
            }}
            onClick={handleLogout}
          >
            Déconnexion
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Grid container sx={{ flex: 1, overflow: "hidden" }}>
        {/* Liste des utilisateurs connectés */}
        <Grid
          item
          xs={3}
          sx={{ backgroundColor: "#0d2a4a", padding: "10px", overflowY: "auto" }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: "10px" }}>
            Utilisateurs connectés
          </Typography>
          <List>
            {connectedUsers.length > 0 ? (
              connectedUsers.map((user, index) => (
                <ListItem key={index}>
                  <ListItemAvatar>
                    <Avatar
                      sx={{ width: 40, height: 40, backgroundColor: "#4caf50" }}
                      src={user.profile_picture || null}
                    >
                      {!user.profile_picture && user.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={user.username} sx={{ color: "#fff" }} />
                </ListItem>
              ))
            ) : (
              <Typography>Aucun utilisateur connecté.</Typography>
            )}
          </List>
        </Grid>

        {/* Chatbox */}
        <Grid
          item
          xs={9}
          sx={{ padding: "20px", display: "flex", flexDirection: "column" }}
        >
          <Paper
            sx={{
              flex: 1,
              backgroundColor: "#0d2a4a",
              overflowY: "auto",
              borderRadius: "10px",
              padding: "10px",
            }}
          >
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    flexDirection: msg.username === username ? "row-reverse" : "row",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <Avatar
                    sx={{ margin: "0 10px", backgroundColor: "#4caf50" }}
                    src={msg.profile_picture || null}
                  >
                    {!msg.profile_picture && msg.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ maxWidth: "70%" }}>
                    <Typography sx={{ fontWeight: "bold", color: "#81c784" }}>
                      {msg.username}
                    </Typography>
                    <Typography sx={{ color: "#fff" }}>{msg.message}</Typography>
                  </Box>
                </Box>
              ))
            ) : (
              <Typography
                sx={{ textAlign: "center", marginTop: "20px", color: "#90caf9" }}
              >
                Aucun message pour le moment.
              </Typography>
            )}
          </Paper>

          {/* Message Input */}
          <form
            onSubmit={handleSendMessage}
            style={{
              display: "flex",
              marginTop: "20px",
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez un message..."
              sx={{
                backgroundColor: "#fff",
                borderRadius: "5px",
                marginRight: "10px",
              }}
            />
            <Button
              type="submit"
              variant="contained"
              endIcon={<SendIcon />}
              sx={{
                backgroundColor: "#1565c0",
                color: "#fff",
                fontWeight: "bold",
                "&:hover": { backgroundColor: "#0d47a1" },
              }}
            >
              Envoyer
            </Button>
          </form>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
