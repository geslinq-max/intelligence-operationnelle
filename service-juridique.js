/**
 * ============================================================================
 * CAPITAL ÉNERGIE - SERVICE JURIDIQUE
 * ============================================================================
 * Module de Conformité pour la gestion des obligations légales
 * Génère la Charte de Protection des Données et assure le nettoyage RGPD
 * 
 * Usage :
 *   node service-juridique.js charte [NOM-CLIENT]    Génère la Charte de Confidentialité
 *   node service-juridique.js nettoyer               Nettoie les archives > 30 jours (RGPD)
 *   node service-juridique.js audit                  Audit des fichiers à supprimer
 *   node service-juridique.js aide                   Affiche l'aide
 * 
 * Conformité RGPD :
 *   - Suppression automatique des documents de plus de 30 jours
 *   - Limitation des risques de fuite de données
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  dossierClients: './clients',
  retentionJours: 30,
  entreprise: {
    nom: 'Capital Énergie',
    slogan: 'Cellule d\'Expertise Réglementaire',
    adresse: '123 Avenue de l\'Innovation',
    codePostal: '75001',
    ville: 'Paris',
    siret: '123 456 789 00012',
    email: 'juridique@capital-energie.fr',
    telephone: '01 23 45 67 89',
    dpo: 'dpo@capital-energie.fr',
  },
  couleurs: {
    primaire: '#0891b2',
    secondaire: '#06b6d4',
    texte: '#1e293b',
    gris: '#64748b',
    fond: '#f8fafc',
    alerte: '#dc2626',
  },
};

// ============================================================================
// GÉNÉRATION DE LA CHARTE DE CONFIDENTIALITÉ (PDF)
// ============================================================================

/**
 * Dessine l'en-tête de la Charte
 */
function dessinerEnteteCharte(doc) {
  const { entreprise, couleurs } = CONFIG;

  // Fond en-tête
  doc.rect(0, 0, 595, 100).fill(couleurs.primaire);

  // Logo textuel Capital Énergie
  doc.fontSize(26)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('⚡ ' + entreprise.nom, 50, 30);

  // Slogan
  doc.fontSize(11)
     .fillColor('#ffffff')
     .font('Helvetica')
     .text(entreprise.slogan, 50, 60);

  // Badge Service Juridique à droite
  doc.rect(420, 30, 130, 45)
     .fill('#1e3a5f');
  doc.fontSize(9)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('⚖️ SERVICE JURIDIQUE', 430, 42, { width: 110, align: 'center' })
     .font('Helvetica')
     .fontSize(8)
     .text('Module de Conformité', 430, 56, { width: 110, align: 'center' });
}

/**
 * Dessine le titre principal de la Charte
 */
function dessinerTitreCharte(doc) {
  const y = 120;

  doc.fontSize(18)
     .fillColor(CONFIG.couleurs.texte)
     .font('Helvetica-Bold')
     .text('CHARTE DE PROTECTION DES DONNÉES', 50, y, { align: 'center', width: 495 });

  doc.fontSize(12)
     .fillColor(CONFIG.couleurs.primaire)
     .font('Helvetica')
     .text('Capital Énergie', 50, y + 25, { align: 'center', width: 495 });

  // Date de mise à jour
  const dateMAJ = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.fontSize(9)
     .fillColor(CONFIG.couleurs.gris)
     .text(`Version en vigueur au ${dateMAJ}`, 50, y + 45, { align: 'center', width: 495 });

  return y + 75;
}

/**
 * Dessine une section de la Charte
 */
function dessinerSection(doc, titre, contenu, y, numero) {
  // Numéro et titre
  doc.fontSize(12)
     .fillColor(CONFIG.couleurs.primaire)
     .font('Helvetica-Bold')
     .text(`ARTICLE ${numero} – ${titre}`, 50, y);

  // Contenu
  doc.fontSize(10)
     .fillColor(CONFIG.couleurs.texte)
     .font('Helvetica')
     .text(contenu, 50, y + 18, { width: 495, lineGap: 4 });

  // Calculer la hauteur du texte
  const hauteurContenu = doc.heightOfString(contenu, { width: 495, lineGap: 4 });
  return y + 25 + hauteurContenu + 15;
}

/**
 * Dessine la clause de non-responsabilité
 */
