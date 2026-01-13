/**
 * ============================================================================
 * CAPITAL ÉNERGIE - AGENT INBOUND (RÉCEPTION EMAILS)
 * ============================================================================
 * Script de surveillance des emails entrants et traitement automatique
 * 
 * Usage :
 *   node agent-inbound.js watch              Démarre la surveillance
 *   node agent-inbound.js process <fichier>  Traite un fichier manuellement
 *   node agent-inbound.js test               Simule un dépôt de fichier
 *   node agent-inbound.js batch <dossier>    Traite un lot de fichiers
 * 
 * Fonctionnement :
 *   1. Surveille le dossier ./entree-emails
 *   2. Détecte les nouveaux fichiers PDF (traitement par lots)
 *   3. Lance automatiquement le pipeline-administratif.js
 *   4. Génère un rapport consolidé via le Générateur Espace Partenaire
 *   5. Alerte si zone de risque trésorerie détectée
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { traiterDossier } = require('./pipeline-administratif');
const { genererHTML } = require('./generateur-espace-partenaire');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  dossierEntree: './entree-emails',
  dossierTraites: './traites',
  dossierErreurs: './erreurs',
  dossierRapports: './espaces-partenaires',
  extensionsAutorisees: ['.pdf'],
  intervalSurveillance: 3000, // 3 secondes
  delaiRegroupement: 2000, // Délai pour regrouper les fichiers arrivant ensemble
  traitementAuto: true,
  seuilRisqueTresorerie: 80, // Indice en dessous duquel on déclenche une alerte
};

// État de la surveillance
let fichiersConnus = new Set();
let enCours = false;
let lotEnAttente = [];
let timerLot = null;

// ============================================================================
// INITIALISATION
// ============================================================================

/**
 * Initialise les dossiers nécessaires
 */
function initialiserDossiers() {
  const dossiers = [
    CONFIG.dossierEntree,
    CONFIG.dossierTraites,
    CONFIG.dossierErreurs,
  ];
  
  dossiers.forEach(dossier => {
    if (!fs.existsSync(dossier)) {
      fs.mkdirSync(dossier, { recursive: true });
      console.log(`  📁 Dossier créé : ${dossier}`);
    }
  });
}

/**
 * Charge la liste des fichiers déjà présents
 */
function chargerFichiersExistants() {
  if (fs.existsSync(CONFIG.dossierEntree)) {
    const fichiers = fs.readdirSync(CONFIG.dossierEntree);
    fichiers.forEach(f => fichiersConnus.add(f));
    return fichiers.length;
  }
  return 0;
}

// ============================================================================
// SURVEILLANCE DU DOSSIER
// ============================================================================

/**
 * Démarre la surveillance du dossier d'entrée
 */
function demarrerSurveillance() {
  console.log('\n' + '═'.repeat(63));
  console.log('  👁️  AGENT INBOUND - MODE SURVEILLANCE');
  console.log('═'.repeat(63) + '\n');
  
  initialiserDossiers();
  const existants = chargerFichiersExistants();
  
  console.log(`  📂 Dossier surveillé : ${path.resolve(CONFIG.dossierEntree)}`);
  console.log(`  📄 Fichiers existants : ${existants}`);
  console.log(`  ⏱️  Intervalle : ${CONFIG.intervalSurveillance / 1000}s`);
  console.log(`  🔄 Traitement auto : ${CONFIG.traitementAuto ? 'Activé' : 'Désactivé'}`);
  console.log('\n  ─────────────────────────────────────────────────────────');
  console.log('  ⏳ En attente de nouveaux fichiers PDF...');
  console.log('     (Ctrl+C pour arrêter)\n');

  // Boucle de surveillance
  setInterval(async () => {
    if (enCours) return;
    
    try {
      await verifierNouveauxFichiers();
    } catch (error) {
      console.error(`  ❌ Erreur surveillance : ${error.message}`);
    }
  }, CONFIG.intervalSurveillance);
}

