/**
 * ============================================================================
 * CAPITAL ÉNERGIE - SERVICE D'ONBOARDING
 * ============================================================================
 * Module d'activation et d'accueil des nouveaux clients
 * Crée l'espace de travail, génère le Guide de Sérénité et prépare le mail
 * 
 * Usage :
 *   node service-onboarding.js activer [NOM-CLIENT]    Active un nouveau client
 *   node service-onboarding.js aide                    Affiche l'aide
 * 
 * Structure créée :
 *   ./clients/[NOM-CLIENT]/depot     Réception des fichiers (devis)
 *   ./clients/[NOM-CLIENT]/rapports  Envoi des audits
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { genererFacturePDF, getInfosClient } = require('./service-facturation.js');
const { genererCharteConfidentialite } = require('./service-juridique.js');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  dossierClients: './clients',
  fichierClients: './clients-privileges.json',
  entreprise: {
    nom: 'Capital Énergie',
    slogan: 'Cellule d\'Expertise Réglementaire',
    email: 'contact@capital-energie.fr',
    telephone: '01 23 45 67 89',
    site: 'https://capital-energie.fr',
  },
  couleurs: {
    primaire: '#0891b2',
    secondaire: '#06b6d4',
    texte: '#1e293b',
    gris: '#64748b',
    fond: '#f8fafc',
    serenite: '#10b981',
    expert: '#8b5cf6',
  },
  forfaits: {
    serenite: {
      nom: 'Sérénité',
      badge: '⭐',
      couleur: '#10b981',
      prix: '390€ HT/mois',
    },
    expert: {
      nom: 'Expert',
      badge: '👑',
      couleur: '#8b5cf6',
      prix: '890€ HT/mois',
    },
  },
};

// ============================================================================
// CRÉATION DE L'ESPACE DE TRAVAIL
// ============================================================================

/**
 * Crée l'arborescence de dossiers pour un nouveau client
 */
function creerEspaceTravail(nomClient) {
  const nomClientSafe = nomClient.replace(/[^a-zA-Z0-9-]/g, '-');
  const cheminBase = path.join(CONFIG.dossierClients, nomClientSafe);
  const cheminDepot = path.join(cheminBase, 'depot');
  const cheminRapports = path.join(cheminBase, 'rapports');

  // Créer les dossiers
  if (!fs.existsSync(cheminDepot)) {
    fs.mkdirSync(cheminDepot, { recursive: true });
  }
  if (!fs.existsSync(cheminRapports)) {
    fs.mkdirSync(cheminRapports, { recursive: true });
  }

  return {
    base: cheminBase,
    depot: cheminDepot,
    rapports: cheminRapports,
    nomClientSafe,
  };
}

// ============================================================================
// GÉNÉRATION DU GUIDE DE SÉRÉNITÉ (PDF)
// ============================================================================

/**
 * Dessine l'en-tête du Guide de Sérénité
 */
function dessinerEnteteGuide(doc, forfait) {
  const { entreprise, couleurs } = CONFIG;
  const forfaitInfo = CONFIG.forfaits[forfait] || CONFIG.forfaits.serenite;

  // Fond en-tête
  doc.rect(0, 0, 595, 140).fill(couleurs.primaire);

  // Logo textuel Capital Énergie
  doc.fontSize(32)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('⚡ ' + entreprise.nom, 50, 40);

  // Slogan
  doc.fontSize(14)
     .fillColor('#ffffff')
     .font('Helvetica')
     .text(entreprise.slogan, 50, 80);

  // Badge forfait à droite
  doc.rect(420, 45, 130, 40)
     .fill(forfaitInfo.couleur);
  doc.fontSize(12)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text(`${forfaitInfo.badge} Forfait ${forfaitInfo.nom}`, 430, 58, { width: 110, align: 'center' });
}

/**
 * Dessine le titre du guide
 */
function dessinerTitreGuide(doc) {
  const y = 170;

  doc.fontSize(24)
     .fillColor(CONFIG.couleurs.texte)
     .font('Helvetica-Bold')
     .text('Guide de Sérénité', 50, y, { align: 'center', width: 495 });

  doc.fontSize(12)
     .fillColor(CONFIG.couleurs.gris)
     .font('Helvetica')
     .text('Votre parcours vers la conformité énergétique', 50, y + 35, { align: 'center', width: 495 });

  return y + 70;
}

/**
 * Dessine le rappel du forfait choisi
 */
