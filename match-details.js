// Configuration
const API_BASE_URL = 'https://api-ffhockey-sur-gazon.fly.dev/api/v1';

// Récupérer l'ID de rencontre depuis l'URL
function getRencIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('rencId');
}

// Extraire les infos du match depuis la feuille HTML
function extractMatchInfo(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const text = doc.body.innerText;

    const info = {
        date: '',
        heure: '',
        terrain: '',
        equipe1: '',
        equipe2: '',
        score1: '',
        score2: ''
    };

    // Extraire date
    const dateMatch = text.match(/Date :\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (dateMatch) info.date = dateMatch[1];

    // Extraire heure
    const heureMatch = text.match(/Horaire :\s*(\d{1,2}:\d{2})/);
    if (heureMatch) info.heure = heureMatch[1];

    // Extraire terrain
    const terrainMatch = text.match(/Terrain :\s*([^\n]+)/);
    if (terrainMatch) info.terrain = terrainMatch[1].trim();

    // Extraire équipes
    const equipe1Match = text.match(/CLUB VISITE[^N]*NOM :\s*([^\n]+)/);
    const equipe2Match = text.match(/CLUB VISITEUR[^N]*NOM :\s*([^\n]+)/);
    
    if (equipe1Match) info.equipe1 = equipe1Match[1].trim();
    if (equipe2Match) info.equipe2 = equipe2Match[1].trim();

    // Extraire scores
    const scoreMatches = text.match(/Buts en chiffres :\s*(\d+)/g);
    if (scoreMatches && scoreMatches.length >= 2) {
        info.score1 = scoreMatches[0].match(/(\d+)/)[1];
        info.score2 = scoreMatches[1].match(/(\d+)/)[1];
    }

    return info;
}

// Stocker les officiels complets pour la vue complète
let allOfficials = [];

// Fonction pour charger et afficher les détails du match
async function loadMatchDetails() {
    const rencId = getRencIdFromURL();
    
    if (!rencId) {
        document.getElementById('match-info').innerHTML = '<div class="error">ID de rencontre manquant</div>';
        return;
    }

    try {
        // Charger toutes les données en parallèle
        const [officielsRes, buteursRes, cartonsRes, feuilleRes] = await Promise.all([
            fetch(`${API_BASE_URL}/match/${rencId}/officiels`),
            fetch(`${API_BASE_URL}/match/${rencId}/buteurs`),
            fetch(`${API_BASE_URL}/match/${rencId}/cartons`),
            fetch(`${API_BASE_URL}/match/${rencId}/feuille-de-match`)
        ]);

        const officielsData = officielsRes.ok ? await officielsRes.json() : { data: [] };
        const buteursData = buteursRes.ok ? await buteursRes.json() : { data: { team1: [], team2: [] } };
        const cartonsData = cartonsRes.ok ? await cartonsRes.json() : { data: { team1: {}, team2: {} } };
        const feuilleData = feuilleRes.ok ? await feuilleRes.json() : { html: '' };

        const officiels = officielsData.data || [];
        const buteurs = buteursData.data || { team1: [], team2: [] };
        const cartons = cartonsData.data || { team1: {}, team2: {} };
        const feuilleHtml = feuilleData.html || '';

        // Extraire les infos du match depuis la feuille
        const matchInfo = extractMatchInfo(feuilleHtml);

        // Stocker les officiels complets
        allOfficials = officiels;

        // Afficher les infos
        displayMatchInfo(matchInfo);
        displayOfficiels(officiels);
        displayButeurs(buteurs, matchInfo);
        displayCartons(cartons);
        displayFeuilleDeMatch(feuilleHtml);

    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('match-info').innerHTML = '<div class="error">Erreur lors du chargement des données</div>';
    }
}

// Fonction pour extraire les infos du match
function extractMatchInfo(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const text = doc.body.innerText;

    const info = {
        date: '',
        heure: '',
        terrain: '',
        equipe1: '',
        equipe2: '',
        score1: '',
        score2: ''
    };

    // Extraire date
    const dateMatch = text.match(/Date :\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (dateMatch) info.date = dateMatch[1];

    // Extraire heure
    const heureMatch = text.match(/Horaire :\s*(\d{1,2}:\d{2})/);
    if (heureMatch) info.heure = heureMatch[1];

    // Extraire terrain
    const terrainMatch = text.match(/Terrain :\s*([^\n]+)/);
    if (terrainMatch) info.terrain = terrainMatch[1].trim();

    // Extraire équipes et scores
    const clubMatches = text.match(/CLUB VISITE[^\n]*\n[^\n]*NOM :\s*([^\n]+)|CLUB VISITEUR[^\n]*\n[^\n]*NOM :\s*([^\n]+)/g);
    
    const equipe1Match = text.match(/CLUB VISITE[^N]*NOM :\s*([^\n]+)/);
    const equipe2Match = text.match(/CLUB VISITEUR[^N]*NOM :\s*([^\n]+)/);
    
    if (equipe1Match) info.equipe1 = equipe1Match[1].trim();
    if (equipe2Match) info.equipe2 = equipe2Match[1].trim();

    // Extraire scores
    const scoreMatches = text.match(/Buts en chiffres :\s*(\d+)/g);
    if (scoreMatches && scoreMatches.length >= 2) {
        info.score1 = scoreMatches[0].match(/(\d+)/)[1];
        info.score2 = scoreMatches[1].match(/(\d+)/)[1];
    }

    return info;
}

// Fonction pour afficher les infos du match
function displayMatchInfo(info) {
    const container = document.getElementById('match-info');
    const title = document.getElementById('match-title');

    // Mettre à jour le titre
    title.textContent = `${info.equipe1} ${info.score1} - ${info.score2} ${info.equipe2}`;

    // Remplir les infos
    container.innerHTML = `
        <div class="info-item">
            <div class="info-label">📅 Date</div>
            <div class="info-value">${info.date || 'Non disponible'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">⏰ Heure</div>
            <div class="info-value">${info.heure || 'Non disponible'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">📍 Terrain</div>
            <div class="info-value">${info.terrain || 'Non disponible'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">⚽ Score</div>
            <div class="info-value">${info.score1} - ${info.score2}</div>
        </div>
    `;
}

// Fonction pour afficher les officiels
function displayOfficiels(officiels) {
    const section = document.getElementById('officiels-section');
    const container = document.getElementById('officiels-content');

    if (!officiels || officiels.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    
    // Séparer les arbitres et délégués
    const arbitres = officiels.filter(o => o.code_fonction === 'ARB');
    const delegates = officiels.filter(o => o.code_fonction === 'DLG');
    const autres = officiels.filter(o => o.code_fonction !== 'ARB' && o.code_fonction !== 'DLG');

    // Afficher les 2 arbitres et le délégué
    let html = '';
    
    arbitres.slice(0, 2).forEach(officiel => {
        html += createOfficielCard(officiel);
    });
    
    delegates.slice(0, 1).forEach(officiel => {
        html += createOfficielCard(officiel);
    });

    // Vérifier s'il y a d'autres officiels
    const totalAffichesInitialement = arbitres.slice(0, 2).length + delegates.slice(0, 1).length;
    const totalOfficiels = officiels.length;
    
    if (totalOfficiels > totalAffichesInitialement) {
        html += `<button id="show-all-officials-btn" class="show-more-btn">Voir tous les officiels (${totalOfficiels})</button>`;
    }

    container.innerHTML = html;

    // Ajouter l'écouteur pour le bouton "Voir tous"
    const btn = document.getElementById('show-all-officials-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            showAllOfficials(officiels);
        });
    }
}

// Créer une carte pour un officiel
function createOfficielCard(officiel) {
    const nom = officiel.nom || 'Non disponible';
    const fonction = officiel.fonction || 'Rôle inconnu';
    const licence = officiel.licence || '';
    
    return `
        <div class="officiel-card">
            <div class="officiel-fonction">🧑‍⚖️ ${fonction}</div>
            <div class="officiel-nom">${nom}</div>
            ${licence ? `<div class="officiel-licence">📋 ${licence}</div>` : ''}
        </div>
    `;
}

// Afficher tous les officiels dans une modale
function showAllOfficials(officiels) {
    let html = '<div class="officiels-modal">';
    
    officiels.forEach(officiel => {
        html += createOfficielCard(officiel);
    });
    
    html += '</div>';
    
    const container = document.getElementById('officiels-content');
    container.innerHTML = html;
    
    // Ajouter un bouton pour revenir
    const btn = document.createElement('button');
    btn.className = 'show-more-btn';
    btn.textContent = 'Réduire';
    btn.addEventListener('click', () => {
        displayOfficiels(allOfficials);
    });
    container.appendChild(btn);
}

// Stocker les buteurs complets pour filtrage par club
let allButeurs = { team1: [], team2: [] };
let currentButeursFilter = 'all';

// Fonction pour afficher les buteurs
function displayButeurs(buteurs, matchInfo) {
    const section = document.getElementById('buteurs-section');
    const container = document.getElementById('buteurs-content');

    if (!buteurs || (buteurs.team1.length === 0 && buteurs.team2.length === 0)) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    allButeurs = buteurs;

    // Vérifier si on est sur mobile
    const isMobile = window.innerWidth < 768;

    let html = '';

    // Sur mobile, ajouter des boutons de filtre par club
    if (isMobile) {
        html += `
            <div class="team-filter-buttons">
                <button class="filter-btn active" data-filter="all">Tous</button>
                <button class="filter-btn" data-filter="team1">${matchInfo.equipe1}</button>
                <button class="filter-btn" data-filter="team2">${matchInfo.equipe2}</button>
            </div>
        `;
    }

    // Afficher les buteurs
    if (currentButeursFilter === 'all' || currentButeursFilter === 'team1') {
        if (buteurs.team1 && buteurs.team1.length > 0) {
            html += `<div class="team-section"><h3>${matchInfo.equipe1}</h3>`;
            buteurs.team1.forEach(but => {
                html += `
                    <div class="but-item">
                        <div class="but-joueur">👕 N°${but.numero_maillot}</div>
                        <div class="but-temps">⚽ ${but.buts} but${but.buts > 1 ? 's' : ''}</div>
                    </div>
                `;
            });
            html += '</div>';
        }
    }

    if (currentButeursFilter === 'all' || currentButeursFilter === 'team2') {
        if (buteurs.team2 && buteurs.team2.length > 0) {
            html += `<div class="team-section"><h3>${matchInfo.equipe2}</h3>`;
            buteurs.team2.forEach(but => {
                html += `
                    <div class="but-item">
                        <div class="but-joueur">� N°${but.numero_maillot}</div>
                        <div class="but-temps">⚽ ${but.buts} but${but.buts > 1 ? 's' : ''}</div>
                    </div>
                `;
            });
            html += '</div>';
        }
    }

    if (!html.includes('but-item')) {
        html = '<p class="loading">Aucun but enregistré</p>';
    }

    container.innerHTML = html;

    // Ajouter les écouteurs pour les boutons de filtre
    if (isMobile) {
        const filterBtns = container.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentButeursFilter = btn.dataset.filter;
                displayButeurs(allButeurs, matchInfo);
            });
        });
    }
}

