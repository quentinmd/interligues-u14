// Configuration
const API_BASE_URL = 'https://api-ffhockey-sur-gazon.fly.dev/api/v1';
const ENDPOINTS = {
    filles_matchs: '/interligues-u14-filles/matchs',
    filles_phases: '/interligues-u14-filles/phases',
    filles_poules: '/interligues-u14-filles/poules',
    garcons_matchs: '/interligues-u14-garcons/matchs',
    garcons_poule_a: '/interligues-u14-garcons-poule-a/matchs',
    garcons_poule_b: '/interligues-u14-garcons-poule-b/matchs',
    garcons_phases: '/interligues-u14-garcons/phases',
    garcons_poules: '/interligues-u14-garcons/poules',
    filles_classement: '/interligues-u14-filles/classement'
};

// Stockage des matchs pour le calcul du classement
let allMatches = {
    filles: [],
    filles_phases: {},
    garcons: [],
    garcons_poule_a: [],
    garcons_poule_b: [],
    garcons_phases: {}
};

// Phases actuelles
let currentPhaseId = null;

// Éléments du DOM
const matchesFillesContainer = document.getElementById('matches-filles');
const matchesGarconsContainer = document.getElementById('matches-garcons');
const loadingFilles = document.getElementById('loading-filles');
const loadingGarcons = document.getElementById('loading-garcons');
const errorMessage = document.getElementById('error-message');

// Fonction pour formater la date
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

// Fonction pour formater l'heure
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

// Fonction pour déterminer le statut du match
function getMatchStatus(match) {
    // Vérifier le champ 'statut' qui existe dans l'API
    if (match.statut === 'FINISHED') {
        return 'finished';
    } else if (match.statut === 'LIVE') {
        return 'live';
    }
    return 'scheduled';
}

// Fonction pour obtenir le texte du statut
function getStatusText(status) {
    const statusMap = {
        'finished': 'Terminé',
        'live': 'En cours',
        'scheduled': 'À venir'
    };
    return statusMap[status] || 'À venir';
}

// Fonction pour obtenir la classe CSS du statut
function getStatusClass(status) {
    return `status-${status}`;
}

// Fonction pour vérifier si un match est en cours
function isMatchOngoing(dateStr) {
    if (!dateStr) return false;
    
    const matchDateTime = new Date(dateStr);
    const now = new Date();
    
    // Durée du match: 2*20 min + 5 min de mi-temps = 45 minutes
    const matchDuration = 45 * 60 * 1000;
    const matchEnd = new Date(matchDateTime.getTime() + matchDuration);
    
    // Le match est en cours si maintenant est entre le début et la fin
    return now >= matchDateTime && now <= matchEnd;
}

// Fonction pour créer une carte de match
function createMatchCard(match) {
    const status = getMatchStatus(match);
    const statusText = getStatusText(status);
    const statusClass = getStatusClass(status);
    
    // Vérifier si le match est en cours
    const isOngoing = isMatchOngoing(match.date);

    // Utiliser les scores depuis l'API, sinon afficher "-"
    const scoreDomicile = match.score_domicile || '-';
    const scoreExterieur = match.score_exterieur || '-';

    const date = match.date || 'Date non disponible';
    const team1 = match.equipe_domicile || 'Équipe Domicile';
    const team2 = match.equipe_exterieur || 'Équipe Extérieur';
    
    // Récupérer la poule si elle existe
    const poule = match.poule ? `<span class="match-poule">${match.poule}</span>` : '';

    const card = document.createElement('div');
    card.className = 'match-card';
    if (isOngoing) {
        card.classList.add('ongoing');
    }
    card.style.cursor = 'pointer';
    card.innerHTML = `
        <div class="match-header">
            <span class="match-date">${formatDate(date)}</span>
            <span class="match-time">${formatTime(date)}</span>
            ${poule}
        </div>
        
        <div class="match-teams">
            <div class="team">
                <span class="team-name">${team1}</span>
                <span class="team-score">${scoreDomicile}</span>
            </div>
            <div class="team">
                <span class="team-name">${team2}</span>
                <span class="team-score">${scoreExterieur}</span>
            </div>
        </div>

        <div class="match-status ${statusClass}">${statusText}</div>
    `;

    // Stocker le rencId et attacher un écouteur de clic
    if (match.rencId) {
        card.dataset.rencId = match.rencId;
        card.addEventListener('click', () => {
            window.location.href = `match.html?rencId=${match.rencId}`;
        });
    }

    return card;
}