function dessinerRappelForfait(doc, forfait, y) {
  const forfaitInfo = CONFIG.forfaits[forfait] || CONFIG.forfaits.serenite;

  // Encadré forfait
  doc.rect(50, y, 495, 80)
     .lineWidth(2)
     .stroke(forfaitInfo.couleur);

  doc.rect(50, y, 495, 30).fill(forfaitInfo.couleur);

  doc.fontSize(14)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text(`${forfaitInfo.badge} VOTRE FORFAIT : ${forfaitInfo.nom.toUpperCase()}`, 60, y + 8);

  doc.fontSize(11)
     .fillColor(CONFIG.couleurs.texte)
     .font('Helvetica')
     .text(`Tarif : ${forfaitInfo.prix}`, 60, y + 42);

  const avantages = forfait === 'expert'
    ? 'Dossiers illimités • Priorité maximale • Service de Veille dédié • Reporting mensuel'
    : 'Jusqu\'à 20 dossiers/mois • Priorité standard • Service de Veille inclus';

  doc.fontSize(10)
     .fillColor(CONFIG.couleurs.gris)
     .text(avantages, 60, y + 58);

  return y + 100;
}

/**
 * Dessine les 3 étapes de fonctionnement
 */
function dessinerEtapes(doc, y) {
  doc.fontSize(16)
     .fillColor(CONFIG.couleurs.texte)
     .font('Helvetica-Bold')
     .text('Les 3 étapes de fonctionnement', 50, y);

  const etapes = [
    {
      numero: '1',
      titre: 'Déposer le devis',
      description: 'Déposez votre devis dans le dossier de dépôt prévu. Formats acceptés : PDF, images.',
      icone: '📁',
    },
    {
      numero: '2',
      titre: 'Analyse algorithmique',
      description: 'Notre système analyse automatiquement votre devis selon les règles CEE en vigueur.',
      icone: '🔍',
    },
    {
      numero: '3',
      titre: 'Réception du rapport sous 60min',
      description: 'Recevez votre rapport d\'audit complet avec les points de conformité et alertes.',
      icone: '📊',
    },
  ];

  let currentY = y + 30;

  etapes.forEach((etape, index) => {
    // Cercle numéro
    doc.circle(75, currentY + 25, 20).fill(CONFIG.couleurs.primaire);
    doc.fontSize(16)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text(etape.numero, 68, currentY + 17);

    // Icône
    doc.fontSize(24)
       .text(etape.icone, 110, currentY + 10);

    // Titre
    doc.fontSize(14)
       .fillColor(CONFIG.couleurs.texte)
       .font('Helvetica-Bold')
       .text(etape.titre, 145, currentY + 10);

    // Description
    doc.fontSize(10)
       .fillColor(CONFIG.couleurs.gris)
       .font('Helvetica')
       .text(etape.description, 145, currentY + 30, { width: 380 });

    currentY += 70;
  });

  return currentY + 10;
}

/**
 * Dessine le pied de page du guide
 */
function dessinerPiedPageGuide(doc) {
  const { entreprise, couleurs } = CONFIG;
  const y = 750;

  // Ligne de séparation
  doc.rect(50, y, 495, 1).fill(couleurs.gris);

  // Contact
  doc.fontSize(9)
     .fillColor(couleurs.gris)
     .font('Helvetica')
     .text(`${entreprise.nom} • ${entreprise.email} • ${entreprise.telephone}`, 50, y + 15, { align: 'center', width: 495 });

  // Mention légale obligatoire
  doc.fontSize(7)
     .text('Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.', 50, y + 32, { align: 'center', width: 495 });
}

/**
 * Génère le PDF "Guide de Sérénité"
 */