// Stocker les cartons complets pour filtrage par club
let allCartons = { team1: {}, team2: {} };
let currentCartonsFilter = 'all';

// Fonction pour afficher les cartons
function displayCartons(cartons) {
    const section = document.getElementById('cartons-section');
    const container = document.getElementById('cartons-content');

    if (!cartons || (Object.keys(cartons.team1 || {}).every(k => !cartons.team1[k] || cartons.team1[k].length === 0) &&
        Object.keys(cartons.team2 || {}).every(k => !cartons.team2[k] || cartons.team2[k].length === 0))) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    allCartons = cartons;

    // Vérifier s'il y a des cartons
    const hasCartons = 
        (cartons.team1 && (cartons.team1.jaune?.length > 0 || cartons.team1.rouge?.length > 0 || cartons.team1.vert?.length > 0)) ||
        (cartons.team2 && (cartons.team2.jaune?.length > 0 || cartons.team2.rouge?.length > 0 || cartons.team2.vert?.length > 0));

    if (!hasCartons) {
        section.style.display = 'none';
        return;
    }

    let html = '';

    // Afficher les cartons avec couleurs
    const types = ['vert', 'jaune', 'rouge'];
    const typeIcons = { vert: '🟢', jaune: '🟨', rouge: '🔴' };
    const typeTexts = { vert: 'Carton vert', jaune: 'Carton jaune', rouge: 'Carton rouge' };
    const typeClasses = { vert: 'green', jaune: 'yellow', rouge: 'red' };

    // Team 1
    if (cartons.team1) {
        html += '<div class="team-section"><h3>Équipe 1</h3>';
        types.forEach(type => {
            if (cartons.team1[type] && cartons.team1[type].length > 0) {
                cartons.team1[type].forEach(carton => {
                    html += `
                        <div class="carton-item carton-${typeClasses[type]}">
                            <span class="carton-type carton-type-${typeClasses[type]}">${typeIcons[type]} ${typeTexts[type]}</span>
                            <div class="carton-joueur">${carton.nom}</div>
                        </div>
                    `;
                });
            }
        });
        html += '</div>';
    }

    // Team 2
    if (cartons.team2) {
        html += '<div class="team-section"><h3>Équipe 2</h3>';
        types.forEach(type => {
            if (cartons.team2[type] && cartons.team2[type].length > 0) {
                cartons.team2[type].forEach(carton => {
                    html += `
                        <div class="carton-item carton-${typeClasses[type]}">
                            <span class="carton-type carton-type-${typeClasses[type]}">${typeIcons[type]} ${typeTexts[type]}</span>
                            <div class="carton-joueur">${carton.nom}</div>
                        </div>
                    `;
                });
            }
        });
        html += '</div>';
    }

    container.innerHTML = html || '<p class="loading">Aucun carton enregistré</p>';
}

// Fonction pour afficher la feuille de match complète
function displayFeuilleDeMatch(feuilleHtml) {
    const section = document.getElementById('feuille-section');
    if (!section) return;

    if (!feuilleHtml) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    const container = document.getElementById('feuille-content');
    if (container) {
        container.innerHTML = feuilleHtml;
    }
}

// Charger les données au chargement de la page
window.addEventListener('DOMContentLoaded', loadMatchDetails);
