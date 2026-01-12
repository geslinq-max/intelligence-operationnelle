/**
 * Générateur PDF - Note de Synthèse Technique
 * 
 * Génère un document PDF professionnel pour la Note de Synthèse Technique
 * incluant l'éligibilité mathématique et le diagnostic technique
 */

import jsPDF from 'jspdf';
import type { NoteSyntheseTechnique } from '../technical/noteSynthese';

const COLORS = {
  primary: [0, 188, 212] as [number, number, number],      // Cyan
  secondary: [139, 92, 246] as [number, number, number],   // Purple
  success: [34, 197, 94] as [number, number, number],      // Green
  warning: [249, 115, 22] as [number, number, number],     // Orange
  danger: [239, 68, 68] as [number, number, number],       // Red
  dark: [15, 23, 42] as [number, number, number],          // Slate 900
  light: [148, 163, 184] as [number, number, number],      // Slate 400
  white: [255, 255, 255] as [number, number, number],
};

function formatNumber(value: number): string {
  return value.toLocaleString('fr-FR');
}

function formatCurrency(value: number): string {
  return `${formatNumber(value)} €`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function generateNoteSynthesePDF(note: NoteSyntheseTechnique): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let y = margin;

  // ═══════════════════════════════════════════════════════════════
  // EN-TÊTE
  // ═══════════════════════════════════════════════════════════════
  
  // Bandeau supérieur
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Logo texte
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CAPITAL ÉNERGIE', margin, 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Intelligence Opérationnelle', margin, 22);
  
  // Titre du document
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('NOTE DE SYNTHÈSE TECHNIQUE', pageWidth - margin, 15, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Réf: NST-${Date.now().toString(36).toUpperCase()}`, pageWidth - margin, 22, { align: 'right' });
  
  y = 45;

  // ═══════════════════════════════════════════════════════════════
  // INFORMATIONS ENTREPRISE
  // ═══════════════════════════════════════════════════════════════
  
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.roundedRect(margin, y, contentWidth, 25, 3, 3, 'F');
  
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(note.entreprise, margin + 5, y + 10);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.light);
  doc.text(`Secteur: ${note.secteur}`, margin + 5, y + 18);
  doc.text(`Date d'analyse: ${formatDate(note.dateAnalyse)}`, pageWidth - margin - 5, y + 18, { align: 'right' });
  
  y += 35;

  // ═══════════════════════════════════════════════════════════════
  // BLOC 1: ÉLIGIBILITÉ MATHÉMATIQUE
  // ═══════════════════════════════════════════════════════════════
  
  const em = note.eligibiliteMathematique;
  
  // Titre du bloc
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('BLOC 1 : ÉLIGIBILITÉ MATHÉMATIQUE', margin + 5, y + 7);
  
  y += 15;
  
  // Métriques principales (2 colonnes)
  const colWidth = (contentWidth - 5) / 2;
  
  // Ratio de perte réactive
  doc.setFillColor(254, 243, 199); // Amber 100
  doc.roundedRect(margin, y, colWidth, 35, 2, 2, 'F');
  
  doc.setTextColor(...COLORS.warning);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('RATIO DE PERTE RÉACTIVE', margin + 5, y + 8);
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`${em.ratioPerteReactive}%`, margin + 5, y + 22);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.light);
  doc.text('Énergie réactive / Consommation totale', margin + 5, y + 30);
  
  // Gisement technique
  doc.setFillColor(220, 252, 231); // Green 100
  doc.roundedRect(margin + colWidth + 5, y, colWidth, 35, 2, 2, 'F');
  
  doc.setTextColor(...COLORS.success);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('GISEMENT TECHNIQUE DÉTECTÉ', margin + colWidth + 10, y + 8);
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${formatNumber(em.gisementTechnique)} kWh/an`, margin + colWidth + 10, y + 22);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.light);
  doc.text('Économies d\'énergie récupérables', margin + colWidth + 10, y + 30);
  
  y += 42;
  
  // Facteur de puissance
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F');
  
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Facteur de puissance (cos φ)', margin + 5, y + 8);
  
  // Barres de progression
  const barY = y + 14;
  const barWidth = 60;
  
  // Actuel
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Actuel:', margin + 5, barY + 4);
  
  doc.setFillColor(226, 232, 240); // Slate 200
  doc.roundedRect(margin + 25, barY, barWidth, 6, 1, 1, 'F');
  
  const cosPhiColor = em.facteurPuissanceCalcule < 0.85 
    ? COLORS.danger 
    : em.facteurPuissanceCalcule < 0.92 
      ? COLORS.warning 
      : COLORS.success;
  doc.setFillColor(...cosPhiColor);
  doc.roundedRect(margin + 25, barY, barWidth * em.facteurPuissanceCalcule, 6, 1, 1, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...cosPhiColor);
  doc.text(`${em.facteurPuissanceCalcule}`, margin + 90, barY + 4);
  
  // Cible
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'normal');
  doc.text('Cible:', margin + 105, barY + 4);
  
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(margin + 120, barY, barWidth, 6, 1, 1, 'F');
  
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(margin + 120, barY, barWidth * em.facteurPuissanceCible, 6, 1, 1, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text(`${em.facteurPuissanceCible}`, margin + 185, barY + 4);
  
  // Compensation nécessaire
  if (em.puissanceReactiveACompenser > 0) {
    doc.setTextColor(...COLORS.light);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Compensation nécessaire: ${em.puissanceReactiveACompenser} kVAR pour atteindre la cible`,
      margin + 5, y + 27
    );
  }
  
  y += 35;
  
  // Justification technique
  const bgColor = em.eligible ? [220, 252, 231] : [254, 226, 226]; // Green/Red 100
  const borderColor = em.eligible ? COLORS.success : COLORS.danger;
  
  doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  doc.roundedRect(margin, y, contentWidth, 25, 2, 2, 'F');
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 25, 2, 2, 'S');
  
  doc.setTextColor(...borderColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(
    em.eligible ? '✓ ÉLIGIBLE AUX DISPOSITIFS CEE' : '✗ NON ÉLIGIBLE',
    margin + 5, y + 8
  );
  
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Wrap justification text
  const justificationLines = doc.splitTextToSize(em.justification, contentWidth - 10);
  doc.text(justificationLines, margin + 5, y + 15);
  
  y += 30;
  
  // Score et économies
  doc.setFillColor(224, 242, 254); // Cyan 100
  doc.roundedRect(margin, y, colWidth, 20, 2, 2, 'F');
  
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(8);
  doc.text('SCORE D\'ÉLIGIBILITÉ', margin + 5, y + 7);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${em.scoreEligibilite}/100`, margin + 5, y + 16);
  
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(margin + colWidth + 5, y, colWidth, 20, 2, 2, 'F');
  
  doc.setTextColor(...COLORS.success);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('ÉCONOMIES POTENTIELLES', margin + colWidth + 10, y + 7);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${formatCurrency(em.economiesPotentielles)}/an`, margin + colWidth + 10, y + 16);
  
  y += 28;

  // ═══════════════════════════════════════════════════════════════
  // BLOC 2: DIAGNOSTIC TECHNIQUE
  // ═══════════════════════════════════════════════════════════════
  
  const dt = note.diagnosticTechnique;
  
  // Titre du bloc
  doc.setFillColor(...COLORS.secondary);
  doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('BLOC 2 : DIAGNOSTIC TECHNIQUE', margin + 5, y + 7);
  
  y += 15;
  
  // Équipements et points faibles (2 colonnes)
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, colWidth, 45, 2, 2, 'F');
  
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Équipements analysés', margin + 5, y + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  let eqY = y + 15;
  dt.equipementsAnalyses.slice(0, 4).forEach(eq => {
    doc.text(`• ${eq}`, margin + 5, eqY);
    eqY += 7;
  });
  
  // Points faibles
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin + colWidth + 5, y, colWidth, 45, 2, 2, 'F');
  
  doc.setTextColor(...COLORS.warning);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Points faibles détectés', margin + colWidth + 10, y + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  let pfY = y + 15;
  if (dt.pointsFaibles.length > 0) {
    dt.pointsFaibles.slice(0, 4).forEach(pf => {
      doc.text(`⚠ ${pf}`, margin + colWidth + 10, pfY);
      pfY += 7;
    });
  } else {
    doc.setTextColor(...COLORS.light);
    doc.text('Aucun point critique', margin + colWidth + 10, pfY);
  }
  
  y += 50;
  
  // Recommandations
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(margin, y, contentWidth, 35, 2, 2, 'F');
  
  doc.setTextColor(...COLORS.success);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommandations', margin + 5, y + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  let recY = y + 15;
  dt.recommandations.slice(0, 3).forEach(rec => {
    doc.text(`✓ ${rec}`, margin + 5, recY);
    recY += 7;
  });
  
  y += 42;

  // ═══════════════════════════════════════════════════════════════
  // BLOC 3: FICHE CEE APPLICABLE
  // ═══════════════════════════════════════════════════════════════
  
  if (note.ficheCEE) {
    // Titre du bloc
    doc.setFillColor(...COLORS.success);
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('BLOC 3 : FICHE CEE APPLICABLE', margin + 5, y + 7);
    
    y += 15;
    
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(margin, y, contentWidth, 25, 2, 2, 'F');
    
    // Code
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Code', margin + 5, y + 7);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(note.ficheCEE.code, margin + 5, y + 16);
    
    // Nom
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Opération', margin + 50, y + 7);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const nomLines = doc.splitTextToSize(note.ficheCEE.nom, 80);
    doc.text(nomLines, margin + 50, y + 14);
    
    // Montant
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Montant estimé', pageWidth - margin - 45, y + 7);
    doc.setTextColor(...COLORS.success);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(note.ficheCEE.montantEstime), pageWidth - margin - 45, y + 18);
  }

  // ═══════════════════════════════════════════════════════════════
  // PIED DE PAGE
  // ═══════════════════════════════════════════════════════════════
  
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `© ${new Date().getFullYear()} CAPITAL ÉNERGIE - Note de Synthèse Technique`,
    pageWidth / 2,
    pageHeight - 7,
    { align: 'center' }
  );

  // Sauvegarde
  const fileName = `Note_Synthese_${note.entreprise.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
