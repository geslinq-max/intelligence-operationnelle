// ============================================================================
// GÉNÉRATEUR PDF - Registre Phytosanitaire
// Format réglementaire pour contrôles viticoles
// ============================================================================

import { jsPDF } from 'jspdf';
import { TraitementPhyto, formatDateFR, getTypeLabel } from '@/lib/phyto/phyto-products';

interface RegistrePhytoData {
  exploitant: {
    nom: string;
    adresse: string;
    siret?: string;
    numAgrement?: string;
  };
  traitements: TraitementPhyto[];
  dateGeneration: string;
}

function cleanZone(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, w, h, 'F');
}

export function generateRegistrePhytoPDF(data: RegistrePhytoData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  
  let currentY = margin;
  let pageNumber = 1;

  // Fonction pour ajouter une nouvelle page
  const addNewPage = () => {
    doc.addPage();
    pageNumber++;
    currentY = margin;
    addHeader();
  };

  // Fonction pour vérifier et ajouter une page si nécessaire
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 30) {
      addNewPage();
      return true;
    }
    return false;
  };

  // Header de chaque page
  const addHeader = () => {
    // Bandeau vert foncé
    doc.setFillColor(22, 101, 52);
    doc.rect(0, 0, pageWidth, 25, 'F');

    // Titre
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRE PHYTOSANITAIRE', margin, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Document réglementaire - Article L. 254-3-1 du Code rural', margin, 19);

    // Logo / Icon placeholder
    doc.setFontSize(20);
    doc.text('🍇', pageWidth - margin - 10, 15);

    currentY = 35;
  };

  // Ajouter le header initial
  addHeader();

  // Informations exploitant
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, currentY, contentWidth, 30, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, currentY, contentWidth, 30, 'S');

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('EXPLOITANT', margin + 5, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Nom : ${data.exploitant.nom}`, margin + 5, currentY + 14);
  doc.text(`Adresse : ${data.exploitant.adresse}`, margin + 5, currentY + 20);
  
  if (data.exploitant.siret) {
    doc.text(`SIRET : ${data.exploitant.siret}`, margin + 100, currentY + 14);
  }
  if (data.exploitant.numAgrement) {
    doc.text(`N° Agrément : ${data.exploitant.numAgrement}`, margin + 100, currentY + 20);
  }

  doc.text(`Généré le : ${formatDateFR(data.dateGeneration)}`, margin + 100, currentY + 26);

  currentY += 40;

  // En-tête du tableau
  const drawTableHeader = () => {
    doc.setFillColor(22, 101, 52);
    doc.rect(margin, currentY, contentWidth, 10, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');

    const cols = [
      { label: 'Date', x: margin + 2, width: 18 },
      { label: 'Parcelle', x: margin + 22, width: 30 },
      { label: 'Produit', x: margin + 54, width: 38 },
      { label: 'Dose', x: margin + 94, width: 18 },
      { label: 'DAR', x: margin + 114, width: 12 },
      { label: 'Récolte aut.', x: margin + 128, width: 22 },
      { label: 'Opérateur', x: margin + 152, width: 28 }
    ];

    cols.forEach(col => {
      doc.text(col.label, col.x, currentY + 7);
    });

    currentY += 10;
  };

  drawTableHeader();

  // Lignes du tableau
  data.traitements.forEach((traitement, index) => {
    checkPageBreak(12);
    
    // Alternance de couleurs
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(margin, currentY, contentWidth, 10, 'F');

    // Bordure
    doc.setDrawColor(220, 220, 220);
    doc.rect(margin, currentY, contentWidth, 10, 'S');

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');

    // Date
    doc.text(formatDateFR(traitement.date), margin + 2, currentY + 6);

    // Parcelle
    const parcelleText = traitement.parcelle.length > 18 
      ? traitement.parcelle.substring(0, 16) + '...'
      : traitement.parcelle;
    doc.text(parcelleText, margin + 22, currentY + 6);

    // Produit
    const produitText = traitement.produit.nom.length > 22
      ? traitement.produit.nom.substring(0, 20) + '...'
      : traitement.produit.nom;
    doc.text(produitText, margin + 54, currentY + 6);

    // Dose
    doc.text(`${traitement.doseAppliquee} ${traitement.produit.unite}`, margin + 94, currentY + 6);

    // DAR avec alerte visuelle
    if (traitement.alerteDAR) {
      doc.setFillColor(254, 243, 199);
      doc.rect(margin + 112, currentY + 1, 14, 8, 'F');
      doc.setTextColor(180, 83, 9);
    }
    doc.text(`${traitement.produit.dar}j`, margin + 114, currentY + 6);
    doc.setTextColor(50, 50, 50);

    // Date récolte autorisée
    doc.text(formatDateFR(traitement.dateRecolteAutorisee), margin + 128, currentY + 6);

    // Opérateur
    const operateurText = traitement.operateur.length > 16
      ? traitement.operateur.substring(0, 14) + '...'
      : traitement.operateur;
    doc.text(operateurText, margin + 152, currentY + 6);

    currentY += 10;
  });

  // Ligne de total
  currentY += 5;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, currentY, contentWidth, 8, 'F');
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total : ${data.traitements.length} traitement(s) enregistré(s)`, margin + 5, currentY + 5);

  // Statistiques par type
  currentY += 15;
  checkPageBreak(40);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('RÉCAPITULATIF PAR TYPE DE PRODUIT', margin, currentY);
  currentY += 8;

  const typeStats: Record<string, number> = {};
  data.traitements.forEach(t => {
    const type = getTypeLabel(t.produit.type);
    typeStats[type] = (typeStats[type] || 0) + 1;
  });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  Object.entries(typeStats).forEach(([type, count]) => {
    doc.text(`• ${type} : ${count} application(s)`, margin + 5, currentY);
    currentY += 5;
  });

  // Légende DAR
  currentY += 10;
  checkPageBreak(25);

  doc.setFillColor(254, 243, 199);
  doc.rect(margin, currentY, 8, 8, 'F');
  doc.setDrawColor(180, 83, 9);
  doc.rect(margin, currentY, 8, 8, 'S');

  doc.setTextColor(180, 83, 9);
  doc.setFontSize(8);
  doc.text('= DAR proche (≤7 jours) - Vigilance requise', margin + 12, currentY + 5);

  // Footer avec mention légale
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    cleanZone(doc, 0, 275, 210, 25);
    
    // Ligne de séparation
    doc.setDrawColor(22, 101, 52);
    doc.setLineWidth(0.5);
    doc.line(margin, 280, pageWidth - margin, 280);

    // Numéro de page
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i}/${totalPages}`, pageWidth - margin - 15, 287);

    // Mention légale
    doc.setFontSize(7);
    doc.text(
      'Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.',
      margin,
      287
    );
  }

  return doc;
}

export function downloadRegistrePhytoPDF(data: RegistrePhytoData, filename?: string) {
  const doc = generateRegistrePhytoPDF(data);
  const name = filename || `registre-phyto-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(name);
}

export function previewRegistrePhytoPDF(data: RegistrePhytoData): string {
  const doc = generateRegistrePhytoPDF(data);
  return doc.output('bloburl').toString();
}
