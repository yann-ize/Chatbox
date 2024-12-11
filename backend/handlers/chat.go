package handlers

import (
	"backend/database"
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

// WebSocket upgrader pour transformer une connexion HTTP en WebSocket
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Autorise toutes les origines (modifie selon tes besoins)
	},
}

// Map des clients connectés
var clients = make(map[*websocket.Conn]bool)

// Canal pour diffuser les messages
var broadcast = make(chan map[string]string)

// GetMessages : Récupère tous les messages
func GetMessages(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT m.username, m.message, m.created_at, u.profile_picture
		FROM messages m
		LEFT JOIN users u ON m.username = u.username
		ORDER BY m.created_at ASC
	`)
	if err != nil {
		http.Error(w, "Error fetching messages", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var messages []map[string]string
	for rows.Next() {
		var username, message, createdAt, profilePicture string
		err := rows.Scan(&username, &message, &createdAt, &profilePicture)
		if err != nil {
			http.Error(w, "Error reading message data", http.StatusInternalServerError)
			return
		}
		messages = append(messages, map[string]string{
			"username":        username,
			"message":         message,
			"created_at":      createdAt,
			"profile_picture": profilePicture,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

// SendMessage : Enregistre un nouveau message dans la base et le diffuse via WebSocket
func SendMessage(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Username string `json:"username"`
		Message  string `json:"message"`
	}

	// Décoder le corps de la requête JSON
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Vérifier que les champs nécessaires sont fournis
	if payload.Username == "" || payload.Message == "" {
		http.Error(w, "Username and message cannot be empty", http.StatusBadRequest)
		return
	}

	// Récupérer l'image de profil de l'utilisateur
	var profilePicture string
	err = database.DB.QueryRow(`
		SELECT profile_picture 
		FROM users 
		WHERE username = ?
	`, payload.Username).Scan(&profilePicture)

	if err != nil {
		profilePicture = "" // Valeur par défaut si erreur
	}

	// Enregistrer le message dans la base de données
	_, err = database.DB.Exec("INSERT INTO messages (username, message) VALUES (?, ?)",
		payload.Username, payload.Message)
	if err != nil {
		http.Error(w, "Error saving message", http.StatusInternalServerError)
		return
	}

	// Préparer le message pour diffusion via WebSocket
	message := map[string]string{
		"type":            "message",
		"username":        payload.Username,
		"message":         payload.Message,
		"profile_picture": profilePicture,
	}

	// Diffuser le message via WebSocket
	broadcast <- message

	// Réponse HTTP de succès
	w.WriteHeader(http.StatusCreated)
}

// HandleConnections : Gère les connexions WebSocket
func HandleConnections(w http.ResponseWriter, r *http.Request) {
	// Upgrade la connexion HTTP en WebSocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading to WebSocket: %v", err)
		return
	}
	defer ws.Close()

	// Ajouter le client à la liste des clients connectés
	clients[ws] = true

	for {
		// Lire les messages envoyés par le client
		var message map[string]string
		err := ws.ReadJSON(&message)
		if err != nil {
			delete(clients, ws)
			break
		}

		// Récupérer l'image de profil pour ce message
		if message["type"] == "message" {
			var profilePicture string
			err = database.DB.QueryRow(`
				SELECT profile_picture 
				FROM users 
				WHERE username = ?
			`, message["username"]).Scan(&profilePicture)

			if err != nil {
				profilePicture = "" // Valeur par défaut si erreur
			}

			// Ajouter l'image de profil au message
			message["profile_picture"] = profilePicture
		}

		// Diffuser le message
		broadcast <- message
	}
}

// HandleMessages : Diffuse les messages à tous les clients connectés
func HandleMessages() {
	for {
		message := <-broadcast
		for client := range clients {
			err := client.WriteJSON(message)
			if err != nil {
				client.Close()
				delete(clients, client)
			}
		}
	}
}
