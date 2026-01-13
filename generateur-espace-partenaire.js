/**
 * ============================================================================
 * CAPITAL ÉNERGIE - GÉNÉRATEUR ESPACE PARTENAIRE
 * ============================================================================
 * Génération de tableaux de bord personnalisés pour les artisans partenaires
 * 
 * Usage :
 *   node generateur-espace-partenaire.js generer    Génère tous les espaces
 *   node generateur-espace-partenaire.js apercu     Aperçu artisan test
 *   node generateur-espace-partenaire.js liste      Liste les dossiers traités
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  dossierTraites: './traites',
  dossierEspaces: './espaces-partenaires',
  fichierAlertes: './alertes-reglementaires.json',
  formatSortie: 'html', // 'html' ou 'md'
};

// ============================================================================
// CHARGEMENT DES ALERTES RÉGLEMENTAIRES
// ============================================================================

/**
 * Charge les alertes réglementaires depuis le fichier de veille
 */
function chargerAlertesReglementaires() {
  const chemin = path.resolve(CONFIG.fichierAlertes);
  
  if (!fs.existsSync(chemin)) {
    return { alertesActives: [], nouvellesFiches: [] };
  }
  
  try {
    return JSON.parse(fs.readFileSync(chemin, 'utf8'));
  } catch (e) {
    return { alertesActives: [], nouvellesFiches: [] };
  }
}

/**
 * Filtre les alertes pertinentes pour une fiche CEE donnée
 */
function getAlertesParFiche(ficheCEE, alertes) {
  if (!alertes?.alertesActives) return [];
  return alertes.alertesActives.filter(a => a.fiche === ficheCEE);
}

// ============================================================================
// SCAN DES DOSSIERS TRAITÉS
// ============================================================================

function scannerDossiersTraites() {
  const dossierPath = path.resolve(CONFIG.dossierTraites);
  
  if (!fs.existsSync(dossierPath)) {
    console.log(`  ⚠️  Dossier ${CONFIG.dossierTraites} non trouvé`);
    return [];
  }
  
  const fichiers = fs.readdirSync(dossierPath);
  const rapports = fichiers
    .filter(f => f.endsWith('_rapport.json'))
    .map(f => {
      const cheminComplet = path.join(dossierPath, f);
      try {
        const contenu = JSON.parse(fs.readFileSync(cheminComplet, 'utf8'));
        return {
          fichier: f,
          chemin: cheminComplet,
          donnees: contenu,
        };
      } catch (e) {
        return null;
      }
    })
    .filter(r => r !== null);
  
  return rapports;
}

// ============================================================================
// EXTRACTION DES INFORMATIONS ARTISAN
// ============================================================================

function extraireInfosArtisan(rapport) {
  const donnees = rapport.donnees;
  const meta = donnees.meta || {};
  const rapportData = donnees.rapport || {};
  const conformite = donnees.conformite || {};
  
  // Extraire le nom de l'artisan depuis les données
  const entreprise = rapportData.entreprise || 
                     donnees.donnees?.entreprise ||
                     extraireEntrepriseDepuisTexte(donnees);
  
  // Extraire les infos client
  const client = rapportData.client || donnees.donnees?.client || {};
  const travaux = rapportData.travaux || donnees.donnees?.travaux || {};
  
  // Construire le nom du projet
  const nomClient = client.nom || client.email?.split('@')[0] || 'Client';
  const typeTravaux = travaux.type || 'Travaux';
  const nomProjet = `${nomClient} - ${formatTypeTravaux(typeTravaux)}`;
  
  // Indice de sécurité
  const indiceSécurite = rapportData.indiceSécurite || conformite.indiceSécurite || 0;
  const decision = rapportData.decision || conformite.decision || 'EN ATTENTE';
  
  // Statut administratif
  const statut = determinerStatutAdministratif(indiceSécurite, decision, donnees);
  
  // Pièces manquantes (simulation basée sur le rapport)
  const piecesManquantes = determinerPiecesManquantes(donnees);
  
  return {
    artisan: {
      nom: entreprise?.nom || 'Artisan Partenaire',
      siret: entreprise?.siret || 'N/A',
      rge: entreprise?.rge || 'N/A',
      ville: entreprise?.ville || 'N/A',
    },
    projet: {
      nom: nomProjet,
      fichier: rapport.fichier,
      dateTraitement: meta.dateTraitement || new Date().toISOString(),
    },
    client: {
      nom: client.nom || 'N/A',
      email: client.email || 'N/A',
      ville: client.localisation || client.ville || 'N/A',
    },
    travaux: {
      type: typeTravaux,
      ficheCEE: travaux.ficheCEE || travaux.fichesCEE?.[0] || 'N/A',
      montantTTC: travaux.montantTTC || rapportData.montants?.ttc || 0,
    },
    conformite: {
      indiceSécurite,
      decision,
      pointsConformes: rapportData.pointsConformes?.length || conformite.pointsConformes?.length || 0,
      pointsAlerte: rapportData.pointsAlerte?.length || conformite.pointsAlerte?.length || 0,
      pointsBloquants: rapportData.pointsBloquants?.length || conformite.pointsBloquants?.length || 0,
    },
    statut,
    piecesManquantes,
  };
}

