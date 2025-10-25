FROM node:18-alpine

WORKDIR /app

# Installer un serveur HTTP simple
RUN npm install -g http-server

# Copier les fichiers du site
COPY . .

# Exposer le port
EXPOSE 3000

# Démarrer le serveur
CMD ["http-server", ".", "-p", "3000", "-c-1"]
