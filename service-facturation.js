/**
 * ============================================================================
 * CAPITAL ÉNERGIE - SERVICE DE FACTURATION
 * ============================================================================
 * Module de génération de factures PDF professionnelles
 * Lit les données clients et forfaits depuis clients-privileges.json
 * 
 * Usage :
 *   node service-facturation.js generer <client>    Génère une facture
 *   node service-facturation.js tous                Génère toutes les factures
 *   node service-facturation.js apercu <client>     Aperçu sans génération
 *   node service-facturation.js liste               Liste les clients facturables
 * 
 * Archivage : ./factures/[ANNEE]/[MOIS]/[NOM-CLIENT].pdf
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  fichierClients: './clients-privileges.json',
  dossierFactures: './factures',
  entreprise: {
    nom: 'Capital Énergie',
    slogan: 'Cellule d\'Expertise Réglementaire',
    adresse: '123 Avenue de l\'Innovation',
    codePostal: '75001',
    ville: 'Paris',
    siret: '123 456 789 00012',
    tvaIntra: 'FR12 123456789',
    email: 'facturation@capital-energie.fr',
    telephone: '01 23 45 67 89',
  },
  tva: 0.20, // 20%
  couleurs: {
    primaire: '#0891b2',
    secondaire: '#06b6d4',
    texte: '#1e293b',
    gris: '#64748b',
    fond: '#f8fafc',
  },
};

// ============================================================================
// CHARGEMENT DES DONNÉES
// ============================================================================

/**
 * Charge les données des clients et forfaits
 */
function chargerDonneesClients() {
  const chemin = path.resolve(CONFIG.fichierClients);
  
  if (!fs.existsSync(chemin)) {
    console.error('  ❌ Fichier clients-privileges.json non trouvé');
    return null;
  }
  
  try {
    return JSON.parse(fs.readFileSync(chemin, 'utf8'));
  } catch (e) {
    console.error('  ❌ Erreur lecture clients-privileges.json:', e.message);
    return null;
  }
}

/**
 * Récupère les informations d'un client avec son forfait
 */
function getInfosClient(identifiant) {
  const donnees = chargerDonneesClients();
  if (!donnees) return null;
  
  const idLower = identifiant.toLowerCase();
  const client = donnees.clients.find(c => 
    c.id === identifiant ||
    c.email.toLowerCase() === idLower ||
    c.nom.toLowerCase().includes(idLower)
  );
  
  if (!client) return null;
  
  const forfait = donnees.forfaits[client.forfait];
  
  return {
    ...client,
    forfaitDetails: forfait,
  };
}

/**
 * Calcule les montants de la facture
 */
function calculerMontants(prixHT) {
  const montantTVA = prixHT * CONFIG.tva;
  const montantTTC = prixHT + montantTVA;
  
  return {
    ht: prixHT,
    tva: montantTVA,
    tauxTVA: CONFIG.tva * 100,
    ttc: montantTTC,
  };
}

/**
 * Génère un numéro de facture unique
 */
function genererNumeroFacture(client) {
  const date = new Date();
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const jour = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `CE-${annee}${mois}${jour}-${random}`;
}

/**
 * Obtient la période de facturation
 */
function getPeriodeFacturation() {
  const date = new Date();
  const mois = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const debut = new Date(date.getFullYear(), date.getMonth(), 1);
  const fin = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  return {
    mois: mois.charAt(0).toUpperCase() + mois.slice(1),
    debut: debut.toLocaleDateString('fr-FR'),
    fin: fin.toLocaleDateString('fr-FR'),
  };
}

// ============================================================================
// GÉNÉRATION PDF
// ============================================================================

/**
 * Crée le chemin d'archivage et le retourne
 */
function creerCheminArchivage(nomClient) {
  const date = new Date();
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const nomClientSafe = nomClient.replace(/[^a-zA-Z0-9]/g, '-');
  
  const dossier = path.join(CONFIG.dossierFactures, String(annee), mois);
  
  // Créer le dossier si nécessaire
  if (!fs.existsSync(dossier)) {
    fs.mkdirSync(dossier, { recursive: true });
  }
  
  const nomFichier = `Facture-${nomClientSafe}-${annee}-${mois}.pdf`;
  return path.join(dossier, nomFichier);
}