function extraireEntrepriseDepuisTexte(donnees) {
  // Essayer d'extraire depuis le texte brut
  const texte = donnees.donnees?.texte_brut || '';
  const siretMatch = texte.match(/SIRET[:\s]*(\d[\d\s]{12,})/i);
  const rgeMatch = texte.match(/RGE[:\s]*([\w\s-]+)/i);
  
  return {
    nom: 'Artisan Partenaire',
    siret: siretMatch ? siretMatch[1].replace(/\s/g, '') : 'N/A',
    rge: rgeMatch ? rgeMatch[1].trim() : 'N/A',
  };
}

function formatTypeTravaux(type) {
  if (!type) return 'Travaux';
  
  const mapping = {
    'pompe à chaleur': 'PAC',
    'chauffage': 'Chauffage',
    'isolation': 'Isolation',
    'chaudière': 'Chaudière',
  };
  
  const typeLower = type.toLowerCase();
  for (const [key, value] of Object.entries(mapping)) {
    if (typeLower.includes(key)) return value;
  }
  
  return type.substring(0, 20);
}

function determinerStatutAdministratif(indice, decision, donnees) {
  if (decision === 'ACCEPTÉ' && indice === 100) {
    return {
      code: 'COMPLET',
      label: 'Dossier Complet',
      emoji: '✅',
      couleur: '#059669',
    };
  }
  
  if (decision === 'RÉVISION' || (indice >= 50 && indice < 100)) {
    return {
      code: 'RELANCE',
      label: 'Relance Client en cours',
      emoji: '📧',
      couleur: '#d97706',
    };
  }
  
  if (decision === 'REJETÉ' || indice < 50) {
    return {
      code: 'BLOQUE',
      label: 'Dossier Bloqué',
      emoji: '❌',
      couleur: '#dc2626',
    };
  }
  
  return {
    code: 'EN_ATTENTE',
    label: 'En attente',
    emoji: '⏳',
    couleur: '#6b7280',
  };
}

function determinerPiecesManquantes(donnees) {
  // Liste standard des pièces potentiellement manquantes
  const piecesStandard = [
    { id: 'avis_imposition', nom: 'Avis d\'imposition' },
    { id: 'justificatif_domicile', nom: 'Justificatif de domicile' },
    { id: 'piece_identite', nom: 'Pièce d\'identité' },
    { id: 'fiche_technique', nom: 'Fiche technique matériel' },
  ];
  
  // Simuler des pièces manquantes basées sur l'indice
  const indice = donnees.rapport?.indiceSécurite || donnees.conformite?.indiceSécurite || 100;
  
  if (indice === 100) return [];
  if (indice >= 80) return piecesStandard.slice(0, 1);
  if (indice >= 50) return piecesStandard.slice(0, 2);
  return piecesStandard;
}

// ============================================================================
// GÉNÉRATION HTML
// ============================================================================

