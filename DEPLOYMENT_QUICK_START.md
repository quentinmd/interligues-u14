# 🚀 Guide Rapide - Déploiement Firebase V2

## Étape 1 : Installer Firebase CLI via npm

```bash
cd "/Users/qm/Library/CloudStorage/OneDrive-EcolesGaliléoGlobalEducationFrance/CHC - Code/Interligues U14 - octobre 2025"
npm install firebase-tools --save-dev
```

## Étape 2 : Authentifier

```bash
npx firebase login
```
(Cela ouvrira une page de login dans le navigateur)

## Étape 3 : Initialiser le projet (déjà fait, mais vérifie)

```bash
npx firebase init
```

## Étape 4 : Déployer les Cloud Functions

```bash
npx firebase deploy --only functions
```

## Alternative : Via Console Firebase (Web)

Si tu préfères ne pas utiliser CLI :

1. Va sur https://console.firebase.google.com
2. Sélectionne ton projet `interligues-u14-v2`
3. Clique sur **Functions** dans le menu gauche
4. Clique **Get Started**
5. Suis les instructions (elles vont t'installer gcloud SDK)

## Étape 5 : Configurer Cloud Scheduler (après déploiement)

1. Va sur https://console.cloud.google.com
2. Sélectionne ton projet
3. Ouvre **Cloud Scheduler** dans la barre de recherche
4. **Create Job** :
   - **Name**: `sync-hockey-data`
   - **Frequency**: `0 * * * *` (toutes les heures)
   - **Timezone**: `Europe/Paris`
   - **HTTP Target** :
     - **Method**: POST
     - **URL**: `https://us-central1-interligues-u14-v2.cloudfunctions.net/syncDataScheduled`
   - **Auth header**: Add OIDC token
   - **Service account**: compute default

5. Clique **Create**

## Résultat Final

✅ Les données se mettent à jour **automatiquement toutes les heures**
✅ **Gratuit** (2M appels/mois gratuits)
✅ Zero maintenance

## Tester manuellement

Après le déploiement, tu peux tester via :
```bash
curl -X POST https://us-central1-interligues-u14-v2.cloudfunctions.net/syncData
```

Ou regarde les logs :
```bash
npx firebase functions:log
```

---

**Questions ?** Dis-moi l'erreur exacte que tu reçois ! 🚀
