// firebaseService.js
import { db } from './firebaseConfig.js';
import { 
    collection, 
    getDocs, 
    onSnapshot, 
    doc, 
    setDoc, 
    updateDoc,
    writeBatch,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

class FirebaseService {
    // ==================== MATCHS ====================

    /**
     * Charger tous les matchs des filles
     */
    static async getMatchsFilles() {
        try {
            const q = query(collection(db, "matchs_filles"), orderBy("date", "asc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Erreur lors du chargement des matchs filles:', error);
            return [];
        }
    }

    /**
     * Charger tous les matchs des garçons
     */
    static async getMatchsGarcons() {
        try {
            const q = query(collection(db, "matchs_garcons"), orderBy("date", "asc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Erreur lors du chargement des matchs garçons:', error);
            return [];
        }
    }

    // ==================== PHASES ====================

    /**
     * Charger toutes les phases des filles
     */
    static async getPhasesFilles() {
        try {
            const q = query(collection(db, "phases_filles"), orderBy("ordre", "asc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Erreur lors du chargement des phases filles:', error);
            return [];
        }
    }

    /**
     * Charger toutes les phases des garçons
     */
    static async getPhasesGarcons() {
        try {
            const q = query(collection(db, "phases_garcons"), orderBy("ordre", "asc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Erreur lors du chargement des phases garçons:', error);
            return [];
        }
    }

    // ==================== POULES ====================

    /**
     * Charger les poules pour une phase spécifique (garçons)
     */
    static async getPoulesGarcons(phaseId) {
        try {
            const poulesRef = collection(db, "phases_garcons", phaseId, "poules");
            const q = query(poulesRef, orderBy("ordre", "asc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`Erreur lors du chargement des poules garçons (${phaseId}):`, error);
            return [];
        }
    }

    /**
     * Charger les poules pour une phase spécifique (filles)
     */
    static async getPoulesFilles(phaseId) {
        try {
            const poulesRef = collection(db, "phases_filles", phaseId, "poules");
            const q = query(poulesRef, orderBy("ordre", "asc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`Erreur lors du chargement des poules filles (${phaseId}):`, error);
            return [];
        }
    }

    // ==================== LISTENERS EN TEMPS RÉEL ====================

    /**
     * S'abonner aux matchs des filles en temps réel
     */
    static subscribeToMatchsFilles(callback) {
        const q = query(collection(db, "matchs_filles"), orderBy("date", "asc"));
        return onSnapshot(q, (snapshot) => {
            const matchs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(matchs);
        }, (error) => {
            console.error('Erreur listener matchs filles:', error);
        });
    }

    /**
     * S'abonner aux matchs des garçons en temps réel
     */
    static subscribeToMatchsGarcons(callback) {
        const q = query(collection(db, "matchs_garcons"), orderBy("date", "asc"));
        return onSnapshot(q, (snapshot) => {
            const matchs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(matchs);
        }, (error) => {
            console.error('Erreur listener matchs garçons:', error);
        });
    }

    // ==================== SAUVEGARDE DE DONNÉES ====================

    /**
     * Sauvegarder les matchs (batch)
     */
    static async saveMatchs(category, matchsData) {
        try {
            const batch = writeBatch(db);
            const collectionName = category === 'filles' ? 'matchs_filles' : 'matchs_garcons';
            
            matchsData.forEach((match, index) => {
                const docRef = doc(db, collectionName, `match_${index}_${Date.now()}`);
                batch.set(docRef, {
                    ...match,
                    lastUpdated: new Date(),
                    category: category
                });
            });
            
            await batch.commit();
            console.log(`✅ Matchs ${category} sauvegardés (${matchsData.length} matchs)`);
            return true;
        } catch (error) {
            console.error(`❌ Erreur lors de la sauvegarde des matchs ${category}:`, error);
            return false;
        }
    }

    /**
     * Mettre à jour un match spécifique (scores, statut, etc.)
     */
    static async updateMatch(category, matchId, updates) {
        try {
            const collectionName = category === 'filles' ? 'matchs_filles' : 'matchs_garcons';
            const docRef = doc(db, collectionName, matchId);
            await updateDoc(docRef, {
                ...updates,
                lastUpdated: new Date()
            });
            console.log(`✅ Match ${matchId} mis à jour`);
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour du match:', error);
            return false;
        }
    }

    /**
     * Sauvegarder une phase
     */
    static async savePhase(category, phaseData) {
        try {
            const collectionName = category === 'filles' ? 'phases_filles' : 'phases_garcons';
            const phaseId = phaseData.phase_id || phaseData.id || `phase_${Date.now()}`;
            
            const docRef = doc(db, collectionName, phaseId);
            await setDoc(docRef, {
                ...phaseData,
                lastUpdated: new Date()
            });
            console.log(`✅ Phase ${phaseId} sauvegardée`);
            return phaseId;
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde de la phase:', error);
            return null;
        }
    }

    /**
     * Sauvegarder une poule dans une phase
     */
    static async savePoule(category, phaseId, pouleData) {
        try {
            const collectionName = category === 'filles' ? 'phases_filles' : 'phases_garcons';
            const pouleId = pouleData.poule_id || pouleData.id || `poule_${Date.now()}`;
            
            const docRef = doc(db, collectionName, phaseId, "poules", pouleId);
            await setDoc(docRef, {
                ...pouleData,
                lastUpdated: new Date()
            });
            console.log(`✅ Poule ${pouleId} sauvegardée dans la phase ${phaseId}`);
            return pouleId;
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde de la poule:', error);
            return null;
        }
    }

    // ==================== SYNC DEPUIS L'API ====================

    /**
     * Synchroniser les données de l'API actuelle vers Firebase
     * @param {string} category - 'filles' ou 'garcons'
     * @param {array} matchsFromApi - Les matchs provenant de l'API
     * @param {array} phasesFromApi - Les phases provenant de l'API
     */
    static async syncFromAPI(category, matchsFromApi = [], phasesFromApi = []) {
        try {
            console.log(`🔄 Synchronisation des données ${category}...`);
            
            // Sauvegarder les matchs
            if (matchsFromApi.length > 0) {
                await this.saveMatchs(category, matchsFromApi);
            }

            // Sauvegarder les phases
            for (const phase of phasesFromApi) {
                const phaseId = await this.savePhase(category, phase);
                
                // Sauvegarder les poules de cette phase
                if (phase.poules && Array.isArray(phase.poules)) {
                    for (const poule of phase.poules) {
                        await this.savePoule(category, phaseId, poule);
                    }
                }
            }

            console.log(`✅ Synchronisation terminée pour ${category}`);
            return true;
        } catch (error) {
            console.error(`❌ Erreur lors de la synchronisation:`, error);
            return false;
        }
    }

    /**
     * Vérifier la connexion à Firebase
     */
    static async checkConnection() {
        try {
            const testRef = doc(db, "health", "check");
            await setDoc(testRef, { 
                status: "ok", 
                timestamp: new Date() 
            });
            console.log("✅ Connexion Firebase OK");
            return true;
        } catch (error) {
            console.error("❌ Erreur connexion Firebase:", error);
            return false;
        }
    }
}

export default FirebaseService;