function dessinerClauseNonResponsabilite(doc, y) {
  // Encadré d'alerte
  doc.rect(50, y, 495, 70)
     .lineWidth(2)
     .stroke(CONFIG.couleurs.alerte);

  doc.rect(50, y, 495, 25).fill('#fef2f2');

  doc.fontSize(11)
     .fillColor(CONFIG.couleurs.alerte)
     .font('Helvetica-Bold')
     .text('⚠️ CLAUSE DE NON-RESPONSABILITÉ', 60, y + 7);

  doc.fontSize(9)
     .fillColor(CONFIG.couleurs.texte)
     .font('Helvetica')
     .text(
       'Le service fournit une aide à la décision ; le dépôt final reste sous la responsabilité de l\'artisan. ' +
       'Capital Énergie ne saurait être tenu responsable des décisions prises sur la base des audits algorithmiques fournis.',
       60, y + 32, { width: 475, lineGap: 3 }
     );

  return y + 85;
}

/**
 * Dessine le pied de page de la Charte
 */
function dessinerPiedPageCharte(doc, pageNum, totalPages) {
  const { entreprise, couleurs } = CONFIG;
  const y = 780;

  // Ligne de séparation
  doc.rect(50, y, 495, 1).fill(couleurs.gris);

  // Coordonnées DPO
  doc.fontSize(8)
     .fillColor(couleurs.gris)
     .font('Helvetica')
     .text(`Délégué à la Protection des Données : ${entreprise.dpo}`, 50, y + 10);

  // Numéro de page
  doc.text(`Page ${pageNum}/${totalPages}`, 450, y + 10, { align: 'right', width: 95 });

  // Mention légale
  doc.fontSize(7)
     .text('Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.', 50, y + 25, { align: 'center', width: 495 });
}

/**
 * Génère le PDF de la Charte de Protection des Données
 */
async function genererCharteConfidentialite(nomClient = null) {
  const nomClientSafe = nomClient ? nomClient.replace(/[^a-zA-Z0-9-]/g, '-') : 'General';
  const dateStr = new Date().toISOString().slice(0, 10);
  
  let cheminPDF;
  if (nomClient) {
    const dossierClient = path.join(CONFIG.dossierClients, nomClientSafe);
    if (!fs.existsSync(dossierClient)) {
      fs.mkdirSync(dossierClient, { recursive: true });
    }
    cheminPDF = path.join(dossierClient, `Charte-Confidentialite-${nomClientSafe}.pdf`);
  } else {
    cheminPDF = `./Charte-Confidentialite-Capital-Energie-${dateStr}.pdf`;
  }

  const sections = [
    {
      titre: 'OBJET ET ENGAGEMENT DE CONFIDENTIALITÉ',
      contenu: 
        'Capital Énergie s\'engage à garantir la stricte confidentialité de l\'ensemble des documents ' +
        'transmis par ses clients dans le cadre de l\'utilisation du service d\'audit algorithmique. ' +
        'Cette confidentialité s\'applique notamment aux devis, factures, avis d\'imposition et tout ' +
        'autre document à caractère personnel ou professionnel déposé sur la plateforme.',
    },
    {
      titre: 'FINALITÉ DU TRAITEMENT DES DONNÉES',
      contenu:
        'Les données et documents transmis sont utilisés exclusivement pour l\'audit algorithmique ' +
        'de conformité aux réglementations CEE (Certificats d\'Économies d\'Énergie) en vigueur. ' +
        'Aucune utilisation commerciale, partage avec des tiers ou exploitation à d\'autres fins ' +
        'ne sera effectuée sans le consentement explicite et préalable du client.',
    },
    {
      titre: 'DURÉE DE CONSERVATION',
      contenu:
        'Conformément au Règlement Général sur la Protection des Données (RGPD), les documents ' +
        'déposés dans l\'espace client sont conservés pour une durée maximale de 30 jours à compter ' +
        'de leur dépôt. Passé ce délai, les fichiers sont automatiquement et définitivement supprimés ' +
        'par le Module de Conformité afin de limiter les risques de fuite de données.',
    },
    {
      titre: 'MESURES DE SÉCURITÉ',
      contenu:
        'Capital Énergie met en œuvre des mesures techniques et organisationnelles appropriées pour ' +
        'protéger les données contre tout accès non autorisé, modification, divulgation ou destruction. ' +
        'Les accès aux données sont strictement limités aux personnels habilités dans le cadre de leurs missions.',
    },
    {
      titre: 'DROITS DES PERSONNES CONCERNÉES',
      contenu:
        'Conformément au RGPD, vous disposez d\'un droit d\'accès, de rectification, d\'effacement, ' +
        'de limitation du traitement, de portabilité et d\'opposition concernant vos données personnelles. ' +
        'Pour exercer ces droits, contactez notre Délégué à la Protection des Données à l\'adresse : ' +
        CONFIG.entreprise.dpo,
    },
  ];

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
      info: {
        Title: 'Charte de Protection des Données - Capital Énergie',
        Author: 'Capital Énergie - Service Juridique',
        Subject: 'Module de Conformité RGPD',
      },
    });

    const writeStream = fs.createWriteStream(cheminPDF);
    doc.pipe(writeStream);

    // Page 1
    dessinerEnteteCharte(doc);
    let y = dessinerTitreCharte(doc);

    // Sections
    sections.forEach((section, index) => {
      // Vérifier si besoin de nouvelle page
      if (y > 650) {
        doc.addPage();
        y = 50;
      }
      y = dessinerSection(doc, section.titre, section.contenu, y, index + 1);
    });

    // Clause de non-responsabilité
    if (y > 620) {
      doc.addPage();
      y = 50;
    }
    y = dessinerClauseNonResponsabilite(doc, y);

    // Signature
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    doc.fontSize(10)
       .fillColor(CONFIG.couleurs.texte)
       .font('Helvetica')
       .text('Fait à Paris,', 350, y + 20)
       .text(`Le ${new Date().toLocaleDateString('fr-FR')}`, 350, y + 35)
       .font('Helvetica-Bold')
       .text('Capital Énergie', 350, y + 55)
       .font('Helvetica')
       .text('Service Juridique', 350, y + 70);

    // Pieds de page
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      dessinerPiedPageCharte(doc, i + 1, totalPages);
    }

    doc.end();

    writeStream.on('finish', () => {
      resolve({
        chemin: cheminPDF,
        nomClient: nomClient || 'Général',
        dateGeneration: new Date().toISOString(),
      });
    });

    writeStream.on('error', reject);
  });
}

