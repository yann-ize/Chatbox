package handlers

import (
	"backend/database"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

// Clé secrète pour signer les JWT
var jwtKey = []byte("G8dNp1xsz1v6cP6h1+Q2N3yDzf/JRfT+AM3LwY2VeX8=")

// generateJWT génère un token JWT pour un utilisateur donné
func generateJWT(username string) (string, error) {
	claims := &jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(24 * time.Hour).Unix(), // Le token expire dans 24 heures
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(jwtKey)
	if err != nil {
		return "", err
	}
	return signedToken, nil
}

// Register permet à un utilisateur de s'enregistrer
func Register(w http.ResponseWriter, r *http.Request) {
	var user struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	// Décoder la requête JSON
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Hash du mot de passe
	hashedPassword := fmt.Sprintf("%x", sha256.Sum256([]byte(user.Password)))

	// Insertion dans la base de données
	_, err = database.DB.Exec("INSERT INTO users (username, password) VALUES (?, ?)", user.Username, hashedPassword)
	if err != nil {
		http.Error(w, "Error creating user", http.StatusInternalServerError)
		return
	}

	// Réponse de succès
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User registered successfully"})
}

// Login authentifie un utilisateur et génère un JWT
func Login(w http.ResponseWriter, r *http.Request) {
	var user struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	// Décoder la requête JSON
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Vérification du mot de passe dans la base de données
	var storedPassword string
	err = database.DB.QueryRow("SELECT password FROM users WHERE username = ?", user.Username).Scan(&storedPassword)
	if err != nil || storedPassword != fmt.Sprintf("%x", sha256.Sum256([]byte(user.Password))) {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	// Mettre à jour le statut de l'utilisateur à "online"
	_, err = database.DB.Exec("UPDATE users SET status = 'online' WHERE username = ?", user.Username)
	if err != nil {
		http.Error(w, "Error updating status", http.StatusInternalServerError)
		return
	}

	// Générer le JWT
	token, err := generateJWT(user.Username)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	// Réponse de succès
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Login successful", "username": user.Username, "token": token})
}

// Logout met à jour le statut d'un utilisateur à "offline"
func Logout(w http.ResponseWriter, r *http.Request) {
	var user struct {
		Username string `json:"username"`
	}

	// Décoder la requête JSON
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Mettre à jour le statut de l'utilisateur à "offline"
	_, err = database.DB.Exec("UPDATE users SET status = 'offline' WHERE username = ?", user.Username)
	if err != nil {
		http.Error(w, "Error updating status", http.StatusInternalServerError)
		return
	}

	// Réponse de succès
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Logout successful"})
}

// GetOnlineUsers retourne la liste des utilisateurs connectés
func GetOnlineUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query("SELECT username, profile_picture FROM users WHERE status = 'online'")
	if err != nil {
		http.Error(w, "Error fetching online users", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var onlineUsers []map[string]string
	for rows.Next() {
		var username, profilePicture string
		rows.Scan(&username, &profilePicture)
		onlineUsers = append(onlineUsers, map[string]string{
			"username":        username,
			"profile_picture": profilePicture,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(onlineUsers)
}

// UpdateProfile permet de mettre à jour le profil d'un utilisateur
func UpdateProfile(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Username        string `json:"username"`
		NewUsername     string `json:"newUsername,omitempty"`
		OldPassword     string `json:"oldPassword,omitempty"`
		NewPassword     string `json:"newPassword,omitempty"`
		ConfirmPassword string `json:"confirmPassword,omitempty"`
		ProfilePicture  string `json:"profilePicture,omitempty"` // Base64 ou URL de l'image
	}

	// Décoder la requête JSON
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Vérifie si l'utilisateur existe
	var currentUsername string
	var storedPassword string
	err = database.DB.QueryRow("SELECT username, password FROM users WHERE username = ?", payload.Username).Scan(&currentUsername, &storedPassword)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Mise à jour du nom d'utilisateur
	if payload.NewUsername != "" {
		_, err := database.DB.Exec("UPDATE users SET username = ? WHERE username = ?", payload.NewUsername, payload.Username)
		if err != nil {
			http.Error(w, "Error updating username", http.StatusInternalServerError)
			return
		}
		payload.Username = payload.NewUsername // Met à jour localement
	}

	// Mise à jour du mot de passe
	if payload.NewPassword != "" {
		// Vérifier l'ancien mot de passe
		if payload.OldPassword == "" {
			http.Error(w, "Old password is required", http.StatusBadRequest)
			return
		}
		hashedOldPassword := fmt.Sprintf("%x", sha256.Sum256([]byte(payload.OldPassword)))
		if hashedOldPassword != storedPassword {
			http.Error(w, "Invalid old password", http.StatusUnauthorized)
			return
		}

		if payload.NewPassword == payload.ConfirmPassword {
			hashedPassword := fmt.Sprintf("%x", sha256.Sum256([]byte(payload.NewPassword)))
			_, err := database.DB.Exec("UPDATE users SET password = ? WHERE username = ?", hashedPassword, payload.Username)
			if err != nil {
				http.Error(w, "Error updating password", http.StatusInternalServerError)
				return
			}
		} else {
			http.Error(w, "Password confirmation does not match", http.StatusBadRequest)
			return
		}
	}

	// Mise à jour de la photo de profil
	if payload.ProfilePicture != "" {
		_, err := database.DB.Exec("UPDATE users SET profile_picture = ? WHERE username = ?", payload.ProfilePicture, payload.Username)
		if err != nil {
			http.Error(w, "Error updating profile picture", http.StatusInternalServerError)
			return
		}
	}

	// Réponse de succès
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Profile updated successfully"})
}
