/**
 * ============================================================================
 * CAPITAL ÉNERGIE - AGENT DE SECRÉTARIAT / COLLECTEUR DE PIÈCES
 * ============================================================================
 * Script de gestion des pièces justificatives et relances automatisées
 * 
 * Usage :
 *   node collecteur-pieces.js analyser <dossier_rapport.json>
 *   node collecteur-pieces.js relance <dossier_rapport.json>
 *   node collecteur-pieces.js batch <dossier/>
 * 
 * Exemple :
 *   node collecteur-pieces.js relance devis-test_rapport.json
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  expediteur: {
    nom: 'Capital Énergie',
    email: 'contact@capital-energie.fr',
    telephone: '01 23 45 67 89',
    signature: 'L\'équipe Capital Énergie',
  },
  delaiRelance: {
    premier: 3,   // Jours avant première relance
    second: 7,    // Jours avant seconde relance
    urgent: 14,   // Jours avant relance urgente
  },
};

// ============================================================================
// BASE DE CONNAISSANCES - DOCUMENTS OBLIGATOIRES PAR FICHE CEE
// ============================================================================

const DOCUMENTS_OBLIGATOIRES = {
  // Documents communs à tous les dossiers CEE
  communs: [
    {
      id: 'devis_signe',
      nom: 'Devis signé',
      description: 'Devis détaillé avec signature du client et date',
      obligatoire: true,
      detectableDepuis: 'rapport', // Peut être détecté depuis le rapport
    },
    {
      id: 'facture',
      nom: 'Facture acquittée',
      description: 'Facture finale mentionnant le règlement',
      obligatoire: true,
      detectableDepuis: null,
    },
    {
      id: 'attestation_honneur',
      nom: 'Attestation sur l\'honneur',
      description: 'Attestation signée par le bénéficiaire et l\'installateur',
      obligatoire: true,
      detectableDepuis: null,
    },
    {
      id: 'justificatif_domicile',
      nom: 'Justificatif de domicile',
      description: 'Facture EDF, eau ou téléphone de moins de 3 mois',
      obligatoire: true,
      detectableDepuis: null,
    },
    {
      id: 'piece_identite',
      nom: 'Pièce d\'identité',
      description: 'CNI ou passeport en cours de validité',
      obligatoire: true,
      detectableDepuis: null,
    },
  ],

  // Documents spécifiques par fiche CEE
  'BAR-TH-104': [
    {
      id: 'avis_imposition',
      nom: 'Avis d\'imposition',
      description: 'Avis d\'imposition N-1 ou N-2 du foyer fiscal',
      obligatoire: true,
      raison: 'Requis pour déterminer le niveau de prime (ménage modeste/très modeste)',
    },
    {
      id: 'fiche_technique_pac',
      nom: 'Fiche technique PAC',
      description: 'Documentation technique du fabricant avec COP et ηs',
      obligatoire: true,
      raison: 'Vérification de l\'éligibilité technique (ηs ≥ 111%)',
    },
    {
      id: 'certificat_rge',
      nom: 'Certificat RGE installateur',
      description: 'Attestation QualiPAC ou équivalent en cours de validité',
      obligatoire: true,
      detectableDepuis: 'rapport',
    },
    {
      id: 'photos_installation',
      nom: 'Photos de l\'installation',
      description: 'Photos avant/après montrant l\'unité extérieure et intérieure',
      obligatoire: false,
      raison: 'Recommandé pour éviter les contrôles sur site',
    },
  ],

  'BAR-TH-106': [
    {
      id: 'avis_imposition',
      nom: 'Avis d\'imposition',
      description: 'Avis d\'imposition N-1 ou N-2',
      obligatoire: true,
    },
    {
      id: 'fiche_technique_chaudiere',
      nom: 'Fiche technique chaudière',
      description: 'Documentation avec efficacité énergétique saisonnière',
      obligatoire: true,
    },
    {
      id: 'certificat_rge',
      nom: 'Certificat RGE installateur',
      description: 'Attestation Qualigaz ou équivalent',
      obligatoire: true,
    },
  ],

  'BAR-EN-101': [
    {
      id: 'avis_imposition',
      nom: 'Avis d\'imposition',
      description: 'Avis d\'imposition N-1 ou N-2',
      obligatoire: true,
    },
    {
      id: 'fiche_technique_isolant',
      nom: 'Fiche technique isolant',
      description: 'Documentation avec résistance thermique R',
      obligatoire: true,
    },
    {
      id: 'surface_isolee',
      nom: 'Attestation surface isolée',
      description: 'Document attestant de la surface traitée en m²',
      obligatoire: true,
    },
    {
      id: 'certificat_rge',
      nom: 'Certificat RGE installateur',
      description: 'Attestation Qualibat RGE',
      obligatoire: true,
    },
  ],
};

// ============================================================================
// STATUTS DES PIÈCES
// ============================================================================

const STATUT_PIECE = {
  FOURNI: { code: 'FOURNI', emoji: '✅', label: 'Fourni' },
  MANQUANT: { code: 'MANQUANT', emoji: '❌', label: 'Manquant' },
  A_VERIFIER: { code: 'A_VERIFIER', emoji: '⚠️', label: 'À vérifier' },
  OPTIONNEL: { code: 'OPTIONNEL', emoji: '📎', label: 'Optionnel' },
};

// ============================================================================
// FONCTION PRINCIPALE : ANALYSER DOSSIER
// ============================================================================

/**
 * Analyse un rapport et identifie les pièces manquantes
 * @param {string} cheminRapport - Chemin vers le fichier _rapport.json
 * @returns {Object} Analyse des pièces
 */