// ============================================================================
// MODULE DE NETTOYAGE AUTOMATIQUE (RGPD)
// ============================================================================

/**
 * Calcule l'âge d'un fichier en jours
 */
function getAgeFichierJours(cheminFichier) {
  const stats = fs.statSync(cheminFichier);
  const maintenant = new Date();
  const dateModif = new Date(stats.mtime);
  const diffMs = maintenant - dateModif;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Scanne récursivement un dossier pour trouver les fichiers
 */
function scannerDossier(dossier, fichiers = []) {
  if (!fs.existsSync(dossier)) return fichiers;

  const elements = fs.readdirSync(dossier);
  
  for (const element of elements) {
    const chemin = path.join(dossier, element);
    const stats = fs.statSync(chemin);
    
    if (stats.isDirectory()) {
      scannerDossier(chemin, fichiers);
    } else {
      fichiers.push({
        chemin,
        nom: element,
        taille: stats.size,
        dateModif: stats.mtime,
        ageJours: getAgeFichierJours(chemin),
      });
    }
  }
  
  return fichiers;
}

/**
 * Identifie les fichiers à supprimer (> 30 jours dans /depot)
 */
function identifierFichiersASupprimer() {
  const fichiersASupprimer = [];
  
  if (!fs.existsSync(CONFIG.dossierClients)) {
    return fichiersASupprimer;
  }

  const clients = fs.readdirSync(CONFIG.dossierClients);
  
  for (const client of clients) {
    const dossierDepot = path.join(CONFIG.dossierClients, client, 'depot');
    
    if (fs.existsSync(dossierDepot)) {
      const fichiers = scannerDossier(dossierDepot);
      
      for (const fichier of fichiers) {
        if (fichier.ageJours > CONFIG.retentionJours) {
          fichiersASupprimer.push({
            ...fichier,
            client,
          });
        }
      }
    }
  }
  
  return fichiersASupprimer;
}

/**
 * Nettoie les archives de plus de 30 jours (conformité RGPD)
 */
function nettoyerArchives(modeSimulation = false) {
  console.log(`\n  🧹 Module de Conformité RGPD - Nettoyage des archives`);
  console.log(`     Rétention maximale : ${CONFIG.retentionJours} jours`);
  console.log(`     Mode : ${modeSimulation ? 'SIMULATION (aucune suppression)' : 'EXÉCUTION'}\n`);

  const fichiersASupprimer = identifierFichiersASupprimer();
  
  if (fichiersASupprimer.length === 0) {
    console.log('  ✅ Aucun fichier à supprimer - Conformité RGPD respectée\n');
    return {
      fichiersSupprimés: 0,
      tailleLibérée: 0,
      details: [],
    };
  }

  console.log(`  📋 ${fichiersASupprimer.length} fichier(s) identifié(s) :\n`);

  let tailleTotal = 0;
  const details = [];

  for (const fichier of fichiersASupprimer) {
    console.log(`     📁 ${fichier.client}`);
    console.log(`        └─ ${fichier.nom}`);
    console.log(`           Âge: ${fichier.ageJours} jours | Taille: ${(fichier.taille / 1024).toFixed(1)} Ko`);
    
    tailleTotal += fichier.taille;
    
    if (!modeSimulation) {
      try {
        fs.unlinkSync(fichier.chemin);
        console.log(`           ✅ Supprimé\n`);
        details.push({ ...fichier, statut: 'supprimé' });
      } catch (error) {
        console.log(`           ❌ Erreur: ${error.message}\n`);
        details.push({ ...fichier, statut: 'erreur', erreur: error.message });
      }
    } else {
      console.log(`           ⏸️ À supprimer (simulation)\n`);
      details.push({ ...fichier, statut: 'simulation' });
    }
  }

  const resultat = {
    fichiersSupprimés: modeSimulation ? 0 : fichiersASupprimer.length,
    fichiersIdentifiés: fichiersASupprimer.length,
    tailleLibérée: modeSimulation ? 0 : tailleTotal,
    taillePotentielle: tailleTotal,
    details,
  };

  console.log('  ─────────────────────────────────────────────────────────');
  console.log(`  📊 Résumé :`);
  console.log(`     Fichiers ${modeSimulation ? 'à supprimer' : 'supprimés'} : ${fichiersASupprimer.length}`);
  console.log(`     Espace ${modeSimulation ? 'libérable' : 'libéré'} : ${(tailleTotal / 1024).toFixed(1)} Ko\n`);

  return resultat;
}

/**
 * Audit des fichiers (mode simulation)
 */
function auditerArchives() {
  return nettoyerArchives(true);
}

// ============================================================================
// INTERFACE LIGNE DE COMMANDE
// ============================================================================

function afficherAide() {
  console.log('\n  📖 COMMANDES DISPONIBLES :\n');
  console.log('  charte [NOM-CLIENT]       Génère la Charte de Confidentialité');
  console.log('     Sans argument : génère une charte générique');
  console.log('     Avec argument : génère dans le dossier client');
  console.log('');
  console.log('  nettoyer                  Supprime les fichiers > 30 jours (RGPD)');
  console.log('     ⚠️  Action irréversible - Utilisez "audit" d\'abord');
  console.log('');
  console.log('  audit                     Liste les fichiers à supprimer (simulation)');
  console.log('     Aucune suppression effectuée');
  console.log('');
  console.log('  aide                      Affiche cette aide');
  console.log('');
  console.log('  📜 CHARTE DE CONFIDENTIALITÉ :');
  console.log('     - Confidentialité des documents (devis, factures, avis)');
  console.log('     - Utilisation pour audit algorithmique uniquement');
  console.log('     - Clause de non-responsabilité incluse');
  console.log('');
  console.log('  🔒 CONFORMITÉ RGPD :');
  console.log('     - Rétention maximale : 30 jours');
  console.log('     - Suppression automatique des fichiers /depot');
  console.log('     - Limitation des risques de fuite de données');
  console.log('');
  console.log('  💡 EXEMPLES :');
  console.log('     node service-juridique.js charte "EcoTherm Solutions"');
  console.log('     node service-juridique.js audit');
  console.log('     node service-juridique.js nettoyer\n');
}

async function main() {
  const args = process.argv.slice(2);
  const commande = args[0] || 'aide';

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   CAPITAL ÉNERGIE - SERVICE JURIDIQUE v1.0.0              ║');
  console.log('║   Module de Conformité                                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  switch (commande) {
    case 'charte':
    case 'charter': {
      const nomClient = args[1] || null;
      
      console.log(`\n  📜 Génération de la Charte de Confidentialité...`);
      if (nomClient) {
        console.log(`     Client : ${nomClient}\n`);
      }

      try {
        const resultat = await genererCharteConfidentialite(nomClient);
        console.log('  ✅ Charte générée avec succès !\n');
        console.log(`     📁 Fichier : ${resultat.chemin}`);
        console.log(`     📅 Date    : ${new Date().toLocaleDateString('fr-FR')}\n`);
      } catch (error) {
        console.error(`  ❌ Erreur : ${error.message}\n`);
      }
      break;
    }

    case 'nettoyer':
    case 'clean': {
      console.log('\n  ⚠️  ATTENTION : Cette action est irréversible !\n');
      nettoyerArchives(false);
      break;
    }

    case 'audit':
    case 'scan': {
      auditerArchives();
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
  genererCharteConfidentialite,
  nettoyerArchives,
  auditerArchives,
  identifierFichiersASupprimer,
  CONFIG,
};
