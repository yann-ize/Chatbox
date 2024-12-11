package main

import (
	"log"
	"net/http"
	"github.com/gorilla/mux"
	"backend/database"
	"backend/handlers"
)

// Middleware pour autoriser CORS
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*") // Autorise toutes les origines
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE") // Méthodes autorisées
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization") // En-têtes autorisés
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	// Initialiser la base de données
	database.InitDB()

	// Configurer le routeur
	router := mux.NewRouter()

	// Routes HTTP
	router.HandleFunc("/register", handlers.Register).Methods("POST")
	router.HandleFunc("/login", handlers.Login).Methods("POST")
	router.HandleFunc("/messages", handlers.GetMessages).Methods("GET")
	router.HandleFunc("/messages", handlers.SendMessage).Methods("POST")
	router.HandleFunc("/logout", handlers.Logout).Methods("POST")
	router.HandleFunc("/online-users", handlers.GetOnlineUsers).Methods("GET")
	router.HandleFunc("/update-profile", handlers.UpdateProfile).Methods("PUT")

	// Route WebSocket
	router.HandleFunc("/ws", handlers.HandleConnections)

	// Ajouter le middleware CORS
	http.Handle("/", enableCORS(router))

	// Lancer la gestion des messages WebSocket dans une goroutine
	go handlers.HandleMessages()

	// Lancer le serveur
	log.Println("Backend running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