function analyserPieces(cheminRapport) {
  // Lecture du rapport
  const rapportPath = path.resolve(cheminRapport);
  
  if (!fs.existsSync(rapportPath)) {
    throw new Error(`Fichier rapport non trouvé: ${rapportPath}`);
  }
  
  const rapportData = JSON.parse(fs.readFileSync(rapportPath, 'utf8'));
  
  // Extraction des informations du dossier
  const dossier = {
    id: path.basename(cheminRapport, '_rapport.json'),
    fichierOrigine: rapportData.meta?.fichier || 'inconnu',
    dateTraitement: rapportData.meta?.dateTraitement,
    client: rapportData.rapport?.client || rapportData.donnees?.client || {},
    travaux: rapportData.rapport?.travaux || rapportData.donnees?.travaux || {},
    fichesCEE: rapportData.rapport?.travaux?.fichesCEE || rapportData.donnees?.travaux?.fichesCEE || [],
    indiceSécurite: rapportData.rapport?.indiceSécurite || rapportData.conformite?.indiceSécurite || 0,
    decision: rapportData.rapport?.decision || rapportData.conformite?.decision || 'INCONNU',
    conformite: rapportData.conformite || {},
  };

  // Récupérer la liste des documents requis
  const documentsRequis = obtenirDocumentsRequis(dossier.fichesCEE);
  
  // Analyser chaque document
  const analyseDocuments = documentsRequis.map(doc => {
    const statut = verifierStatutDocument(doc, dossier, rapportData);
    return {
      ...doc,
      statut: statut.statut,
      statutInfo: STATUT_PIECE[statut.statut],
      raison: statut.raison,
    };
  });

  // Séparer les documents par statut
  const piecesFournies = analyseDocuments.filter(d => d.statut === 'FOURNI');
  const piecesManquantes = analyseDocuments.filter(d => d.statut === 'MANQUANT');
  const piecesAVerifier = analyseDocuments.filter(d => d.statut === 'A_VERIFIER');
  const piecesOptionnelles = analyseDocuments.filter(d => d.statut === 'OPTIONNEL');

  // Calcul du taux de complétude
  const totalObligatoires = analyseDocuments.filter(d => d.obligatoire).length;
  const fournisObligatoires = piecesFournies.filter(d => d.obligatoire).length;
  const tauxCompletude = totalObligatoires > 0 
    ? Math.round((fournisObligatoires / totalObligatoires) * 100) 
    : 0;

  return {
    dossier,
    documents: analyseDocuments,
    resume: {
      fournies: piecesFournies.length,
      manquantes: piecesManquantes.length,
      aVerifier: piecesAVerifier.length,
      optionnelles: piecesOptionnelles.length,
      tauxCompletude,
    },
    piecesFournies,
    piecesManquantes,
    piecesAVerifier,
    piecesOptionnelles,
    pret: piecesManquantes.length === 0,
  };
}

/**
 * Obtient la liste des documents requis selon les fiches CEE
 */
function obtenirDocumentsRequis(fichesCEE) {
  const documents = [...DOCUMENTS_OBLIGATOIRES.communs];
  
  // Ajouter les documents spécifiques à chaque fiche
  fichesCEE.forEach(fiche => {
    const docsSpecifiques = DOCUMENTS_OBLIGATOIRES[fiche] || [];
    docsSpecifiques.forEach(doc => {
      // Éviter les doublons
      if (!documents.find(d => d.id === doc.id)) {
        documents.push(doc);
      }
    });
  });
  
  return documents;
}

