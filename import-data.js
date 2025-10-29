// import-data.js
// Script pour importer les données de l'API actuelle vers Firebase Firestore
// À exécuter une seule fois pour peupler la base Firebase

import FirebaseService from './firebaseService.js';

const API_BASE = 'https://api-ffhockey-sur-gazon.fly.dev/api/v1';

class DataImporter {
    /**
     * Charger les phases depuis l'API
     */
    static async getPhasesFromAPI(category) {
        try {
            const endpoint = `/interligues-u14-${category}/phases`;
            console.log(`📥 Chargement des phases ${category}...`);
            
            const response = await fetch(`${API_BASE}${endpoint}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            console.log(`✅ ${data.length} phases ${category} chargées`);
            return data;
        } catch (error) {
            console.error(`❌ Erreur chargement phases ${category}:`, error);
            return [];
        }
    }

    /**
     * Charger les poules d'une phase depuis l'API
     */
    static async getPoulesFromAPI(category, phaseId) {
        try {
            const endpoint = `/interligues-u14-${category}/poules/${phaseId}`;
            console.log(`📥 Chargement des poules pour phase ${phaseId}...`);
            
            const response = await fetch(`${API_BASE}${endpoint}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            console.log(`✅ ${data.length} poule(s) pour phase ${phaseId}`);
            return data;
        } catch (error) {
            console.error(`❌ Erreur chargement poules ${phaseId}:`, error);
            return [];
        }
    }

    /**
     * Charger les matchs pour une poule depuis l'API
     */
    static async getMatchsFromAPI(category, pouleType) {
        try {
            const endpoint = `/interligues-u14-${category}-poule-${pouleType}/matchs`;
            console.log(`📥 Chargement des matchs ${category} poule ${pouleType}...`);
            
            const response = await fetch(`${API_BASE}${endpoint}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            console.log(`✅ ${data.length} matchs chargés pour ${category} poule ${pouleType}`);
            return data;
        } catch (error) {
            console.error(`❌ Erreur chargement matchs ${category} poule ${pouleType}:`, error);
            return [];
        }
    }

    /**
     * Importer tous les matchs pour une catégorie
     */
    static async importMatchsForCategory(category) {
        try {
            console.log(`\n🔄 === IMPORT MATCHS ${category.toUpperCase()} ===`);
            
            const allMatchs = [];
            
            // Charger matchs Poule A
            const matchsA = await this.getMatchsFromAPI(category, 'a');
            allMatchs.push(...matchsA.map(m => ({
                ...m,
                poule: 'A',
                category: category
            })));
            
            // Charger matchs Poule B
            const matchsB = await this.getMatchsFromAPI(category, 'b');
            allMatchs.push(...matchsB.map(m => ({
                ...m,
                poule: 'B',
                category: category
            })));
            
            if (allMatchs.length > 0) {
                await FirebaseService.saveMatchs(category, allMatchs);
                console.log(`✅ ${allMatchs.length} matchs ${category} importés`);
            }
            
            return allMatchs;
        } catch (error) {
            console.error(`❌ Erreur import matchs ${category}:`, error);
            return [];
        }
    }

    /**
     * Importer toutes les phases et poules pour une catégorie
     */
    static async importPhasesForCategory(category) {
        try {
            console.log(`\n🔄 === IMPORT PHASES ${category.toUpperCase()} ===`);
            
            const phases = await this.getPhasesFromAPI(category);
            
            for (const phase of phases) {
                // Sauvegarder la phase
                const phaseId = phase.phase_id || phase.id;
                console.log(`\n📌 Phase: ${phase.libelle} (${phaseId})`);
                
                await FirebaseService.savePhase(category, {
                    phase_id: phaseId,
                    libelle: phase.libelle,
                    ordre: phase.ordre || 0,
                    date_debut: phase.date_debut,
                    date_fin: phase.date_fin,
                    description: phase.description || ''
                });
                
                // Charger et sauvegarder les poules pour cette phase
                const poules = await this.getPoulesFromAPI(category, phaseId);
                
                for (const poule of poules) {
                    const pouleId = poule.poule_id || poule.id;
                    const rencontres = poule.rencontres || poule.rencontre || [];
                    
                    console.log(`   📋 Poule: ${poule.libelle} (${rencontres.length} matchs)`);
                    
                    await FirebaseService.savePoule(category, phaseId, {
                        poule_id: pouleId,
                        libelle: poule.libelle,
                        ordre: poule.ordre || 0,
                        rencontres: rencontres
                    });
                }
                
                console.log(`✅ Phase ${phase.libelle} importée avec poules`);
            }
            
            console.log(`\n✅ ${phases.length} phases ${category} importées avec succès`);
            return phases;
        } catch (error) {
            console.error(`❌ Erreur import phases ${category}:`, error);
            return [];
        }
    }

    /**
     * Lancer l'import complet
     */
    static async importAll() {
        console.log('🚀 ========== IMPORT DONNÉES FIREBASE ==========');
        console.log(`⏰ Démarrage: ${new Date().toLocaleString('fr-FR')}\n`);
        
        try {
            // Vérifier la connexion
            const isConnected = await FirebaseService.checkConnection();
            if (!isConnected) {
                throw new Error('Impossible de se connecter à Firebase');
            }
            
            // Import garçons
            await this.importPhasesForCategory('garcons');
            await this.importMatchsForCategory('garcons');
            
            // Import filles
            await this.importPhasesForCategory('filles');
            await this.importMatchsForCategory('filles');
            
            console.log('\n✅ ========== IMPORT TERMINÉ AVEC SUCCÈS ==========');
            console.log(`⏰ Fin: ${new Date().toLocaleString('fr-FR')}\n`);
            
        } catch (error) {
            console.error('\n❌ ERREUR LORS DE L\'IMPORT:', error);
            process.exit(1);
        }
    }
}

// Lancer l'import
DataImporter.importAll();
