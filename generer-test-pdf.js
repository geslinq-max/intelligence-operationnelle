/**
 * ============================================================================
 * CAPITAL ÉNERGIE - GÉNÉRATEUR DE DEVIS PDF TEST
 * ============================================================================
 * Script de génération d'un PDF de devis simulé pour tester le lecteur
 * 
 * Usage :
 *   node generer-test-pdf.js
 * 
 * Génère : devis-test.pdf
 * ============================================================================
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION DU DEVIS TEST
// ============================================================================

const DEVIS_DATA = {
  // Entreprise
  entreprise: {
    nom: 'Artisans du Rhône',
    adresse: '25 avenue Jean Jaurès',
    codePostal: '69000',
    ville: 'Lyon',
    telephone: '04 78 12 34 56',
    email: 'contact@artisans-rhone.fr',
    siret: '123 456 789 00012',
    rge: 'RGE QualiPAC N°2024-12345',
  },
  
  // Client
  client: {
    nom: 'Jean Dupont',
    adresse: '10 rue de la République',
    codePostal: '69002',
    ville: 'Lyon',
    telephone: '06 12 34 56 78',
    email: 'jean.dupont@email.fr',
  },
  
  // Devis
  devis: {
    numero: 'DEV-2026-0042',
    date: '13 janvier 2026',
    validite: '13 février 2026',
  },
  
  // Travaux
  travaux: {
    titre: 'Installation d\'une Pompe à Chaleur Air/Eau',
    description: 'Fourniture et pose d\'une pompe à chaleur air/eau pour le chauffage et la production d\'eau chaude sanitaire.',
    ficheCEE: 'BAR-TH-104',
    conformite: 'Conforme à la fiche BAR-TH-104',
  },
  
  // Matériel
  materiel: {
    marque: 'Atlantic',
    modele: 'Alféa Extensa A.I. 10',
    reference: 'ATL-AEX-AI10',
    puissance: '10 kW',
    cop: 'COP 4.2',
  },
  
  // Lignes de devis
  lignes: [
    { description: 'Pompe à Chaleur Atlantic Alféa Extensa A.I. 10 kW', quantite: 1, prixUnitaire: 8500.00 },
    { description: 'Module hydraulique intérieur', quantite: 1, prixUnitaire: 1200.00 },
    { description: 'Ballon ECS 200L', quantite: 1, prixUnitaire: 850.00 },
    { description: 'Kit de raccordement frigorifique', quantite: 1, prixUnitaire: 320.00 },
    { description: 'Main d\'oeuvre installation', quantite: 1, prixUnitaire: 1350.00 },
    { description: 'Mise en service et réglages', quantite: 1, prixUnitaire: 450.00 },
  ],
  
  // TVA
  tauxTVA: 5.5, // TVA réduite travaux énergétiques
};

// ============================================================================
// GÉNÉRATION DU PDF
// ============================================================================

function genererDevisPDF() {
  const doc = new PDFDocument({ 
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });
  
  const outputPath = path.join(__dirname, 'devis-test.pdf');
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);
  
  const pageWidth = doc.page.width - 100;
  
  // ========== EN-TÊTE ENTREPRISE ==========
  doc.fontSize(20).fillColor('#0891b2').text(DEVIS_DATA.entreprise.nom, { align: 'left' });
  doc.fontSize(10).fillColor('#333');
  doc.text(DEVIS_DATA.entreprise.adresse);
  doc.text(`${DEVIS_DATA.entreprise.codePostal} ${DEVIS_DATA.entreprise.ville}`);
  doc.text(`Tél: ${DEVIS_DATA.entreprise.telephone}`);
  doc.text(`Email: ${DEVIS_DATA.entreprise.email}`);
  doc.moveDown(0.5);
  doc.text(`SIRET: ${DEVIS_DATA.entreprise.siret}`);
  doc.fontSize(9).fillColor('#059669').text(DEVIS_DATA.entreprise.rge);
  
  // ========== TITRE DEVIS ==========
  doc.moveDown(1.5);
  doc.fontSize(24).fillColor('#1e293b').text('DEVIS', { align: 'center' });
  doc.fontSize(12).fillColor('#64748b');
  doc.text(`N° ${DEVIS_DATA.devis.numero}`, { align: 'center' });
  doc.text(`Date : ${DEVIS_DATA.devis.date}`, { align: 'center' });
  doc.text(`Validité : ${DEVIS_DATA.devis.validite}`, { align: 'center' });
  
  // ========== CLIENT ==========
  doc.moveDown(1.5);
  doc.fontSize(12).fillColor('#0891b2').text('CLIENT', { underline: true });
  doc.fontSize(11).fillColor('#333');
  doc.text(DEVIS_DATA.client.nom);
  doc.text(DEVIS_DATA.client.adresse);
  doc.text(`${DEVIS_DATA.client.codePostal} ${DEVIS_DATA.client.ville}`);
  doc.text(`Tél: ${DEVIS_DATA.client.telephone}`);
  doc.text(`Email: ${DEVIS_DATA.client.email}`);
  
  // ========== OBJET DES TRAVAUX ==========
  doc.moveDown(1.5);
  doc.fontSize(12).fillColor('#0891b2').text('OBJET DES TRAVAUX', { underline: true });
  doc.fontSize(11).fillColor('#333');
  doc.font('Helvetica-Bold').text(DEVIS_DATA.travaux.titre);
  doc.font('Helvetica').text(DEVIS_DATA.travaux.description);
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#059669').text(DEVIS_DATA.travaux.conformite);
  
  // ========== MATÉRIEL ==========
  doc.moveDown(1);
  doc.fontSize(12).fillColor('#0891b2').text('MATÉRIEL PRÉVU', { underline: true });
  doc.fontSize(11).fillColor('#333');
  doc.text(`Marque : ${DEVIS_DATA.materiel.marque}`);
  doc.text(`Modèle : ${DEVIS_DATA.materiel.modele}`);
  doc.text(`Référence : ${DEVIS_DATA.materiel.reference}`);
  doc.text(`Puissance : ${DEVIS_DATA.materiel.puissance}`);
  doc.text(`Performance : ${DEVIS_DATA.materiel.cop}`);
  
  // ========== TABLEAU DEVIS ==========
  doc.moveDown(1.5);
  doc.fontSize(12).fillColor('#0891b2').text('DÉTAIL DU DEVIS', { underline: true });
  doc.moveDown(0.5);
  
  // En-tête tableau
  const tableTop = doc.y;
  const col1 = 50;
  const col2 = 350;
  const col3 = 400;
  const col4 = 480;
  
  doc.fontSize(10).fillColor('#1e293b').font('Helvetica-Bold');
  doc.text('Description', col1, tableTop);
  doc.text('Qté', col2, tableTop);
  doc.text('P.U. HT', col3, tableTop);
  doc.text('Total HT', col4, tableTop);
  
  // Ligne séparatrice
  doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke('#e2e8f0');
  
  // Lignes du tableau
  let yPos = tableTop + 25;
  let totalHT = 0;
  
  doc.font('Helvetica').fontSize(9).fillColor('#333');
  
  DEVIS_DATA.lignes.forEach(ligne => {
    const ligneTotalHT = ligne.quantite * ligne.prixUnitaire;
    totalHT += ligneTotalHT;
    
    doc.text(ligne.description, col1, yPos, { width: 290 });
    doc.text(ligne.quantite.toString(), col2, yPos);
    doc.text(ligne.prixUnitaire.toFixed(2) + ' €', col3, yPos);
    doc.text(ligneTotalHT.toFixed(2) + ' €', col4, yPos);
    
    yPos += 20;
  });
  
  // Ligne séparatrice
  doc.moveTo(col1, yPos).lineTo(550, yPos).stroke('#e2e8f0');
  yPos += 10;
  
  // ========== TOTAUX ==========
  const tva = totalHT * (DEVIS_DATA.tauxTVA / 100);
  const totalTTC = totalHT + tva;
  
  doc.fontSize(10).font('Helvetica');
  doc.text('Total HT :', col3, yPos);
  doc.text(totalHT.toFixed(2) + ' €', col4, yPos);
  yPos += 18;
  
  doc.text(`TVA ${DEVIS_DATA.tauxTVA}% :`, col3, yPos);
  doc.text(tva.toFixed(2) + ' €', col4, yPos);
  yPos += 18;
  
  doc.moveTo(col3, yPos).lineTo(550, yPos).stroke('#0891b2');
  yPos += 8;
  
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#0891b2');
  doc.text('Total TTC :', col3, yPos);
  doc.text(totalTTC.toFixed(2) + ' €', col4, yPos);
  
  // ========== MENTIONS CEE ==========
  doc.moveDown(3);
  doc.fontSize(9).fillColor('#64748b').font('Helvetica');
  doc.text('─'.repeat(80), { align: 'center' });
  doc.moveDown(0.5);
  doc.text('INFORMATIONS CEE (Certificats d\'Économies d\'Énergie)', { align: 'center' });
  doc.moveDown(0.3);
  doc.text(`Fiche d'opération standardisée : ${DEVIS_DATA.travaux.ficheCEE}`, { align: 'center' });
  doc.text('Cette installation est éligible aux primes CEE.', { align: 'center' });
  doc.text('Estimation prime CEE : 2 500 € à 4 000 € selon revenus.', { align: 'center' });
  
  // ========== PIED DE PAGE ==========
  doc.moveDown(2);
  doc.fontSize(8).fillColor('#94a3b8');
  doc.text('Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.', { align: 'center' });
  doc.moveDown(0.5);
  doc.text(`${DEVIS_DATA.entreprise.nom} - ${DEVIS_DATA.entreprise.siret}`, { align: 'center' });
  
  // Finalisation
  doc.end();
  
  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`\n✅ PDF généré avec succès : ${outputPath}`);
      console.log(`   Taille : ${(fs.statSync(outputPath).size / 1024).toFixed(2)} Ko\n`);
      resolve(outputPath);
    });
    stream.on('error', reject);
  });
}

// ============================================================================
// EXÉCUTION
// ============================================================================

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║    CAPITAL ÉNERGIE - GÉNÉRATEUR DEVIS PDF TEST           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  console.log('📄 Génération du devis de test...\n');
  console.log('   Entreprise : ' + DEVIS_DATA.entreprise.nom);
  console.log('   Client     : ' + DEVIS_DATA.client.nom);
  console.log('   Travaux    : ' + DEVIS_DATA.travaux.titre);
  console.log('   Matériel   : ' + DEVIS_DATA.materiel.marque + ' ' + DEVIS_DATA.materiel.modele);
  console.log('   Fiche CEE  : ' + DEVIS_DATA.travaux.ficheCEE);
  
  // Calcul du total
  const totalHT = DEVIS_DATA.lignes.reduce((sum, l) => sum + (l.quantite * l.prixUnitaire), 0);
  const tva = totalHT * (DEVIS_DATA.tauxTVA / 100);
  const totalTTC = totalHT + tva;
  
  console.log(`   Total TTC  : ${totalTTC.toFixed(2)} €`);
  
  try {
    const outputPath = await genererDevisPDF();
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  💡 Pour tester le lecteur de devis :');
    console.log('     node lecteur-devis.js analyser devis-test.pdf');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

main();

module.exports = { genererDevisPDF, DEVIS_DATA };
