import React, { useState } from "react";
import { TextField, Button, Box, Typography, Container, Paper } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import chatboxLogo from "../assets/chatbox.svg";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("jwt", data.token); // Stocker le JWT
        localStorage.setItem("username", data.username); // Stocker le nom d'utilisateur
        navigate("/dashboard"); // Redirige vers le Dashboard
      } else {
        setError(true);
      }
    } catch (error) {
      console.error("Erreur de connexion :", error);
      setError(true);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#073b69",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Logo */}
      <Box
        component="img"
        src={chatboxLogo}
        alt="Chatbox Logo"
        sx={{
          position: "absolute",
          top: "5%",
          left: "54%",
          transform: "translate(-50%, 0)",
          width: "900px",
          height: "auto",
        }}
      />

      {/* Formulaire */}
      <Container maxWidth="xs">
        <Paper
          elevation={5}
          sx={{
            padding: "30px",
            borderRadius: "15px",
            backgroundColor: "#0d2a4a",
            color: "#fff",
            textAlign: "center",
            marginTop: "180px",
          }}
        >
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Nom d'utilisateur"
              type="text"
              variant="outlined"
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              error={error}
              helperText={error ? "Nom d'utilisateur ou mot de passe incorrect" : ""}
              InputProps={{
                style: {
                  backgroundColor: "#333",
                  color: "#fff",
                  borderRadius: "5px",
                },
              }}
              InputLabelProps={{
                style: { color: "#bbb" },
              }}
            />
            <TextField
              fullWidth
              label="Mot de passe"
              type="password"
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              error={error}
              helperText={error ? "Nom d'utilisateur ou mot de passe incorrect" : ""}
              InputProps={{
                style: {
                  backgroundColor: "#333",
                  color: "#fff",
                  borderRadius: "5px",
                },
              }}
              InputLabelProps={{
                style: { color: "#bbb" },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                padding: "10px",
                backgroundColor: "#ffffff",
                color: "#0d47a1",
                fontWeight: "bold",
                border: "2px solid #0d47a1",
                borderRadius: "25px",
                "&:hover": {
                  backgroundColor: "#0d47a1",
                  color: "#ffffff",
                },
              }}
            >
              Se connecter
            </Button>
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Vous n'avez pas de compte ?{" "}
            <Link to="/register" style={{ color: "#1565c0", textDecoration: "none" }}>
              Inscrivez-vous ici
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
