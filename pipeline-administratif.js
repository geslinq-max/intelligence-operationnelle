/**
 * ============================================================================
 * CAPITAL ÉNERGIE - PIPELINE ADMINISTRATIF CEE
 * ============================================================================
 * Script d'orchestration du flux de travail complet :
 * 1. Lecture du devis PDF (lecteur-devis.js)
 * 2. Vérification de conformité (conformite-cee.js)
 * 3. Génération du rapport consolidé
 * 
 * Usage :
 *   node pipeline-administratif.js traiter <devis.pdf>
 *   node pipeline-administratif.js batch <dossier/>
 * 
 * Exemple :
 *   node pipeline-administratif.js traiter devis-test.pdf
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// Import des modules agents
const { analyserDevis } = require('./lecteur-devis');
const { verifierDossier, REGLES_CEE } = require('./conformite-cee');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  seuilAcceptation: 80,      // Indice minimum pour acceptation automatique
  seuilRevision: 50,         // Indice minimum pour révision manuelle
  exportRapport: true,       // Exporter le rapport en JSON
  afficherTexteBrut: false,  // Afficher le texte extrait du PDF
};

// ============================================================================
// FONCTION PRINCIPALE : TRAITER DOSSIER
// ============================================================================

/**
 * Traite un dossier CEE complet : lecture PDF + vérification conformité
 * @param {string} cheminPDF - Chemin vers le fichier PDF du devis
 * @returns {Promise<Object>} Rapport consolidé
 */