// Fonction pour charger les matchs
async function loadMatches(type) {
    if (type === 'garcons') {
        // Pour les garçons, charger les poules A et B + phases
        await loadGarconsWithPoules();
    } else if (type === 'filles') {
        // Pour les filles, charger avec le système de phases
        await loadFillesWithPhases();
    } else {
        const endpoint = ENDPOINTS[type === 'filles' ? 'filles_matchs' : 'garcons_matchs'];
        const containerId = type === 'filles' ? 'matches-filles' : 'matches-garcons';
        const loadingSpinnerId = type === 'filles' ? 'loading-filles' : 'loading-garcons';
        const container = document.getElementById(containerId);
        const spinner = document.getElementById(loadingSpinnerId);

        try {
            spinner.style.display = 'inline-block';
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            
            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Vérifier si les données sont un tableau
            let matches = Array.isArray(data) ? data : data.data || data.matchs || [];
            
            if (matches.length === 0) {
                container.innerHTML = '<p class="loading">Aucun match trouvé pour cette catégorie.</p>';
                return;
            }

            // Filtrer les matchs entre le 27 et 30 octobre 2025
            matches = filterMatchesByDate(matches);

            if (matches.length === 0) {
                container.innerHTML = '<p class="loading">Aucun match trouvé pour la période 27-30 octobre 2025.</p>';
                return;
            }

            // Trier les matchs par date et heure
            matches.sort((a, b) => {
                const dateA = new Date(a.date || '');
                const dateB = new Date(b.date || '');
                return dateA - dateB;
            });

            // Créer les cartes
            container.innerHTML = '';
            matches.forEach(match => {
                const card = createMatchCard(match);
                container.appendChild(card);
            });

            // Stocker les matchs pour le calcul du classement
            allMatches[type] = matches;

        } catch (error) {
            console.error(`Erreur lors du chargement des matchs ${type}:`, error);
            container.innerHTML = `<p class="loading">Erreur lors du chargement: ${error.message}</p>`;
            showError(`Impossible de charger les matchs ${type}: ${error.message}`);
        } finally {
            spinner.style.display = 'none';
            // Mettre à jour le classement après avoir chargé les matchs
            updateClassement();
        }
    }
}

// ==================== FILLES AVEC PHASES ====================

// Fonction pour charger les phases des filles
async function loadPhasesFilles() {
    try {
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.filles_phases}`);
        if (!response.ok) {
            throw new Error('Impossible de charger les phases');
        }
        
        const data = await response.json();
        // API peut retourner array ou objet avec data
        const phases = Array.isArray(data) ? data : (data.data || data.phases || []);
        return phases;
    } catch (error) {
        console.warn('Erreur lors du chargement des phases filles:', error);
        return [];
    }
}

// Fonction pour charger les poules pour une phase spécifique (filles)
async function loadPoulesForPhaseFilles(phaseId) {
    try {
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.filles_poules}/${phaseId}`);
        if (!response.ok) {
            throw new Error('Impossible de charger les poules pour cette phase');
        }
        
        const data = await response.json();
        const poules = Array.isArray(data) ? data : (data.data || data.poules || []);
        return poules;
    } catch (error) {
        console.warn(`Erreur lors du chargement des poules filles pour la phase ${phaseId}:`, error);
        return [];
    }
}