/**
 * Dessine l'en-tête de la facture
 */
function dessinerEntete(doc, numeroFacture) {
  const { entreprise, couleurs } = CONFIG;
  
  // Fond en-tête
  doc.rect(0, 0, 612, 120).fill(couleurs.primaire);
  
  // Logo textuel Capital Énergie
  doc.fontSize(28)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('⚡ ' + entreprise.nom, 50, 35);
  
  // Slogan
  doc.fontSize(12)
     .fillColor('#ffffff')
     .font('Helvetica')
     .text(entreprise.slogan, 50, 70);
  
  // Numéro de facture à droite
  doc.fontSize(10)
     .fillColor('#ffffff')
     .text('FACTURE', 450, 35, { align: 'right' })
     .fontSize(14)
     .font('Helvetica-Bold')
     .text(numeroFacture, 450, 50, { align: 'right' });
  
  // Date
  const dateFacture = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.fontSize(10)
     .font('Helvetica')
     .text(dateFacture, 450, 75, { align: 'right' });
}

/**
 * Dessine les informations de l'entreprise et du client
 */
function dessinerInfos(doc, client) {
  const { entreprise, couleurs } = CONFIG;
  const y = 140;
  
  // Informations entreprise (gauche)
  doc.fontSize(10)
     .fillColor(couleurs.gris)
     .font('Helvetica-Bold')
     .text('ÉMETTEUR', 50, y);
  
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor(couleurs.texte)
     .text(entreprise.nom, 50, y + 18)
     .text(entreprise.adresse, 50, y + 30)
     .text(`${entreprise.codePostal} ${entreprise.ville}`, 50, y + 42)
     .text(`SIRET : ${entreprise.siret}`, 50, y + 58)
     .text(`TVA Intra : ${entreprise.tvaIntra}`, 50, y + 70);
  
  // Informations client (droite)
  doc.fontSize(10)
     .fillColor(couleurs.gris)
     .font('Helvetica-Bold')
     .text('DESTINATAIRE', 350, y);
  
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor(couleurs.texte)
     .text(client.nom, 350, y + 18)
     .text(client.email, 350, y + 30)
     .text(`Client depuis le ${new Date(client.dateDebut).toLocaleDateString('fr-FR')}`, 350, y + 42);
  
  // Badge forfait
  const forfait = client.forfaitDetails;
  doc.rect(350, y + 58, 120, 22)
     .fill(forfait.couleur);
  doc.fontSize(10)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text(`${forfait.badge} Forfait ${forfait.nom}`, 355, y + 63);
}

/**
 * Dessine le tableau des prestations
 */