async function genererGuideSerenitePDF(nomClient, forfait = 'serenite') {
  const nomClientSafe = nomClient.replace(/[^a-zA-Z0-9-]/g, '-');
  const cheminPDF = path.join(CONFIG.dossierClients, nomClientSafe, `Guide-Serenite-${nomClientSafe}.pdf`);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Guide de Sérénité - ${nomClient}`,
        Author: 'Capital Énergie',
        Subject: 'Guide d\'accueil client',
      },
    });

    const writeStream = fs.createWriteStream(cheminPDF);
    doc.pipe(writeStream);

    // Dessiner les sections
    dessinerEnteteGuide(doc, forfait);
    const yTitre = dessinerTitreGuide(doc);
    const yForfait = dessinerRappelForfait(doc, forfait, yTitre);
    dessinerEtapes(doc, yForfait);
    dessinerPiedPageGuide(doc);

    doc.end();

    writeStream.on('finish', () => {
      resolve({
        chemin: cheminPDF,
        nomClient,
        forfait,
      });
    });

    writeStream.on('error', reject);
  });
}

// ============================================================================
// PRÉPARATION DU MAIL DE BIENVENUE
// ============================================================================

/**
 * Génère le contenu du mail de bienvenue
 */
function genererMailBienvenue(nomClient, espaces, guideChemin, factureChemin, charteChemin, forfait = 'serenite') {
  const forfaitInfo = CONFIG.forfaits[forfait] || CONFIG.forfaits.serenite;
  const { entreprise } = CONFIG;

  const lienDepot = path.resolve(espaces.depot);

  const sujet = `🎉 Bienvenue chez ${entreprise.nom} - Votre espace est prêt !`;

  const corps = `
═══════════════════════════════════════════════════════════════════════════════
                    ⚡ ${entreprise.nom.toUpperCase()}
                    ${entreprise.slogan}
═══════════════════════════════════════════════════════════════════════════════

Bonjour,

Nous avons le plaisir de vous accueillir parmi nos clients privilégiés !

Votre espace de travail ${forfaitInfo.badge} Forfait ${forfaitInfo.nom} est désormais actif.

───────────────────────────────────────────────────────────────────────────────
📁 ACCÈS À VOTRE DOSSIER DE DÉPÔT
───────────────────────────────────────────────────────────────────────────────

Déposez vos devis à analyser dans le dossier suivant :
${lienDepot}

Vos rapports d'audit seront automatiquement générés dans :
${path.resolve(espaces.rapports)}

───────────────────────────────────────────────────────────────────────────────
📎 PIÈCES JOINTES (KIT DE BIENVENUE)
───────────────────────────────────────────────────────────────────────────────

1. Guide de Sérénité (PDF)
   → Retrouvez les 3 étapes pour utiliser notre service

2. Charte de Protection des Données (PDF)
   → Nos engagements de confidentialité et conformité RGPD

3. Première facture d'abonnement (PDF)
   → Votre facture pour le mois en cours

───────────────────────────────────────────────────────────────────────────────
📞 BESOIN D'AIDE ?
───────────────────────────────────────────────────────────────────────────────

Notre équipe est à votre disposition :
• Email : ${entreprise.email}
• Téléphone : ${entreprise.telephone}
• Site : ${entreprise.site}

À très bientôt !

L'équipe ${entreprise.nom}

───────────────────────────────────────────────────────────────────────────────
Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.
`;

  return {
    destinataire: nomClient,
    sujet,
    corps,
    piecesJointes: [
      { nom: 'Guide-Serenite.pdf', chemin: guideChemin },
      { nom: 'Charte-Confidentialite.pdf', chemin: charteChemin },
      { nom: 'Facture-Abonnement.pdf', chemin: factureChemin },
    ],
  };
}

/**
 * Sauvegarde le mail de bienvenue dans un fichier
 */
function sauvegarderMailBienvenue(nomClient, mail) {
  const nomClientSafe = nomClient.replace(/[^a-zA-Z0-9-]/g, '-');
  const cheminMail = path.join(CONFIG.dossierClients, nomClientSafe, `mail-bienvenue-${nomClientSafe}.txt`);

  const contenu = `
DESTINATAIRE: ${mail.destinataire}
SUJET: ${mail.sujet}

PIÈCES JOINTES:
${mail.piecesJointes.map(pj => `  - ${pj.nom}: ${pj.chemin}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
CORPS DU MESSAGE:
═══════════════════════════════════════════════════════════════════════════════
${mail.corps}
`;

  fs.writeFileSync(cheminMail, contenu.trim(), 'utf8');
  return cheminMail;
}

// ============================================================================
// PROCESSUS D'ACTIVATION COMPLET
// ============================================================================

/**
 * Active un nouveau client (processus complet)
 */
async function activerClient(nomClient, forfait = 'serenite') {
  console.log(`\n  🚀 Activation du client : ${nomClient}`);
  console.log(`     Forfait : ${CONFIG.forfaits[forfait]?.nom || 'Sérénité'}\n`);

  const resultats = {
    client: nomClient,
    forfait,
    espaces: null,
    guide: null,
    charte: null,
    facture: null,
    mail: null,
  };

  // 1. Création de l'espace de travail
  console.log('  📁 Création de l\'espace de travail...');
  resultats.espaces = creerEspaceTravail(nomClient);
  console.log(`     ✅ Dossier dépôt    : ${resultats.espaces.depot}`);
  console.log(`     ✅ Dossier rapports : ${resultats.espaces.rapports}\n`);

  // 2. Génération du Guide de Sérénité
  console.log('  📄 Génération du Guide de Sérénité...');
  try {
    resultats.guide = await genererGuideSerenitePDF(nomClient, forfait);
    console.log(`     ✅ Guide généré : ${resultats.guide.chemin}\n`);
  } catch (error) {
    console.error(`     ❌ Erreur génération guide : ${error.message}\n`);
  }

  // 3. Génération de la Charte de Confidentialité
  console.log('  ⚖️ Génération de la Charte de Confidentialité...');
  try {
    resultats.charte = await genererCharteConfidentialite(nomClient);
    console.log(`     ✅ Charte générée : ${resultats.charte.chemin}\n`);
  } catch (error) {
    console.error(`     ❌ Erreur génération charte : ${error.message}\n`);
  }

  // 4. Génération de la première facture
  console.log('  💳 Génération de la première facture...');
  try {
    // Chercher le client dans clients-privileges.json
    const clientInfo = getInfosClient(nomClient);
    if (clientInfo) {
      resultats.facture = await genererFacturePDF(nomClient);
      console.log(`     ✅ Facture générée : ${resultats.facture?.chemin || 'N/A'}\n`);
    } else {
      console.log(`     ⚠️  Client non trouvé dans clients-privileges.json`);
      console.log(`        La facture sera générée après inscription complète.\n`);
    }
  } catch (error) {
    console.error(`     ❌ Erreur génération facture : ${error.message}\n`);
  }

  // 5. Préparation du mail de bienvenue
  console.log('  📧 Préparation du mail de bienvenue...');
  const mail = genererMailBienvenue(
    nomClient,
    resultats.espaces,
    resultats.guide?.chemin || '',
    resultats.facture?.chemin || '',
    resultats.charte?.chemin || '',
    forfait
  );
  const cheminMail = sauvegarderMailBienvenue(nomClient, mail);
  resultats.mail = { ...mail, fichier: cheminMail };
  console.log(`     ✅ Mail préparé : ${cheminMail}\n`);

  return resultats;
}

// ============================================================================
// INTERFACE LIGNE DE COMMANDE
// ============================================================================

function afficherAide() {
  console.log('\n  📖 COMMANDES DISPONIBLES :\n');
  console.log('  activer [NOM-CLIENT]      Active un nouveau client');
  console.log('     Options :');
  console.log('       --forfait=serenite   Forfait Sérénité (défaut)');
  console.log('       --forfait=expert     Forfait Expert');
  console.log('');
  console.log('  aide                      Affiche cette aide');
  console.log('');
  console.log('  📁 STRUCTURE CRÉÉE :');
  console.log('     ./clients/[NOM-CLIENT]/depot      Réception des devis');
  console.log('     ./clients/[NOM-CLIENT]/rapports   Envoi des audits');
  console.log('');
  console.log('  📄 KIT DE BIENVENUE GÉNÉRÉ :');
  console.log('     Guide de Sérénité (PDF)           Présentation du service');
  console.log('     Charte de Confidentialité (PDF)   Via service-juridique.js');
  console.log('     Première facture (PDF)            Via service-facturation.js');
  console.log('     Mail de bienvenue (TXT)           Prêt à envoyer');
  console.log('');
  console.log('  💡 EXEMPLES :');
  console.log('     node service-onboarding.js activer "EcoTherm Solutions"');
  console.log('     node service-onboarding.js activer "MonClient" --forfait=expert\n');
}

async function main() {
  const args = process.argv.slice(2);
  const commande = args[0] || 'aide';

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   CAPITAL ÉNERGIE - SERVICE D\'ONBOARDING v1.0.0           ║');
  console.log('║   Cellule d\'Expertise Réglementaire                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  switch (commande) {
    case 'activer':
    case 'activate': {
      const nomClient = args[1];
      if (!nomClient) {
        console.log('\n  ❌ Usage : node service-onboarding.js activer [NOM-CLIENT]\n');
        break;
      }

      // Extraire le forfait des options
      let forfait = 'serenite';
      const forfaitArg = args.find(a => a.startsWith('--forfait='));
      if (forfaitArg) {
        const valeur = forfaitArg.split('=')[1].toLowerCase();
        if (valeur === 'expert') forfait = 'expert';
      }

      try {
        const resultats = await activerClient(nomClient, forfait);

        console.log('  ═══════════════════════════════════════════════════════════');
        console.log('  ✅ ACTIVATION TERMINÉE AVEC SUCCÈS\n');
        console.log(`     Client      : ${resultats.client}`);
        console.log(`     Forfait     : ${CONFIG.forfaits[forfait].badge} ${CONFIG.forfaits[forfait].nom}`);
        console.log(`     Dépôt       : ${resultats.espaces.depot}`);
        console.log(`     Rapports    : ${resultats.espaces.rapports}`);
        console.log(`     Guide       : ${resultats.guide?.chemin || 'Non généré'}`);
        console.log(`     Charte      : ${resultats.charte?.chemin || 'Non générée'}`);
        console.log(`     Facture     : ${resultats.facture?.chemin || 'À générer après inscription'}`);
        console.log(`     Mail        : ${resultats.mail?.fichier || 'Non généré'}\n`);
      } catch (error) {
        console.error(`\n  ❌ Erreur lors de l'activation : ${error.message}\n`);
      }
      break;
    }

    case 'aide':
    case 'help':
    default: {
      afficherAide();
    }
  }
}

// Exécution
if (require.main === module) {
  main().catch(console.error);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  creerEspaceTravail,
  genererGuideSerenitePDF,
  genererMailBienvenue,
  sauvegarderMailBienvenue,
  activerClient,
  CONFIG,
};