/**
 * Vérifie le statut d'un document dans le dossier
 */
function verifierStatutDocument(doc, dossier, rapportData) {
  // Documents détectables depuis le rapport
  if (doc.detectableDepuis === 'rapport') {
    switch (doc.id) {
      case 'devis_signe':
        // Si on a un rapport, c'est qu'on a analysé un devis
        if (rapportData.donnees || rapportData.rapport) {
          return { statut: 'FOURNI', raison: 'Devis analysé par le pipeline' };
        }
        break;
      
      case 'certificat_rge':
        // Vérifier si RGE détecté dans le rapport
        const rge = dossier.conformite?.controles?.find(c => 
          c.id === 'presence_rge' && c.status === 'CONFORME'
        );
        if (rge) {
          return { statut: 'A_VERIFIER', raison: 'Mention RGE détectée, certificat à fournir' };
        }
        break;
    }
  }

  // Documents non détectables automatiquement
  if (!doc.obligatoire) {
    return { statut: 'OPTIONNEL', raison: 'Document recommandé mais non obligatoire' };
  }
  
  return { statut: 'MANQUANT', raison: 'Document obligatoire non fourni' };
}

// ============================================================================
// GÉNÉRATION DE MESSAGES DE RELANCE
// ============================================================================

/**
 * Prépare un message de relance personnalisé
 * @param {string} cheminRapport - Chemin vers le fichier _rapport.json
 * @returns {Object} Message de relance formaté
 */
function preparerRelance(cheminRapport) {
  const analyse = analyserPieces(cheminRapport);
  
  if (analyse.pret) {
    return {
      type: 'COMPLET',
      message: 'Le dossier est complet, aucune relance nécessaire.',
      analyse,
    };
  }

  const dossier = analyse.dossier;
  const piecesManquantes = analyse.piecesManquantes;
  
  // Informations du client
  const prenomClient = extrairePrenomClient(dossier.client);
  const villeClient = dossier.client.localisation || dossier.client.ville || '';
  const typeTravaux = formaterTypeTravaux(dossier.travaux.type);
  const ficheCEE = dossier.fichesCEE[0] || '';

  // Générer les messages
  const messageEmail = genererEmailRelance({
    prenom: prenomClient,
    ville: villeClient,
    typeTravaux,
    ficheCEE,
    piecesManquantes,
    indiceSécurite: dossier.indiceSécurite,
  });

  const messageSMS = genererSMSRelance({
    prenom: prenomClient,
    typeTravaux,
    nombrePieces: piecesManquantes.length,
  });

  return {
    type: 'RELANCE',
    dossierId: analyse.dossier.id,
    client: dossier.client,
    piecesManquantes,
    tauxCompletude: analyse.resume.tauxCompletude,
    messages: {
      email: messageEmail,
      sms: messageSMS,
    },
    analyse,
  };
}

/**
 * Génère un email de relance personnalisé
 */
function genererEmailRelance(params) {
  const { prenom, ville, typeTravaux, ficheCEE, piecesManquantes, indiceSécurite } = params;
  
  const listePieces = piecesManquantes
    .map((p, i) => `   ${i + 1}. ${p.nom}\n      → ${p.description}`)
    .join('\n\n');

  const objet = `[Action requise] Votre dossier ${typeTravaux}${ville ? ` à ${ville}` : ''} - Pièces manquantes`;

  const corps = `Bonjour${prenom ? ` ${prenom}` : ''},

Nous espérons que vous allez bien !

Votre dossier de prime énergie pour votre projet "${typeTravaux}"${ville ? ` à ${ville}` : ''} est en bonne voie. 🎉

Cependant, pour finaliser votre demande et vous permettre de recevoir votre prime CEE dans les meilleurs délais, nous avons besoin des documents suivants :

📋 PIÈCES MANQUANTES :

${listePieces}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 COMMENT NOUS LES TRANSMETTRE ?

Vous pouvez simplement répondre à cet email en joignant vos documents, ou les déposer sur votre espace client.

Formats acceptés : PDF, JPG, PNG (max 10 Mo par fichier)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 ÉTAT DE VOTRE DOSSIER :
   • Avancement : ${100 - Math.round((piecesManquantes.length / (piecesManquantes.length + 5)) * 100)}% complété
   • Fiche d'opération : ${ficheCEE || 'En cours de validation'}
   • Statut : En attente de pièces

Une fois votre dossier complet, le versement de votre prime intervient généralement sous 4 à 6 semaines.

Besoin d'aide ? Notre équipe est disponible du lundi au vendredi de 9h à 18h.
📞 ${CONFIG.expediteur.telephone}
📧 ${CONFIG.expediteur.email}

Nous restons à votre disposition,

${CONFIG.expediteur.signature}

---
Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.`;

  return {
    objet,
    corps,
    expediteur: CONFIG.expediteur.email,
    piecesJointes: [],
  };
}