async function traiterDossier(cheminPDF) {
  const rapport = {
    dateTraitement: new Date().toISOString(),
    fichier: path.basename(cheminPDF),
    cheminComplet: path.resolve(cheminPDF),
    etapes: [],
    resultat: null,
    succes: false,
  };

  console.log('\n' + '═'.repeat(63));
  console.log('  🚀 PIPELINE ADMINISTRATIF CEE - TRAITEMENT EN COURS');
  console.log('═'.repeat(63) + '\n');
  console.log(`  📄 Fichier : ${rapport.fichier}`);
  console.log(`  📅 Date    : ${new Date().toLocaleString('fr-FR')}\n`);

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // ÉTAPE 1 : LECTURE DU PDF
    // ═══════════════════════════════════════════════════════════════════════
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  ÉTAPE 1/2 : EXTRACTION DES DONNÉES                     │');
    console.log('  └─────────────────────────────────────────────────────────┘\n');

    const startLecture = Date.now();
    const resultatLecture = await analyserDevis(cheminPDF);
    const dureeLecture = Date.now() - startLecture;

    rapport.etapes.push({
      nom: 'Lecture PDF',
      duree: dureeLecture,
      succes: resultatLecture.succes,
      confiance: resultatLecture.devis?.extraction?.confiance || 0,
    });

    if (!resultatLecture.succes) {
      throw new Error('Échec de la lecture du PDF');
    }

    const donnees = resultatLecture.devis;
    
    console.log(`  ✅ Extraction réussie (${dureeLecture}ms)`);
    console.log(`     Confiance : ${donnees.extraction.confiance}%\n`);

    // Résumé des données extraites
    console.log('  📋 DONNÉES EXTRAITES :');
    console.log('  ─────────────────────────────────────────────────────────');
    console.log(`     👤 Client      : ${donnees.client.nom || donnees.client.email || '(non détecté)'}`);
    console.log(`     📍 Ville       : ${donnees.client.ville || '(non détectée)'} ${donnees.client.codePostal || ''}`);
    console.log(`     🔧 Travaux     : ${donnees.travaux.type || '(non détecté)'}`);
    console.log(`     📋 Fiche CEE   : ${donnees.travaux.fichesCEE?.join(', ') || '(non détectée)'}`);
    console.log(`     💰 Montant TTC : ${donnees.montants.totalTTC ? donnees.montants.totalTTC.toFixed(2) + ' €' : '(non détecté)'}`);
    console.log(`     📦 Matériel    : ${donnees.materiel.marque || ''} ${donnees.materiel.reference || '(non détecté)'}`);
    console.log('  ─────────────────────────────────────────────────────────\n');

    // ═══════════════════════════════════════════════════════════════════════
    // ÉTAPE 2 : VÉRIFICATION CONFORMITÉ
    // ═══════════════════════════════════════════════════════════════════════
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  ÉTAPE 2/2 : CONTRÔLE DE CONFORMITÉ                     │');
    console.log('  └─────────────────────────────────────────────────────────┘\n');

    const startVerif = Date.now();
    const resultatVerif = verifierDossier(donnees);
    const dureeVerif = Date.now() - startVerif;

    rapport.etapes.push({
      nom: 'Vérification conformité',
      duree: dureeVerif,
      succes: true,
      indiceSécurite: resultatVerif.indiceSécurite,
    });

    console.log(`  ✅ Vérification terminée (${dureeVerif}ms)\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // RAPPORT FINAL CONSOLIDÉ
    // ═══════════════════════════════════════════════════════════════════════
    rapport.resultat = genererRapportConsolide(donnees, resultatVerif);
    rapport.succes = true;

    afficherRapportFinal(rapport.resultat);

    // Export du rapport
    if (CONFIG.exportRapport) {
      const rapportPath = cheminPDF.replace('.pdf', '_rapport.json');
      fs.writeFileSync(rapportPath, JSON.stringify({
        meta: {
          dateTraitement: rapport.dateTraitement,
          fichier: rapport.fichier,
          dureeTraitement: rapport.etapes.reduce((sum, e) => sum + e.duree, 0),
        },
        donnees: donnees,
        conformite: resultatVerif,
        rapport: rapport.resultat,
      }, null, 2));
      console.log(`  💾 Rapport exporté : ${path.basename(rapportPath)}\n`);
    }

  } catch (error) {
    rapport.succes = false;
    rapport.erreur = error.message;
    console.error(`\n  ❌ ERREUR : ${error.message}\n`);
  }

  return rapport;
}

// ============================================================================
// GÉNÉRATION DU RAPPORT CONSOLIDÉ
// ============================================================================

/**
 * Génère un rapport consolidé à partir des données et de la vérification
 */
function genererRapportConsolide(donnees, verification) {
  const rapport = {
    // Informations principales
    client: {
      nom: donnees.client.nom || donnees.client.email || 'Non identifié',
      contact: donnees.client.email || donnees.client.telephone || 'Non renseigné',
      localisation: `${donnees.client.ville || ''} ${donnees.client.codePostal || ''}`.trim() || 'Non renseignée',
    },
    
    travaux: {
      type: donnees.travaux.type || 'Non détecté',
      fichesCEE: donnees.travaux.fichesCEE || [],
      puissance: donnees.travaux.puissance ? `${donnees.travaux.puissance} kW` : null,
      surface: donnees.travaux.surface ? `${donnees.travaux.surface} m²` : null,
    },
    
    financier: {
      montantTTC: donnees.montants.totalTTC,
      montantHT: donnees.montants.totalHT,
      tva: donnees.montants.tva,
    },
    
    materiel: {
      marque: donnees.materiel.marque || 'Non détectée',
      reference: donnees.materiel.reference || 'Non détectée',
    },
    
    // Indice de sécurité
    indiceSécurite: verification.indiceSécurite,
    decision: verification.decision,
    
    // Points conformes
    pointsConformes: verification.controles
      .filter(c => c.status === 'CONFORME')
      .map(c => ({
        categorie: c.categorie,
        description: c.description,
        detail: c.message,
      })),
    
    // Points en alerte
    pointsAlerte: verification.controles
      .filter(c => c.status === 'ALERTE')
      .map(c => ({
        categorie: c.categorie,
        description: c.description,
        detail: c.message,
      })),
    
    // Points bloquants
    pointsBloquants: verification.controles
      .filter(c => c.status === 'BLOQUANT')
      .map(c => ({
        categorie: c.categorie,
        description: c.description,
        detail: c.message,
      })),
    
    // Recommandations
    recommandations: verification.recommandations,
    
    // Estimation prime CEE
    estimationPrime: null,
  };

  // Calcul estimation prime CEE si applicable
  if (rapport.travaux.fichesCEE.length > 0) {
    const fichePrincipale = rapport.travaux.fichesCEE[0];
    const regle = REGLES_CEE[fichePrincipale];
    
    if (regle?.calculPrime && donnees.travaux.puissance) {
      const primeEstimee = (donnees.travaux.puissance * regle.calculPrime.baseKWhCumac * regle.calculPrime.prixMWhCumac) / 1000;
      rapport.estimationPrime = {
        fiche: fichePrincipale,
        montant: Math.round(primeEstimee * 100) / 100,
        formule: regle.calculPrime.formule,
      };
    }
  }

  return rapport;
}

// ============================================================================
// AFFICHAGE DU RAPPORT FINAL
// ============================================================================

function afficherRapportFinal(rapport) {
  console.log('\n' + '═'.repeat(63));
  console.log('  📊 RAPPORT FINAL CONSOLIDÉ');
  console.log('═'.repeat(63) + '\n');

  // ─────────────────────────────────────────────────────────────────────────
  // CLIENT & TRAVAUX
  // ─────────────────────────────────────────────────────────────────────────
  console.log('  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  👤 CLIENT & TRAVAUX                                    │');
  console.log('  └─────────────────────────────────────────────────────────┘');
  console.log(`     Nom         : ${rapport.client.nom}`);
  console.log(`     Contact     : ${rapport.client.contact}`);
  console.log(`     Localisation: ${rapport.client.localisation}`);
  console.log('');
  console.log(`     Type travaux: ${rapport.travaux.type}`);
  console.log(`     Fiche CEE   : ${rapport.travaux.fichesCEE.join(', ') || 'Non détectée'}`);
  if (rapport.travaux.puissance) console.log(`     Puissance   : ${rapport.travaux.puissance}`);
  if (rapport.travaux.surface) console.log(`     Surface     : ${rapport.travaux.surface}`);
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // INDICE DE SÉCURITÉ
  // ─────────────────────────────────────────────────────────────────────────
  const indiceCouleur = rapport.indiceSécurite >= 80 ? '🟢' : 
                        rapport.indiceSécurite >= 50 ? '🟡' : '🔴';
  const barreProgres = genererBarreProgres(rapport.indiceSécurite);
  
  console.log('  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  🔒 INDICE DE SÉCURITÉ                                  │');
  console.log('  └─────────────────────────────────────────────────────────┘');
  console.log(`     ${indiceCouleur} ${rapport.indiceSécurite}% ${barreProgres}`);
  console.log(`     📋 Décision : ${rapport.decision}`);
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // MONTANTS & PRIME
  // ─────────────────────────────────────────────────────────────────────────
  console.log('  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  💰 MONTANTS                                            │');
  console.log('  └─────────────────────────────────────────────────────────┘');
  console.log(`     Total TTC   : ${rapport.financier.montantTTC ? rapport.financier.montantTTC.toFixed(2) + ' €' : 'Non détecté'}`);
  console.log(`     Total HT    : ${rapport.financier.montantHT ? rapport.financier.montantHT.toFixed(2) + ' €' : 'Non détecté'}`);
  
  if (rapport.estimationPrime) {
    console.log('');
    console.log(`     💎 ESTIMATION PRIME CEE :`);
    console.log(`        Fiche    : ${rapport.estimationPrime.fiche}`);
    console.log(`        Montant  : ${rapport.estimationPrime.montant.toFixed(2)} €`);
  }
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // POINTS CONFORMES
  // ─────────────────────────────────────────────────────────────────────────
  if (rapport.pointsConformes.length > 0) {
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  ✅ POINTS CONFORMES                                    │');
    console.log('  └─────────────────────────────────────────────────────────┘');
    rapport.pointsConformes.forEach(p => {
      console.log(`     ✅ [${p.categorie}] ${p.detail}`);
    });
    console.log('');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POINTS EN ALERTE
  // ─────────────────────────────────────────────────────────────────────────
  if (rapport.pointsAlerte.length > 0) {
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  ⚠️  POINTS EN ALERTE                                   │');
    console.log('  └─────────────────────────────────────────────────────────┘');
    rapport.pointsAlerte.forEach(p => {
      console.log(`     ⚠️  [${p.categorie}] ${p.detail}`);
    });
    console.log('');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POINTS BLOQUANTS
  // ─────────────────────────────────────────────────────────────────────────
  if (rapport.pointsBloquants.length > 0) {
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  ❌ POINTS BLOQUANTS                                    │');
    console.log('  └─────────────────────────────────────────────────────────┘');
    rapport.pointsBloquants.forEach(p => {
      console.log(`     ❌ [${p.categorie}] ${p.detail}`);
    });
    console.log('');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RECOMMANDATIONS
  // ─────────────────────────────────────────────────────────────────────────
  if (rapport.recommandations.length > 0) {
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  💡 RECOMMANDATIONS                                     │');
    console.log('  └─────────────────────────────────────────────────────────┘');
    rapport.recommandations.forEach((r, i) => {
      console.log(`     ${i + 1}. ${r}`);
    });
    console.log('');
  }

  // Mention légale
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  Ce rapport est une estimation par IA. Validation technique');
  console.log('  par un professionnel RGE requise.');
  console.log('═'.repeat(63) + '\n');
}

/**
 * Génère une barre de progression ASCII
 */
function genererBarreProgres(pourcentage) {
  const largeur = 20;
  const rempli = Math.round((pourcentage / 100) * largeur);
  const vide = largeur - rempli;
  return '[' + '█'.repeat(rempli) + '░'.repeat(vide) + ']';
}

// ============================================================================
// TRAITEMENT PAR LOT (BATCH)
// ============================================================================

async function traiterLot(dossierPath) {
  console.log('\n' + '═'.repeat(63));
  console.log('  📁 TRAITEMENT PAR LOT');
  console.log('═'.repeat(63) + '\n');

  if (!fs.existsSync(dossierPath)) {
    console.log(`  ❌ Dossier non trouvé : ${dossierPath}\n`);
    return;
  }

  const fichiersPDF = fs.readdirSync(dossierPath).filter(f => f.endsWith('.pdf'));

  if (fichiersPDF.length === 0) {
    console.log(`  ❌ Aucun fichier PDF trouvé dans : ${dossierPath}\n`);
    return;
  }

  console.log(`  📄 ${fichiersPDF.length} fichier(s) à traiter\n`);

  const resultats = [];

  for (const fichier of fichiersPDF) {
    const chemin = path.join(dossierPath, fichier);
    console.log(`\n  ▶ Traitement de ${fichier}...`);
    
    try {
      const rapport = await traiterDossier(chemin);
      resultats.push({
        fichier,
        succes: rapport.succes,
        indiceSécurite: rapport.resultat?.indiceSécurite || 0,
        decision: rapport.resultat?.decision || 'ERREUR',
      });
    } catch (error) {
      resultats.push({
        fichier,
        succes: false,
        erreur: error.message,
      });
    }
  }

  // Résumé du lot
  console.log('\n' + '═'.repeat(63));
  console.log('  📊 RÉSUMÉ DU TRAITEMENT PAR LOT');
  console.log('═'.repeat(63) + '\n');

  console.log('  ┌──────────────────────────────┬──────────┬──────────────┐');
  console.log('  │ Fichier                      │ Indice   │ Décision     │');
  console.log('  ├──────────────────────────────┼──────────┼──────────────┤');

  resultats.forEach(r => {
    const fichier = r.fichier.substring(0, 28).padEnd(28);
    const indice = r.succes ? `${r.indiceSécurite}%`.padEnd(8) : 'ERR'.padEnd(8);
    const decision = (r.decision || 'ERREUR').padEnd(12);
    console.log(`  │ ${fichier} │ ${indice} │ ${decision} │`);
  });

  console.log('  └──────────────────────────────┴──────────┴──────────────┘\n');

  const acceptes = resultats.filter(r => r.decision === 'ACCEPTÉ').length;
  const revisions = resultats.filter(r => r.decision === 'RÉVISION').length;
  const rejetes = resultats.filter(r => r.decision === 'REJETÉ' || !r.succes).length;

  console.log(`  ✅ Acceptés  : ${acceptes}`);
  console.log(`  ⚠️  Révisions : ${revisions}`);
  console.log(`  ❌ Rejetés   : ${rejetes}\n`);
}

// ============================================================================
// INTERFACE LIGNE DE COMMANDE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const commande = args[0] || 'help';

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   CAPITAL ÉNERGIE - PIPELINE ADMINISTRATIF v1.0.0        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  switch (commande) {
    case 'traiter':
    case 'process': {
      const cheminPDF = args[1];

      if (!cheminPDF) {
        console.log('\n  ❌ Usage : node pipeline-administratif.js traiter <devis.pdf>\n');
        break;
      }

      await traiterDossier(cheminPDF);
      break;
    }

    case 'batch':
    case 'lot': {
      const dossier = args[1] || './devis';
      await traiterLot(dossier);
      break;
    }

    case 'help':
    default: {
      console.log('\n  📖 COMMANDES DISPONIBLES :\n');
      console.log('  traiter <devis.pdf>   Traite un dossier complet');
      console.log('                        Lecture + Conformité + Rapport');
      console.log('');
      console.log('  batch <dossier/>      Traite tous les PDF d\'un dossier');
      console.log('');
      console.log('  help                  Affiche cette aide');
      console.log('');
      console.log('  📋 PIPELINE :');
      console.log('     1. Lecture PDF (lecteur-devis.js)');
      console.log('     2. Vérification conformité (conformite-cee.js)');
      console.log('     3. Génération rapport consolidé');
      console.log('');
      console.log('  💡 EXEMPLE :');
      console.log('     node pipeline-administratif.js traiter devis-test.pdf');
      console.log('');
    }
  }
}

// Exécution
main().catch(console.error);

// ============================================================================
// EXPORTS (pour utilisation comme module)
// ============================================================================

module.exports = {
  traiterDossier,
  traiterLot,
  genererRapportConsolide,
  CONFIG,
};