/**
 * Vérifie s'il y a de nouveaux fichiers dans le dossier
 * Regroupe les fichiers arrivant ensemble pour traitement par lots
 */
async function verifierNouveauxFichiers() {
  if (!fs.existsSync(CONFIG.dossierEntree)) return;
  
  const fichiers = fs.readdirSync(CONFIG.dossierEntree);
  let nouveauxFichiers = [];
  
  for (const fichier of fichiers) {
    // Ignorer les fichiers déjà connus
    if (fichiersConnus.has(fichier)) continue;
    
    // Vérifier l'extension
    const ext = path.extname(fichier).toLowerCase();
    if (!CONFIG.extensionsAutorisees.includes(ext)) {
      fichiersConnus.add(fichier);
      continue;
    }
    
    // Nouveau fichier PDF détecté !
    fichiersConnus.add(fichier);
    nouveauxFichiers.push(fichier);
  }
  
  // Si de nouveaux fichiers sont détectés, les ajouter au lot en attente
  if (nouveauxFichiers.length > 0) {
    lotEnAttente.push(...nouveauxFichiers);
    
    console.log('\n  ─────────────────────────────────────────────────────────');
    console.log(`  📥 ${nouveauxFichiers.length} NOUVEAU(X) FICHIER(S) DÉTECTÉ(S)`);
    nouveauxFichiers.forEach(f => console.log(`     → ${f}`));
    console.log('  ─────────────────────────────────────────────────────────');
    
    // Réinitialiser le timer pour regrouper les fichiers arrivant ensemble
    if (timerLot) clearTimeout(timerLot);
    
    timerLot = setTimeout(async () => {
      if (CONFIG.traitementAuto && lotEnAttente.length > 0) {
        await traiterLot([...lotEnAttente]);
        lotEnAttente = [];
      }
    }, CONFIG.delaiRegroupement);
  }
}

// ============================================================================
// TRAITEMENT PAR LOTS
// ============================================================================

/**
 * Traite un lot de fichiers PDF de manière séquentielle
 * @param {string[]} fichiers - Liste des noms de fichiers à traiter
 */
async function traiterLot(fichiers) {
  enCours = true;
  
  const horodatage = new Date().toLocaleString('fr-FR');
  const resultatsLot = [];
  let alertesRisque = [];
  
  console.log('\n' + '═'.repeat(63));
  console.log('  📦 TRAITEMENT PAR LOT - ' + fichiers.length + ' DOSSIER(S)');
  console.log('═'.repeat(63));
  console.log(`  📅 ${horodatage}\n`);
  
  // Traiter chaque fichier séquentiellement
  for (let i = 0; i < fichiers.length; i++) {
    const fichier = fichiers[i];
    console.log(`  ┌─────────────────────────────────────────────────────────┐`);
    console.log(`  │  ⚡ [${i + 1}/${fichiers.length}] ${fichier.substring(0, 43).padEnd(43)}│`);
    console.log(`  └─────────────────────────────────────────────────────────┘\n`);
    
    const resultat = await traiterFichierEntrant(fichier, false);
    resultatsLot.push({
      fichier,
      ...resultat,
    });
    
    // Détecter les zones de risque trésorerie
    if (resultat.indiceSécurite !== undefined && resultat.indiceSécurite < CONFIG.seuilRisqueTresorerie) {
      alertesRisque.push({
        fichier,
        indice: resultat.indiceSécurite,
        decision: resultat.decision,
      });
    }
  }
  
  // Générer le rapport consolidé
  await genererRapportConsolide(resultatsLot);
  
  // Afficher les alertes prioritaires si nécessaire
  if (alertesRisque.length > 0) {
    afficherAlertePrioritaire(alertesRisque);
  }
  
  // Résumé du lot
  afficherResumeLot(resultatsLot);
  
  console.log('\n  ─────────────────────────────────────────────────────────');
  console.log('  ⏳ En attente de nouveaux fichiers PDF...\n');
  
  enCours = false;
}

