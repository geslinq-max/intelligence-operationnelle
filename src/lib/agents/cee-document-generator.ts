/**
 * Agent de Génération de Documents CEE
 * 
 * Génère le Pack Conformité contenant :
 * - Devis CEE (avec mentions Arrêté 22/12/2025)
 * - Attestation sur l'Honneur (AH)
 * - Mandat de Délégation
 * 
 * Produit un fichier ZIP téléchargeable
 */

import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import type { ExtractionResult } from './cee-extractor';
import type { ValidationReport } from './cee-validator';

// ============================================================================
// TYPES
// ============================================================================

export interface DocumentGeneratorInput {
  extraction: ExtractionResult;
  validation: ValidationReport;
  dossier_id?: string;
}

export interface GeneratedPack {
  zip_blob: Blob;
  filename: string;
  documents: {
    devis: Blob;
    attestation: Blob;
    mandat: Blob;
  };
}

// ============================================================================
// CONSTANTES
// ============================================================================

const CONFIG = {
  ARRETE_REFERENCE: 'Arrêté du 22 décembre 2025',
  MENTION_LEGALE: 'Ce document est généré conformément aux dispositions de l\'arrêté du 22 décembre 2025 relatif aux certificats d\'économies d\'énergie.',
  CAPITAL_ENERGIE: {
    nom: 'CAPITAL ÉNERGIE',
    adresse: 'Partenaire de gestion des primes CEE',
  },
};

// ============================================================================
// UTILITAIRES PDF
// ============================================================================

function formatNumber(value: number): string {
  return value.toLocaleString('fr-FR');
}

function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function generateDossierId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CE-${year}-${rand}`;
}

function cleanZone(doc: jsPDF, x: number, y: number, w: number, h: number): void {
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, w, h, 'F');
}

function addHeader(doc: jsPDF, title: string, subtitle: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text(title, pageWidth / 2, y, { align: 'center' });
  
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, pageWidth / 2, y, { align: 'center' });
  
  return y + 10;
}

function addFooter(doc: jsPDF, dossierId: string, pageNum: number, totalPages: number): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  cleanZone(doc, 0, 275, 210, 25);
  
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(CONFIG.MENTION_LEGALE, pageWidth / 2, 280, { align: 'center', maxWidth: 180 });
  doc.text(`${CONFIG.CAPITAL_ENERGIE.nom} - ${dossierId} - Page ${pageNum}/${totalPages}`, pageWidth / 2, 287, { align: 'center' });
}

function addReferenceBox(doc: jsPDF, dossierId: string, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - 2 * margin, 12, 'F');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Référence dossier : ${dossierId}`, margin + 5, y + 7);
  doc.text(`Date : ${formatDate()}`, pageWidth - margin - 50, y + 7);
  
  return y + 18;
}

// ============================================================================
// GÉNÉRATION DEVIS CEE
// ============================================================================

