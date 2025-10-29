// functions/index.js
// Cloud Function pour synchroniser les données de l'API vers Firestore
// Déployer avec: firebase deploy --only functions

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const https = require("https");

admin.initializeApp();
const db = admin.firestore();

const API_BASE = "https://api-ffhockey-sur-gazon.fly.dev/api/v1";

/**
 * Récupérer les données depuis l'API
 */
async function fetchFromAPI(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${endpoint}`;
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json.data || json);
          } catch (e) {
            reject(new Error(`Erreur parsing JSON: ${e.message}`));
          }
        });
      })
      .on("error", reject);
  });
}

/**
 * Synchroniser les matchs garçons
 */
async function syncMatchsGarcons() {
  console.log("📥 Sync matchs garçons...");
  
  const matchsA = await fetchFromAPI("/interligues-u14-garcons-poule-a/matchs");
  const matchsB = await fetchFromAPI("/interligues-u14-garcons-poule-b/matchs");
  
  const allMatchs = [
    ...matchsA.map((m) => ({ ...m, poule: "A" })),
    ...matchsB.map((m) => ({ ...m, poule: "B" })),
  ];

  // Effacer et remplir la collection
  const collectionRef = db.collection("matchs_garcons");
  const existingDocs = await collectionRef.get();
  
  // Supprimer les anciens docs
  const batch = db.batch();
  existingDocs.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  // Ajouter les nouveaux
  const batch2 = db.batch();
  allMatchs.forEach((match, index) => {
    const docRef = collectionRef.doc(`match_${index}_${Date.now()}`);
    batch2.set(docRef, {
      ...match,
      lastUpdated: new Date(),
      category: "garcons",
    });
  });
  await batch2.commit();

  console.log(`✅ ${allMatchs.length} matchs garçons synchronisés`);
  return allMatchs.length;
}

/**
 * Synchroniser les matchs filles
 */
async function syncMatchsFilles() {
  console.log("📥 Sync matchs filles...");
  
  const matchsFilles = await fetchFromAPI("/interligues-u14-filles/matchs");

  // Effacer et remplir la collection
  const collectionRef = db.collection("matchs_filles");
  const existingDocs = await collectionRef.get();
  
  // Supprimer les anciens docs
  const batch = db.batch();
  existingDocs.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  // Ajouter les nouveaux
  const batch2 = db.batch();
  matchsFilles.forEach((match, index) => {
    const docRef = collectionRef.doc(`match_${index}_${Date.now()}`);
    batch2.set(docRef, {
      ...match,
      lastUpdated: new Date(),
      category: "filles",
    });
  });
  await batch2.commit();

  console.log(`✅ ${matchsFilles.length} matchs filles synchronisés`);
  return matchsFilles.length;
}

/**
 * Synchroniser les phases et poules
 */
async function syncPhasesAndPoules() {
  console.log("📥 Sync phases et poules...");
  
  for (const category of ["garcons", "filles"]) {
    const collectionName = category === "garcons" ? "phases_garcons" : "phases_filles";
    
    // Récupérer les phases
    const phases = await fetchFromAPI(`/interligues-u14-${category}/phases`);
    
    for (const phase of phases) {
      const phaseId = phase.phase_id || phase.id;
      
      // Sauvegarder la phase
      await db.collection(collectionName).doc(phaseId).set({
        phase_id: phaseId,
        libelle: phase.libelle,
        ordre: phase.ordre || 0,
        date_debut: phase.date_debut,
        date_fin: phase.date_fin,
        lastUpdated: new Date(),
      });

      // Récupérer et sauvegarder les poules
      const poules = await fetchFromAPI(`/interligues-u14-${category}/poules/${phaseId}`);
      
      for (const poule of poules) {
        const pouleId = poule.poule_id || poule.id;
        const rencontres = poule.rencontres || poule.rencontre || [];
        
        await db
          .collection(collectionName)
          .doc(phaseId)
          .collection("poules")
          .doc(pouleId)
          .set({
            poule_id: pouleId,
            libelle: poule.libelle,
            ordre: poule.ordre || 0,
            rencontres: rencontres,
            lastUpdated: new Date(),
          });
      }
      
      console.log(`✅ Phase ${phase.libelle} synchronisée`);
    }
  }
}

/**
 * Cloud Function principale - Synchronisation complète
 * Déclenche à: https://us-central1-interligues-u14-v2.cloudfunctions.net/syncData
 */
exports.syncData = functions.https.onRequest(async (req, res) => {
  try {
    console.log("🔄 Début de la synchronisation des données...");
    
    // Synchroniser phases et poules d'abord
    await syncPhasesAndPoules();
    
    // Puis les matchs
    const garconsCount = await syncMatchsGarcons();
    const fillesCount = await syncMatchsFilles();
    
    const message = `✅ Synchronisation réussie: ${garconsCount} matchs garçons, ${fillesCount} matchs filles`;
    console.log(message);
    
    res.json({
      success: true,
      message: message,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Cloud Function schedulée - Sync toutes les heures
 * Crée un Cloud Scheduler job qui appelle syncData chaque heure
 */
exports.syncDataScheduled = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async (context) => {
    try {
      console.log("⏰ Synchronisation programmée à", new Date().toISOString());
      
      await syncPhasesAndPoules();
      const garconsCount = await syncMatchsGarcons();
      const fillesCount = await syncMatchsFilles();
      
      console.log(
        `✅ Sync programmée réussie: ${garconsCount} garçons, ${fillesCount} filles`
      );
    } catch (error) {
      console.error("❌ Erreur sync programmée:", error);
      throw error;
    }
  });
