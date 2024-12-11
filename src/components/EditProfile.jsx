import React, { useState } from "react";
import { Box, TextField, Button, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const EditProfile = () => {
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(""); // Saisir l'URL de l'image
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    const formData = {
      username: username,
      newUsername,
      newPassword,
      profilePicture, // URL de la photo de profil
    };

    try {
      const response = await fetch("http://localhost:8080/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Profil mis à jour avec succès !");
        navigate("/dashboard");
      } else {
        alert("Erreur lors de la mise à jour du profil.");
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        backgroundColor: "#073b69",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Paper
        sx={{
          padding: "30px",
          borderRadius: "15px",
          backgroundColor: "#0d2a4a",
          color: "#fff",
          textAlign: "center",
          width: "400px",
        }}
      >
        <Typography variant="h5" sx={{ marginBottom: "20px" }}>
          Modifier le profil
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Nouveau nom d'utilisateur"
            variant="outlined"
            margin="normal"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            sx={{
              backgroundColor: "#fff",
              borderRadius: "5px",
              marginBottom: "10px",
            }}
          />
          <TextField
            fullWidth
            label="Nouveau mot de passe"
            type="password"
            variant="outlined"
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{
              backgroundColor: "#fff",
              borderRadius: "5px",
              marginBottom: "10px",
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
            sx={{
              backgroundColor: "#fff",
              borderRadius: "5px",
              marginBottom: "10px",
            }}
          />
          <TextField
            fullWidth
            label="URL de la photo de profil"
            variant="outlined"
            margin="normal"
            value={profilePicture}
            onChange={(e) => setProfilePicture(e.target.value)} // Met à jour la valeur de l'URL
            sx={{
              backgroundColor: "#fff",
              borderRadius: "5px",
              marginBottom: "10px",
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              marginTop: "10px",
              backgroundColor: "#4caf50",
              "&:hover": { backgroundColor: "#388e3c" },
            }}
          >
            Sauvegarder
          </Button>
        </form>
        <Button
          fullWidth
          variant="outlined"
          sx={{
            marginTop: "10px",
            color: "#fff",
            borderColor: "#fff",
            "&:hover": { backgroundColor: "#1565c0", borderColor: "#1565c0" },
          }}
          onClick={() => navigate("/dashboard")}
        >
          Annuler
        </Button>
      </Paper>
    </Box>
  );
};

export default EditProfile;