function generateDevisPDF(input: DocumentGeneratorInput, dossierId: string): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  const { extraction } = input;
  const puissance = extraction.puissance_nominale_kw.value || 0;
  const kwhCumac = extraction.calcul_cee?.kwh_cumac || 0;
  const prime = extraction.calcul_cee?.prime_estimee_euros || 0;
  const ficheRef = extraction.calcul_cee?.fiche_reference || 'IND-UT-102';
  
  // Calculs
  const prixMaterielHT = Math.round(puissance * 150);
  const prixPoseHT = Math.round(puissance * 30);
  const totalBrutHT = prixMaterielHT + prixPoseHT;
  const resteACharge = Math.max(0, totalBrutHT - prime);
  
  // En-tête
  let y = addHeader(doc, 'DEVIS', 'Opération d\'économies d\'énergie - CEE');
  y = addReferenceBox(doc, dossierId, y);
  
  // Section Client
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('CLIENT', margin, y);
  y += 6;
  
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, pageWidth - 2 * margin, 28, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  
  const clientNom = extraction.coordonnees_client.nom.value || '___________________________';
  const clientAdresse = extraction.coordonnees_client.adresse.value || '___________________________';
  const clientVille = `${extraction.coordonnees_client.code_postal.value || '_____'} ${extraction.coordonnees_client.ville.value || '_______________'}`;
  
  doc.text(`Raison sociale : ${clientNom}`, margin + 5, y + 8);
  doc.text(`Adresse : ${clientAdresse}`, margin + 5, y + 16);
  doc.text(`Ville : ${clientVille}`, margin + 5, y + 24);
  y += 35;
  
  // Section Opération
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('OBJET DU DEVIS', margin, y);
  y += 6;
  
  doc.setFillColor(239, 246, 255);
  doc.rect(margin, y, pageWidth - 2 * margin, 32, 'F');
  doc.setDrawColor(191, 219, 254);
  doc.rect(margin, y, pageWidth - 2 * margin, 32, 'S');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`Fiche d'opération : ${ficheRef}`, margin + 5, y + 8);
  doc.text('Intitulé : Système de variation électronique de vitesse sur moteur asynchrone', margin + 5, y + 16);
  doc.text(`Puissance nominale du moteur : ${puissance} kW`, margin + 5, y + 24);
  doc.text(`Type moteur : ${extraction.type_moteur.value || 'IE3/IE4'}`, margin + 5, y + 30);
  y += 40;
  
  // Tableau chiffrage
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('CHIFFRAGE', margin, y);
  y += 6;
  
  // En-tête tableau
  doc.setFillColor(30, 64, 175);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('DÉSIGNATION', margin + 3, y + 5.5);
  doc.text('MONTANT HT', pageWidth - margin - 3, y + 5.5, { align: 'right' });
  y += 8;
  
  // Ligne matériel
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text('Fourniture : Variateur de vitesse électronique (VEV)', margin + 3, y + 6.5);
  doc.text(`${formatNumber(prixMaterielHT)} €`, pageWidth - margin - 3, y + 6.5, { align: 'right' });
  y += 10;
  
  // Ligne pose
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
  doc.text('Prestation : Pose, raccordement et paramétrage', margin + 3, y + 6.5);
  doc.text(`${formatNumber(prixPoseHT)} €`, pageWidth - margin - 3, y + 6.5, { align: 'right' });
  y += 10;
  
  // Total brut
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL BRUT HT', margin + 3, y + 6.5);
  doc.text(`${formatNumber(totalBrutHT)} €`, pageWidth - margin - 3, y + 6.5, { align: 'right' });
  y += 10;
  
  // Prime CEE
  doc.setFillColor(220, 252, 231);
  doc.rect(margin, y, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(22, 163, 74);
  doc.text(`Prime CEE ${ficheRef} (${formatNumber(kwhCumac)} kWh cumac)`, margin + 3, y + 7.5);
  doc.text(`- ${formatNumber(prime)} €`, pageWidth - margin - 3, y + 7.5, { align: 'right' });
  y += 12;
  
  // Reste à charge
  doc.setFillColor(219, 234, 254);
  doc.rect(margin, y, pageWidth - 2 * margin, 14, 'F');
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(11);
  doc.text('RESTE À CHARGE CLIENT HT', margin + 3, y + 9);
  doc.text(`${formatNumber(resteACharge)} €`, pageWidth - margin - 3, y + 9, { align: 'right' });
  y += 22;
  
  // Mentions obligatoires CEE
  doc.setFillColor(254, 249, 195);
  doc.rect(margin, y, pageWidth - 2 * margin, 40, 'F');
  doc.setDrawColor(250, 204, 21);
  doc.rect(margin, y, pageWidth - 2 * margin, 40, 'S');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(161, 98, 7);
  doc.text('MENTIONS OBLIGATOIRES CEE', margin + 5, y + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(113, 63, 18);
  const mentions = [
    `Travaux relevant de la fiche d'opération standardisée ${ficheRef}.`,
    `Référence réglementaire : ${CONFIG.ARRETE_REFERENCE}.`,
    `Économies d'énergie générées : ${formatNumber(kwhCumac)} kWh cumac.`,
    `La prime CEE est déduite du montant des travaux sur acceptation du dossier.`,
    `Validité du devis : 30 jours.`,
  ];
  let mY = y + 15;
  mentions.forEach(m => {
    doc.text(`• ${m}`, margin + 5, mY);
    mY += 5;
  });
  y += 48;
  
  // Signatures
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Le Client', margin, y);
  doc.text('Le Professionnel RGE', pageWidth - margin - 45, y);
  y += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Bon pour accord, signature', margin, y);
  doc.text('Signature et cachet', pageWidth - margin - 45, y);
  
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y + 3, 55, 25, 'S');
  doc.rect(pageWidth - margin - 55, y + 3, 55, 25, 'S');
  
  // Footer
  addFooter(doc, dossierId, 1, 1);
  
  return doc.output('blob');
}

