// Configuration
const API_BASE_URL = 'https://api-ffhockey-sur-gazon.fly.dev/api/v1';

// Récupérer l'ID de rencontre depuis l'URL
function getRencIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('rencId');
}

// Fonction pour parser les buteurs depuis la feuille de match HTML
function parseButeurs(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const buteurs = [];

    // Chercher les sections de buteurs
    const allText = doc.body.innerText;
    const buteursSections = allText.split('Buteurs :');

    for (let i = 1; i < buteursSections.length; i++) {
        const section = buteursSections[i].split('Blessures')[0];
        const lines = section.split('\n').filter(l => l.trim());
        
        for (let line of lines) {
            // Chercher les patterns comme "N°7 (x1)"
            const matches = line.match(/N°(\d+)\s*\(x(\d+)\)/g);
            if (matches) {
                for (let match of matches) {
                    const numMatch = match.match(/N°(\d+)\s*\(x(\d+)\)/);
                    if (numMatch) {
                        buteurs.push({
                            numero: numMatch[1],
                            buts: numMatch[2],
                            equipe: i === 1 ? 'domicile' : 'exterieur'
                        });
                    }
                }
            }
        }
    }

    return buteurs;
}

// Fonction pour parser les cartons depuis la feuille de match HTML
function parseCartons(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const cartons = [];

    // Chercher les éléments avec classes de cartons
    const yellowCards = doc.querySelectorAll('[class*="CartonJaune"], .txt-orange');
    const redCards = doc.querySelectorAll('[class*="CartonRouge"]');

    // Parser les cartons jaunes
    yellowCards.forEach(card => {
        const text = card.textContent.trim();
        if (text && text.length > 0) {
            cartons.push({
                joueur: text,
                type: 'yellow'
            });
        }
    });

    // Parser les cartons rouges
    redCards.forEach(card => {
        const text = card.textContent.trim();
        if (text && text.length > 0) {
            cartons.push({
                joueur: text,
                type: 'red'
            });
        }
    });

    return cartons;
}

// Fonction pour charger et afficher les détails du match
async function loadMatchDetails() {
    const rencId = getRencIdFromURL();
    
    if (!rencId) {
        document.getElementById('match-info').innerHTML = '<div class="error">ID de rencontre manquant</div>';
        return;
    }

    try {
        // Charger les officiels
        const officielsResponse = await fetch(`${API_BASE_URL}/match/${rencId}/officiels`);
        const officielsData = officielsResponse.ok ? await officielsResponse.json() : {};
        const officiels = officielsData.data || [];

        // Charger la feuille de match
        const feuilleResponse = await fetch(`${API_BASE_URL}/match/${rencId}/feuille-de-match`);
        const feuilleData = feuilleResponse.ok ? await feuilleResponse.json() : {};
        const feuilleHtml = feuilleData.html || '';

        // Parser les buteurs et cartons
        const buteurs = parseButeurs(feuilleHtml);
        const cartons = parseCartons(feuilleHtml);

        // Extraire les infos du match depuis la feuille
        const matchInfo = extractMatchInfo(feuilleHtml);

        // Afficher les infos
        displayMatchInfo(matchInfo);
        displayOfficiels(officiels);
        displayButeurs(buteurs, matchInfo);
        displayCartons(cartons);

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
    container.innerHTML = '';

    officiels.forEach(officiel => {
        const nom = officiel.nom || 'Non disponible';
        const fonction = officiel.fonction || 'Rôle inconnu';
        const licence = officiel.licence || '';

        container.innerHTML += `
            <div class="officiel-card">
                <div class="officiel-fonction">🧑‍⚖️ ${fonction}</div>
                <div class="officiel-nom">${nom}</div>
                ${licence ? `<div class="officiel-licence">📋 ${licence}</div>` : ''}
            </div>
        `;
    });
}

// Fonction pour afficher les buteurs
function displayButeurs(buteurs, matchInfo) {
    const section = document.getElementById('buteurs-section');
    const container = document.getElementById('buteurs-content');

    if (!buteurs || buteurs.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = '';

    buteurs.forEach(but => {
        const equipe = but.equipe === 'domicile' ? matchInfo.equipe1 : matchInfo.equipe2;
        container.innerHTML += `
            <div class="but-item">
                <div class="but-joueur">👕 N°${but.numero}</div>
                <div class="but-temps">⚽ ${but.buts} but${but.buts > 1 ? 's' : ''}</div>
                <div class="but-temps">📍 ${equipe}</div>
            </div>
        `;
    });
}

// Fonction pour afficher les cartons
function displayCartons(cartons) {
    const section = document.getElementById('cartons-section');
    const container = document.getElementById('cartons-content');

    if (!cartons || cartons.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = '';

    cartons.forEach(carton => {
        const typeClass = carton.type === 'red' ? 'red' : 'yellow';
        const typeText = carton.type === 'red' ? 'Carton rouge' : 'Carton jaune';
        const icon = carton.type === 'red' ? '🔴' : '🟨';

        container.innerHTML += `
            <div class="carton-item ${carton.type}-card">
                <span class="carton-type ${typeClass}">${icon} ${typeText}</span>
                <div class="but-joueur">${carton.joueur}</div>
            </div>
        `;
    });
}

// Charger les données au chargement de la page
window.addEventListener('DOMContentLoaded', loadMatchDetails);
