// Configuration
const API_BASE_URL = 'https://api-ffhockey-sur-gazon.fly.dev/api/v1';
const ENDPOINTS = {
    filles_matchs: '/interligues-u14-filles/matchs',
    garcons_matchs: '/interligues-u14-garcons/matchs',
    garcons_poule_a: '/interligues-u14-garcons-poule-a/matchs',
    garcons_poule_b: '/interligues-u14-garcons-poule-b/matchs',
    filles_classement: '/interligues-u14-filles/classement'
};

// Stockage des matchs pour le calcul du classement
let allMatches = {
    filles: [],
    garcons: [],
    garcons_poule_a: [],
    garcons_poule_b: []
};

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

// Fonction pour créer une carte de match
function createMatchCard(match) {
    const status = getMatchStatus(match);
    const statusText = getStatusText(status);
    const statusClass = getStatusClass(status);

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

    return card;
}

// Fonction pour charger les matchs
async function loadMatches(type) {
    if (type === 'garcons') {
        // Pour les garçons, charger les poules A et B
        await loadGarconsWithPoules();
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

// Fonction pour charger les matchs des garçons avec poules
async function loadGarconsWithPoules() {
    const container = document.getElementById('matches-garcons');
    const spinner = document.getElementById('loading-garcons');

    try {
        spinner.style.display = 'inline-block';
        
        // Charger les deux poules en parallèle
        const [responseA, responseB] = await Promise.all([
            fetch(`${API_BASE_URL}${ENDPOINTS.garcons_poule_a}`),
            fetch(`${API_BASE_URL}${ENDPOINTS.garcons_poule_b}`)
        ]);

        if (!responseA.ok || !responseB.ok) {
            throw new Error(`Erreur API: Une ou plusieurs requêtes ont échoué`);
        }

        const dataA = await responseA.json();
        const dataB = await responseB.json();

        // Récupérer les matchs
        let matchesA = (Array.isArray(dataA) ? dataA : dataA.data || dataA.matchs || []).map(m => ({ ...m, poule: 'Poule A' }));
        let matchesB = (Array.isArray(dataB) ? dataB : dataB.data || dataB.matchs || []).map(m => ({ ...m, poule: 'Poule B' }));

        // Combiner et filtrer par date
        let allMatches_garcons = [...matchesA, ...matchesB];
        allMatches_garcons = filterMatchesByDate(allMatches_garcons);

        if (allMatches_garcons.length === 0) {
            container.innerHTML = '<p class="loading">Aucun match trouvé pour la période 27-30 octobre 2025.</p>';
            return;
        }

        // Trier par date et heure
        allMatches_garcons.sort((a, b) => {
            const dateA = new Date(a.date || '');
            const dateB = new Date(b.date || '');
            return dateA - dateB;
        });

        // Afficher les matchs
        container.innerHTML = '';
        allMatches_garcons.forEach(match => {
            const card = createMatchCard(match);
            container.appendChild(card);
        });

        // Stocker les matchs
        allMatches.garcons = allMatches_garcons;
        allMatches.garcons_poule_a = matchesA;
        allMatches.garcons_poule_b = matchesB;

    } catch (error) {
        console.error('Erreur lors du chargement des matchs garçons avec poules:', error);
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
    setupMatchModal();
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

// ===== GESTION DE LA MODALE =====

let currentMatchInModal = null;

// Fonction pour ouvrir la modale
async function openMatchModal(match) {
    const modal = document.getElementById('match-details-modal');
    currentMatchInModal = match;

    console.log('Ouverture modale pour le match:', match);

    // Afficher la modale
    modal.classList.add('active');

    // Mettre à jour le titre avec les infos du match
    const modalTitle = document.getElementById('modal-title');
    const team1 = match.equipe_domicile || 'Équipe 1';
    const team2 = match.equipe_exterieur || 'Équipe 2';
    const score1 = match.score_domicile || '-';
    const score2 = match.score_exterieur || '-';
    modalTitle.textContent = `${team1} ${score1} - ${score2} ${team2}`;

    // Charger les officiels et la feuille de match
    const rencId = match.rencId || match.renc_id;
    console.log('RencId utilisé:', rencId);
    await loadMatchDetails(rencId);

    // Afficher le premier onglet par défaut
    showModalTab('officiels');
}

// Fonction pour fermer la modale
function closeMatchModal() {
    const modal = document.getElementById('match-details-modal');
    modal.classList.remove('active');
    currentMatchInModal = null;
}

// Fonction pour charger les détails du match (officiels et feuille de match)
async function loadMatchDetails(rencId) {
    try {
        // Charger les officiels et la feuille de match en parallèle
        const [officielsResponse, feuilleResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/match/${rencId}/officiels`),
            fetch(`${API_BASE_URL}/match/${rencId}/feuille-de-match`)
        ]);

        // Charger les officiels
        if (officielsResponse.ok) {
            const response = await officielsResponse.json();
            const officiels = response.data || response.officiels || [];
            displayOfficiels(officiels);
        } else {
            displayOfficiels([]);
        }

        // Charger la feuille de match
        if (feuilleResponse.ok) {
            const feuilleData = await feuilleResponse.json();
            const html = feuilleData.html || '';
            displayFeuilleDeMatch(html);
        } else {
            displayFeuilleDeMatch('');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des détails du match:', error);
        displayOfficiels([]);
        displayFeuilleDeMatch('');
    }
}

// Fonction pour afficher les officiels
function displayOfficiels(officiels) {
    const content = document.getElementById('modal-tab-content-officiels');
    
    if (!officiels || officiels.length === 0) {
        content.innerHTML = '<p class="loading">Aucun officiel disponible pour ce match.</p>';
        return;
    }

    let html = '<div class="officiels-list">';

    // Créer une liste des officiels avec leurs rôles
    officiels.forEach(officiel => {
        const nom = officiel.nom || 'Non disponible';
        const fonction = officiel.fonction || 'Rôle inconnu';
        const licence = officiel.licence || '';
        const civilite = officiel.civilite || '';

        html += `
            <div class="officiel-card">
                <div class="officiel-fonction">🧑‍⚖️ ${fonction}</div>
                <div class="officiel-nom">${nom}</div>
                ${licence ? `<div class="officiel-info">📋 Licence: ${licence}</div>` : ''}
            </div>
        `;
    });

    html += '</div>';
    content.innerHTML = html;
}

// Fonction pour afficher la feuille de match
function displayFeuilleDeMatch(feuilleHtml) {
    const content = document.getElementById('modal-tab-content-feuille');
    
    if (!feuilleHtml) {
        content.innerHTML = '<p class="loading">Feuille de match non disponible.</p>';
        return;
    }

    // Créer un lien pour ouvrir la feuille de match dans un nouvel onglet
    const rencId = currentMatchInModal?.rencId || currentMatchInModal?.renc_id;
    
    let html = '<div class="feuille-content">';
    html += '<p style="margin-bottom: 20px; text-align: center;">';
    html += '<a href="#" id="open-feuille-full" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; cursor: pointer;">🔗 Ouvrir la feuille complète dans un nouvel onglet</a>';
    html += '</p>';
    
    // Afficher un aperçu de la feuille
    html += '<div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; margin-top: 15px;">';
    html += '<h3 style="margin-top: 0; color: #667eea;">📋 Aperçu de la feuille de match</h3>';
    html += '<p style="font-size: 0.9em; color: #666;">La feuille de match complète contient : équipes, listes de joueurs, buteurs, blessures, arbitres et officiels.</p>';
    html += '<p style="font-size: 0.85em; color: #999; margin-top: 10px;">Cliquez sur le lien ci-dessus pour voir la version complète formatée.</p>';
    html += '</div>';
    html += '</div>';
    
    content.innerHTML = html;
    
    // Ajouter l'événement au lien
    document.getElementById('open-feuille-full').addEventListener('click', (e) => {
        e.preventDefault();
        openFeuilleDeMatchInNewTab(rencId);
    });
}

// Fonction pour ouvrir la feuille de match dans un nouvel onglet
async function openFeuilleDeMatchInNewTab(rencId) {
    try {
        const response = await fetch(`${API_BASE_URL}/match/${rencId}/feuille-de-match`);
        if (response.ok) {
            const data = await response.json();
            const html = data.html || '';
            
            // Créer une nouvelle fenêtre
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Feuille de match</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                            background: white;
                        }
                        @media print {
                            body { margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    ${html}
                </body>
                </html>
            `);
            newWindow.document.close();
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Impossible de charger la feuille de match');
    }
}

// Fonction pour afficher un onglet
function showModalTab(tabName) {
    // Masquer tous les contenus
    document.querySelectorAll('.modal-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Désactiver tous les boutons d'onglet
    document.querySelectorAll('.modal-tab').forEach(btn => {
        btn.classList.remove('active');
    });

    // Afficher l'onglet sélectionné
    const content = document.getElementById(`modal-tab-content-${tabName}`);
    if (content) {
        content.classList.add('active');
    }

    // Activer le bouton d'onglet sélectionné
    const btn = document.querySelector(`[data-tab="${tabName}"]`);
    if (btn) {
        btn.classList.add('active');
    }
}

// Initialiser la modale au chargement
function setupMatchModal() {
    const modal = document.getElementById('match-details-modal');
    const closeBtn = document.querySelector('.modal-close');
    const tabs = document.querySelectorAll('.modal-tab');

    // Fermer au clic sur le bouton fermer
    closeBtn.addEventListener('click', closeMatchModal);

    // Fermer au clic sur le fond (backdrop)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeMatchModal();
        }
    });

    // Onglets
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            showModalTab(tabName);
        });
    });
}