function genererHTML(infos, alertesReglementaires = null) {
  const dateFormatee = new Date(infos.projet.dateTraitement).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const barreProgression = Math.min(100, Math.max(0, infos.conformite.indiceSécurite));
  const couleurBarre = barreProgression >= 80 ? '#059669' : barreProgression >= 50 ? '#d97706' : '#dc2626';
  
  // Charger les alertes si non fournies
  if (!alertesReglementaires) {
    alertesReglementaires = chargerAlertesReglementaires();
  }
  
  // Filtrer les alertes pour la fiche CEE du projet
  const alertesPertinentes = getAlertesParFiche(infos.travaux.ficheCEE, alertesReglementaires);
  const hasAlertes = alertesPertinentes.length > 0;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Espace Partenaire - ${infos.artisan.nom}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 900px; margin: 0 auto; }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
      color: white;
      padding: 30px;
      border-radius: 16px 16px 0 0;
      text-align: center;
    }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .logo { font-size: 32px; margin-bottom: 10px; }
    
    /* Main Content */
    .main {
      background: white;
      padding: 30px;
      border-radius: 0 0 16px 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    /* Cards */
    .card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
    }
    .card-title {
      font-size: 14px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    /* Projet Card */
    .projet-nom {
      font-size: 22px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 10px;
    }
    .projet-meta {
      display: flex;
      gap: 20px;
      color: #64748b;
      font-size: 14px;
    }
    .projet-meta span { display: flex; align-items: center; gap: 5px; }
    
    /* Indice Card */
    .indice-container {
      display: flex;
      align-items: center;
      gap: 30px;
    }
    .indice-cercle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: conic-gradient(${couleurBarre} ${barreProgression * 3.6}deg, #e2e8f0 0deg);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .indice-cercle::before {
      content: '';
      width: 90px;
      height: 90px;
      background: white;
      border-radius: 50%;
      position: absolute;
    }
    .indice-valeur {
      position: relative;
      font-size: 32px;
      font-weight: 700;
      color: ${couleurBarre};
    }
    .indice-valeur span { font-size: 16px; }
    .indice-details { flex: 1; }
    .indice-decision {
      font-size: 18px;
      font-weight: 600;
      color: ${infos.statut.couleur};
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .indice-stats {
      display: flex;
      gap: 15px;
      font-size: 14px;
      color: #64748b;
    }
    .stat { display: flex; align-items: center; gap: 5px; }
    .stat-ok { color: #059669; }
    .stat-warn { color: #d97706; }
    .stat-err { color: #dc2626; }
    
    /* Statut Card */
    .statut-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 30px;
      font-weight: 600;
      font-size: 16px;
      background: ${infos.statut.couleur}15;
      color: ${infos.statut.couleur};
      border: 2px solid ${infos.statut.couleur}30;
    }
    
    /* Pièces manquantes */
    .pieces-liste {
      list-style: none;
    }
    .pieces-liste li {
      padding: 12px 15px;
      background: #fef3c7;
      border-left: 4px solid #d97706;
      margin-bottom: 8px;
      border-radius: 0 8px 8px 0;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #92400e;
    }
    .pieces-vide {
      padding: 20px;
      text-align: center;
      color: #059669;
      background: #ecfdf5;
      border-radius: 8px;
    }
    
    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .info-item {
      padding: 12px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .info-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
    .info-value { font-weight: 600; color: #1e293b; }
    
    /* Note Anticipation Réglementaire */
    .anticipation {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .anticipation-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
    }
    .anticipation-header h3 {
      color: #92400e;
      font-size: 16px;
      margin: 0;
    }
    .anticipation-badge {
      background: #f59e0b;
      color: white;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }
    .anticipation-note {
      background: white;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 12px;
      border-left: 4px solid #f59e0b;
    }
    .anticipation-note-header {
      font-weight: 600;
      color: #92400e;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .anticipation-note p {
      color: #78350f;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 8px;
    }
    .anticipation-note .delai {
      display: inline-block;
      background: #dc2626;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .anticipation-conseil {
      background: #ecfdf5;
      border-radius: 8px;
      padding: 12px;
      color: #065f46;
      font-size: 13px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .expert-signature {
      margin-top: 15px;
      padding-top: 12px;
      border-top: 1px dashed #d97706;
      font-style: italic;
      color: #92400e;
      font-size: 12px;
      text-align: right;
    }
    
    /* Footer */
    .footer {
      margin-top: 30px;
      padding: 20px;
      text-align: center;
      color: #64748b;
      font-size: 12px;
      border-top: 1px solid #e2e8f0;
    }
    
    @media (max-width: 600px) {
      .indice-container { flex-direction: column; text-align: center; }
      .info-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡</div>
      <h1>Espace Partenaire Capital Énergie</h1>
      <p>${infos.artisan.nom} • ${infos.artisan.ville}</p>
    </div>
    
    <div class="main">
      <!-- Projet -->
      <div class="card">
        <div class="card-title">📋 Projet en cours</div>
        <div class="projet-nom">${infos.projet.nom}</div>
        <div class="projet-meta">
          <span>📅 ${dateFormatee}</span>
          <span>📄 ${infos.travaux.ficheCEE}</span>
          <span>💰 ${infos.travaux.montantTTC.toLocaleString('fr-FR')} €</span>
        </div>
      </div>
      
      <!-- Indice de Sécurité -->
      <div class="card">
        <div class="card-title">🔒 Indice de Sécurité</div>
        <div class="indice-container">
          <div class="indice-cercle">
            <div class="indice-valeur">${infos.conformite.indiceSécurite}<span>%</span></div>
          </div>
          <div class="indice-details">
            <div class="indice-decision">${infos.statut.emoji} ${infos.conformite.decision}</div>
            <div class="indice-stats">
              <span class="stat stat-ok">✅ ${infos.conformite.pointsConformes} conformes</span>
              <span class="stat stat-warn">⚠️ ${infos.conformite.pointsAlerte} alertes</span>
              <span class="stat stat-err">❌ ${infos.conformite.pointsBloquants} bloquants</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Statut Administratif -->
      <div class="card">
        <div class="card-title">📊 Statut Administratif</div>
        <div class="statut-badge">${infos.statut.emoji} ${infos.statut.label}</div>
      </div>
      
      <!-- Pièces Manquantes -->
      <div class="card">
        <div class="card-title">📎 Pièces Justificatives</div>
        ${infos.piecesManquantes.length > 0 ? `
        <ul class="pieces-liste">
          ${infos.piecesManquantes.map(p => `<li>📄 ${p.nom}</li>`).join('')}
        </ul>
        ` : `
        <div class="pieces-vide">✅ Toutes les pièces sont fournies</div>
        `}
      </div>
      
      <!-- Informations Client -->
      <div class="card">
        <div class="card-title">👤 Client</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Nom</div>
            <div class="info-value">${infos.client.nom}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${infos.client.email}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Localisation</div>
            <div class="info-value">${infos.client.ville}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Type de travaux</div>
            <div class="info-value">${infos.travaux.type}</div>
          </div>
        </div>
      </div>
      
      ${hasAlertes ? `
      <!-- Note d'Anticipation Réglementaire -->
      <div class="anticipation">
        <div class="anticipation-header">
          <span style="font-size: 24px;">🔍</span>
          <h3>Note d'Anticipation Réglementaire</h3>
          <span class="anticipation-badge">Service de Veille</span>
        </div>
        
        ${alertesPertinentes.map(alerte => `
        <div class="anticipation-note">
          <div class="anticipation-note-header">
            ${alerte.severite === 'CRITIQUE' ? '🔴' : alerte.severite === 'IMPORTANTE' ? '🟠' : '🟢'}
            ${alerte.titre}
            ${alerte.delaiRestant ? `<span class="delai">${alerte.delaiRestant} jours</span>` : ''}
          </div>
          <p><strong>Contexte :</strong> ${alerte.description}</p>
          <p><strong>Impact sur votre dossier :</strong> ${alerte.impact}</p>
          <div class="anticipation-conseil">
            <span>💡</span>
            <span><strong>Notre recommandation :</strong> ${alerte.recommandation}</span>
          </div>
        </div>
        `).join('')}
        
        <div class="expert-signature">
          — Cellule d'Expertise Réglementaire, Capital Énergie
        </div>
      </div>
      ` : ''}
      
      <div class="footer">
        <p>Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.</p>
        <p style="margin-top: 10px;">Capital Énergie © 2025 • Système d'Audit Automatisé</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// GÉNÉRATION MARKDOWN
// ============================================================================

function genererMarkdown(infos) {
  const dateFormatee = new Date(infos.projet.dateTraitement).toLocaleDateString('fr-FR');
  
  return `# ⚡ Espace Partenaire - ${infos.artisan.nom}

---

## 📋 Projet en cours

**${infos.projet.nom}**

| Info | Valeur |
|------|--------|
| 📅 Date | ${dateFormatee} |
| 📄 Fiche CEE | ${infos.travaux.ficheCEE} |
| 💰 Montant | ${infos.travaux.montantTTC.toLocaleString('fr-FR')} € |

---

## 🔒 Indice de Sécurité

### ${infos.conformite.indiceSécurite}% - ${infos.conformite.decision}

| Statut | Nombre |
|--------|--------|
| ✅ Conformes | ${infos.conformite.pointsConformes} |
| ⚠️ Alertes | ${infos.conformite.pointsAlerte} |
| ❌ Bloquants | ${infos.conformite.pointsBloquants} |

---

## 📊 Statut Administratif

> ${infos.statut.emoji} **${infos.statut.label}**

---

## 📎 Pièces Justificatives

${infos.piecesManquantes.length > 0 
  ? infos.piecesManquantes.map(p => `- ⚠️ **${p.nom}** - Manquant`).join('\n')
  : '✅ Toutes les pièces sont fournies'}

---

## 👤 Client

| Champ | Valeur |
|-------|--------|
| Nom | ${infos.client.nom} |
| Email | ${infos.client.email} |
| Ville | ${infos.client.ville} |
| Travaux | ${infos.travaux.type} |

---

*Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.*

Capital Énergie © 2025
`;
}

// ============================================================================
// GÉNÉRATION DES ESPACES
// ============================================================================

function genererEspaces() {
  const rapports = scannerDossiersTraites();
  
  if (rapports.length === 0) {
    console.log('\n  ⚠️  Aucun rapport trouvé dans ./traites/\n');
    return [];
  }
  
  // Créer le dossier de sortie
  if (!fs.existsSync(CONFIG.dossierEspaces)) {
    fs.mkdirSync(CONFIG.dossierEspaces, { recursive: true });
  }
  
  const espacesGeneres = [];
  
  rapports.forEach(rapport => {
    try {
      const infos = extraireInfosArtisan(rapport);
      
      // Générer le nom du fichier
      const nomArtisan = infos.artisan.nom.replace(/[^a-zA-Z0-9]/g, '-');
      const extension = CONFIG.formatSortie === 'html' ? 'html' : 'md';
      const nomFichier = `suivi-${nomArtisan}.${extension}`;
      const cheminSortie = path.join(CONFIG.dossierEspaces, nomFichier);
      
      // Générer le contenu
      const contenu = CONFIG.formatSortie === 'html' 
        ? genererHTML(infos) 
        : genererMarkdown(infos);
      
      // Écrire le fichier
      fs.writeFileSync(cheminSortie, contenu);
      
      espacesGeneres.push({
        artisan: infos.artisan.nom,
        fichier: nomFichier,
        chemin: cheminSortie,
        infos,
      });
      
    } catch (error) {
      console.error(`  ❌ Erreur pour ${rapport.fichier}: ${error.message}`);
    }
  });
  
  return espacesGeneres;
}

// ============================================================================
// APERÇU (DONNÉES TEST)
// ============================================================================

function genererApercu() {
  // Données de test pour l'aperçu
  const infosTest = {
    artisan: {
      nom: 'EcoTherm Solutions',
      siret: '987 654 321 00015',
      rge: 'RGE QualiPAC N°2025-98765',
      ville: 'Lyon',
    },
    projet: {
      nom: 'Martin Sophie - PAC Air/Eau',
      fichier: 'devis-martin_rapport.json',
      dateTraitement: new Date().toISOString(),
    },
    client: {
      nom: 'Sophie Martin',
      email: 'sophie.martin@email.fr',
      ville: 'Lyon 69003',
    },
    travaux: {
      type: 'Installation Pompe à Chaleur Air/Eau',
      ficheCEE: 'BAR-TH-104',
      montantTTC: 12850,
    },
    conformite: {
      indiceSécurite: 88,
      decision: 'RÉVISION',
      pointsConformes: 7,
      pointsAlerte: 2,
      pointsBloquants: 0,
    },
    statut: {
      code: 'RELANCE',
      label: 'Relance Client en cours',
      emoji: '📧',
      couleur: '#d97706',
    },
    piecesManquantes: [
      { id: 'avis_imposition', nom: 'Avis d\'imposition' },
      { id: 'justificatif_domicile', nom: 'Justificatif de domicile' },
    ],
  };
  
  // Créer le dossier si nécessaire
  if (!fs.existsSync(CONFIG.dossierEspaces)) {
    fs.mkdirSync(CONFIG.dossierEspaces, { recursive: true });
  }
  
  // Générer HTML
  const htmlContent = genererHTML(infosTest);
  const htmlPath = path.join(CONFIG.dossierEspaces, 'apercu-test.html');
  fs.writeFileSync(htmlPath, htmlContent);
  
  // Générer MD
  const mdContent = genererMarkdown(infosTest);
  const mdPath = path.join(CONFIG.dossierEspaces, 'apercu-test.md');
  fs.writeFileSync(mdPath, mdContent);
  
  return { htmlPath, mdPath, infos: infosTest };
}

// ============================================================================
// AFFICHAGE
// ============================================================================

function afficherTableauBord(infos) {
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  ⚡ TABLEAU DE BORD PARTENAIRE                          │');
  console.log('  └─────────────────────────────────────────────────────────┘\n');
  
  console.log(`  🏢 Artisan : ${infos.artisan.nom}`);
  console.log(`  📍 Ville   : ${infos.artisan.ville}`);
  console.log(`  🔧 RGE     : ${infos.artisan.rge}\n`);
  
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  📋 PROJET EN COURS\n');
  console.log(`     ${infos.projet.nom}`);
  console.log(`     📄 ${infos.travaux.ficheCEE} • 💰 ${infos.travaux.montantTTC.toLocaleString('fr-FR')} €\n`);
  
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  🔒 INDICE DE SÉCURITÉ\n');
  
  const barre = genererBarreProgres(infos.conformite.indiceSécurite);
  const emoji = infos.conformite.indiceSécurite >= 80 ? '🟢' : 
                infos.conformite.indiceSécurite >= 50 ? '🟡' : '🔴';
  
  console.log(`     ${emoji} ${infos.conformite.indiceSécurite}% ${barre}`);
  console.log(`     📋 Décision : ${infos.conformite.decision}\n`);
  console.log(`     ✅ ${infos.conformite.pointsConformes} conformes | ⚠️ ${infos.conformite.pointsAlerte} alertes | ❌ ${infos.conformite.pointsBloquants} bloquants\n`);
  
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  📊 STATUT ADMINISTRATIF\n');
  console.log(`     ${infos.statut.emoji} ${infos.statut.label}\n`);
  
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  📎 PIÈCES MANQUANTES\n');
  
  if (infos.piecesManquantes.length === 0) {
    console.log('     ✅ Toutes les pièces sont fournies\n');
  } else {
    infos.piecesManquantes.forEach(p => {
      console.log(`     ⚠️  ${p.nom}`);
    });
    console.log('');
  }
  
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  👤 CLIENT\n');
  console.log(`     Nom   : ${infos.client.nom}`);
  console.log(`     Email : ${infos.client.email}`);
  console.log(`     Ville : ${infos.client.ville}\n`);
  
  // Afficher les alertes réglementaires si présentes
  const alertes = chargerAlertesReglementaires();
  const alertesPertinentes = getAlertesParFiche(infos.travaux.ficheCEE, alertes);
  
  if (alertesPertinentes.length > 0) {
    console.log('  ─────────────────────────────────────────────────────────');
    console.log('  🔍 NOTE D\'ANTICIPATION RÉGLEMENTAIRE\n');
    console.log('     Service de Veille - Cellule d\'Expertise\n');
    
    alertesPertinentes.forEach(alerte => {
      const emoji = alerte.severite === 'CRITIQUE' ? '🔴' : alerte.severite === 'IMPORTANTE' ? '🟠' : '🟢';
      console.log(`     ${emoji} ${alerte.titre}`);
      if (alerte.delaiRestant) {
        console.log(`        ⏱️  Délai : ${alerte.delaiRestant} jours`);
      }
      console.log(`        💡 ${alerte.recommandation}\n`);
    });
  }
}

function genererBarreProgres(pourcentage) {
  const largeur = 20;
  const rempli = Math.round((pourcentage / 100) * largeur);
  const vide = largeur - rempli;
  return '[' + '█'.repeat(rempli) + '░'.repeat(vide) + ']';
}

// ============================================================================
// INTERFACE LIGNE DE COMMANDE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const commande = args[0] || 'help';

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   CAPITAL ÉNERGIE - GÉNÉRATEUR ESPACE PARTENAIRE v1.0.0   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  switch (commande) {
    case 'generer':
    case 'generate': {
      console.log('\n  🔄 Génération des espaces partenaires...\n');
      
      const espaces = genererEspaces();
      
      if (espaces.length > 0) {
        console.log('  ┌─────────────────────────────────────────────────────────┐');
        console.log('  │  ✅ ESPACES GÉNÉRÉS                                     │');
        console.log('  └─────────────────────────────────────────────────────────┘\n');
        
        espaces.forEach(e => {
          console.log(`     📄 ${e.fichier}`);
          console.log(`        Artisan: ${e.artisan}`);
          console.log(`        Indice: ${e.infos.conformite.indiceSécurite}% - ${e.infos.statut.label}\n`);
        });
        
        console.log(`  📁 Dossier de sortie : ${path.resolve(CONFIG.dossierEspaces)}\n`);
      }
      break;
    }
    
    case 'apercu':
    case 'preview': {
      console.log('\n  🎨 Génération de l\'aperçu test...\n');
      
      const { htmlPath, mdPath, infos } = genererApercu();
      
      afficherTableauBord(infos);
      
      console.log('  ═══════════════════════════════════════════════════════════');
      console.log('  📁 FICHIERS GÉNÉRÉS\n');
      console.log(`     📄 HTML : ${htmlPath}`);
      console.log(`     📄 MD   : ${mdPath}\n`);
      console.log('  💡 Ouvrez le fichier HTML dans un navigateur pour voir le rendu.\n');
      break;
    }
    
    case 'liste':
    case 'list': {
      console.log('\n  📋 Dossiers traités disponibles :\n');
      
      const rapports = scannerDossiersTraites();
      
      if (rapports.length === 0) {
        console.log('     ⚠️  Aucun rapport trouvé dans ./traites/\n');
      } else {
        rapports.forEach((r, i) => {
          const infos = extraireInfosArtisan(r);
          console.log(`     ${i + 1}. ${r.fichier}`);
          console.log(`        Projet: ${infos.projet.nom}`);
          console.log(`        Indice: ${infos.conformite.indiceSécurite}%\n`);
        });
      }
      break;
    }
    
    case 'help':
    default: {
      console.log('\n  📖 COMMANDES DISPONIBLES :\n');
      console.log('  generer              Génère les espaces pour tous les artisans');
      console.log('                       depuis ./traites/');
      console.log('');
      console.log('  apercu               Génère un aperçu avec données test');
      console.log('');
      console.log('  liste                Liste les dossiers traités disponibles');
      console.log('');
      console.log('  help                 Affiche cette aide');
      console.log('');
      console.log('  📁 DOSSIERS :');
      console.log(`     Entrée  : ${CONFIG.dossierTraites}`);
      console.log(`     Sortie  : ${CONFIG.dossierEspaces}`);
      console.log('');
      console.log('  💡 EXEMPLE :');
      console.log('     node generateur-espace-partenaire.js apercu');
      console.log('');
    }
  }
}

// Exécution
main().catch(console.error);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  scannerDossiersTraites,
  extraireInfosArtisan,
  genererHTML,
  genererMarkdown,
  genererEspaces,
  genererApercu,
  chargerAlertesReglementaires,
  getAlertesParFiche,
  CONFIG,
};