function dessinerTableau(doc, client, montants, periode) {
  const y = 280;
  const { couleurs } = CONFIG;
  const forfait = client.forfaitDetails;
  
  // Titre
  doc.fontSize(12)
     .fillColor(couleurs.texte)
     .font('Helvetica-Bold')
     .text('DÉTAIL DE LA PRESTATION', 50, y);
  
  // Période
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor(couleurs.gris)
     .text(`Période : ${periode.debut} au ${periode.fin}`, 50, y + 18);
  
  // En-tête tableau
  const tableY = y + 45;
  doc.rect(50, tableY, 512, 25).fill(couleurs.fond);
  
  doc.fontSize(9)
     .font('Helvetica-Bold')
     .fillColor(couleurs.gris)
     .text('DÉSIGNATION', 60, tableY + 8)
     .text('QUANTITÉ', 320, tableY + 8)
     .text('PRIX UNIT. HT', 390, tableY + 8)
     .text('TOTAL HT', 490, tableY + 8);
  
  // Ligne 1 : Forfait
  const ligne1Y = tableY + 30;
  doc.rect(50, ligne1Y, 512, 1).fill('#e2e8f0');
  
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(couleurs.texte)
     .text(`Forfait ${forfait.nom} - Abonnement mensuel`, 60, ligne1Y + 10)
     .text('1', 340, ligne1Y + 10)
     .text(`${forfait.prix.toFixed(2)} €`, 390, ligne1Y + 10)
     .text(`${forfait.prix.toFixed(2)} €`, 490, ligne1Y + 10);
  
  // Description forfait
  doc.fontSize(8)
     .fillColor(couleurs.gris)
     .text(`Inclus : ${forfait.dossiersMax === -1 ? 'Dossiers illimités' : forfait.dossiersMax + ' dossiers/mois'} • Priorité ${forfait.priorite}`, 60, ligne1Y + 25);
  
  // Ligne 2 : Dossiers traités
  const ligne2Y = ligne1Y + 50;
  doc.rect(50, ligne2Y, 512, 1).fill('#e2e8f0');
  
  const nbDossiers = client.dossiersTraitesCeMois || 0;
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(couleurs.texte)
     .text('Dossiers protégés par le Système d\'Audit', 60, ligne2Y + 10)
     .text(String(nbDossiers), 340, ligne2Y + 10)
     .text('Inclus', 390, ligne2Y + 10)
     .text('0.00 €', 490, ligne2Y + 10);
  
  // Description dossiers
  doc.fontSize(8)
     .fillColor(couleurs.gris)
     .text(`${nbDossiers} dossier(s) sécurisé(s) durant la période de facturation`, 60, ligne2Y + 25);
  
  // Ligne de séparation totaux
  const totauxY = ligne2Y + 55;
  doc.rect(350, totauxY, 212, 1).fill(couleurs.primaire);
  
  // Totaux
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(couleurs.texte)
     .text('Total HT', 360, totauxY + 12)
     .text(`${montants.ht.toFixed(2)} €`, 490, totauxY + 12)
     .text(`TVA (${montants.tauxTVA}%)`, 360, totauxY + 30)
     .text(`${montants.tva.toFixed(2)} €`, 490, totauxY + 30);
  
  // Total TTC
  doc.rect(350, totauxY + 48, 212, 30).fill(couleurs.primaire);
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .text('TOTAL TTC', 360, totauxY + 56)
     .text(`${montants.ttc.toFixed(2)} €`, 480, totauxY + 56);
  
  return totauxY + 90;
}

/**
 * Dessine le récapitulatif des services
 */
function dessinerRecapitulatif(doc, client, y) {
  const { couleurs } = CONFIG;
  const forfait = client.forfaitDetails;
  const nbDossiers = client.dossiersTraitesCeMois || 0;
  
  // Encadré récapitulatif
  doc.rect(50, y, 512, 80)
     .lineWidth(1)
     .stroke(couleurs.primaire);
  
  doc.rect(50, y, 512, 25).fill(couleurs.fond);
  
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor(couleurs.primaire)
     .text('📊 RÉCAPITULATIF DES SERVICES', 60, y + 7);
  
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor(couleurs.texte)
     .text(`✅ ${nbDossiers} dossier(s) protégé(s) par le Système d'Audit ce mois-ci`, 60, y + 35)
     .text(`✅ Forfait ${forfait.nom} : ${forfait.fonctionnalites.slice(0, 3).join(', ')}`, 60, y + 50)
     .text(`✅ Service de Veille Réglementaire actif`, 60, y + 65);
  
  return y + 100;
}

/**
 * Dessine le pied de page
 */
function dessinerPiedPage(doc) {
  const { entreprise, couleurs } = CONFIG;
  const y = 720;
  
  // Ligne de séparation
  doc.rect(50, y, 512, 1).fill(couleurs.gris);
  
  // Conditions de paiement
  doc.fontSize(8)
     .font('Helvetica')
     .fillColor(couleurs.gris)
     .text('Conditions de paiement : Paiement à réception de facture', 50, y + 10)
     .text('Mode de règlement : Virement bancaire ou prélèvement automatique', 50, y + 22);
  
  // Coordonnées
  doc.text(`${entreprise.nom} • ${entreprise.adresse}, ${entreprise.codePostal} ${entreprise.ville}`, 50, y + 45, { align: 'center', width: 512 })
     .text(`${entreprise.email} • ${entreprise.telephone}`, 50, y + 57, { align: 'center', width: 512 });
  
  // Mention légale
  doc.fontSize(7)
     .text('Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.', 50, y + 75, { align: 'center', width: 512 });
}

