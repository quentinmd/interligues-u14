# 🏑 Interlligues U14 - Hockey sur Gazon

![Badge License](https://img.shields.io/badge/License-MIT-blue.svg)
![Badge Status](https://img.shields.io/badge/Status-Active-green.svg)

Site web pour répertorier les matchs des interlligues U14 de hockey sur gazon du 27 au 30 octobre 2025.

## 📋 Fonctionnalités

✅ **Affichage des matchs** - Filles et Garçons séparés
✅ **Recherche et filtres** - Trouvez facilement les matchs de votre équipe
✅ **Récupération en temps réel** - Données depuis l'API FFHockey
✅ **Classement automatique** - Suivi du classement des filles
✅ **Tri chronologique** - Matchs triés par date et heure
✅ **Design responsive** - Fonctionne sur desktop, tablette et mobile
✅ **Statuts des matchs** - À venir / En cours / Terminé
✅ **Interface intuitive** - Facilité d'utilisation maximale

## 🚀 Utilisation

### Option 1 : Ouvrir directement le fichier
1. Ouvrez `index.html` dans votre navigateur web préféré
2. Les matchs se chargeront automatiquement

### Option 2 : Serveur local (recommandé)
```bash
# Avec Python 3
python -m http.server 8000

# Avec Node.js (si vous avez http-server installé)
http-server

# Avec PHP
php -S localhost:8000
```

Puis ouvrez `http://localhost:8000` dans votre navigateur.

## 📊 Structure du projet

```
interligues-u14/
├── index.html      # Structure HTML du site
├── style.css       # Styles CSS et design responsive
├── script.js       # Logique JavaScript et récupération API
├── README.md       # Documentation du projet
├── LICENSE         # Licence MIT
└── .gitignore      # Fichiers à ignorer par git
```

## 🔗 API Utilisée

**Base URL** : `https://api-ffhockey-sur-gazon.fly.dev/api/v1`

### Endpoints
- **Matchs Filles** : `/interligues-u14-filles/matchs`
- **Matchs Garçons** : `/interligues-u14-garcons/matchs`
- **Classement Filles** : `/interligues-u14-filles/classement`

## 🎨 Personalisations possibles

### Modifier les couleurs
Éditer les variables de couleur dans `style.css`:
- `#667eea` - Couleur primaire (violet)
- `#764ba2` - Couleur secondaire (violet foncé)

### Ajouter des logos ou images
Modifier le fichier `index.html` pour ajouter des assets visuels

### Filtrer par équipe
Modifier la fonction `filterMatchesByDate()` dans `script.js` pour ajouter des filtres personnalisés

## ⚠️ Notes importantes

- Le site récupère les données depuis une API externe
- Les données se chargent automatiquement au démarrage
- En cas d'erreur API, un message d'erreur s'affiche
- Le site fonctionne mieux avec une connexion internet active

## 📝 Détails techniques

- **Langage**: HTML5, CSS3, JavaScript (ES6+)
- **Pas de dépendances** - Pur vanilla JavaScript
- **CORS**: L'API doit supporter les requêtes CORS (cross-origin)
- **Compatibilité**: Tous les navigateurs modernes (Chrome, Firefox, Safari, Edge)

## 🔧 Dépannage

### Les matchs ne s'affichent pas
1. Vérifiez votre connexion internet
2. Vérifiez la console du navigateur (F12) pour voir les erreurs
3. Vérifiez que l'API est accessible
4. Vérifiez que les données existent pour les dates 27-30 octobre 2025

### CORS Error
Si vous recevez une erreur CORS, assurez-vous que l'API est correctement configurée pour accepter les requêtes cross-origin.

## 📞 Support

Pour toute question ou problème, consultez la structure du code ou les logs du navigateur (F12).

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🎯 Roadmap

- [ ] Ajouter classement garçons
- [ ] Notifications temps réel des matchs
- [ ] Export des données en CSV/PDF
- [ ] Application mobile
- [ ] Système de favoris équipes