// Fonction pour charger les matchs d'une phase spécifique (filles)
async function loadMatchesForPhaseFilles(phaseId) {
    try {
        // Récupérer les poules pour cette phase
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.filles_poules}/${phaseId}`);
        
        if (!response.ok) {
            console.warn(`Impossible de charger les poules pour la phase ${phaseId}`);
            return [];
        }
        
        const data = await response.json();
        const poules = Array.isArray(data) ? data : (data.data || data.poules || []);
        
        if (!poules || poules.length === 0) {
            console.warn('Aucune poule trouvée pour cette phase');
            return [];
        }
        
        // Extraire les matchs directement du array rencontres de chaque poule
        const allPhaseMatches = [];
        for (const poule of poules) {
            const pouleName = poule.libelle || poule.nom || `Poule ${poule.poule_id}`;
            
            // Les matchs sont directement dans le array 'rencontres'
            if (poule.rencontres && Array.isArray(poule.rencontres)) {
                const matches = poule.rencontres.map(m => ({ 
                    ...m, 
                    poule: pouleName,
                    // Normaliser les champs pour la compatibilité
                    equipe1: m.equipe_domicile,
                    equipe2: m.equipe_exterieur,
                    but1: m.score_domicile,
                    but2: m.score_exterieur,
                    rencId: m.rencId
                }));
                allPhaseMatches.push(...matches);
            }
        }
        
        // Filtrer par date
        let filteredMatches = filterMatchesByDate(allPhaseMatches);
        
        // Trier par date et heure
        filteredMatches.sort((a, b) => {
            const dateA = new Date(a.date || '');
            const dateB = new Date(b.date || '');
            return dateA - dateB;
        });
        
        return filteredMatches;
        
    } catch (error) {
        console.error('Erreur lors du chargement des matchs de la phase filles:', error);
        return [];
    }
}

// Fonction pour afficher les sélecteurs de phase des filles
function displayPhaseButtonsFilles(phases) {
    const phasesContainer = document.getElementById('phases-container-filles');
    
    // Créer le conteneur s'il n'existe pas
    if (!phasesContainer) {
        const fillesSection = document.getElementById('section-filles');
        const newContainer = document.createElement('div');
        newContainer.id = 'phases-container-filles';
        newContainer.className = 'phases-container';
        
        const filterInput = fillesSection.querySelector('.filters');
        if (filterInput) {
            filterInput.insertAdjacentElement('beforebegin', newContainer);
        }
    }
    
    const container = document.getElementById('phases-container-filles');
    
    if (!phases || phases.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';
    container.innerHTML = '<div class="phases-label">Phase:</div><div class="phases-buttons" id="phases-buttons-filles"></div>';
    const phasesButtonsContainer = document.getElementById('phases-buttons-filles');
    
    phases.forEach((phase, index) => {
        const phaseId = phase.phase_id || phase.id || index;
        const phaseName = phase.libelle || phase.nom || phase.name || `Phase ${index + 1}`;
        
        const btn = document.createElement('button');
        btn.className = 'phase-btn';
        if (index === 0) {
            btn.classList.add('active');
        }
        btn.textContent = phaseName;
        btn.addEventListener('click', () => {
            document.querySelectorAll('#phases-buttons-filles .phase-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayMatchesForPhaseFilles(phaseId);
        });
        
        phasesButtonsContainer.appendChild(btn);
    });
}

// Fonction pour afficher les matchs d'une phase sélectionnée (filles)
function displayMatchesForPhaseFilles(phaseId) {
    const container = document.getElementById('matches-filles');
    const spinner = document.getElementById('loading-filles');
    
    try {
        spinner.style.display = 'inline-block';
        
        // Récupérer les matchs de cette phase depuis le stockage
        const matches = allMatches.filles_phases[phaseId] || [];
        
        if (matches.length === 0) {
            container.innerHTML = '<p class="loading">Aucun match trouvé pour cette phase. Les matchs seront ajoutés dès que les équipes seront désignées.</p>';
            return;
        }
        
        // Afficher les matchs
        container.innerHTML = '';
        matches.forEach(match => {
            const card = createMatchCard(match);
            container.appendChild(card);
        });
        
        // Mettre à jour le classement avec les matchs de cette phase
        allMatches.filles = matches;
        updateClassement();
        
    } catch (error) {
        console.error('Erreur lors de l\'affichage des matchs filles:', error);
        container.innerHTML = `<p class="loading">Erreur: ${error.message}</p>`;
    } finally {
        spinner.style.display = 'none';
    }
}

// Fonction pour charger les matchs des filles avec phases
async function loadFillesWithPhases() {
    const container = document.getElementById('matches-filles');
    const spinner = document.getElementById('loading-filles');

    try {
        spinner.style.display = 'inline-block';
        
        // Charger les matchs du championnat d'abord (endpoint principal)
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.filles_matchs}`);
        
        let allFillesPhases = [];
        let combinedChampionnatMatches = [];
        
        if (response.ok) {
            const data = await response.json();
            const matchesData = Array.isArray(data) ? data : (data.data || data.matchs || []);
            combinedChampionnatMatches = filterMatchesByDate(matchesData);
            
            // Créer une phase "Championnat" pour le stockage
            allFillesPhases.push({
                phase_id: 'championnat',
                libelle: 'Championnat (27-29 oct)',
                ordre: 1
            });
            
            allMatches.filles_phases['championnat'] = combinedChampionnatMatches;
        }
        
        // Charger les phases supplémentaires (finale)
        const allPhases = await loadPhasesFilles();
        
        if (allPhases && allPhases.length > 0) {
            // Ajouter les phases supplémentaires
            for (const phase of allPhases) {
                // Ignorer la phase "CHAMPIONNAT" déjà chargée
                if (phase.libelle !== 'CHAMPIONNAT' && phase.libelle !== 'Championnat') {
                    allFillesPhases.push(phase);
                    
                    // Charger les matchs pour cette phase
                    const phaseId = phase.phase_id || phase.id;
                    const phaseMatches = await loadMatchesForPhaseFilles(phaseId);
                    allMatches.filles_phases[phaseId] = phaseMatches;
                }
            }
        }
        
        // Afficher les sélecteurs de phase
        if (allFillesPhases.length > 0) {
            displayPhaseButtonsFilles(allFillesPhases);
        }
        
        // Afficher d'abord les matchs du championnat
        container.innerHTML = '';
        let sortedMatches = combinedChampionnatMatches.sort((a, b) => {
            const dateA = new Date(a.date || '');
            const dateB = new Date(b.date || '');
            return dateA - dateB;
        });
        
        if (sortedMatches.length === 0) {
            container.innerHTML = '<p class="loading">Aucun match trouvé pour le championnat.</p>';
        } else {
            sortedMatches.forEach(match => {
                const card = createMatchCard(match);
                container.appendChild(card);
            });
        }
        
        // Stocker tous les matchs filles
        allMatches.filles = sortedMatches;

    } catch (error) {
        console.error('Erreur lors du chargement des matchs filles:', error);
        container.innerHTML = `<p class="loading">Erreur lors du chargement: ${error.message}</p>`;
        showError(`Impossible de charger les matchs filles: ${error.message}`);
    } finally {
        spinner.style.display = 'none';
        updateClassement();
    }
}