// ============================================================================
// GÉNÉRATION ATTESTATION SUR L'HONNEUR
// ============================================================================

function generateAttestationPDF(input: DocumentGeneratorInput, dossierId: string): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  const { extraction } = input;
  const puissance = extraction.puissance_nominale_kw.value || 0;
  const kwhCumac = extraction.calcul_cee?.kwh_cumac || 0;
  const ficheRef = extraction.calcul_cee?.fiche_reference || 'IND-UT-102';
  
  // En-tête
  let y = addHeader(doc, 'ATTESTATION SUR L\'HONNEUR', 'Opération d\'économies d\'énergie - CEE');
  y = addReferenceBox(doc, dossierId, y);
  
  // Section Bénéficiaire
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('BÉNÉFICIAIRE DE L\'OPÉRATION', margin, y);
  y += 6;
  
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, pageWidth - 2 * margin, 32, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const clientNom = extraction.coordonnees_client.nom.value || '___________________________';
  const clientAdresse = extraction.coordonnees_client.adresse.value || '___________________________';
  const clientCP = extraction.coordonnees_client.code_postal.value || '_____';
  const clientVille = extraction.coordonnees_client.ville.value || '_______________';
  
  doc.text(`Raison sociale : ${clientNom}`, margin + 5, y + 8);
  doc.text(`Adresse : ${clientAdresse}`, margin + 5, y + 16);
  doc.text(`Code postal : ${clientCP}     Ville : ${clientVille}`, margin + 5, y + 24);
  doc.text(`SIRET : ____________________________`, margin + 5, y + 30);
  y += 40;
  
  // Section Artisan RGE
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('PROFESSIONNEL AYANT RÉALISÉ L\'OPÉRATION', margin, y);
  y += 6;
  
  doc.setFillColor(239, 246, 255);
  doc.rect(margin, y, pageWidth - 2 * margin, 24, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const siret = extraction.siret_artisan.value || '____________________________';
  doc.text(`SIRET : ${siret}`, margin + 5, y + 8);
  doc.text('Qualification RGE : ☐ Oui  ☐ Non', margin + 5, y + 16);
  doc.text('N° de qualification : ____________________________', margin + 5, y + 22);
  y += 32;
  
  // Section Opération
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('CARACTÉRISTIQUES DE L\'OPÉRATION', margin, y);
  y += 6;
  
  doc.setFillColor(220, 252, 231);
  doc.rect(margin, y, pageWidth - 2 * margin, 36, 'F');
  doc.setDrawColor(134, 239, 172);
  doc.rect(margin, y, pageWidth - 2 * margin, 36, 'S');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`Fiche d'opération standardisée : ${ficheRef}`, margin + 5, y + 8);
  doc.text('Intitulé : Système de variation électronique de vitesse sur moteur asynchrone', margin + 5, y + 16);
  doc.text(`Puissance nominale du moteur : ${puissance} kW`, margin + 5, y + 24);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text(`Volume CEE généré : ${formatNumber(kwhCumac)} kWh cumac`, margin + 5, y + 32);
  y += 44;
  
  // Engagement
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('ENGAGEMENT DU BÉNÉFICIAIRE', margin, y);
  y += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  
  const engagements = [
    'Je soussigné(e), représentant légal de l\'entreprise bénéficiaire, atteste sur l\'honneur :',
    '',
    '☑ Que les travaux décrits ci-dessus ont été réalisés conformément aux exigences de la fiche',
    `   d'opération standardisée ${ficheRef}.`,
    '',
    '☑ Que le matériel installé est neuf et répond aux critères techniques requis.',
    '',
    '☑ Que je n\'ai pas bénéficié d\'une autre aide de l\'État pour cette même opération au titre',
    '   des certificats d\'économies d\'énergie.',
    '',
    '☑ Que les informations fournies dans ce document sont exactes et sincères.',
  ];
  
  engagements.forEach(line => {
    doc.text(line, margin, y);
    y += 5;
  });
  y += 8;
  
  // Signatures
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Le Bénéficiaire', margin, y);
  doc.text('Le Professionnel RGE', pageWidth - margin - 45, y);
  y += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Date et signature', margin, y);
  doc.text('Date et signature', pageWidth - margin - 45, y);
  
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y + 3, 55, 25, 'S');
  doc.rect(pageWidth - margin - 55, y + 3, 55, 25, 'S');
  
  // Footer
  addFooter(doc, dossierId, 1, 1);
  
  return doc.output('blob');
}