/**
 * Génère un SMS de relance court
 */
function genererSMSRelance(params) {
  const { prenom, typeTravaux, nombrePieces } = params;
  
  return {
    message: `${prenom ? `Bonjour ${prenom}, ` : ''}Votre dossier ${typeTravaux} est presque complet ! Il nous manque ${nombrePieces} pièce${nombrePieces > 1 ? 's' : ''} pour finaliser votre prime CEE. Consultez votre email pour plus de détails. - Capital Énergie`,
    caracteres: 160,
  };
}

/**
 * Extrait le prénom du client depuis les données
 */
function extrairePrenomClient(client) {
  if (client.nom) {
    const parts = client.nom.split(' ');
    return parts[0];
  }
  if (client.email) {
    const localPart = client.email.split('@')[0];
    const prenom = localPart.split('.')[0];
    return prenom.charAt(0).toUpperCase() + prenom.slice(1);
  }
  return '';
}

/**
 * Formate le type de travaux pour l'affichage
 */
function formaterTypeTravaux(type) {
  if (!type) return 'travaux de rénovation énergétique';
  
  const mapping = {
    'pompe à chaleur': 'Installation Pompe à Chaleur',
    'pac': 'Installation Pompe à Chaleur',
    'chauffage': 'Travaux de Chauffage',
    'isolation': 'Travaux d\'Isolation',
    'chaudière': 'Installation Chaudière',
    'fenêtres': 'Remplacement Fenêtres',
  };
  
  const typeLC = type.toLowerCase();
  for (const [key, value] of Object.entries(mapping)) {
    if (typeLC.includes(key)) return value;
  }
  
  return type;
}

// ============================================================================
// AFFICHAGE DES RÉSULTATS
// ============================================================================

function afficherAnalyse(analyse) {
  console.log('\n' + '═'.repeat(63));
  console.log('  📁 ANALYSE DES PIÈCES JUSTIFICATIVES');
  console.log('═'.repeat(63) + '\n');

  // Infos dossier
  console.log(`  📄 Dossier : ${analyse.dossier.id}`);
  console.log(`  👤 Client  : ${analyse.dossier.client.nom || analyse.dossier.client.email || 'Non identifié'}`);
  console.log(`  🔧 Travaux : ${analyse.dossier.travaux.type || 'Non détecté'}`);
  console.log(`  📋 Fiche   : ${analyse.dossier.fichesCEE.join(', ') || 'Non détectée'}\n`);

  // Barre de progression
  const barre = genererBarreProgres(analyse.resume.tauxCompletude);
  const emoji = analyse.resume.tauxCompletude === 100 ? '🟢' : 
                analyse.resume.tauxCompletude >= 50 ? '🟡' : '🔴';
  
  console.log(`  ${emoji} COMPLÉTUDE : ${analyse.resume.tauxCompletude}% ${barre}\n`);

  // Résumé
  console.log('  ─────────────────────────────────────────────────────────');
  console.log(`  ✅ Fournies   : ${analyse.resume.fournies}`);
  console.log(`  ❌ Manquantes : ${analyse.resume.manquantes}`);
  console.log(`  ⚠️  À vérifier : ${analyse.resume.aVerifier}`);
  console.log(`  📎 Optionnelles: ${analyse.resume.optionnelles}`);
  console.log('  ─────────────────────────────────────────────────────────\n');

  // Pièces manquantes (détaillées)
  if (analyse.piecesManquantes.length > 0) {
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  ❌ PIÈCES MANQUANTES                                   │');
    console.log('  └─────────────────────────────────────────────────────────┘');
    analyse.piecesManquantes.forEach((p, i) => {
      console.log(`     ${i + 1}. ${p.nom}`);
      console.log(`        ${p.description}`);
      if (p.raison) console.log(`        💡 ${p.raison}`);
      console.log('');
    });
  }

  // Pièces à vérifier
  if (analyse.piecesAVerifier.length > 0) {
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  ⚠️  À VÉRIFIER                                         │');
    console.log('  └─────────────────────────────────────────────────────────┘');
    analyse.piecesAVerifier.forEach(p => {
      console.log(`     ⚠️  ${p.nom} - ${p.raison}`);
    });
    console.log('');
  }

  // Pièces fournies
  if (analyse.piecesFournies.length > 0) {
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  ✅ PIÈCES FOURNIES                                     │');
    console.log('  └─────────────────────────────────────────────────────────┘');
    analyse.piecesFournies.forEach(p => {
      console.log(`     ✅ ${p.nom}`);
    });
    console.log('');
  }

  // Statut final
  if (analyse.pret) {
    console.log('  ═══════════════════════════════════════════════════════════');
    console.log('  ✅ DOSSIER COMPLET - Prêt pour soumission');
    console.log('  ═══════════════════════════════════════════════════════════\n');
  } else {
    console.log('  ═══════════════════════════════════════════════════════════');
    console.log('  ⏳ DOSSIER INCOMPLET - Relance recommandée');
    console.log('  ═══════════════════════════════════════════════════════════\n');
  }
}