// ==================== GARÇONS AVEC POULES ET PHASES ====================

// Fonction pour charger les phases des garçons (phases supplémentaires : 1/2 finales, finales)
async function loadPhasesGarcons() {
    try {
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.garcons_phases}`);
        if (!response.ok) {
            throw new Error('Impossible de charger les phases');
        }
        
        const phases = await response.json();
        return Array.isArray(phases) ? phases : phases.data || phases.phases || [];
    } catch (error) {
        console.warn('Erreur lors du chargement des phases garçons:', error);


// Fonction pour charger les poules pour une phase spécifique
async function loadPoulesForPhase(phaseId) {
    try {
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.garcons_poules}/${phaseId}`);
        if (!response.ok) {
            throw new Error('Impossible de charger les poules pour cette phase');
        }
        
        const data = await response.json();
        return Array.isArray(data) ? data : data.data || data.poules || [];
    } catch (error) {
        console.warn(`Erreur lors du chargement des poules pour la phase ${phaseId}:`, error);
        return [];
    }
}

// Fonction pour afficher les sélecteurs de phase (incluant les poules)
function displayPhaseButtons(poulesPhases) {
    const phasesContainer = document.getElementById('phases-container');
    const phasesButtonsContainer = document.getElementById('phases-buttons');
    
    if (!poulesPhases || poulesPhases.length === 0) {
        phasesContainer.style.display = 'none';
        return;
    }
    
    phasesContainer.style.display = 'flex';
    phasesButtonsContainer.innerHTML = '';
    
    poulesPhases.forEach((phase, index) => {
        const phaseId = phase.id || phase.phase_id || phase.poule_id || index;
        // Utiliser 'libelle' (nouveau format API) ou 'nom' (ancien format)
        const phaseName = phase.libelle || phase.nom || phase.name || `Phase ${index + 1}`;
        
        const btn = document.createElement('button');
        btn.className = 'phase-btn';
        if (index === 0) {
            btn.classList.add('active');
            currentPhaseId = phaseId;
        }
        btn.textContent = phaseName;
        btn.addEventListener('click', () => {
            // Désactiver tous les boutons
            document.querySelectorAll('.phase-btn').forEach(b => b.classList.remove('active'));
            // Activer le bouton cliqué
            btn.classList.add('active');
            currentPhaseId = phaseId;
            // Afficher les matchs de cette phase
            displayMatchesForPhase(phaseId, poulesPhases);
        });
        
        phasesButtonsContainer.appendChild(btn);
    });
}

