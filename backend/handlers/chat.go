package handlers

import (
    "backend/database"
    "encoding/json"
    "log"
    "net/http"

    "github.com/gorilla/websocket"
)

// Configuration du WebSocket
var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        return true // Autorise toutes les origines pour le développement
    },
}

// Gestion des connexions actives
var (
    // Map pour suivre tous les clients WebSocket connectés
    clients = make(map[*websocket.Conn]bool)

    // Canal pour diffuser les messages à tous les clients
    broadcast = make(chan map[string]interface{})
)

// HandleConnections gère les nouvelles connexions WebSocket.
// Cette fonction :
// 1. Upgrade la connexion HTTP en WebSocket
// 2. Ajoute le client à la liste des clients connectés
// 3. Écoute les messages entrants du client
// 4. Gère la déconnexion du client
func HandleConnections(w http.ResponseWriter, r *http.Request) {
    ws, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Printf("Error upgrading to WebSocket: %v", err)
        return
    }
    defer ws.Close()

    clients[ws] = true

    for {
        var message map[string]interface{}
        if err := ws.ReadJSON(&message); err != nil {
            delete(clients, ws)
            break
        }

        // Si c'est un message de chat, ajoute l'image de profil
        if message["type"] == "message" {
            var profilePicture string
            err := database.DB.QueryRow("SELECT profile_picture FROM users WHERE username = ?", message["username"]).Scan(&profilePicture)
            if err == nil && profilePicture != "" {
                message["profile_picture"] = profilePicture
            }
        }

        // Diffuse le message à tous les clients
        broadcast <- message
    }
}

// HandleMessages est une goroutine qui s'exécute en continu pour
// diffuser les messages à tous les clients connectés.
// Cette fonction doit être lancée avec 'go HandleMessages()' au démarrage du serveur.
func HandleMessages() {
    for {
        // Récupère le prochain message du canal broadcast
        message := <-broadcast

        // Envoie le message à tous les clients
        for client := range clients {
            if err := client.WriteJSON(message); err != nil {
                log.Printf("Error sending message: %v", err)
                client.Close()
                delete(clients, client)
            }
        }
    }
}

// BroadcastStatusChange envoie une mise à jour de statut à tous les clients WebSocket
func BroadcastStatusChange(statusUpdate map[string]interface{}) {
    broadcast <- statusUpdate
}

// GetUserAvatar récupère l'avatar d'un utilisateur par son nom d'utilisateur
func GetUserAvatar(w http.ResponseWriter, r *http.Request) {
    username := r.URL.Query().Get("username")
    if username == "" {
        http.Error(w, "Username is required", http.StatusBadRequest)
        return
    }

    var profilePicture string
    err := database.DB.QueryRow("SELECT profile_picture FROM users WHERE username = ?", username).Scan(&profilePicture)
    if err != nil {
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"profilePicture": profilePicture})
}
