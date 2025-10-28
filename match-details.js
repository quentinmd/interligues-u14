// Configuration
const API_BASE_URL = 'https://api-ffhockey-sur-gazon.fly.dev/api/v1';

// Stocker les officiels complets pour la vue complète
let allOfficials = [];

// Stocker les buteurs complets pour filtrage par club
let allButeurs = {};
let currentButeursFilter = 'all';

// Stocker les noms d'équipes pour la feuille de match
let team1Name = 'Équipe 1';
let team2Name = 'Équipe 2';

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

// Fonction pour charger et afficher les détails du match
async function loadMatchDetails() {
    const rencId = getRencIdFromURL();
    
    if (!rencId) {
        document.getElementById('match-info').innerHTML = '<div class="error">ID de rencontre manquant</div>';
        return;
    }

    try {
        // Charger d'abord la feuille de match (prioritaire)
        const feuilleRes = await fetch(`${API_BASE_URL}/match/${rencId}/feuille-de-match`);
        const feuilleData = feuilleRes.ok ? await feuilleRes.json() : { html: '' };
        const feuilleHtml = feuilleData.html || '';

        // Extraire les infos du match depuis la feuille
        const matchInfo = extractMatchInfo(feuilleHtml);
        
        // Afficher immédiatement l'header (score, équipes, date, terrain)
        displayMatchInfo(matchInfo);
        // Ne pas afficher la feuille immédiatement

        // Charger les données secondaires en parallèle en arrière-plan
        const [officielsRes, buteursRes, cartonsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/match/${rencId}/officiels`),
            fetch(`${API_BASE_URL}/match/${rencId}/buteurs`),
            fetch(`${API_BASE_URL}/match/${rencId}/cartons`)
        ]);

        const officielsData = officielsRes.ok ? await officielsRes.json() : { data: [] };
        const buteursData = buteursRes.ok ? await buteursRes.json() : { data: { team1: {}, team2: {} } };
        const cartonsData = cartonsRes.ok ? await cartonsRes.json() : { data: { team1: {}, team2: {} } };

        const officiels = officielsData.data || [];
        const buteurs = buteursData.data || { team1: {}, team2: {} };
        const cartons = cartonsData.data || { team1: {}, team2: {} };

        // Utiliser les noms d'équipes des buteurs si disponibles (plus fiables)
        if (buteurs.team1 && buteurs.team1.nom_equipe) {
            matchInfo.equipe1 = buteurs.team1.nom_equipe;
            team1Name = matchInfo.equipe1;
            // Mettre à jour immédiatement l'affichage
            document.getElementById('team1-name').textContent = matchInfo.equipe1;
            document.getElementById('avatar1').textContent = matchInfo.equipe1.charAt(0).toUpperCase();
        }
        if (buteurs.team2 && buteurs.team2.nom_equipe) {
            matchInfo.equipe2 = buteurs.team2.nom_equipe;
            team2Name = matchInfo.equipe2;
            // Mettre à jour immédiatement l'affichage
            document.getElementById('team2-name').textContent = matchInfo.equipe2;
            document.getElementById('avatar2').textContent = matchInfo.equipe2.charAt(0).toUpperCase();
        }

        // Stocker les officiels complets
        allOfficials = officiels;

        // Afficher les détails secondaires
        displayOfficiels(officiels);
        displayButeurs(buteurs, matchInfo);
        displayCartons(cartons);
        displayFeuilleDeMatch(feuilleHtml);

    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('match-info').innerHTML = '<div class="error">Erreur lors du chargement des données</div>';
    }
}

// Fonction pour afficher les infos du match
function displayMatchInfo(info) {
    // Afficher dans le header hero
    document.getElementById('team1-name').textContent = info.equipe1 || 'Équipe 1';
    document.getElementById('team2-name').textContent = info.equipe2 || 'Équipe 2';
    document.getElementById('score1').textContent = info.score1 || '-';
    document.getElementById('score2').textContent = info.score2 || '-';
    
    // Avatar avec première lettre
    const avatar1 = document.getElementById('avatar1');
    const avatar2 = document.getElementById('avatar2');
    avatar1.textContent = (info.equipe1 || 'E').charAt(0).toUpperCase();
    avatar2.textContent = (info.equipe2 || 'E').charAt(0).toUpperCase();
    
    // Date, heure et terrain
    document.getElementById('match-date').textContent = info.date ? `${info.date} - ${info.heure}` : 'Date non disponible';
    document.getElementById('match-terrain').textContent = info.terrain || 'Terrain non disponible';
    
    // Afficher les infos détaillées (vide pour l'instant)
    const container = document.getElementById('match-info');
    container.innerHTML = '';
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

// Fonction pour afficher les buteurs
function displayButeurs(buteurs, matchInfo) {
    const section = document.getElementById('buteurs-section');
    const container = document.getElementById('buteurs-content');

    if (!buteurs || !buteurs.team1 || !buteurs.team2 || ((!buteurs.team1.buteurs || buteurs.team1.buteurs.length === 0) && (!buteurs.team2.buteurs || buteurs.team2.buteurs.length === 0))) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    allButeurs = buteurs;

    // Vérifier si on est sur mobile
    const isMobile = window.innerWidth < 768;

    let html = '';

    // Sur mobile, ajouter des boutons de filtre par club
    if (isMobile && ((buteurs.team1.buteurs && buteurs.team1.buteurs.length > 0) || (buteurs.team2.buteurs && buteurs.team2.buteurs.length > 0))) {
        html += `
            <div class="team-filter-buttons">
                <button class="filter-btn active" data-filter="all">Tous</button>
        `;
        if (buteurs.team1.buteurs && buteurs.team1.buteurs.length > 0) {
            html += `<button class="filter-btn" data-filter="team1">${buteurs.team1.nom_equipe}</button>`;
        }
        if (buteurs.team2.buteurs && buteurs.team2.buteurs.length > 0) {
            html += `<button class="filter-btn" data-filter="team2">${buteurs.team2.nom_equipe}</button>`;
        }
        html += '</div>';
    }

    // Afficher les buteurs
    if (currentButeursFilter === 'all' || currentButeursFilter === 'team1') {
        if (buteurs.team1.buteurs && buteurs.team1.buteurs.length > 0) {
            html += `<div class="team-section"><h3>${buteurs.team1.nom_equipe}</h3>`;
            buteurs.team1.buteurs.forEach(but => {
                html += `
                    <div class="but-item">
                        <div class="but-joueur">👕 N°${but.numero_maillot} - ${but.nom}</div>
                        <div class="but-temps">⚽ ${but.buts} but${but.buts > 1 ? 's' : ''}</div>
                    </div>
                `;
            });
            html += '</div>';
        }
    }

    if (currentButeursFilter === 'all' || currentButeursFilter === 'team2') {
        if (buteurs.team2.buteurs && buteurs.team2.buteurs.length > 0) {
            html += `<div class="team-section"><h3>${buteurs.team2.nom_equipe}</h3>`;
            buteurs.team2.buteurs.forEach(but => {
                html += `
                    <div class="but-item">
                        <div class="but-joueur">👕 N°${but.numero_maillot} - ${but.nom}</div>
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

// Stocker les cartons complets
let allCartons = { team1: {}, team2: {} };

// Fonction pour afficher les cartons
function displayCartons(cartons) {
    const section = document.getElementById('cartons-section');
    const container = document.getElementById('cartons-content');

    if (!cartons || !cartons.team1 || !cartons.team2) {
        section.style.display = 'none';
        return;
    }

    const hasCartons = 
        (cartons.team1 && (cartons.team1.jaune?.length > 0 || cartons.team1.rouge?.length > 0 || cartons.team1.vert?.length > 0)) ||
        (cartons.team2 && (cartons.team2.jaune?.length > 0 || cartons.team2.rouge?.length > 0 || cartons.team2.vert?.length > 0));

    if (!hasCartons) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    allCartons = cartons;

    let html = '';

    // Afficher les cartons avec couleurs
    const types = ['vert', 'jaune', 'rouge'];
    const typeIcons = { vert: '🟢', jaune: '🟨', rouge: '🔴' };
    const typeTexts = { vert: 'Carton vert', jaune: 'Carton jaune', rouge: 'Carton rouge' };
    const typeClasses = { vert: 'green', jaune: 'yellow', rouge: 'red' };

    // Team 1
    if (cartons.team1) {
        const hasTeam1Cartons = types.some(type => cartons.team1[type] && cartons.team1[type].length > 0);
        if (hasTeam1Cartons) {
            html += `<div class="team-section"><h3>${cartons.team1.nom_equipe}</h3>`;
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
    }

    // Team 2
    if (cartons.team2) {
        const hasTeam2Cartons = types.some(type => cartons.team2[type] && cartons.team2[type].length > 0);
        if (hasTeam2Cartons) {
            html += `<div class="team-section"><h3>${cartons.team2.nom_equipe}</h3>`;
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

    // Afficher la vue simplifiée (mobile et desktop)
    displayFeuilleDeMatchMobile(feuilleHtml);
}

// Fonction pour afficher la feuille en version mobile (simplifiée)
function displayFeuilleDeMatchMobile(feuilleHtml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(feuilleHtml, 'text/html');
    
    // Trouver la table principale avec class="orbe"
    const mainTable = doc.querySelector('table.orbe');
    
    if (!mainTable) {
        console.log('Table.orbe non trouvée');
        return;
    }

    // Extraire les données des deux équipes
    const rows = mainTable.querySelectorAll('tbody tr');
    let team1Data = [];
    let team2Data = [];

    rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        
        if (cells.length < 8) {
            return; // Passer les lignes incomplètes
        }
        
        // La structure est: [licencié1, maillot1, nom1, carton1, licencié2, maillot2, nom2, carton2]
        
        // Extraire équipe 1 (colonnes 1-2)
        const numero1 = cells[1]?.textContent?.trim() || '';
        const nom1 = cells[2]?.textContent?.trim() || '';
        
        // Extraire équipe 2 (colonnes 5-6)
        const numero2 = cells[5]?.textContent?.trim() || '';
        const nom2 = cells[6]?.textContent?.trim() || '';
        
        // Ajouter équipe 1 si valide
        if (numero1 && nom1) {
            if (numero1 === 'Gardien') {
                team1Data.push({ numero: 'G', nom: nom1 });
            } else if (numero1 !== 'Entraîneur' && numero1 !== 'Chef d\'équipe' && numero1 !== 'N° Maillot') {
                team1Data.push({ numero: numero1, nom: nom1 });
            }
        }
        
        // Ajouter équipe 2 si valide
        if (numero2 && nom2) {
            if (numero2 === 'Gardien') {
                team2Data.push({ numero: 'G', nom: nom2 });
            } else if (numero2 !== 'Entraîneur' && numero2 !== 'Chef d\'équipe' && numero2 !== 'N° Maillot') {
                team2Data.push({ numero: numero2, nom: nom2 });
            }
        }
    });

    console.log('Team1:', team1Data.length, 'joueurs');
    console.log('Team2:', team2Data.length, 'joueurs');

    // Créer l'affichage mobile/desktop
    let mobileHtml = '<div class="team-toggle-btn" data-team="all">Toutes les équipes</div>';

    if (team1Data.length > 0) {
        mobileHtml += `<div class="team-toggle-btn" data-team="team1">${team1Name}</div>`;
    }
    if (team2Data.length > 0) {
        mobileHtml += `<div class="team-toggle-btn" data-team="team2">${team2Name}</div>`;
    }

    // Afficher équipe 1
    if (team1Data.length > 0) {
        mobileHtml += `<div class="feuille-team-container" data-team-content="all" data-team="team1">`;
        mobileHtml += `<h3>${team1Name}</h3>`;
        team1Data.forEach(player => {
            const displayNumber = player.numero === 'G' ? 'Gardien' : `N° ${player.numero}`;
            mobileHtml += `
                <div class="player-card-mobile">
                    <div class="player-info-mobile">
                        <span class="player-number-mobile">${displayNumber}</span>
                        <span class="player-name-mobile">${player.nom}</span>
                    </div>
                </div>
            `;
        });
        mobileHtml += '</div>';
    }

    // Afficher équipe 2
    if (team2Data.length > 0) {
        mobileHtml += `<div class="feuille-team-container" data-team-content="all" data-team="team2">`;
        mobileHtml += `<h3>${team2Name}</h3>`;
        team2Data.forEach(player => {
            const displayNumber = player.numero === 'G' ? 'Gardien' : `N° ${player.numero}`;
            mobileHtml += `
                <div class="player-card-mobile">
                    <div class="player-info-mobile">
                        <span class="player-number-mobile">${displayNumber}</span>
                        <span class="player-name-mobile">${player.nom}</span>
                    </div>
                </div>
            `;
        });
        mobileHtml += '</div>';
    }

    const mobileContainer = document.getElementById('feuille-mobile-content');
    if (mobileContainer) {
        mobileContainer.innerHTML = mobileHtml;
        mobileContainer.style.display = 'block';

        // Ajouter les écouteurs pour les boutons de filtre
        const toggleBtns = mobileContainer.querySelectorAll('.team-toggle-btn');
        const teamContainers = mobileContainer.querySelectorAll('.feuille-team-container');

        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Retirer la classe active de tous les boutons
                toggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const selectedTeam = btn.dataset.team;

                // Afficher/masquer les conteneurs selon la sélection
                teamContainers.forEach(container => {
                    const containerTeam = container.dataset.team;
                    if (selectedTeam === 'all') {
                        container.style.display = 'block';
                    } else if (containerTeam === selectedTeam) {
                        container.style.display = 'block';
                    } else {
                        container.style.display = 'none';
                    }
                });
            });
        });

        // Activer le bouton "Toutes les équipes" par défaut
        toggleBtns[0]?.classList.add('active');
    }
}

// Charger les données au chargement de la page
window.addEventListener('DOMContentLoaded', loadMatchDetails);
