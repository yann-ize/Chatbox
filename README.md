# ChatBox - Application de Messagerie Moderne

ChatBox est une application de messagerie moderne développée avec React et Go, offrant une expérience de communication en temps réel sécurisée et intuitive.

## 🚀 Caractéristiques

- Interface utilisateur moderne avec Material-UI
- Authentification sécurisée des utilisateurs
- Messagerie en temps réel
- Support des emojis
- Prévisualisation des liens avec Microlink
- Routes protégées pour la sécurité
- Architecture backend robuste en Go

## 🛠️ Technologies Utilisées

### Frontend
- React 18
- Material-UI
- React Router DOM
- Emoji Picker React
- Microlink React
- Vite (pour le build et le développement)

### Backend
- Go
- Gestion d'authentification personnalisée
- API RESTful

## 🏗️ Structure du Projet

```
chatbox/
├── backend/           # Serveur Go
│   ├── handlers/     # Gestionnaires de routes
│   └── main.go      # Point d'entrée du serveur
├── src/              # Code source React
│   ├── components/  # Composants React
│   └── App.jsx     # Composant racine
└── public/           # Ressources statiques
```

## 🚀 Pour Commencer

1. Cloner le repository
2. Installer les dépendances frontend : `npm install`
3. Installer les dépendances backend : `go mod tidy`
4. Lancer le serveur de développement : `npm run dev`
5. Lancer le serveur backend : `go run main.go`

## 💡 Vision du Projet

ChatBox vise à fournir une plateforme de communication moderne, sécurisée et facile à utiliser, en mettant l'accent sur la performance et l'expérience utilisateur.
