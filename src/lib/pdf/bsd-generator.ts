import jsPDF from 'jspdf';

interface BSDData {
  chantierNom: string;
  chantierAdresse: string;
  dateEnlevement: string;
  producteurNom: string;
  producteurSiret: string;
  producteurTel: string;
  typeDechet: string;
  codeDechet: string;
  tonnageEstime: number;
  volumeEstime?: number;
  conditionnement: string;
  destinationNom: string;
  destinationAdresse: string;
  destinationType: string;
  transporteurNom: string;
  transporteurSiret: string;
  immatriculationVehicule: string;
  signatureProducteur: string | null;
  signatureTransporteur: string | null;
}

const TYPES_LABELS: Record<string, string> = {
  TERRE: 'Terres et cailloux',
  GRAVATS: 'Gravats / Béton',
  VERTS: 'Déchets verts',
  MIXTE: 'Déchets mélangés',
  DANGEREUX: 'Déchets dangereux',
};

const DESTINATION_LABELS: Record<string, string> = {
  ISDI: 'ISDI (Installation de Stockage de Déchets Inertes)',
  ISDND: 'ISDND (Installation de Stockage de Déchets Non Dangereux)',
  RECYCLAGE: 'Centre de recyclage',
  VALORISATION: 'Valorisation matière',
};

function cleanZone(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, w, h, 'F');
}

export function generateBSDPdf(data: BSDData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // ============================================================================
  // EN-TÊTE
  // ============================================================================
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('BSD EXPRESS', margin, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Bordereau de Suivi des Déchets', margin, 33);

  // Numéro BSD
  const bsdNumber = `BSD-${Date.now().toString(36).toUpperCase()}`;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(bsdNumber, pageWidth - margin, 25, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const dateFormatted = new Date(data.dateEnlevement).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Date: ${dateFormatted}`, pageWidth - margin, 33, { align: 'right' });

  y = 55;

  // ============================================================================
  // SECTION 1: PRODUCTEUR
  // ============================================================================
  doc.setTextColor(30, 41, 59);
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. PRODUCTEUR DU DÉCHET', margin + 3, y + 6);
  y += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Raison sociale: ${data.producteurNom}`, margin + 3, y);
  y += 6;
  if (data.producteurSiret) {
    doc.text(`SIRET: ${data.producteurSiret}`, margin + 3, y);
    y += 6;
  }
  if (data.producteurTel) {
    doc.text(`Téléphone: ${data.producteurTel}`, margin + 3, y);
    y += 6;
  }
  doc.text(`Adresse du chantier: ${data.chantierAdresse}`, margin + 3, y);
  y += 6;
  doc.text(`Nom du chantier: ${data.chantierNom}`, margin + 3, y);
  y += 12;

  // ============================================================================
  // SECTION 2: DÉCHET
  // ============================================================================
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. DÉSIGNATION DU DÉCHET', margin + 3, y + 6);
  y += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Type: ${TYPES_LABELS[data.typeDechet] || data.typeDechet}`, margin + 3, y);
  y += 6;
  doc.text(`Code déchet: ${data.codeDechet}`, margin + 3, y);
  y += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Tonnage estimé: ${data.tonnageEstime} tonnes`, margin + 3, y);
  doc.setFont('helvetica', 'normal');
  if (data.volumeEstime) {
    doc.text(`Volume estimé: ${data.volumeEstime} m³`, margin + 80, y);
  }
  y += 6;
  doc.text(`Conditionnement: ${data.conditionnement}`, margin + 3, y);
  y += 12;

  // ============================================================================
  // SECTION 3: DESTINATION
  // ============================================================================
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. DESTINATION', margin + 3, y + 6);
  y += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Installation: ${data.destinationNom}`, margin + 3, y);
  y += 6;
  if (data.destinationAdresse) {
    doc.text(`Adresse: ${data.destinationAdresse}`, margin + 3, y);
    y += 6;
  }
  doc.text(`Type: ${DESTINATION_LABELS[data.destinationType] || data.destinationType}`, margin + 3, y);
  y += 12;

  // ============================================================================
  // SECTION 4: TRANSPORTEUR
  // ============================================================================
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('4. TRANSPORTEUR', margin + 3, y + 6);
  y += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Raison sociale: ${data.transporteurNom}`, margin + 3, y);
  y += 6;
  if (data.transporteurSiret) {
    doc.text(`SIRET: ${data.transporteurSiret}`, margin + 3, y);
    y += 6;
  }
  if (data.immatriculationVehicule) {
    doc.text(`Immatriculation: ${data.immatriculationVehicule}`, margin + 3, y);
    y += 6;
  }
  y += 6;

  // ============================================================================
  // SECTION 5: SIGNATURES
  // ============================================================================
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('5. SIGNATURES', margin + 3, y + 6);
  y += 15;

  const sigWidth = (contentWidth - 10) / 2;
  const sigHeight = 35;

  // Cadre signature producteur
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.rect(margin, y, sigWidth, sigHeight);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Signature du Producteur', margin + 3, y + 5);

  if (data.signatureProducteur) {
    try {
      doc.addImage(data.signatureProducteur, 'PNG', margin + 5, y + 8, sigWidth - 10, sigHeight - 12);
    } catch (e) {
      console.warn('Erreur ajout signature producteur:', e);
    }
  }

  // Cadre signature transporteur
  doc.rect(margin + sigWidth + 10, y, sigWidth, sigHeight);
  doc.text('Signature du Transporteur', margin + sigWidth + 13, y + 5);

  if (data.signatureTransporteur) {
    try {
      doc.addImage(data.signatureTransporteur, 'PNG', margin + sigWidth + 15, y + 8, sigWidth - 10, sigHeight - 12);
    } catch (e) {
      console.warn('Erreur ajout signature transporteur:', e);
    }
  }

  y += sigHeight + 15;

  // ============================================================================
  // FOOTER
  // ============================================================================
  cleanZone(doc, 0, 275, 210, 25);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    'Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.',
    pageWidth / 2,
    282,
    { align: 'center' }
  );
  
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} - ${bsdNumber}`, pageWidth / 2, 287, { align: 'center' });
  doc.text('CAPITAL ÉNERGIE - BSD Express', pageWidth / 2, 292, { align: 'center' });

  return doc;
}

export function downloadBSDPdf(data: BSDData, filename?: string) {
  const doc = generateBSDPdf(data);
  const bsdNumber = `BSD-${Date.now().toString(36).toUpperCase()}`;
  doc.save(filename || `${bsdNumber}.pdf`);
}

export function openBSDPdfPreview(data: BSDData) {
  const doc = generateBSDPdf(data);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
}