/**
 * Génère un rapport HTML consolidé pour tous les dossiers du lot
 */
async function genererRapportConsolide(resultatsLot) {
  if (resultatsLot.length === 0) return;
  
  // Créer le dossier de rapports si nécessaire
  if (!fs.existsSync(CONFIG.dossierRapports)) {
    fs.mkdirSync(CONFIG.dossierRapports, { recursive: true });
  }
  
  // Extraire le nom du client/artisan depuis le premier dossier
  const premierResultat = resultatsLot[0];
  const nomClient = premierResultat.client?.nom || 
                    premierResultat.artisan?.nom || 
                    'Client';
  const nomClientSafe = nomClient.replace(/[^a-zA-Z0-9]/g, '-');
  
  const dateStr = new Date().toISOString().split('T')[0];
  const nomFichier = `Suivi-${nomClientSafe}-${resultatsLot.length}-dossiers-${dateStr}.html`;
  const cheminRapport = path.join(CONFIG.dossierRapports, nomFichier);
  
  // Générer le HTML consolidé
  const htmlContent = genererHTMLConsolide(resultatsLot, nomClient);
  fs.writeFileSync(cheminRapport, htmlContent);
  
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  📊 RAPPORT CONSOLIDÉ GÉNÉRÉ                            │');
  console.log('  └─────────────────────────────────────────────────────────┘');
  console.log(`  📄 ${nomFichier}`);
  console.log(`  📁 ${path.resolve(CONFIG.dossierRapports)}`);
}

/**
 * Génère le HTML pour un rapport consolidé multi-dossiers
 */