// ============================================================================
// GÉNÉRATION MANDAT DE DÉLÉGATION
// ============================================================================

function generateMandatPDF(input: DocumentGeneratorInput, dossierId: string): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  const { extraction } = input;
  const kwhCumac = extraction.calcul_cee?.kwh_cumac || 0;
  const prime = extraction.calcul_cee?.prime_estimee_euros || 0;
  const ficheRef = extraction.calcul_cee?.fiche_reference || 'IND-UT-102';
  
  // Calcul des frais de gestion (10%)
  const tauxFraisGestion = 0.10;
  const fraisGestion = Math.round(prime * tauxFraisGestion * 100) / 100;
  const primeNette = Math.round((prime - fraisGestion) * 100) / 100;
  
  // En-tête
  let y = addHeader(doc, 'MANDAT DE DÉLÉGATION', 'Gestion des Certificats d\'Économies d\'Énergie (CEE)');
  y = addReferenceBox(doc, dossierId, y);
  
  // Section Mandant
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('ARTICLE 1 - LE MANDANT (Bénéficiaire des travaux)', margin, y);
  y += 6;
  
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, pageWidth - 2 * margin, 28, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const clientNom = extraction.coordonnees_client.nom.value || '___________________________';
  const clientAdresse = extraction.coordonnees_client.adresse.value || '___________________________';
  
  doc.text(`Raison sociale : ${clientNom}`, margin + 5, y + 7);
  doc.text(`Adresse : ${clientAdresse}`, margin + 5, y + 14);
  doc.text('Représenté par : ___________________________  SIRET : ____________________', margin + 5, y + 21);
  y += 34;
  
  // Section Mandataire
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('ARTICLE 2 - LE MANDATAIRE (Gestionnaire CEE)', margin, y);
  y += 6;
  
  doc.setFillColor(239, 246, 255);
  doc.rect(margin, y, pageWidth - 2 * margin, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 64, 175);
  doc.text(CONFIG.CAPITAL_ENERGIE.nom, margin + 5, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(CONFIG.CAPITAL_ENERGIE.adresse, margin + 5, y + 14);
  y += 22;
  
  // ARTICLE 3 - Objet du mandat (détaillé pour IND-UT-102)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('ARTICLE 3 - OBJET DU MANDAT', margin, y);
  y += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  
  const objetLines = [
    `Le Mandant autorise ${CONFIG.CAPITAL_ENERGIE.nom} à accomplir, en son nom et pour son compte,`,
    `toutes les démarches administratives relatives à la fiche d'opération standardisée ${ficheRef}`,
    '(Système de variation électronique de vitesse sur moteur asynchrone), notamment :',
    '',
    '• La constitution et le dépôt du dossier CEE auprès des obligés (énergéticiens)',
    '• Le suivi administratif jusqu\'à la validation complète du dossier',
    '• La négociation et la valorisation des certificats générés sur le marché',
    '• L\'encaissement de la prime CEE pour le compte du Mandant',
    '• La gestion des éventuels contrôles et demandes de pièces complémentaires',
  ];
  
  objetLines.forEach(line => {
    doc.text(line, margin, y);
    y += 4;
  });
  y += 4;
  
  // ARTICLE 4 - Montant et rémunération
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('ARTICLE 4 - MONTANT DE LA PRIME ET RÉMUNÉRATION', margin, y);
  y += 5;
  
  // Tableau des montants
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, pageWidth - 2 * margin, 28, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, pageWidth - 2 * margin, 28, 'S');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`Opération : ${ficheRef} - ${formatNumber(kwhCumac)} kWh cumac`, margin + 5, y + 6);
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Prime CEE brute :`, margin + 5, y + 13);
  doc.text(`${formatNumber(prime)} €`, pageWidth - margin - 35, y + 13);
  
  doc.setTextColor(220, 38, 38);
  doc.text(`Frais de gestion (${(tauxFraisGestion * 100).toFixed(0)}%) :`, margin + 5, y + 20);
  doc.text(`- ${formatNumber(fraisGestion)} €`, pageWidth - margin - 35, y + 20);
  
  doc.setTextColor(22, 163, 74);
  doc.text(`Prime nette reversée au Mandant :`, margin + 5, y + 27);
  doc.text(`${formatNumber(primeNette)} €`, pageWidth - margin - 35, y + 27);
  y += 33;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(`La prestation de gestion administrative est facturée à hauteur de ${(tauxFraisGestion * 100).toFixed(0)}% du montant`, margin, y);
  y += 4;
  doc.text('de la prime CEE générée, conformément aux conditions générales acceptées par le Mandant.', margin, y);
  y += 8;
  
  // ARTICLE 5 - Modalités de versement
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('ARTICLE 5 - MODALITÉS DE VERSEMENT', margin, y);
  y += 5;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  
  const versementLines = [
    'La prime CEE est versée au Bénéficiaire (Mandant) après déduction des frais de service de',
    `${CONFIG.CAPITAL_ENERGIE.nom}, conformément à l'${CONFIG.ARRETE_REFERENCE} relatif aux`,
    'modalités d\'application du dispositif des certificats d\'économies d\'énergie.',
    '',
    'Le versement intervient dans un délai de 30 jours suivant la validation définitive du dossier',
    'par l\'obligé et la réception effective des fonds par le Mandataire.',
  ];
  
  versementLines.forEach(line => {
    doc.text(line, margin, y);
    y += 4;
  });
  y += 4;
  
  // ARTICLE 6 - Durée et révocation
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('ARTICLE 6 - DURÉE ET RÉVOCATION', margin, y);
  y += 5;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  
  const dureeLines = [
    'Le présent mandat est consenti pour une durée indéterminée, courant à compter de sa signature',
    'jusqu\'à la clôture complète du dossier CEE, y compris la fin de toute opération de contrôle',
    'COFRAC (Comité Français d\'Accréditation) susceptible d\'être diligentée sur le dossier.',
    '',
    'Le Mandant peut révoquer le présent mandat à tout moment par lettre recommandée avec AR.',
    'En cas de révocation avant le versement de la prime, les frais engagés par le Mandataire',
    'restent dus par le Mandant.',
  ];
  
  dureeLines.forEach(line => {
    doc.text(line, margin, y);
    y += 4;
  });
  y += 6;
  
  // Signatures
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Le Mandant (Lu et approuvé)', margin, y);
  doc.text('Le Mandataire', pageWidth - margin - 35, y);
  y += 4;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Lu et approuvé, date et signature', margin, y);
  doc.text('Date et signature', pageWidth - margin - 35, y);
  
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y + 3, 60, 28, 'S');
  doc.rect(pageWidth - margin - 60, y + 3, 60, 28, 'S');
  
  // Footer
  addFooter(doc, dossierId, 1, 1);
  
  return doc.output('blob');
}

