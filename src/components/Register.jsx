import React, { useState } from "react";
import { TextField, Button, Box, Typography, Container, Paper } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import chatboxLogo from "../assets/chatbox.svg";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ username: false, password: false });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      username: username.trim() === "",
      password: password !== confirmPassword,
    };

    setErrors(newErrors);

    if (!newErrors.username && !newErrors.password) {
      try {
        const response = await fetch("http://localhost:8080/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
          alert("Inscription réussie !");
          navigate("/"); // Redirige vers la page de connexion après inscription
        } else {
          alert("Erreur lors de l'inscription !");
        }
      } catch (error) {
        console.error("Erreur d'inscription :", error);
        alert("Erreur réseau ou serveur !");
      }
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        backgroundColor: "#073b69", // Bleu sombre
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#fff",
      }}
    >
      {/* Logo */}
      <Box
        component="img"
        src={chatboxLogo}
        alt="Chatbox Logo"
        sx={{
          position: "absolute",
          top: "5%", // Ajuste la distance depuis le haut
          left: "54%",
          transform: "translate(-50%, 0)", // Centrage horizontal parfait
          width: "900px", // Largeur du logo
          height: "auto", // Maintenir les proportions
        }}
      />
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
              error={errors.username}
              helperText={errors.username ? "Saisie incorrecte" : ""}
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
              label="Confirmer le mot de passe"
              type="password"
              variant="outlined"
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              error={errors.password}
              helperText={errors.password ? "Les mots de passe ne correspondent pas" : ""}
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
              S'inscrire
            </Button>
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Déjà un compte ?{" "}
            <Link to="/" style={{ color: "#1565c0", textDecoration: "none" }}>
              Connectez-vous ici
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