// Fonction pour afficher les matchs d'une phase sélectionnée
function displayMatchesForPhase(phaseId, poulesPhases) {
    const container = document.getElementById('matches-garcons');
    const spinner = document.getElementById('loading-garcons');
    
    try {
        spinner.style.display = 'inline-block';
        
        // Récupérer les matchs de cette phase depuis le stockage
        const matches = allMatches.garcons_phases[phaseId] || [];
        
        if (matches.length === 0) {
            container.innerHTML = '<p class="loading">Aucun match trouvé pour cette phase.</p>';
            return;
        }
        
        // Afficher les matchs
        container.innerHTML = '';
        matches.forEach(match => {
            const card = createMatchCard(match);
            container.appendChild(card);
        });
        
        // Mettre à jour le classement avec les matchs de cette phase
        allMatches.garcons = matches;
        updateClassement();
        
    } catch (error) {
        console.error('Erreur lors de l\'affichage des matchs:', error);
        container.innerHTML = `<p class="loading">Erreur: ${error.message}</p>`;
    } finally {
        spinner.style.display = 'none';
    }
}

// Fonction pour charger les matchs d'une phase spécifique depuis l'API
async function loadMatchesForPhase(phaseId) {
    try {
        // Récupérer les poules pour cette phase
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.garcons_poules}/${phaseId}`);
        
        if (!response.ok) {
            console.warn(`Impossible de charger les poules pour la phase ${phaseId}`);
            return [];
        }
        
        const data = await response.json();
        const poules = Array.isArray(data) ? data : (data.data || data.poules || []);
        
        if (!poules || poules.length === 0) {
            console.warn('Aucune poule trouvée pour cette phase');
            return [];
        }
        
        // Extraire les matchs directement du array rencontres de chaque poule
        const allPhaseMatches = [];
        for (const poule of poules) {
            const pouleName = poule.libelle || poule.nom || `Poule ${poule.poule_id}`;
            
            // Les matchs sont directement dans le array 'rencontres'
            if (poule.rencontres && Array.isArray(poule.rencontres)) {
                const matches = poule.rencontres.map(m => ({ 
                    ...m, 
                    poule: pouleName,
                    // Normaliser les champs pour la compatibilité
                    equipe1: m.equipe_domicile,
                    equipe2: m.equipe_exterieur,
                    but1: m.score_domicile,
                    but2: m.score_exterieur,
                    rencId: m.rencId
                }));
                allPhaseMatches.push(...matches);
            }
        }
        
        // Filtrer par date
        let filteredMatches = filterMatchesByDate(allPhaseMatches);
        
        // Trier par date et heure
        filteredMatches.sort((a, b) => {
            const dateA = new Date(a.date || '');
            const dateB = new Date(b.date || '');
            return dateA - dateB;
        });
        
        return filteredMatches;
        
    } catch (error) {
        console.error('Erreur lors du chargement des matchs de la phase:', error);
        return [];
    }
}

// Fonction pour charger les matchs des garçons avec poules ET phases
async function loadGarconsWithPoules() {
    const container = document.getElementById('matches-garcons');
    const spinner = document.getElementById('loading-garcons');

    try {
        spinner.style.display = 'inline-block';
        
        // Charger les poules (Poule A et Poule B) en parallèle
        const [responseA, responseB] = await Promise.all([
            fetch(`${API_BASE_URL}${ENDPOINTS.garcons_poule_a}`),
            fetch(`${API_BASE_URL}${ENDPOINTS.garcons_poule_b}`)
        ]);

        // Récupérer les matchs des poules
        let matchesA = [];
        let matchesB = [];
        
        if (responseA.ok) {
            const dataA = await responseA.json();
            matchesA = (Array.isArray(dataA) ? dataA : dataA.data || dataA.matchs || []).map(m => ({ ...m, poule: 'Poule A' }));
        }
        
        if (responseB.ok) {
            const dataB = await responseB.json();
            matchesB = (Array.isArray(dataB) ? dataB : dataB.data || dataB.matchs || []).map(m => ({ ...m, poule: 'Poule B' }));
        }

        // Créer l'objet "Poules" pour le stockage (phase 1 du nouveau système)
        let poulesPhases = [];

        // Stocker les matchs des poules
        allMatches.garcons_poule_a = matchesA;
        allMatches.garcons_poule_b = matchesB;
        let combinedPoulesMatches = [...matchesA, ...matchesB];
        combinedPoulesMatches = filterMatchesByDate(combinedPoulesMatches);
        allMatches.garcons_phases['poules'] = combinedPoulesMatches;

        // Charger les phases (depuis la nouvelle API)
        const allPhases = await loadPhasesGarcons();
        
        if (allPhases && allPhases.length > 0) {
            // Ajouter toutes les phases (y compris PHASE DE POULES)
            poulesPhases = allPhases;
            
            // Charger les matchs pour chaque phase
            for (const phase of allPhases) {
                const phaseId = phase.phase_id;
                const phaseMatches = await loadMatchesForPhase(phaseId);
                allMatches.garcons_phases[phaseId] = phaseMatches;
            }
        } else {
            // Fallback: créer une phase "Poules" si API phases n'est pas disponible
            poulesPhases = [
                { 
                    phase_id: 'poules', 
                    libelle: 'Poules (28-29 oct)',
                    ordre: 1
                }
            ];
        }

        // Afficher les sélecteurs de phase
        if (poulesPhases.length > 0) {
            displayPhaseButtons(poulesPhases);
        }

        // Afficher d'abord les matchs de la première phase
        const firstPhaseId = poulesPhases[0]?.phase_id || poulesPhases[0]?.id || 'poules';
        const firstPhaseMatches = allMatches.garcons_phases[firstPhaseId] || combinedPoulesMatches;
        
        container.innerHTML = '';
        let sortedMatches = firstPhaseMatches.sort((a, b) => {
            const dateA = new Date(a.date || '');
            const dateB = new Date(b.date || '');
            return dateA - dateB;
        });
        
        sortedMatches.forEach(match => {
            const card = createMatchCard(match);
            container.appendChild(card);
        });

        // Stocker tous les matchs garçons
        allMatches.garcons = sortedMatches;


    } catch (error) {
        console.error('Erreur lors du chargement des matchs garçons:', error);
        container.innerHTML = `<p class="loading">Erreur lors du chargement: ${error.message}</p>`;
        showError(`Impossible de charger les matchs garçons: ${error.message}`);
    } finally {
        spinner.style.display = 'none';
        updateClassement();
    }
}

// Fonction pour filtrer les matchs par date (27-30 octobre 2025)
function filterMatchesByDate(matches) {
    const startDate = new Date('2025-10-27T00:00:00Z');
    const endDate = new Date('2025-10-30T23:59:59Z');

    return matches.filter(match => {
        const matchDate = new Date(match.date || '');
        return matchDate >= startDate && matchDate <= endDate;
    });
}

// Fonction pour afficher les erreurs
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Fonction pour masquer les erreurs
function hideError() {
    errorMessage.style.display = 'none';
}

// Initialiser le chargement des matchs
window.addEventListener('DOMContentLoaded', () => {
    hideError();
    loadMatches('filles');
    loadMatches('garcons');
    setupCategoryButtons();
    setupFilters();
    optimizeMobile();
});

// Configuration des boutons de catégorie
function setupCategoryButtons() {
    const btnFilles = document.getElementById('btn-filles');
    const btnGarcons = document.getElementById('btn-garcons');
    const btnClassement = document.getElementById('btn-classement');
    const sectionFilles = document.getElementById('section-filles');
    const sectionGarcons = document.getElementById('section-garcons');
    const sectionClassement = document.getElementById('section-classement');

    function hideAllSections() {
        sectionFilles.classList.remove('active');
        sectionGarcons.classList.remove('active');
        sectionClassement.classList.remove('active');
        btnFilles.classList.remove('active');
        btnGarcons.classList.remove('active');
        btnClassement.classList.remove('active');
    }

    btnFilles.addEventListener('click', () => {
        hideAllSections();
        btnFilles.classList.add('active');
        sectionFilles.classList.add('active');
    });

    btnGarcons.addEventListener('click', () => {
        hideAllSections();
        btnGarcons.classList.add('active');
        sectionGarcons.classList.add('active');
    });

    btnClassement.addEventListener('click', () => {
        hideAllSections();
        btnClassement.classList.add('active');
        sectionClassement.classList.add('active');
    });
}

// Fonction pour calculer le classement des filles
function calculateClassement() {
    const classement = {};

    // Parcourir tous les matchs terminés
    allMatches.filles.forEach(match => {
        if (match.statut === 'FINISHED' && match.score_domicile !== '' && match.score_exterieur !== '') {
            const scoreDomicile = parseInt(match.score_domicile) || 0;
            const scoreExterieur = parseInt(match.score_exterieur) || 0;

            // Initialiser les équipes s'il n'existent pas
            if (!classement[match.equipe_domicile]) {
                classement[match.equipe_domicile] = {
                    nom: match.equipe_domicile,
                    joues: 0,
                    gagnees: 0,
                    nulles: 0,
                    perdues: 0,
                    points_pour: 0,
                    points_contre: 0
                };
            }
            if (!classement[match.equipe_exterieur]) {
                classement[match.equipe_exterieur] = {
                    nom: match.equipe_exterieur,
                    joues: 0,
                    gagnees: 0,
                    nulles: 0,
                    perdues: 0,
                    points_pour: 0,
                    points_contre: 0
                };
            }

            // Mettre à jour les statistiques domicile
            classement[match.equipe_domicile].joues++;
            classement[match.equipe_domicile].points_pour += scoreDomicile;
            classement[match.equipe_domicile].points_contre += scoreExterieur;

            // Mettre à jour les statistiques extérieur
            classement[match.equipe_exterieur].joues++;
            classement[match.equipe_exterieur].points_pour += scoreExterieur;
            classement[match.equipe_exterieur].points_contre += scoreDomicile;

            // Déterminer le gagnant
            if (scoreDomicile > scoreExterieur) {
                classement[match.equipe_domicile].gagnees++;
                classement[match.equipe_exterieur].perdues++;
            } else if (scoreExterieur > scoreDomicile) {
                classement[match.equipe_exterieur].gagnees++;
                classement[match.equipe_domicile].perdues++;
            } else {
                classement[match.equipe_domicile].nulles++;
                classement[match.equipe_exterieur].nulles++;
            }
        }
    });

    // Convertir en tableau et ajouter les points de classement
    let tableauClassement = Object.values(classement).map(equipe => ({
        ...equipe,
        points_classement: (equipe.gagnees * 3) + equipe.nulles,
        difference: equipe.points_pour - equipe.points_contre
    }));

    // Trier par points, puis par différence
    tableauClassement.sort((a, b) => {
        if (b.points_classement !== a.points_classement) {
            return b.points_classement - a.points_classement;
        }
        return b.difference - a.difference;
    });

    return tableauClassement;
}

// Fonction pour afficher le classement (récupéré depuis l'API) (récupéré depuis l'API)
async function updateClassement() {
    const classementContainer = document.getElementById('classement-filles');
    
    try {
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.filles_classement}`);
        
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

