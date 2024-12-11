package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"backend/database"
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
	log.Printf("rows reçu : %v", rows) // Log de l'erreur
	if err != nil {
		http.Error(w, "Error fetching messages", http.StatusInternalServerError)
		log.Printf("err reçu : %v", err) // Log de l'erreur
		return
	}
	defer rows.Close()

	var messages []map[string]string
	for rows.Next() {
		var username, message, createdAt, profilePicture string
		err := rows.Scan(&username, &message, &createdAt, &profilePicture)
		if err != nil {
			http.Error(w, "Error reading message data", http.StatusInternalServerError)
			log.Printf("err 2 reçu : %v", err) // Log de l'erreur
			return
		}
		messages = append(messages, map[string]string{
			"username":        username,
			"message":         message,
			"created_at":      createdAt,
			"profile_picture": profilePicture,
		})
		log.Printf("message reçu : %v", messages) // Log de l'erreur
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
        log.Println("Invalid input: %v", err)
        return
    }

    // Vérifier que les champs nécessaires sont fournis
    if payload.Username == "" || payload.Message == "" {
        http.Error(w, "Username and message cannot be empty", http.StatusBadRequest)
        return
    }

    // Récupérer les informations utilisateur, y compris la photo de profil
    var profilePicture string
    err = database.DB.QueryRow(`
        SELECT u.profile_picture 
        FROM users u 
        WHERE u.username = ?
    `, payload.Username).Scan(&profilePicture)

    if err != nil {
        log.Println("Erreur lors de la récupération des informations utilisateur : %v", err)
        profilePicture = "" // Valeur par défaut
    } else {
        log.Println("Photo de profil récupérée pour %s : %s", payload.Username, profilePicture)
    }

    // Enregistrer le message dans la base de données
    _, err = database.DB.Exec("INSERT INTO messages (username, message) VALUES (?, ?)", payload.Username, payload.Message)
    if err != nil {
        http.Error(w, "Error saving message", http.StatusInternalServerError)
        log.Println("Error saving message: %v", err)
        return
    }

    // Préparer le message pour diffusion via WebSocket
    message := map[string]string{
        "type":           "message",
        "username":       payload.Username,
        "message":        payload.Message,
        "profile_picture": profilePicture, // Inclure la photo de profil
    }
    log.Printf("Message diffusé : %+v", message)

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
    log.Println("New WebSocket connection established")

    for {
        // Lire les messages envoyés par le client
        var message map[string]string
        err := ws.ReadJSON(&message)
        if err != nil {
            log.Printf("WebSocket read error: %v", err)
            delete(clients, ws)
            break
        }

        // Diffuser le message reçu à tous les clients
        broadcast <- message
    }
}


// HandleMessages : Diffuse les messages à tous les clients connectés
func HandleMessages() {
    for {
        message := <-broadcast
        log.Printf("Message reçu pour diffusion (avec WebSocket) : %+v", message)
        for client := range clients {
            err := client.WriteJSON(message)
            if err != nil {
                log.Printf("Erreur d'envoi du message WebSocket : %v", err)
                client.Close()
                delete(clients, client)
            }
        }
    }
}