function afficherRelance(relance) {
  if (relance.type === 'COMPLET') {
    console.log('\n  ✅ ' + relance.message + '\n');
    return;
  }

  console.log('\n' + '═'.repeat(63));
  console.log('  📧 MESSAGE DE RELANCE PRÉPARÉ');
  console.log('═'.repeat(63) + '\n');

  console.log(`  📄 Dossier : ${relance.dossierId}`);
  console.log(`  📊 Complétude : ${relance.tauxCompletude}%`);
  console.log(`  ❌ Pièces manquantes : ${relance.piecesManquantes.length}\n`);

  // Email
  console.log('  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  📧 EMAIL                                               │');
  console.log('  └─────────────────────────────────────────────────────────┘');
  console.log(`  Objet : ${relance.messages.email.objet}\n`);
  console.log('  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─');
  console.log(relance.messages.email.corps);
  console.log('  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─\n');

  // SMS
  console.log('  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  📱 SMS                                                 │');
  console.log('  └─────────────────────────────────────────────────────────┘');
  console.log(`  ${relance.messages.sms.message}\n`);

  console.log('═'.repeat(63) + '\n');
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
  console.log('║   CAPITAL ÉNERGIE - COLLECTEUR DE PIÈCES v1.0.0          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  switch (commande) {
    case 'analyser':
    case 'analyze': {
      const cheminRapport = args[1];

      if (!cheminRapport) {
        console.log('\n  ❌ Usage : node collecteur-pieces.js analyser <dossier_rapport.json>\n');
        break;
      }

      try {
        const analyse = analyserPieces(cheminRapport);
        afficherAnalyse(analyse);
      } catch (error) {
        console.error(`\n  ❌ Erreur : ${error.message}\n`);
      }
      break;
    }

    case 'relance':
    case 'reminder': {
      const cheminRapport = args[1];

      if (!cheminRapport) {
        console.log('\n  ❌ Usage : node collecteur-pieces.js relance <dossier_rapport.json>\n');
        break;
      }

      try {
        const relance = preparerRelance(cheminRapport);
        afficherAnalyse(relance.analyse);
        afficherRelance(relance);

        // Export du message
        if (args.includes('--export')) {
          const exportPath = cheminRapport.replace('_rapport.json', '_relance.json');
          fs.writeFileSync(exportPath, JSON.stringify(relance, null, 2));
          console.log(`  💾 Relance exportée : ${path.basename(exportPath)}\n`);
        }
      } catch (error) {
        console.error(`\n  ❌ Erreur : ${error.message}\n`);
      }
      break;
    }

    case 'help':
    default: {
      console.log('\n  📖 COMMANDES DISPONIBLES :\n');
      console.log('  analyser <rapport.json>   Analyse les pièces d\'un dossier');
      console.log('                            Identifie les documents manquants');
      console.log('');
      console.log('  relance <rapport.json>    Génère un message de relance');
      console.log('                            Options : --export (sauvegarde)');
      console.log('');
      console.log('  help                      Affiche cette aide');
      console.log('');
      console.log('  📋 DOCUMENTS GÉRÉS :');
      console.log('     - Devis signé');
      console.log('     - Facture acquittée');
      console.log('     - Attestation sur l\'honneur');
      console.log('     - Avis d\'imposition');
      console.log('     - Justificatif de domicile');
      console.log('     - Pièce d\'identité');
      console.log('     - Fiche technique matériel');
      console.log('     - Certificat RGE');
      console.log('');
      console.log('  💡 EXEMPLE :');
      console.log('     node collecteur-pieces.js relance devis-test_rapport.json');
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
  analyserPieces,
  preparerRelance,
  genererEmailRelance,
  genererSMSRelance,
  DOCUMENTS_OBLIGATOIRES,
  STATUT_PIECE,
  CONFIG,
};
