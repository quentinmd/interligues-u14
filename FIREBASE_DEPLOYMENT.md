# 🚀 Déploiement Firebase V2 - Interligues U14

## Installation et déploiement

### 1️⃣ Installer Firebase CLI
```bash
npm install -g firebase-tools
```

### 2️⃣ Se connecter à Firebase
```bash
firebase login
```

### 3️⃣ Installer les dépendances
```bash
cd functions
npm install
cd ..
```

### 4️⃣ Déployer les Cloud Functions
```bash
firebase deploy --only functions
```

### 5️⃣ Configurer Cloud Scheduler (automatisation horaire)

Une fois les functions déployées :

1. Va sur [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionne le projet `interligues-u14-v2`
3. Ouvre **Cloud Scheduler**
4. Clique **Create Job**
5. Configure :
   - **Name**: `sync-hockey-data`
   - **Frequency**: `0 * * * *` (toutes les heures)
   - **Timezone**: Europe/Paris
   - **HTTP Target**: 
     - URL: `https://us-central1-interligues-u14-v2.cloudfunctions.net/syncDataScheduled`
     - Method: POST
6. **Create**

### ✅ Résultat

- ✅ Les données se mettent à jour **automatiquement toutes les heures**
- ✅ Les matchs, scores, et statuts sont synchronisés en direct
- ✅ **Gratuit** (Cloud Functions: 2M appels/mois gratuit, Cloud Scheduler: gratuit)
- ✅ Zero maintenance après le setup

## Tester manuellement

```bash
# Déployer et tester localement
firebase emulators:start --only functions

# Ou appeler la fonction directement
curl -X POST https://us-central1-interligues-u14-v2.cloudfunctions.net/syncData
```

## Logs

Voir les logs des Cloud Functions :
```bash
firebase functions:log
```

## 🔄 Alternative : Firestore Realtime Sync

Si tu veux une sync **en temps réel** (toutes les minutes) :
1. Remplace la fréquence Cloud Scheduler par `*/1 * * * *` (toutes les minutes)
2. Coût reste gratuit jusqu'à 2M d'appels/mois

---

**Pour plus d'infos** : https://firebase.google.com/docs/functions