// Configuration des filtres
function setupFilters() {
    const filterFilles = document.getElementById('filter-filles');
    const filterGarcons = document.getElementById('filter-garcons');

    filterFilles.addEventListener('input', (e) => {
        applyFilter('filles', e.target.value);
    });

    filterGarcons.addEventListener('input', (e) => {
        applyFilter('garcons', e.target.value);
    });
}

// Fonction pour appliquer le filtre
function applyFilter(type, searchTerm) {
    const containerId = type === 'filles' ? 'matches-filles' : 'matches-garcons';
    const container = document.getElementById(containerId);
    const matches = allMatches[type];

    // Normaliser le terme de recherche
    const searchNormalized = searchTerm.toLowerCase().trim();

    if (!searchNormalized) {
        // Si le champ est vide, afficher tous les matchs
        displayMatches(matches, containerId);
        return;
    }

    // Filtrer les matchs
    const filteredMatches = matches.filter(match => {
        const team1 = (match.equipe_domicile || '').toLowerCase();
        const team2 = (match.equipe_exterieur || '').toLowerCase();
        return team1.includes(searchNormalized) || team2.includes(searchNormalized);
    });

    if (filteredMatches.length === 0) {
        container.innerHTML = '<p class="loading">Aucun match trouvé pour cette équipe.</p>';
        return;
    }

    displayMatches(filteredMatches, containerId);
}

// Fonction pour afficher les matchs
function displayMatches(matches, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    matches.forEach(match => {
        const card = createMatchCard(match);
        container.appendChild(card);
    });
}

// Optimisations pour mobile
function optimizeMobile() {
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        document.body.style.overscrollBehavior = 'contain';
        
        // Empêcher les zoom accidentels sur double-tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            let now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Optimiser les boutons pour le tactile
        const buttons = document.querySelectorAll('button, .category-btn');
        buttons.forEach(btn => {
            btn.style.minHeight = '44px'; // Apple HIG minimum
            btn.style.minWidth = '44px';
        });

        // Optimiser les champs input pour mobile
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.style.minHeight = '44px';
            input.style.fontSize = '16px'; // Empêche le zoom au focus sur iOS
        });
    }
}

// ===== GESTION DE LA MODALE =====// ===== FIN DU SCRIPT =====

