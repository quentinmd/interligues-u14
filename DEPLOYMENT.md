# Site des Interlligues U14 Hockey sur Gazon

Ce dossier contient le site web pour les Interlligues U14 de hockey sur gazon.

## Fichiers principaux
- `index.html` - Page principale
- `style.css` - Feuille de styles
- `script.js` - Logique JavaScript

## Déploiement

### Avec Fly.io (Recommandé) ⭐
1. **Installer Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Se connecter**
   ```bash
   flyctl auth login
   ```

3. **Déployer le site**
   ```bash
   cd "/Users/qm/Library/CloudStorage/OneDrive-EcolesGaliléoGlobalEducationFrance/CHC - Code/Interligues U14 - octobre 2025"
   flyctl deploy
   ```

4. **Votre site sera accessible à** : `https://interligues-u14.fly.dev`

### Avec GitHub Pages
1. Pousse le code sur GitHub (déjà fait ✅)
2. Active GitHub Pages dans les paramètres du repository
3. Le site sera accessible à `https://quentinmd.github.io/interligues-u14`

### Avec Netlify
1. Connecte ton repository GitHub
2. Déploie directement depuis Netlify
3. Ajoute les variables d'environnement si nécessaire

### Avec Vercel
1. Importe ton repository sur Vercel
2. Le site se déploiera automatiquement
3. Réserve les domaines personnalisés si souhaité

## URL de l'API
L'API est hébergée sur : `https://api-ffhockey-sur-gazon.fly.dev`
