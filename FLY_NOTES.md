# Notes de déploiement Fly.io

## Configuration utilisée

- **Application** : interligues-u14
- **Région** : CDG (Centre de données Paris)
- **Port** : 3000
- **Runtime** : Node.js 18 Alpine + http-server

## Fichiers de configuration

### fly.toml
Configuration Fly.io principale :
- Définit le nom et la région de l'app
- Configure les ports (80 → HTTP, 443 → HTTPS)
- Force HTTPS
- Définie les health checks

### Dockerfile
Dockerfile pour construire l'image Docker :
- Utilise Node 18 Alpine (très léger)
- Installe http-server globalement
- Copie les fichiers du site
- Expose le port 3000
- Lance le serveur

### .dockerignore
Fichiers à ignorer lors du build Docker

## Commandes utiles Fly.io

```bash
# Voir le statut de l'application
flyctl status

# Voir les logs en direct
flyctl logs

# Redéployer
flyctl deploy

# Ouvrir l'app dans le navigateur
flyctl open

# SSH dans l'application
flyctl ssh console

# Voir les secrets
flyctl secrets list

# Ajouter une variable d'environnement
flyctl secrets set NOM_VARIABLE=valeur
```

## URL du site

Une fois déployé : `https://interligues-u14.fly.dev`

## Troubleshooting

### L'app ne démarre pas
```bash
flyctl logs
```
Vérifie les logs pour voir le problème

### Le site affiche "not found"
Assurez-vous que tous les fichiers (index.html, style.css, script.js) sont présents

### Problèmes CORS avec l'API
L'API doit être configurée pour accepter les requêtes CORS depuis `https://interligues-u14.fly.dev`
