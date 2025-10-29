// script-firebase.js
// Version Firebase V2 du site Interligues U14
// Utilise Firestore au lieu de l'API pour les données

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs,
    doc,
    getDoc,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// ==================== INITIALISATION FIREBASE ====================

const firebaseConfig = {
    apiKey: "AIzaSyDjIQvTpQwo-CZUWDqsu84s1P0DT--kIA8",
    authDomain: "interligues-u14-v2.firebaseapp.com",
    projectId: "interligues-u14-v2",
    storageBucket: "interligues-u14-v2.appspot.com",
    messagingSenderId: "683776458153",
    appId: "1:683776458153:web:93e97983e74d0f69ec98b8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("✅ Firebase initialisé");

// ==================== VARIABLES GLOBALES ====================

let allMatches = {
    filles: [],
    garcons: [],
    garcons_poule_a: [],
    garcons_poule_b: []
};

let currentPhaseId = null;

// ==================== UTILITAIRES ====================

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
}

function formatTime(dateTimeString) {
    try {
        const date = new Date(dateTimeString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch {
        return dateTimeString;
    }
}

function getMatchStatus(match) {
    if (match.statut === 'FINISHED') {
        return 'finished';
    } else if (match.statut === 'LIVE') {
        return 'live';
    }
    return 'scheduled';
}

function getStatusText(status) {
    const statusMap = {
        'finished': 'Terminé',
        'live': 'En cours',
        'scheduled': 'À venir'
    };
    return statusMap[status] || 'À venir';
}

function getStatusClass(status) {
    return `status-${status}`;
}

function isMatchOngoing(dateStr) {
    if (!dateStr) return false;
    
    const matchDateTime = new Date(dateStr);
    const now = new Date();
    const matchDuration = 45 * 60 * 1000;
    const matchEnd = new Date(matchDateTime.getTime() + matchDuration);
    
    return now >= matchDateTime && now <= matchEnd;
}

// ==================== FIRESTORE ====================

/**
 * Charger toutes les phases depuis Firestore
 */
async function getPhases(category) {
    try {
        const collectionName = category === 'filles' ? 'phases_filles' : 'phases_garcons';
        const q = query(collection(db, collectionName), orderBy("ordre", "asc"));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error(`Erreur chargement phases ${category}:`, error);
        return [];
    }
}

/**
 * Charger les poules d'une phase
 */
async function getPoules(category, phaseId) {
    try {
        const collectionName = category === 'filles' ? 'phases_filles' : 'phases_garcons';
        const poulesRef = collection(db, collectionName, phaseId, "poules");
        const q = query(poulesRef, orderBy("ordre", "asc"));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error(`Erreur chargement poules:`, error);
        return [];
    }
}

/**
 * Charger tous les matchs d'une catégorie
 */
async function getMatchs(category) {
    try {
        const collectionName = category === 'filles' ? 'matchs_filles' : 'matchs_garcons';
        const q = query(collection(db, collectionName), orderBy("date", "asc"));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error(`Erreur chargement matchs ${category}:`, error);
        return [];
    }
}

/**
 * S'abonner aux mises à jour en temps réel
 */
function subscribeToMatches(category, callback) {
    try {
        const collectionName = category === 'filles' ? 'matchs_filles' : 'matchs_garcons';
        const q = query(collection(db, collectionName), orderBy("date", "asc"));
        
        return onSnapshot(q, (snapshot) => {
            const matchs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(matchs);
        }, (error) => {
            console.error('Erreur listener:', error);
        });
    } catch (error) {
        console.error('Erreur subscription:', error);
    }
}

// ==================== AFFICHAGE ====================

/**
 * Créer une carte match
 */
function createMatchCard(match) {
    const card = document.createElement('div');
    card.className = 'match-card';
    
    const status = getMatchStatus(match);
    const statusClass = getStatusClass(status);
    const statusText = getStatusText(status);
    
    // Ajouter classe pour match en cours
    if (isMatchOngoing(match.date)) {
        card.classList.add('ongoing-match');
    }
    
    const score1 = match.score_domicile || '-';
    const score2 = match.score_exterieur || '-';
    const team1 = match.equipe_domicile || 'À déterminer';
    const team2 = match.equipe_exterieur || 'À déterminer';
    
    card.innerHTML = `
        <div class="match-header">
            <div class="match-status ${statusClass}">${statusText}</div>
            <div class="match-date">${formatDate(match.date)} - ${formatTime(match.date)}</div>
        </div>
        <div class="match-body">
            <div class="team team1">
                <div class="team-name">${team1}</div>
                <div class="team-score">${score1}</div>
            </div>
            <div class="vs">vs</div>
            <div class="team team2">
                <div class="team-name">${team2}</div>
                <div class="team-score">${score2}</div>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Afficher les matchs pour une phase
 */
async function displayMatchesForPhase(category, phaseId) {
    try {
        console.log(`📌 Affichage matchs pour phase: ${phaseId} (${category})`);
        
        const poules = await getPoules(category, phaseId);
        console.log(`🔍 Poules trouvées: ${poules.length}`, poules);
        
        const container = category === 'filles' 
            ? document.getElementById('matches-filles')
            : document.getElementById('matches-garcons');
        
        if (!container) {
            console.error(`Conteneur non trouvé pour ${category}`);
            return;
        }
        
        container.innerHTML = '';
        let totalMatches = 0;
        
        for (const poule of poules) {
            console.log(`📋 Poule: ${poule.libelle}`, poule);
            
            const pouleSection = document.createElement('div');
            pouleSection.className = 'poule-section';
            
            const pouleTitle = document.createElement('h3');
            pouleTitle.className = 'poule-title';
            pouleTitle.textContent = poule.libelle;
            pouleSection.appendChild(pouleTitle);
            
            const matchesGrid = document.createElement('div');
            matchesGrid.className = 'matches-grid';
            
            const rencontres = poule.rencontres || [];
            console.log(`🎯 Rencontres trouvées: ${rencontres.length}`);
            
            for (const match of rencontres) {
                const card = createMatchCard(match);
                matchesGrid.appendChild(card);
                totalMatches++;
            }
            
            pouleSection.appendChild(matchesGrid);
            container.appendChild(pouleSection);
        }
        
        console.log(`✅ Total de matchs affichés: ${totalMatches}`);
        
        // Masquer le chargement
        const loadingEl = category === 'filles'
            ? document.getElementById('loading-filles')
            : document.getElementById('loading-garcons');
        if (loadingEl) loadingEl.style.display = 'none';
        
    } catch (error) {
        console.error(`Erreur affichage matchs ${category}:`, error);
        showError(`Erreur lors du chargement des matchs ${category}`);
    }
}

/**
 * Afficher les boutons de phase
 */
async function displayPhaseButtons(category) {
    try {
        const phases = await getPhases(category);
        
        const containerParentId = category === 'filles'
            ? 'phases-container-filles'
            : 'phases-container';
        
        const containerParent = document.getElementById(containerParentId);
        if (!containerParent) return;
        
        // Vider et recréer le contenu
        containerParent.innerHTML = '<div class="phases-label">Phase:</div>';
        
        const buttonsWrapper = document.createElement('div');
        buttonsWrapper.className = 'phases-buttons';
        
        for (const phase of phases) {
            const btn = document.createElement('button');
            btn.className = 'phase-btn';
            btn.textContent = phase.libelle;
            btn.onclick = async () => {
                // Mettre en avant le bouton actif
                containerParent.querySelectorAll('.phase-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                
                // Afficher les matchs de cette phase
                currentPhaseId = phase.id;
                await displayMatchesForPhase(category, phase.id);
            };
            
            buttonsWrapper.appendChild(btn);
        }
        
        containerParent.appendChild(buttonsWrapper);
        
        // Afficher le premier bouton/phase par défaut
        if (phases.length > 0) {
            const firstBtn = buttonsWrapper.querySelector('.phase-btn');
            if (firstBtn) {
                firstBtn.classList.add('active');
                currentPhaseId = phases[0].id;
                await displayMatchesForPhase(category, phases[0].id);
            }
        }
        
        containerParent.style.display = 'flex';
        
    } catch (error) {
        console.error(`Erreur affichage phases ${category}:`, error);
    }
}

/**
 * Charger les matchs filles avec phases
 */
async function loadFillesWithPhases() {
    try {
        const loadingEl = document.getElementById('loading-filles');
        if (loadingEl) loadingEl.style.display = 'block';
        
        console.log("📥 Chargement matchs filles depuis Firebase...");
        
        await displayPhaseButtons('filles');
        
        // S'abonner aux mises à jour temps réel
        subscribeToMatches('filles', (matchs) => {
            console.log("🔄 Mise à jour filles:", matchs.length, "matchs");
            allMatches.filles = matchs;
        });
        
        console.log("✅ Filles chargées");
        
    } catch (error) {
        console.error('Erreur filles:', error);
        showError('Erreur lors du chargement des matchs filles');
    }
}

/**
 * Charger les matchs garçons avec phases et poules
 */
async function loadGarconsWithPoules() {
    try {
        const loadingEl = document.getElementById('loading-garcons');
        if (loadingEl) loadingEl.style.display = 'block';
        
        console.log("📥 Chargement matchs garçons depuis Firebase...");
        
        await displayPhaseButtons('garcons');
        
        // S'abonner aux mises à jour temps réel
        subscribeToMatches('garcons', (matchs) => {
            console.log("🔄 Mise à jour garçons:", matchs.length, "matchs");
            allMatches.garcons = matchs;
        });
        
        console.log("✅ Garçons chargés");
        
    } catch (error) {
        console.error('Erreur garçons:', error);
        showError('Erreur lors du chargement des matchs garçons');
    }
}

/**
 * Charger et afficher le classement des filles depuis l'API
 */
async function updateClassement() {
    const classementContainer = document.getElementById('classement-filles');
    
    try {
        const API_BASE_URL = 'https://api-ffhockey-sur-gazon.fly.dev/api/v1';
        const response = await fetch(`${API_BASE_URL}/interligues-u14-filles/classement`);
        
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }

        const data = await response.json();
        
        // Vérifier la structure de la réponse
        let classement = Array.isArray(data) ? data : data.data || data.classement || [];

        if (classement.length === 0) {
            classementContainer.innerHTML = '<p class="loading">Aucun match terminé pour le moment. Le classement s\'affichera dès que des matchs seront terminés.</p>';
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Rang</th>
                        <th>Équipe</th>
                        <th>J</th>
                        <th>G</th>
                        <th>N</th>
                        <th>P</th>
                        <th>PF</th>
                        <th>PC</th>
                        <th>Diff</th>
                        <th>Pts</th>
                    </tr>
                </thead>
                <tbody>
        `;

        classement.forEach((equipe, index) => {
            let medal = '';
            if (index === 0) medal = '🥇';
            else if (index === 1) medal = '🥈';
            else if (index === 2) medal = '🥉';

            const nomEquipe = equipe.nom || equipe.equipe || equipe.team || 'Équipe';
            const joues = equipe.joues || equipe.matches_joues || 0;
            const gagnees = equipe.gagnees || equipe.wins || 0;
            const nulles = equipe.nulles || equipe.draws || 0;
            const perdues = equipe.perdues || equipe.losses || 0;
            const pointsPour = equipe.points_pour || equipe.points_for || equipe.buts_pour || 0;
            const pointsContre = equipe.points_contre || equipe.points_against || equipe.buts_contre || 0;
            const difference = pointsPour - pointsContre;
            const pointsClassement = equipe.points || equipe.pts || (gagnees * 3) + nulles;

            html += `
                <tr>
                    <td class="classement-rank">${medal || index + 1}</td>
                    <td class="classement-team">${nomEquipe}</td>
                    <td class="classement-stats">${joues}</td>
                    <td class="classement-stats">${gagnees}</td>
                    <td class="classement-stats">${nulles}</td>
                    <td class="classement-stats">${perdues}</td>
                    <td class="classement-stats">${pointsPour}</td>
                    <td class="classement-stats">${pointsContre}</td>
                    <td class="classement-stats">${difference > 0 ? '+' : ''}${difference}</td>
                    <td class="classement-stats"><strong>${pointsClassement}</strong></td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        classementContainer.innerHTML = html;

    } catch (error) {
        console.error('Erreur lors du chargement du classement:', error);
        classementContainer.innerHTML = '<p class="loading">Aucun match terminé pour le moment. Le classement s\'affichera dès que des matchs seront terminés.</p>';
    }
}

/**
 * Charger les matchs selon la catégorie
 */
async function loadMatches(type) {
    try {
        if (type === 'filles') {
            await loadFillesWithPhases();
        } else if (type === 'garcons') {
            await loadGarconsWithPoules();
        } else if (type === 'classement-filles') {
            await updateClassement();
        }
    } catch (error) {
        console.error('Erreur loadMatches:', error);
        showError('Erreur lors du chargement des données');
    }
}

/**
 * Afficher un message d'erreur
 */
function showError(message) {
    const errorEl = document.getElementById('error-message');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }
}

// ==================== INITIALISATION ====================

// Ajouter des écouteurs aux boutons de catégorie
document.addEventListener('DOMContentLoaded', () => {
    const fillesBtn = document.getElementById('btn-filles');
    const garconsBtn = document.getElementById('btn-garcons');
    const classementBtn = document.getElementById('btn-classement');
    
    // Fonction pour gérer les clics sur les boutons de catégorie
    const handleCategoryClick = (type) => {
        // Masquer toutes les sections
        document.getElementById('section-filles')?.classList.remove('active');
        document.getElementById('section-garcons')?.classList.remove('active');
        document.getElementById('section-classement')?.classList.remove('active');
        
        // Retirer active de tous les boutons
        [fillesBtn, garconsBtn, classementBtn].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        
        // Afficher la section et marquer le bouton comme actif
        if (type === 'filles') {
            document.getElementById('section-filles')?.classList.add('active');
            if (fillesBtn) fillesBtn.classList.add('active');
            loadMatches('filles');
        } else if (type === 'garcons') {
            document.getElementById('section-garcons')?.classList.add('active');
            if (garconsBtn) garconsBtn.classList.add('active');
            loadMatches('garcons');
        } else if (type === 'classement-filles') {
            document.getElementById('section-classement')?.classList.add('active');
            if (classementBtn) classementBtn.classList.add('active');
            loadMatches('classement-filles');
        }
    };
    
    if (fillesBtn) {
        fillesBtn.addEventListener('click', () => handleCategoryClick('filles'));
    }
    if (garconsBtn) {
        garconsBtn.addEventListener('click', () => handleCategoryClick('garcons'));
    }
    if (classementBtn) {
        classementBtn.addEventListener('click', () => handleCategoryClick('classement-filles'));
    }
    
    // Charger les FILLES par défaut
    handleCategoryClick('filles');
});

// Exporter pour utilisation externe si nécessaire
window.loadMatches = loadMatches;
window.displayMatchesForPhase = displayMatchesForPhase;