// Fonction pour ajouter les événements click sur les cartes de match
function setupMatchCardClickHandlers() {
    document.addEventListener('click', (e) => {
        const matchCard = e.target.closest('.match-card');
        if (matchCard) {
            // Récupérer le match depuis les données stockées
            const matchTeams = matchCard.querySelector('.team-name');
            if (matchTeams) {
                // Chercher le match dans allMatches
                const matchText = matchCard.textContent;
                
                // Chercher dans les matchs filles
                let match = allMatches.filles.find(m => {
                    return matchCard.innerHTML.includes(m.equipe_domicile) && 
                           matchCard.innerHTML.includes(m.equipe_exterieur);
                });

                // Sinon chercher dans les matchs garçons
                if (!match) {
                    match = allMatches.garcons.find(m => {
                        return matchCard.innerHTML.includes(m.equipe_domicile) && 
                               matchCard.innerHTML.includes(m.equipe_exterieur);
                    });
                }

                if (match && match.renc_id) {
                    openMatchModal(match);
                }
            }
        }
    });
}

// Mettre à jour createMatchCard pour stocker l'ID
function createMatchCardWithId(match) {
    const card = createMatchCard(match);
    card.dataset.rencId = match.renc_id;
    card.dataset.matchTeams = `${match.equipe_domicile}|${match.equipe_exterieur}`;
    return card;
}

// Remplacer createMatchCard pour utiliser la nouvelle version
function createMatchCard(match) {
    const status = getMatchStatus(match);
    const statusText = getStatusText(status);
    const statusClass = getStatusClass(status);

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
    card.dataset.rencId = match.rencId || match.renc_id;
    card.dataset.matchTeams = `${team1}|${team2}`;
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

    // Ajouter l'événement click
    card.addEventListener('click', async (e) => {
        const rencId = card.dataset.rencId;
        const match = allMatches.filles.find(m => (m.rencId || m.renc_id) === rencId) ||
                      allMatches.garcons.find(m => (m.rencId || m.renc_id) === rencId);
        console.log('Match trouvé au clic:', match, 'RencId:', rencId);
        if (match) {
            openMatchModal(match);
        }
    });

    return card;
}