/**
 * Génère la facture PDF complète
 */
async function genererFacturePDF(identifiant, options = {}) {
  const client = getInfosClient(identifiant);
  
  if (!client) {
    console.error(`  ❌ Client non trouvé : ${identifiant}`);
    return null;
  }
  
  const forfait = client.forfaitDetails;
  const numeroFacture = genererNumeroFacture(client);
  const montants = calculerMontants(forfait.prix);
  const periode = getPeriodeFacturation();
  const cheminPDF = creerCheminArchivage(client.nom);
  
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Facture ${numeroFacture} - ${client.nom}`,
        Author: 'Capital Énergie',
        Subject: `Facture ${periode.mois}`,
      },
    });
    
    const writeStream = fs.createWriteStream(cheminPDF);
    doc.pipe(writeStream);
    
    // Dessiner les différentes sections
    dessinerEntete(doc, numeroFacture);
    dessinerInfos(doc, client);
    const yApresTableau = dessinerTableau(doc, client, montants, periode);
    dessinerRecapitulatif(doc, client, yApresTableau);
    dessinerPiedPage(doc);
    
    doc.end();
    
    writeStream.on('finish', () => {
      resolve({
        chemin: cheminPDF,
        numeroFacture,
        client: client.nom,
        forfait: forfait.nom,
        montants,
        periode,
      });
    });
    
    writeStream.on('error', reject);
  });
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Génère les factures pour tous les clients
 */
async function genererToutesFactures() {
  const donnees = chargerDonneesClients();
  if (!donnees) return [];
  
  const resultats = [];
  
  for (const client of donnees.clients) {
    try {
      const resultat = await genererFacturePDF(client.id);
      if (resultat) {
        resultats.push(resultat);
        console.log(`  ✅ Facture générée : ${client.nom}`);
      }
    } catch (error) {
      console.error(`  ❌ Erreur pour ${client.nom}: ${error.message}`);
    }
  }
  
  return resultats;
}

/**
 * Affiche un aperçu de la facture (sans génération)
 */
function afficherApercu(identifiant) {
  const client = getInfosClient(identifiant);
  
  if (!client) {
    console.log(`\n  ❌ Client non trouvé : ${identifiant}\n`);
    return;
  }
  
  const forfait = client.forfaitDetails;
  const montants = calculerMontants(forfait.prix);
  const periode = getPeriodeFacturation();
  
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  📄 APERÇU FACTURE                                      │');
  console.log('  └─────────────────────────────────────────────────────────┘\n');
  
  console.log(`  🏢 ${CONFIG.entreprise.nom}`);
  console.log(`     ${CONFIG.entreprise.slogan}\n`);
  
  console.log(`  👤 Client : ${client.nom}`);
  console.log(`  📧 Email  : ${client.email}`);
  console.log(`  ${forfait.badge} Forfait : ${forfait.nom}\n`);
  
  console.log(`  📅 Période : ${periode.mois}`);
  console.log(`     Du ${periode.debut} au ${periode.fin}\n`);
  
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  📋 DÉTAIL\n');
  console.log(`     Forfait ${forfait.nom}        ${forfait.prix.toFixed(2)} €`);
  console.log(`     Dossiers sécurisés : ${client.dossiersTraitesCeMois || 0}   (inclus)`);
  console.log('');
  console.log(`     Total HT            ${montants.ht.toFixed(2)} €`);
  console.log(`     TVA (${montants.tauxTVA}%)           ${montants.tva.toFixed(2)} €`);
  console.log('  ─────────────────────────────────────────────────────────');
  console.log(`     TOTAL TTC           ${montants.ttc.toFixed(2)} €\n`);
}

/**
 * Liste les clients facturables
 */
function listerClientsFacturables() {
  const donnees = chargerDonneesClients();
  if (!donnees) return;
  
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  👥 CLIENTS FACTURABLES                                 │');
  console.log('  └─────────────────────────────────────────────────────────┘\n');
  
  donnees.clients.forEach(client => {
    const forfait = donnees.forfaits[client.forfait];
    const montants = calculerMontants(forfait.prix);
    
    console.log(`     ${forfait.badge} ${client.nom}`);
    console.log(`        Forfait: ${forfait.nom} | ${montants.ttc.toFixed(2)} € TTC/mois`);
    console.log(`        Dossiers ce mois: ${client.dossiersTraitesCeMois || 0}\n`);
  });
}

// ============================================================================
// INTERFACE LIGNE DE COMMANDE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const commande = args[0] || 'help';

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   CAPITAL ÉNERGIE - SERVICE DE FACTURATION v1.0.0         ║');
  console.log('║   Cellule d\'Expertise Réglementaire                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  switch (commande) {
    case 'generer':
    case 'generate': {
      const client = args[1];
      if (!client) {
        console.log('\n  ❌ Usage : node service-facturation.js generer <client>\n');
        break;
      }
      
      console.log(`\n  📄 Génération de la facture pour : ${client}\n`);
      
      try {
        const resultat = await genererFacturePDF(client);
        if (resultat) {
          console.log('  ✅ Facture générée avec succès !\n');
          console.log(`     📁 Fichier : ${resultat.chemin}`);
          console.log(`     🔢 Numéro  : ${resultat.numeroFacture}`);
          console.log(`     💰 Montant : ${resultat.montants.ttc.toFixed(2)} € TTC\n`);
        }
      } catch (error) {
        console.error(`  ❌ Erreur : ${error.message}\n`);
      }
      break;
    }
    
    case 'tous':
    case 'all': {
      console.log('\n  📄 Génération de toutes les factures...\n');
      
      const resultats = await genererToutesFactures();
      
      console.log('\n  ─────────────────────────────────────────────────────────');
      console.log(`  📊 ${resultats.length} facture(s) générée(s)\n`);
      
      const total = resultats.reduce((sum, r) => sum + r.montants.ttc, 0);
      console.log(`     💰 Total TTC : ${total.toFixed(2)} €\n`);
      break;
    }
    
    case 'apercu':
    case 'preview': {
      const client = args[1];
      if (!client) {
        console.log('\n  ❌ Usage : node service-facturation.js apercu <client>\n');
        break;
      }
      afficherApercu(client);
      break;
    }
    
    case 'liste':
    case 'list': {
      listerClientsFacturables();
      break;
    }
    
    case 'help':
    default: {
      console.log('\n  📖 COMMANDES DISPONIBLES :\n');
      console.log('  generer <client>     Génère une facture PDF pour un client');
      console.log('');
      console.log('  tous                 Génère les factures de tous les clients');
      console.log('');
      console.log('  apercu <client>      Affiche un aperçu de la facture');
      console.log('');
      console.log('  liste                Liste tous les clients facturables');
      console.log('');
      console.log('  help                 Affiche cette aide');
      console.log('');
      console.log('  📁 ARCHIVAGE :');
      console.log('     ./factures/[ANNEE]/[MOIS]/[CLIENT].pdf');
      console.log('');
      console.log('  💼 FORFAITS :');
      console.log('     🔵 Essentiel : 149€ HT/mois (178.80€ TTC)');
      console.log('     ⭐ Sérénité  : 390€ HT/mois (468.00€ TTC)');
      console.log('     👑 Expert    : 890€ HT/mois (1068.00€ TTC)');
      console.log('');
      console.log('  💡 EXEMPLE :');
      console.log('     node service-facturation.js generer "EcoTherm Solutions"');
      console.log('     node service-facturation.js tous\n');
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
  chargerDonneesClients,
  getInfosClient,
  calculerMontants,
  genererFacturePDF,
  genererToutesFactures,
  afficherApercu,
  listerClientsFacturables,
  CONFIG,
};