// ============================================================================
// FONCTION PRINCIPALE : GÉNÉRATION DU PACK COMPLET
// ============================================================================

/**
 * Génère le Pack Conformité CEE (ZIP contenant 3 PDFs)
 * 
 * @param input - Données d'extraction et validation
 * @returns Pack généré avec blob ZIP et documents individuels
 * 
 * @example
 * ```typescript
 * const pack = await generateConformityPack({ extraction, validation });
 * 
 * // Télécharger le ZIP
 * const link = document.createElement('a');
 * link.href = URL.createObjectURL(pack.zip_blob);
 * link.download = pack.filename;
 * link.click();
 * ```
 */
export async function generateConformityPack(input: DocumentGeneratorInput): Promise<GeneratedPack> {
  const dossierId = input.dossier_id || generateDossierId();
  
  // Génération des 3 documents
  const devisBlob = generateDevisPDF(input, dossierId);
  const attestationBlob = generateAttestationPDF(input, dossierId);
  const mandatBlob = generateMandatPDF(input, dossierId);
  
  // Création du ZIP
  const zip = new JSZip();
  const folder = zip.folder(`Pack_CEE_${dossierId}`);
  
  if (folder) {
    folder.file(`Devis_CEE_${dossierId}.pdf`, devisBlob);
    folder.file(`Attestation_Honneur_${dossierId}.pdf`, attestationBlob);
    folder.file(`Mandat_Delegation_${dossierId}.pdf`, mandatBlob);
  }
  
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  
  return {
    zip_blob: zipBlob,
    filename: `Pack_CEE_${dossierId}.zip`,
    documents: {
      devis: devisBlob,
      attestation: attestationBlob,
      mandat: mandatBlob,
    },
  };
}

/**
 * Télécharge le Pack Conformité directement
 */
export async function downloadConformityPack(input: DocumentGeneratorInput): Promise<void> {
  const pack = await generateConformityPack(input);
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(pack.zip_blob);
  link.download = pack.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
