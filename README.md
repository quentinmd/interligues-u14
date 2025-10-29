# 🏑 Interlligues U14 - Hockey sur Gazon

![Badge License](https://img.shields.io/badge/License-MIT-blue.svg)
![Badge Status](https://img.shields.io/badge/Status-Active-green.svg)
![Badge Firebase](https://img.shields.io/badge/Backend-Firebase%20V2-orange.svg)

Site web pour répertorier les matchs des interlligues U14 de hockey sur gazon du 27 au 30 octobre 2025.

## 📋 Fonctionnalités

✅ **Affichage des matchs** - Filles et Garçons séparés
✅ **Recherche et filtres** - Trouvez facilement les matchs de votre équipe
✅ **Backend Firebase** - Données stockées dans Firestore Firestore avec sync automatique
✅ **API V1 (Original)** - Version originale avec API direct toujours disponible
✅ **Tri chronologique** - Matchs triés par date et heure
✅ **Design responsive** - Fonctionne sur desktop, tablette et mobile
✅ **Statuts des matchs** - À venir / En cours / Terminé
✅ **Interface intuitive** - Facilité d'utilisation maximale
✅ **Synchronisation automatique** - Cloud Scheduler synce les données chaque heure

## 🚀 Utilisation

### Accès direct au site en ligne
**🌐 V1 API** : https://interligues-u14-octobre-2025.fly.dev/ (Original, API)
**⚡ V2 Firebase** : https://interligues-u14-octobre-2025.fly.dev/index-firebase.html (Nouveau, Firebase - Plus rapide!)

### Développement local
Ouvrez `index.html` (V1 API) ou `index-firebase.html` (V2 Firebase) dans votre navigateur, ou utilisez un serveur local :

```bash
# Avec Python 3
python -m http.server 8000

# Avec Node.js (http-server)
http-server

# Avec PHP
php -S localhost:8000
```

## 📊 Structure du projet

```
interligues-u14/
├── index.html              # V1 API - Structure originale
├── index-firebase.html     # V2 Firebase - Nouvelle version
├── style.css               # Styles CSS et design responsive (partagés)
├── script.js               # Logique API V1
├── script-firebase.js      # Logique Firebase V2
├── firebaseConfig.js       # Configuration Firebase
├── firebaseService.js      # Service réutilisable Firebase
├── functions/              # Cloud Functions
│   ├── index.js           # Sync automatique via Cloud Scheduler
│   └── package.json       # Dépendances Node.js
├── README.md              # Documentation du projet
├── LICENSE                # Licence MIT
└── .gitignore             # Fichiers à ignorer par git
```

## 🔗 API Utilisée (V1)

**Base URL** : `https://api-ffhockey-sur-gazon.fly.dev/api/v1`

### Endpoints
- **Matchs Filles** : `/interligues-u14-filles/matchs`
- **Matchs Garçons** : `/interligues-u14-garcons/matchs`
- **Classement Filles** : `/interligues-u14-filles/classement`

## 🔥 Firebase V2 (Nouveau!)

### Architecture
- **Frontend** : HTML/CSS/JavaScript vanilla avec SDK Firebase CDN
- **Backend** : Firestore Firestore pour le stockage des données
- **Sync** : Cloud Functions + Cloud Scheduler pour synchronisation automatique
- **Collections** : `matchs_filles`, `matchs_garcons`, `phases_filles`, `phases_garcons`

### Avantages V2 Firebase
- ⚡ **Plus rapide** - Données en cache local, latence 50-100ms
- 🔄 **Sync automatique** - Cloud Scheduler met à jour les données toutes les heures
- 📱 **Offline ready** - Peut fonctionner partiellement sans connexion
- 🛡️ **Sécurisé** - Firestore rules restrictives en production

### Sync Automatique
Les Cloud Functions synchronisent les données depuis l'API FFHockey vers Firebase :
- **Triggers** : Chaque heure via Cloud Scheduler
- **Endpoint manuel** : POST `https://us-central1-interligues-u14-v2.cloudfunctions.net/syncData`
- **Logs** : Consultable dans Firebase Console

## 🎨 Personalisations possibles

### Modifier les couleurs
Éditer les variables de couleur dans `style.css`:
- `#667eea` - Couleur primaire (violet)
- `#764ba2` - Couleur secondaire (violet foncé)

### Ajouter des logos ou images
Modifier le fichier `index.html` ou `index-firebase.html` pour ajouter des assets visuels

### Filtrer par équipe
Modifier la fonction `applyFilter()` dans `script.js` ou `script-firebase.js` pour ajouter des filtres personnalisés

## ⚠️ Notes importantes

- **V1 (API)** : Récupère les données directement de l'API FFHockey
- **V2 (Firebase)** : Récupère les données de Firestore avec sync automatique
- Les données se chargent automatiquement au démarrage
- En cas d'erreur, un message d'erreur s'affiche
- Le site fonctionne mieux avec une connexion internet active

## 📝 Détails techniques

- **Langage**: HTML5, CSS3, JavaScript (ES6+)
- **Frontend** : Vanilla JavaScript (pas de framework)
- **Backend** : Firebase Firestore + Cloud Functions
- **CDN** : Firebase SDK 11.0.0
- **Pas de dépendances frontend** - Pur vanilla JavaScript
- **CORS**: L'API doit supporter les requêtes CORS (cross-origin)
- **Compatibilité**: Tous les navigateurs modernes (Chrome, Firefox, Safari, Edge)

## 🔧 Dépannage

### Les matchs ne s'affichent pas (V1)
1. Vérifiez votre connexion internet
2. Vérifiez la console du navigateur (F12) pour voir les erreurs
3. Vérifiez que l'API est accessible
4. Vérifiez que les données existent pour les dates 27-30 octobre 2025

### Les matchs ne s'affichent pas (V2 Firebase)
1. Vérifiez que les données ont été importées dans Firestore
2. Vérifiez la configuration Firebase dans `firebaseConfig.js`
3. Vérifiez les logs Firebase Console

### CORS Error
Si vous recevez une erreur CORS, assurez-vous que l'API est correctement configurée pour accepter les requêtes cross-origin.

## 📞 Support

Pour toute question ou problème, consultez la structure du code ou les logs du navigateur (F12).

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🎯 Roadmap

- [x] V2 Firebase avec Firestore
- [x] Cloud Functions pour sync automatique
- [x] Design responsive optimisé
- [ ] Ajouter classement garçons
- [ ] Notifications temps réel des matchs
- [ ] Export des données en CSV/PDF
- [ ] Application mobile
- [ ] Système de favoris équipes