function genererHTMLConsolide(resultats, nomClient) {
  const dateFormatee = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  
  const indiceMoyen = resultats.reduce((sum, r) => sum + (r.indiceSécurite || 0), 0) / resultats.length;
  const nbRisques = resultats.filter(r => (r.indiceSécurite || 0) < CONFIG.seuilRisqueTresorerie).length;
  
  const lignesDossiers = resultats.map((r, i) => {
    const indice = r.indiceSécurite || 0;
    const couleur = indice >= 80 ? '#059669' : indice >= 50 ? '#d97706' : '#dc2626';
    const emoji = indice >= 80 ? '✅' : indice >= 50 ? '⚠️' : '❌';
    
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${r.fichier}</td>
        <td style="color: ${couleur}; font-weight: bold;">${emoji} ${indice}%</td>
        <td>${r.decision || 'N/A'}</td>
        <td>${r.succes ? '✅ Traité' : '❌ Erreur'}</td>
      </tr>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Suivi Consolidé - ${nomClient}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f1f5f9; padding: 20px; }
    .container { max-width: 1000px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: white; padding: 30px; border-radius: 16px 16px 0 0; text-align: center; }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .main { background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
    .stat { background: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; }
    .stat-value { font-size: 32px; font-weight: 700; color: #0891b2; }
    .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-size: 12px; text-transform: uppercase; color: #64748b; }
    tr:hover { background: #f8fafc; }
    .alerte { background: #fef2f2; border: 2px solid #dc2626; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .alerte h3 { color: #dc2626; margin-bottom: 10px; }
    .footer { margin-top: 30px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 32px; margin-bottom: 10px;">⚡</div>
      <h1>Rapport Consolidé - ${nomClient}</h1>
      <p>${dateFormatee} • ${resultats.length} dossier(s) analysé(s)</p>
    </div>
    <div class="main">
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${resultats.length}</div>
          <div class="stat-label">Dossiers</div>
        </div>
        <div class="stat">
          <div class="stat-value">${Math.round(indiceMoyen)}%</div>
          <div class="stat-label">Indice Moyen</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: #059669;">${resultats.length - nbRisques}</div>
          <div class="stat-label">Conformes</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: ${nbRisques > 0 ? '#dc2626' : '#059669'};">${nbRisques}</div>
          <div class="stat-label">Zones de Risque</div>
        </div>
      </div>
      
      ${nbRisques > 0 ? `
      <div class="alerte">
        <h3>🚨 ${nbRisques} Zone(s) de Risque Trésorerie Détectée(s)</h3>
        <p>Ces dossiers nécessitent une attention immédiate pour éviter un blocage de paiement.</p>
      </div>` : ''}
      
      <h2 style="margin-bottom: 15px;">📋 Détail des Dossiers</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Fichier</th>
            <th>Indice Sécurité</th>
            <th>Décision</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${lignesDossiers}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.</p>
        <p style="margin-top: 10px;">Capital Énergie © 2025</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Affiche une alerte prioritaire pour les zones de risque trésorerie
 */
function afficherAlertePrioritaire(alertes) {
  console.log('\n');
  console.log('  ╔═══════════════════════════════════════════════════════════╗');
  console.log('  ║                                                           ║');
  console.log('  ║   🚨🚨🚨 ALERTE PRIORITAIRE - RISQUE TRÉSORERIE 🚨🚨🚨   ║');
  console.log('  ║                                                           ║');
  console.log('  ╠═══════════════════════════════════════════════════════════╣');
  
  alertes.forEach(alerte => {
    const fichierTronque = alerte.fichier.substring(0, 45).padEnd(45);
    console.log(`  ║   ❌ ${fichierTronque}${String(alerte.indice).padStart(3)}% ║`);
  });
  
  console.log('  ║                                                           ║');
  console.log('  ║   ⚠️  Ces dossiers risquent un BLOCAGE DE PAIEMENT !      ║');
  console.log('  ║   👉 Action immédiate recommandée                         ║');
  console.log('  ║                                                           ║');
  console.log('  ╚═══════════════════════════════════════════════════════════╝\n');
  
  // Son d'alerte (BEL character)
  process.stdout.write('\x07');
}

/**
 * Affiche le résumé du traitement par lot
 */
function afficherResumeLot(resultats) {
  const succes = resultats.filter(r => r.succes).length;
  const echecs = resultats.length - succes;
  const indiceMoyen = resultats.reduce((sum, r) => sum + (r.indiceSécurite || 0), 0) / resultats.length;
  
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  📊 RÉSUMÉ DU LOT                                       │');
  console.log('  └─────────────────────────────────────────────────────────┘');
  console.log(`  📁 Total traité    : ${resultats.length} dossier(s)`);
  console.log(`  ✅ Succès          : ${succes}`);
  console.log(`  ❌ Échecs          : ${echecs}`);
  console.log(`  📈 Indice moyen    : ${Math.round(indiceMoyen)}%`);
}

// ============================================================================
// TRAITEMENT DES FICHIERS INDIVIDUELS
// ============================================================================

/**
 * Traite un fichier PDF entrant via le pipeline administratif
 * @param {string} nomFichier - Nom du fichier à traiter
 * @param {boolean} afficherAttente - Afficher le message d'attente après traitement
 * @returns {Object} Résultat du traitement
 */
async function traiterFichierEntrant(nomFichier, afficherAttente = true) {
  enCours = true;
  
  const cheminComplet = path.join(CONFIG.dossierEntree, nomFichier);
  const horodatage = new Date().toLocaleString('fr-FR');
  
  console.log(`  🚀 Traitement : ${nomFichier}`);
  console.log(`  📅 ${horodatage}\n`);
  
  let resultat = {
    succes: false,
    indiceSécurite: 0,
    decision: 'N/A',
    client: null,
    artisan: null,
  };
  
  try {
    // Lancer le pipeline administratif
    const rapport = await traiterDossier(cheminComplet);
    
    if (rapport.succes) {
      // Déplacer vers le dossier traités
      const destination = path.join(CONFIG.dossierTraites, nomFichier);
      fs.renameSync(cheminComplet, destination);
      
      resultat = {
        succes: true,
        indiceSécurite: rapport.resultat?.indiceSécurite || 0,
        decision: rapport.resultat?.decision || 'N/A',
        client: rapport.resultat?.client || null,
        artisan: rapport.resultat?.artisan || null,
      };
      
      console.log(`  ✅ Succès - Indice: ${resultat.indiceSécurite}% - ${resultat.decision}`);
      console.log(`  📁 → ${CONFIG.dossierTraites}/\n`);
      
    } else {
      // Déplacer vers le dossier erreurs
      const destination = path.join(CONFIG.dossierErreurs, nomFichier);
      fs.renameSync(cheminComplet, destination);
      
      console.log(`  ❌ Échec : ${rapport.erreur || 'Erreur inconnue'}`);
      console.log(`  📁 → ${CONFIG.dossierErreurs}/\n`);
    }
    
  } catch (error) {
    console.error(`  ❌ Erreur : ${error.message}\n`);
    
    // Tenter de déplacer vers erreurs
    try {
      const destination = path.join(CONFIG.dossierErreurs, nomFichier);
      if (fs.existsSync(cheminComplet)) {
        fs.renameSync(cheminComplet, destination);
      }
    } catch (e) {
      // Ignorer
    }
  }
  
  if (afficherAttente) {
    console.log('\n  ─────────────────────────────────────────────────────────');
    console.log('  ⏳ En attente de nouveaux fichiers PDF...\n');
    enCours = false;
  }
  
  return resultat;
}

/**
 * Affiche une notification de succès stylisée
 */
function afficherNotificationSucces(nomFichier, rapport) {
  const indicateur = rapport.resultat?.indiceSécurite >= 80 ? '🟢' :
                     rapport.resultat?.indiceSécurite >= 50 ? '🟡' : '🔴';
  
  console.log('\n  ╔═══════════════════════════════════════════════════════════╗');
  console.log('  ║                                                           ║');
  console.log(`  ║   ${indicateur} AUDIT FLASH COMPLÉTÉ                            ║`);
  console.log('  ║                                                           ║');
  console.log(`  ║   Devis : ${nomFichier.substring(0, 45).padEnd(45)}║`);
  console.log(`  ║   Indice de Sécurité : ${String(rapport.resultat?.indiceSécurite || 0).padEnd(3)}%                          ║`);
  console.log(`  ║   Décision : ${String(rapport.resultat?.decision || 'N/A').padEnd(42)}║`);
  console.log('  ║                                                           ║');
  console.log('  ╚═══════════════════════════════════════════════════════════╝\n');
}

// ============================================================================
// SIMULATION DE TEST
// ============================================================================

/**
 * Simule le dépôt d'un fichier pour tester le pipeline
 */
async function simulerDepot() {
  console.log('\n' + '═'.repeat(63));
  console.log('  🧪 SIMULATION - DÉPÔT DE FICHIER');
  console.log('═'.repeat(63) + '\n');
  
  initialiserDossiers();
  
  // Vérifier si devis-test.pdf existe
  const fichierSource = './devis-test.pdf';
  const fichierDest = path.join(CONFIG.dossierEntree, 'devis-test-simulation.pdf');
  
  if (!fs.existsSync(fichierSource)) {
    console.log('  ❌ Fichier devis-test.pdf non trouvé.');
    console.log('     Lancez d\'abord : node generer-test-pdf.js\n');
    return;
  }
  
  // Copier le fichier dans le dossier d'entrée
  fs.copyFileSync(fichierSource, fichierDest);
  console.log(`  📥 Fichier déposé : ${fichierDest}\n`);
  
  // Traiter le fichier
  await traiterFichierEntrant('devis-test-simulation.pdf');
}

// ============================================================================
// TRAITEMENT MANUEL
// ============================================================================

/**
 * Traite un fichier spécifique manuellement
 */
async function traiterManuellement(cheminFichier) {
  console.log('\n' + '═'.repeat(63));
  console.log('  📄 TRAITEMENT MANUEL');
  console.log('═'.repeat(63) + '\n');
  
  if (!fs.existsSync(cheminFichier)) {
    console.log(`  ❌ Fichier non trouvé : ${cheminFichier}\n`);
    return;
  }
  
  const nomFichier = path.basename(cheminFichier);
  
  console.log(`  🚀 Audit Flash lancé pour le devis : ${nomFichier}\n`);
  
  try {
    const rapport = await traiterDossier(cheminFichier);
    
    if (rapport.succes) {
      afficherNotificationSucces(nomFichier, rapport);
    } else {
      console.log(`\n  ❌ Échec : ${rapport.erreur}\n`);
    }
  } catch (error) {
    console.error(`\n  ❌ Erreur : ${error.message}\n`);
  }
}

// ============================================================================
// INTERFACE LIGNE DE COMMANDE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const commande = args[0] || 'help';

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   CAPITAL ÉNERGIE - AGENT INBOUND v1.0.0                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  switch (commande) {
    case 'watch':
    case 'surveiller': {
      demarrerSurveillance();
      break;
    }
    
    case 'process':
    case 'traiter': {
      const fichier = args[1];
      if (!fichier) {
        console.log('\n  ❌ Usage : node agent-inbound.js process <fichier.pdf>\n');
        break;
      }
      await traiterManuellement(fichier);
      break;
    }
    
    case 'test':
    case 'simulation': {
      await simulerDepot();
      break;
    }
    
    case 'batch':
    case 'lot': {
      const dossier = args[1] || CONFIG.dossierEntree;
      console.log(`\n  📦 Traitement par lot du dossier : ${dossier}\n`);
      
      if (!fs.existsSync(dossier)) {
        console.log(`  ❌ Dossier non trouvé : ${dossier}\n`);
        break;
      }
      
      const fichiers = fs.readdirSync(dossier)
        .filter(f => CONFIG.extensionsAutorisees.includes(path.extname(f).toLowerCase()));
      
      if (fichiers.length === 0) {
        console.log('  ⚠️  Aucun fichier PDF trouvé dans le dossier.\n');
        break;
      }
      
      // Copier les fichiers dans le dossier d'entrée si nécessaire
      if (dossier !== CONFIG.dossierEntree) {
        initialiserDossiers();
        fichiers.forEach(f => {
          const src = path.join(dossier, f);
          const dest = path.join(CONFIG.dossierEntree, f);
          fs.copyFileSync(src, dest);
        });
      }
      
      await traiterLot(fichiers);
      break;
    }
    
    case 'help':
    default: {
      console.log('\n  📖 COMMANDES DISPONIBLES :\n');
      console.log('  watch                Démarre la surveillance du dossier');
      console.log('                       Détection groupée + traitement par lots');
      console.log('');
      console.log('  batch [dossier]      Traite un lot de fichiers PDF');
      console.log('                       Génère un rapport consolidé');
      console.log('');
      console.log('  process <fichier>    Traite un fichier PDF manuellement');
      console.log('');
      console.log('  test                 Simule un dépôt avec devis-test.pdf');
      console.log('');
      console.log('  help                 Affiche cette aide');
      console.log('');
      console.log('  📁 DOSSIERS :');
      console.log('     ./entree-emails   Déposez vos PDF ici');
      console.log('     ./traites         Fichiers traités avec succès');
      console.log('     ./erreurs         Fichiers en erreur');
      console.log('     ./espaces-partenaires  Rapports consolidés');
      console.log('');
      console.log('  🚨 ALERTES :');
      console.log('     Zone de Risque Trésorerie si indice < 80%');
      console.log('');
      console.log('  💡 EXEMPLE :');
      console.log('     node agent-inbound.js watch');
      console.log('     node agent-inbound.js batch ./mes-devis\n');
    }
  }
}

// Exécution
main().catch(console.error);

// ============================================================================
// EXPORTS (pour utilisation comme module)
// ============================================================================

module.exports = {
  demarrerSurveillance,
  traiterFichierEntrant,
  traiterLot,
  traiterManuellement,
  simulerDepot,
  genererRapportConsolide,
  afficherAlertePrioritaire,
  CONFIG,
};
