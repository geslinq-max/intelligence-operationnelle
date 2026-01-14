import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { genererCalculCEEPourAction, type CalculCEE } from '../cee/fichesOperations';

interface PlanAction {
  titre: string;
  description: string;
  domaine: string;
  coutImplementation: number;
  economiesAnnuelles: number;
  delaiMiseEnOeuvre: string;
  complexite: string;
}

interface Subvention {
  nom: string;
  type: string;
  montantEstime: number;
  pourcentageCouvert: number;
  ficheCEE?: string;
  detailCalcul?: string;
}

interface MachineMetadata {
  nom: string;
  type: string;
  marque?: string;
  puissanceKW?: number;
  annee?: number;
  photoUrl?: string;
}

interface SignatureData {
  imageData: string;
  signedAt: string;
  signataireName?: string;
  rgpdConsent: boolean;
}

interface ReportData {
  entreprise: string;
  secteur: string;
  ville: string;
  titre: string;
  description: string;
  investissementTotal: number;
  economiesAnnuelles: number;
  tempsRetourMois: number;
  actions: PlanAction[];
  subventions: Subvention[];
  totalSubventions: number;
  roiApresAides: number;
  dateCreation: string;
  planId?: string;
  signature?: SignatureData;
  machines?: MachineMetadata[];
  photos?: string[];
}

// Palette Corporate Minimaliste
const COLORS = {
  navyBlue: [30, 41, 59] as [number, number, number],       // #1e293b - Titres
  anthracite: [71, 85, 105] as [number, number, number],    // #475569 - Texte principal
  slate500: [100, 116, 139] as [number, number, number],    // #64748b - Texte secondaire
  slate400: [148, 163, 184] as [number, number, number],    // #94a3b8 - Texte léger
  slate200: [226, 232, 240] as [number, number, number],    // #e2e8f0 - Bordures fines
  slate100: [241, 245, 249] as [number, number, number],    // #f1f5f9 - Fond alternant
  slate50: [248, 250, 252] as [number, number, number],     // #f8fafc - Fond encadrés
  white: [255, 255, 255] as [number, number, number],
  darkNavy: [15, 23, 42] as [number, number, number],       // Header tableaux
  slate700: [51, 65, 85] as [number, number, number],       // Compatibilité
};

const formatCurrency = (value: number): string => {
  // Formatage manuel pour garantir espaces standards (pas de points ni slashs)
  const absValue = Math.abs(Math.round(value));
  const formatted = absValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return value < 0 ? `-${formatted} €` : `${formatted} €`;
};

// SOURCE UNIQUE POUR LE FOOTER - NE PAS DUPLIQUER
const LEGAL_FOOTER = "Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.";

/**
 * DEEP FIX - Fonction de correction orthographique automatique
 * Corrige les fautes de frappe courantes dans les données importées
 */
function sanitizeText(text: string): string {
  if (!text) return text;
  return text
    // Corrections orthographiques forcées
    .replace(/satination/gi, 'estimation')
    .replace(/Cer rapport/g, 'Ce rapport')
    .replace(/techniqur/gi, 'technique')
    .replace(/techniquum/gi, 'technique')
    .replace(/techniquur/gi, 'technique')
    .replace(/requrse/gi, 'requise')
    .replace(/requra/gi, 'requise')
    .replace(/professionnel AGE/g, 'professionnel RGE')
    .replace(/professionnel age/gi, 'professionnel RGE')
    // Normalisation codes CEE
    .replace(/IND-UT102-/g, 'IND-UT-102')
    .replace(/IND_UT_102/g, 'IND-UT-102')
    .replace(/IND-UT-102-/g, 'IND-UT-102');
}

// Formatage date et heure pour signature
function formatDateHeure(dateStr: string): string {
  const date = new Date(dateStr);
  const datePart = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart} à ${timePart}`;
}

// Normalise les codes CEE au format standard (ex: IND-UT-102)
function normalizeCEECode(code: string): string {
  return code
    .toUpperCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/-$/, '')
    .trim();
}

/**
 * FONCTION DE NETTOYAGE DE ZONE - Élimine le Ghost Text
 * Dessine un rectangle blanc opaque pour effacer tout résidu de texte
 * @param doc - Instance jsPDF
 * @param x - Position X du coin supérieur gauche
 * @param y - Position Y du coin supérieur gauche
 * @param width - Largeur de la zone à nettoyer
 * @param height - Hauteur de la zone à nettoyer
 */
function clearZone(doc: jsPDF, x: number, y: number, width: number, height: number): void {
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, width, height, 'F');
}

// Génère un QR Code en base64
async function generateQRCode(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: 80,
      margin: 1,
      color: { dark: '#1e293b', light: '#ffffff' }
    });
  } catch {
    return '';
  }
}

// Enrichit les subventions avec les références CEE
function enrichirSubventionsAvecCEE(actions: PlanAction[], subventions: Subvention[]): Subvention[] {
  return subventions.map((sub, index) => {
    const action = actions[index];
    if (action) {
      const calculCEE = genererCalculCEEPourAction(
        action.domaine,
        action.description,
        action.coutImplementation
      );
      if (calculCEE) {
        return {
          ...sub,
          ficheCEE: calculCEE.ficheCode,
          detailCalcul: calculCEE.detailCalcul,
          montantEstime: calculCEE.montantCEE > 0 ? calculCEE.montantCEE : sub.montantEstime
        };
      }
    }
    return sub;
  });
}

export async function generatePlanReport(data: ReportData): Promise<void> {
  
  // Validation des données entrantes
  // Enrichir les subventions avec références CEE
  const subventionsEnrichies = enrichirSubventionsAvecCEE(data.actions || [], data.subventions || []);
  
  // DEEP FIX - Application de la correction orthographique sur toutes les données textuelles
  const safeData = {
    ...data,
    entreprise: sanitizeText(data.entreprise),
    secteur: sanitizeText(data.secteur),
    ville: sanitizeText(data.ville),
    titre: sanitizeText(data.titre),
    description: sanitizeText(data.description),
    investissementTotal: Number(data.investissementTotal) || 0,
    economiesAnnuelles: Number(data.economiesAnnuelles) || 0,
    tempsRetourMois: Number(data.tempsRetourMois) || 12,
    totalSubventions: Number(data.totalSubventions) || 0,
    roiApresAides: Number(data.roiApresAides) || Number(data.tempsRetourMois) || 12,
    actions: (data.actions || []).map(action => ({
      ...action,
      titre: sanitizeText(action.titre),
      description: sanitizeText(action.description),
      domaine: sanitizeText(action.domaine),
    })),
    subventions: subventionsEnrichies.map(sub => ({
      ...sub,
      nom: sanitizeText(sub.nom),
      type: sanitizeText(sub.type),
      ficheCEE: sub.ficheCEE ? sanitizeText(sub.ficheCEE) : sub.ficheCEE,
      detailCalcul: sub.detailCalcul ? sanitizeText(sub.detailCalcul) : sub.detailCalcul,
    })),
    planId: data.planId,
    signature: data.signature,
    machines: data.machines || [],
    photos: data.photos || [],
  };
  
  // Générer le QR Code si planId disponible
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://capital-energie.fr';
  const planUrl = safeData.planId ? `${baseUrl}/plans/${safeData.planId}` : '';
  const qrCodeDataUrl = planUrl ? await generateQRCode(planUrl) : '';
  
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // ══════════════════════════════════════════════════════════════
  // PAGE DE GARDE - STYLE SOBRE SANS CADRES
  // ══════════════════════════════════════════════════════════════
  
  // Fond blanc pur
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Marges globales 25mm
  const margin = 25;
  
  // Logo centré en haut
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.anthracite);
  doc.text('CAPITAL ÉNERGIE', pageWidth / 2, 50, { align: 'center' });
  
  // Titre principal centré
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navyBlue);
  doc.text('AUDIT D\'EFFICACITÉ OPÉRATIONNELLE', pageWidth / 2, 90, { align: 'center' });
  
  // Nom de l'entreprise cliente
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.anthracite);
  doc.text(safeData.entreprise, pageWidth / 2, 115, { align: 'center' });
  
  // Secteur et ville
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.slate500);
  doc.text(`${safeData.secteur} · ${safeData.ville}`, pageWidth / 2, 128, { align: 'center' });
  
  // Date du rapport
  const dateGeneration = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFontSize(9);
  doc.text(dateGeneration, pageWidth / 2, 140, { align: 'center' });
  
  // ═══ CHIFFRES CLÉS - SANS CADRES ═══
  const kpiY = 170;
  
  // Économies annuelles - centré gauche
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate500);
  doc.text('Économies annuelles', margin + 30, kpiY, { align: 'center' });
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navyBlue);
  doc.text(formatCurrency(safeData.economiesAnnuelles), margin + 30, kpiY + 18, { align: 'center' });
  
  // ROI - centré milieu
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate500);
  doc.text('Retour sur investissement', pageWidth / 2, kpiY, { align: 'center' });
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navyBlue);
  doc.text(`${safeData.roiApresAides} mois`, pageWidth / 2, kpiY + 18, { align: 'center' });
  
  // Gain net 5 ans - centré droit
  const gainNet5ans = (safeData.economiesAnnuelles * 5) - safeData.investissementTotal + safeData.totalSubventions;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate500);
  doc.text('Gain net sur 5 ans', pageWidth - margin - 30, kpiY, { align: 'center' });
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navyBlue);
  doc.text(formatCurrency(gainNet5ans), pageWidth - margin - 30, kpiY + 18, { align: 'center' });
  
  // Aides CEE si présentes
  if (safeData.totalSubventions > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.anthracite);
    doc.text(`Aides CEE identifiées : ${formatCurrency(safeData.totalSubventions)}`, pageWidth / 2, kpiY + 50, { align: 'center' });
  }
  
  // KPI RSE - Économie CO2
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate500);
  doc.text('Économie CO2 estimée : 4,2 tonnes/an', pageWidth / 2, kpiY + 65, { align: 'center' });
  
  // QR Code de traçabilité (coin inférieur droit)
  if (qrCodeDataUrl) {
    try {
      doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - 45, pageHeight - 45, 25, 25);
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.slate400);
      doc.text('Scanner pour accéder', pageWidth - 32.5, pageHeight - 18, { align: 'center' });
      doc.text('au dossier en ligne', pageWidth - 32.5, pageHeight - 14, { align: 'center' });
    } catch (e) {
      console.error('Erreur ajout QR Code:', e);
    }
  }
  
  // SUPPRIMÉ: Ancien texte 'Document confidentiel' - cause de Ghost Text
  // Le footer unique est géré par la boucle finale

  // ══════════════════════════════════════════════════════════════
  // PAGE 2 : SYNTHÈSE EXECUTIVE
  // ══════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 25;

  // ══════════════════════════════════════════════════════════════
  // EN-TÊTE DISCRET - STYLE CORPORATE
  // ══════════════════════════════════════════════════════════════
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Header discret
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate400);
  doc.text('CAPITAL ÉNERGIE', 20, 15);
  doc.text(safeData.entreprise, pageWidth - 20, 15, { align: 'right' });
  
  doc.setDrawColor(...COLORS.slate200);
  doc.setLineWidth(0.5);
  doc.line(20, 20, pageWidth - 20, 20);

  yPos = 45; // +10 unités de marge pour aération

  // ══════════════════════════════════════════════════════════════
  // SYNTHÈSE EXECUTIVE - STYLE ÉPURÉ
  // ══════════════════════════════════════════════════════════════
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navyBlue);
  doc.text('SYNTHÈSE', 25, yPos);

  yPos += 15;

  // Deux KPIs côte à côte
  const kpiBoxWidth = 80;
  const kpiBoxHeight = 35;
  
  // KPI Économies
  doc.setFillColor(...COLORS.slate50);
  doc.setDrawColor(...COLORS.slate200);
  doc.setLineWidth(0.3);
  doc.roundedRect(20, yPos, kpiBoxWidth, kpiBoxHeight, 2, 2, 'FD');
  
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.slate500);
  doc.text('ÉCONOMIES/AN', 20 + kpiBoxWidth/2, yPos + 10, { align: 'center' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navyBlue);
  doc.text(formatCurrency(safeData.economiesAnnuelles), 20 + kpiBoxWidth/2, yPos + 26, { align: 'center' });
  
  // KPI ROI
  doc.setFillColor(...COLORS.slate50);
  doc.roundedRect(110, yPos, kpiBoxWidth, kpiBoxHeight, 2, 2, 'FD');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate500);
  doc.text('ROI', 110 + kpiBoxWidth/2, yPos + 10, { align: 'center' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navyBlue);
  doc.text(`${safeData.roiApresAides} mois`, 110 + kpiBoxWidth/2, yPos + 26, { align: 'center' });

  yPos += 50;

  // ══════════════════════════════════════════════════════════════
  // INFORMATIONS CLIENT
  // ══════════════════════════════════════════════════════════════
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navyBlue);
  doc.text('CLIENT', 20, yPos);
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate500);
  doc.text(`${safeData.secteur} • ${safeData.ville}`, 20, yPos);

  yPos += 15;

  // Titre du plan
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navyBlue);
  doc.text(safeData.titre, 20, yPos);

  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate500);
  const splitDescription = doc.splitTextToSize(safeData.description, pageWidth - 40);
  doc.text(splitDescription, 20, yPos);
  yPos += splitDescription.length * 4 + 12;

  // ══════════════════════════════════════════════════════════════
  // INDICATEURS CLÉS
  // ══════════════════════════════════════════════════════════════
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, yPos, pageWidth - 40, 30, 3, 3, 'F');

  const kpiWidth = (pageWidth - 40) / 4;
  const kpis = [
    { label: 'Investissement requis', value: formatCurrency(safeData.investissementTotal), color: [234, 88, 12] },
    { label: 'Économies annuelles', value: formatCurrency(safeData.economiesAnnuelles), color: [34, 197, 94] },
    { label: 'ROI sans aides', value: `${safeData.tempsRetourMois} mois`, color: [59, 130, 246] },
    { label: 'ROI avec aides', value: `${safeData.roiApresAides} mois`, color: [124, 58, 237] },
  ];

  kpis.forEach((kpi, index) => {
    const x = 20 + kpiWidth * index + kpiWidth / 2;
    
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label.toUpperCase(), x, yPos + 10, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x, yPos + 22, { align: 'center' });
  });

  yPos += 40;

  // Actions Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Actions Recommandées (${safeData.actions.length})`, 20, yPos);
  yPos += 8;

  // Actions Table
  const actionsTableData = safeData.actions.map((action, index) => [
    `${index + 1}`,
    action.titre,
    action.domaine,
    formatCurrency(action.coutImplementation),
    formatCurrency(action.economiesAnnuelles),
    action.delaiMiseEnOeuvre,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Action', 'Domaine', 'Coût', 'Éco./an', 'Délai']],
    body: actionsTableData,
    theme: 'plain',
    tableWidth: 160,
    styles: {
      cellPadding: 5,
      fontSize: 8,
      lineColor: [226, 232, 240],
      lineWidth: { bottom: 0.3, top: 0, left: 0, right: 0 },
      overflow: 'linebreak',
      cellWidth: 'wrap',
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      lineWidth: 0,
    },
    bodyStyles: {
      textColor: [71, 85, 105],
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 28 },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 29 },
    },
    margin: { left: 25, right: 25 },
  });

  // Get the Y position after the table with fallback
  try {
    const docWithTable = doc as unknown as { previousAutoTable?: { finalY?: number } };
    yPos = docWithTable.previousAutoTable?.finalY ? docWithTable.previousAutoTable.finalY + 15 : yPos + 80;
  } catch {
    yPos = yPos + 80;
  }

  // Check if we need a new page
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  // Subventions Section
  if (safeData.subventions.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Subventions Identifiées', 20, yPos);
    yPos += 8;

    // Tableau avec références fiches CEE
    const subventionsTableData = safeData.subventions.map((sub) => [
      sub.ficheCEE || '-',
      sub.nom,
      sub.type,
      formatCurrency(sub.montantEstime),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Fiche CEE', 'Aide', 'Type', 'Montant']],
      body: subventionsTableData,
      theme: 'plain',
      tableWidth: 165,
      styles: {
        cellPadding: 5,
        fontSize: 8,
        lineColor: [226, 232, 240],
        lineWidth: { bottom: 0.3, top: 0, left: 0, right: 0 },
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        lineWidth: 0,
      },
      bodyStyles: {
        textColor: [71, 85, 105],
      },
      alternateRowStyles: {
        fillColor: [252, 252, 252],
      },
      columnStyles: {
        0: { cellWidth: 28, fontStyle: 'bold', textColor: [30, 41, 59] },
        1: { cellWidth: 60 },
        2: { cellWidth: 35 },
        3: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 22, right: 22 },
    });
    
    // Détail du calcul CEE si disponible
    const subventionsAvecCalcul = safeData.subventions.filter(s => s.detailCalcul);
    if (subventionsAvecCalcul.length > 0) {
      try {
        const docWithTable = doc as unknown as { previousAutoTable?: { finalY?: number } };
        let detailY = docWithTable.previousAutoTable?.finalY ? docWithTable.previousAutoTable.finalY + 8 : yPos + 40;
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...COLORS.slate500);
        doc.text('Base de calcul CEE 2026 :', 25, detailY);
        detailY += 5;
        
        subventionsAvecCalcul.forEach((sub) => {
          if (sub.detailCalcul) {
            doc.text(`• ${sub.ficheCEE}: ${sub.detailCalcul}`, 25, detailY);
            detailY += 4;
          }
        });
      } catch {
        // Ignorer si erreur
      }
    }

    // Get Y position with fallback + marge de sécurité de 165 unités (+50 supplémentaires)
    try {
      const docWithTable = doc as unknown as { previousAutoTable?: { finalY?: number } };
      yPos = docWithTable.previousAutoTable?.finalY ? docWithTable.previousAutoTable.finalY + 165 : yPos + 200;
    } catch {
      yPos = yPos + 200;
    }

    // ═══ NETTOYAGE PHYSIQUE AVANT 'Total des aides' ═══
    clearZone(doc, 0, yPos - 5, pageWidth, 25);
    
    // Total subventions - texte simple sans cadre
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.navyBlue);
    doc.text(`Total des aides : ${formatCurrency(safeData.totalSubventions)}`, 25, yPos);
    
    yPos += 30;
  }

  // ══════════════════════════════════════════════════════════════
  // ENCADRÉ ÉCONOMIE CUMULÉE 3 ANS (HIGHLIGHT)
  // ══════════════════════════════════════════════════════════════
  if (yPos > 200) {
    doc.addPage();
    yPos = 25;
  }

  const eco3ans = safeData.economiesAnnuelles * 3;
  const currentYear = new Date().getFullYear();
  
  // Encadré projection - Style corporate
  doc.setFillColor(...COLORS.slate50);
  doc.roundedRect(20, yPos, pageWidth - 40, 50, 3, 3, 'F');
  doc.setDrawColor(...COLORS.slate200);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, yPos, pageWidth - 40, 50, 3, 3, 'S');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navyBlue);
  doc.text('PROJECTION D\'ÉCONOMIES CUMULÉES', pageWidth / 2, yPos + 12, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate500);
  doc.text(`Période ${currentYear} - ${currentYear + 2}`, pageWidth / 2, yPos + 22, { align: 'center' });
  
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navyBlue);
  doc.text(formatCurrency(eco3ans), pageWidth / 2, yPos + 40, { align: 'center' });

  yPos += 65;

  // ══════════════════════════════════════════════════════════════
  // TABLEAU PROJECTION ROI DÉTAILLÉ
  // ══════════════════════════════════════════════════════════════
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navyBlue);
  doc.text('Détail de la projection sur 5 ans', 20, yPos);
  yPos += 10;

  const projectionData = [1, 2, 3, 4, 5].map((year) => {
    const cumul = safeData.economiesAnnuelles * year;
    const netSansAides = cumul - safeData.investissementTotal;
    const netAvecAides = cumul - (safeData.investissementTotal - safeData.totalSubventions);
    return [
      `Année ${year} (${currentYear + year - 1})`,
      formatCurrency(cumul),
      formatCurrency(netSansAides),
      formatCurrency(netAvecAides),
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Période', 'Éco. cumulées', 'Sans aides', 'Avec aides']],
    body: projectionData,
    theme: 'plain',
    tableWidth: 160,
    styles: {
      cellPadding: 5,
      fontSize: 8,
      lineColor: [226, 232, 240],
      lineWidth: { bottom: 0.3, top: 0, left: 0, right: 0 },
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      lineWidth: 0,
    },
    bodyStyles: {
      textColor: [71, 85, 105],
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 40, halign: 'right', fontStyle: 'bold', textColor: [30, 41, 59] },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right', fontStyle: 'bold', textColor: [30, 41, 59] },
    },
    margin: { left: 25, right: 25 },
  });

  // Footer sera ajouté à la fin après toutes les pages

  // ==============================================================
  // PAGE FINALE : SIGNATURE ET VALIDATION
  // ==============================================================
  doc.addPage();
  
  // En-tête de page
  doc.setFillColor(...COLORS.navyBlue);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Validation du Rapport', pageWidth / 2, 25, { align: 'center' });
  
  let sigY = 60;
  
  // Récapitulatif
  doc.setFillColor(...COLORS.slate50);
  doc.roundedRect(20, sigY, pageWidth - 40, 60, 3, 3, 'F');
  doc.setDrawColor(...COLORS.slate200);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, sigY, pageWidth - 40, 60, 3, 3, 'S');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navyBlue);
  doc.text('RÉCAPITULATIF DE L\'ANALYSE', 30, sigY + 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate700);
  doc.text(`Entreprise : ${safeData.entreprise}`, 30, sigY + 30);
  doc.text(`Économies annuelles identifiées : ${formatCurrency(safeData.economiesAnnuelles)}`, 30, sigY + 42);
  doc.text(`Retour sur investissement : ${safeData.roiApresAides} mois`, 30, sigY + 54);
  
  sigY += 80;
  
  // ═══ NETTOYAGE PHYSIQUE AVANT SIGNATURES ═══
  clearZone(doc, 0, sigY - 5, pageWidth, 120);
  
  // Zone Analyste
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navyBlue);
  doc.text('ANALYSTE', 20, sigY);
  
  sigY += 10;
  doc.setDrawColor(...COLORS.slate200);
  doc.setLineWidth(0.5);
  doc.line(20, sigY + 15, 100, sigY + 15);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate500);
  doc.text('Nom / Email', 20, sigY + 22);
  
  // Zone Signature Client
  sigY += 40;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navyBlue);
  doc.text('VALIDATION CLIENT', 20, sigY);
  
  sigY += 10;
  
  // Si signature numérique fournie, l'afficher
  if (safeData.signature?.imageData) {
    try {
      // Cadre de signature
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, sigY, pageWidth - 40, 55, 3, 3, 'F');
      doc.setDrawColor(6, 182, 212); // Cyan border
      doc.setLineWidth(1);
      doc.roundedRect(20, sigY, pageWidth - 40, 55, 3, 3, 'S');
      
      // Image de signature
      doc.addImage(safeData.signature.imageData, 'PNG', 25, sigY + 5, 90, 35);
      
      // Horodatage précis
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...COLORS.slate500);
      const signatureDate = safeData.signature.signedAt ? formatDateHeure(safeData.signature.signedAt) : new Date().toLocaleDateString('fr-FR');
      doc.text(`Signé numériquement le ${signatureDate}`, 25, sigY + 45);
      
      if (safeData.signature.signataireName) {
        doc.text(`Par : ${safeData.signature.signataireName}`, 25, sigY + 51);
      }
      
      // Badge VALIDÉ
      doc.setFillColor(16, 185, 129); // Emerald
      doc.roundedRect(pageWidth - 65, sigY + 8, 40, 12, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('✓ VALIDÉ', pageWidth - 60, sigY + 16);
      
      // Mention RGPD
      if (safeData.signature.rgpdConsent) {
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.slate400);
        doc.text('✓ Consentement RGPD obtenu', pageWidth - 65, sigY + 30);
      }
    } catch {
      // Fallback: ligne de signature vide
      doc.setDrawColor(...COLORS.slate200);
      doc.line(20, sigY + 15, 100, sigY + 15);
    }
  } else {
    // Zone de signature vide
    doc.setDrawColor(...COLORS.slate200);
    doc.line(20, sigY + 15, 100, sigY + 15);
    doc.line(120, sigY + 15, pageWidth - 20, sigY + 15);
    
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.slate500);
    doc.text('Signature', 20, sigY + 22);
    doc.text('Date', 120, sigY + 22);
  }
  
  // Date de validation pré-remplie
  const dateValidation = safeData.signature?.signedAt || new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  sigY += 60;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, sigY, pageWidth - 40, 30, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate700);
  const signatureDateFormatted = safeData.signature?.signedAt ? formatDateHeure(safeData.signature.signedAt) : dateValidation;
  const validationText = safeData.signature ? `Signé numériquement le : ${signatureDateFormatted}` : `Validé le : ${dateValidation}`;
  doc.text(validationText, pageWidth / 2, sigY + 18, { align: 'center' });
  
  // Mention légale finale
  sigY += 45;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLORS.slate500);
  const mentionLegale = "Ce rapport constitue une analyse préliminaire basée sur les données fournies. Les économies et subventions mentionnées sont des estimations qui devront être confirmées par une étude technique approfondie.";
  const mentionLines = doc.splitTextToSize(mentionLegale, pageWidth - 40);
  doc.text(mentionLines, pageWidth / 2, sigY, { align: 'center' });

  // ══════════════════════════════════════════════════════════════
  // PAGE FINALE - AVERTISSEMENT LÉGAL ET RESPONSABILITÉ
  // ══════════════════════════════════════════════════════════════
  doc.addPage();
  
  // Fond blanc avec bordure élégante
  doc.setFillColor(252, 252, 253);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Cadre décoratif
  doc.setDrawColor(...COLORS.slate200);
  doc.setLineWidth(0.5);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30, 'S');
  
  // Ligne décorative supérieure
  doc.setDrawColor(...COLORS.navyBlue);
  doc.setLineWidth(2);
  doc.line(15, 40, pageWidth - 15, 40);
  
  // Titre
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navyBlue);
  doc.text('AVERTISSEMENT LÉGAL ET RESPONSABILITÉ', pageWidth / 2, 55, { align: 'center' });
  
  // Icône balance/juridique (symbole §)
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.slate200);
  doc.text('§', pageWidth / 2, 75, { align: 'center' });
  
  // Texte de l'avertissement
  const cabinetNom = typeof window !== 'undefined' ? localStorage.getItem('io-cabinet') || 'CAPITAL ÉNERGIE' : 'CAPITAL ÉNERGIE';
  
  const avertissementTexte = `Le présent rapport est une simulation réalisée par une intelligence artificielle à partir des données fournies. Il ne constitue pas un audit réglementaire conforme à la norme NF EN 16247.

Les économies annuelles et les montants de subventions (Certificats d'Économies d'Énergie - CEE) présentés dans ce document sont des estimations indicatives basées sur des hypothèses de calcul standardisées.

La société ${cabinetNom} agit en tant qu'apporteur d'affaires et intermédiaire de mise en relation entre le client et les professionnels du secteur de l'efficacité énergétique.

La validation technique finale, le chiffrage précis des travaux et la réalisation des installations doivent impérativement être effectués par un professionnel certifié RGE (Reconnu Garant de l'Environnement).

En aucun cas l'analyste ayant produit ce rapport ne pourra être tenu responsable des éventuels écarts entre les estimations de l'intelligence artificielle et les résultats réels constatés après réalisation des travaux.

Ce document a une valeur informative et ne peut en aucun cas se substituer à une étude technique réalisée par un bureau d'études qualifié.`;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate700);
  
  const avertissementLines = doc.splitTextToSize(avertissementTexte, pageWidth - 50);
  doc.text(avertissementLines, 25, 95);
  
  // Paragraphe de sécurité juridique - CLAUSE REFORMULÉE
  const securiteJuridiqueTexte = "CAPITAL ÉNERGIE agit en qualité de cabinet d'audit indépendant. Le présent rapport ne constitue pas un devis de travaux mais une estimation des droits aux subventions d'État. Notre mission est d'accompagner les entreprises dans l'identification et le recouvrement des aides à l'efficacité énergétique (CEE) auxquelles elles sont éligibles.";
  
  const securiteLines = doc.splitTextToSize(securiteJuridiqueTexte, pageWidth - 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate700);
  doc.text(securiteLines, 25, 180);

  // Paragraphe d'indépendance institutionnelle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.navyBlue);
  doc.text('INDÉPENDANCE INSTITUTIONNELLE :', 25, 210);
  
  const independanceTexte = "CAPITAL ÉNERGIE est une initiative privée indépendante. Ce rapport ne constitue pas un document officiel émanant des services publics (État, ADEME, Anah). Nous ne sommes mandatés par aucune administration pour réaliser des contrôles obligatoires.";
  
  const independanceLines = doc.splitTextToSize(independanceTexte, pageWidth - 50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.slate700);
  doc.text(independanceLines, 25, 218);

  // Bloc 'En résumé' SUPPRIMÉ - Évite collision avec footer
  // Les points clés sont déjà présents dans le footer et l'avertissement légal

  // ══════════════════════════════════════════════════════════════
  // PAGE DOSSIER TECHNIQUE - VUE ARTISAN
  // ══════════════════════════════════════════════════════════════
  if (safeData.machines && safeData.machines.length > 0) {
    doc.addPage();
    
    // En-tête
    doc.setFillColor(...COLORS.navyBlue);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text('DOSSIER TECHNIQUE - VUE ARTISAN', pageWidth / 2, 22, { align: 'center' });
    
    let techY = 50;
    
    // Intro
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.slate500);
    doc.text('Informations techniques collectées par le Scanner Flash pour les professionnels RGE', 20, techY);
    
    techY += 15;
    
    // Tableau des équipements
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.navyBlue);
    doc.text('Équipements identifiés', 20, techY);
    
    techY += 8;
    
    const machinesTableData = safeData.machines.map((machine, idx) => [
      `${idx + 1}`,
      machine.nom,
      machine.type,
      machine.marque || '-',
      machine.puissanceKW ? `${machine.puissanceKW} kW` : '-',
      machine.annee ? `${machine.annee}` : '-'
    ]);
    
    autoTable(doc, {
      startY: techY,
      head: [['#', 'Équipement', 'Type', 'Marque', 'Puissance', 'Année']],
      body: machinesTableData,
      theme: 'plain',
      styles: {
        cellPadding: 4,
        fontSize: 8,
        lineColor: [226, 232, 240],
        lineWidth: { bottom: 0.3, top: 0, left: 0, right: 0 },
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: [71, 85, 105],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 45 },
        2: { cellWidth: 35 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 20, halign: 'center' },
      },
      margin: { left: 20, right: 20 },
    });
    
    // Position après tableau
    try {
      const docWithTable = doc as unknown as { previousAutoTable?: { finalY?: number } };
      techY = docWithTable.previousAutoTable?.finalY ? docWithTable.previousAutoTable.finalY + 20 : techY + 60;
    } catch {
      techY += 60;
    }
    
    // Section photos si disponibles
    if (safeData.photos && safeData.photos.length > 0) {
      if (techY > 200) {
        doc.addPage();
        techY = 30;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.navyBlue);
      doc.text('Documentation photographique', 20, techY);
      
      techY += 10;
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...COLORS.slate500);
      doc.text(`${safeData.photos.length} photo(s) collectée(s) lors de l'analyse`, 20, techY);
      
      techY += 10;
      
      // Afficher les photos en grille 2x2
      const photoWidth = 80;
      const photoHeight = 60;
      let photoX = 20;
      
      for (let i = 0; i < Math.min(safeData.photos.length, 4); i++) {
        try {
          if (i === 2) {
            techY += photoHeight + 10;
            photoX = 20;
          }
          doc.addImage(safeData.photos[i], 'JPEG', photoX, techY, photoWidth, photoHeight);
          doc.setDrawColor(...COLORS.slate200);
          doc.rect(photoX, techY, photoWidth, photoHeight, 'S');
          photoX += photoWidth + 10;
        } catch (e) {
          console.error('Erreur ajout photo:', e);
        }
      }
    }
    
    // Note pour l'artisan
    doc.addPage();
    let noteY = 30;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.navyBlue);
    doc.text('Note pour le professionnel RGE', 20, noteY);
    
    noteY += 12;
    
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, noteY, pageWidth - 40, 80, 3, 3, 'F');
    doc.setDrawColor(...COLORS.slate200);
    doc.roundedRect(20, noteY, pageWidth - 40, 80, 3, 3, 'S');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.slate700);
    
    const noteTexte = `Ce dossier technique a été généré automatiquement par la plateforme CAPITAL ÉNERGIE.

Les informations présentées sont issues d'une analyse par intelligence artificielle et doivent être vérifiées sur site avant tout devis ou intervention.

Merci de contacter le client pour planifier une visite technique de validation.

Contact plateforme : contact@capital-energie.fr`;
    
    const noteLines = doc.splitTextToSize(noteTexte, pageWidth - 50);
    doc.text(noteLines, 25, noteY + 12);
  }
  
  // ══════════════════════════════════════════════════════════════
  // BOUCLE FINALE DE PAGINATION - APRÈS GÉNÉRATION DE TOUTES LES PAGES
  // getNumberOfPages() appelé UNE SEULE FOIS après la page 6
  // ══════════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pH = doc.internal.pageSize.getHeight();
    const pW = doc.internal.pageSize.getWidth();
    
    // ═══ EFFACEMENT PHYSIQUE ANTI-GHOST ═══
    // Nettoyer zone footer (0, 275, 210, 25) avant injection mentions légales
    clearZone(doc, 0, 275, 210, 25);
    
    // Ligne de séparation fine
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(20, pH - 18, pW - 20, pH - 18);
    
    // Clause juridique RGE - SOURCE UNIQUE
    doc.setFontSize(5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.slate500);
    doc.text(LEGAL_FOOTER, pW / 2, pH - 12, { align: 'center' });
    
    // Ligne du bas : Confidentiel | Copyright | Pagination
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.slate500);
    doc.text('CONFIDENTIEL', 20, pH - 5);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`© ${new Date().getFullYear()} CAPITAL ÉNERGIE`, pW / 2, pH - 5, { align: 'center' });
    
    // Pagination dynamique: affiche X/totalPages
    doc.text(`${i}/${totalPages}`, pW - 20, pH - 5, { align: 'right' });
  }

  // Save the PDF avec nom professionnel
  const cleanName = safeData.entreprise.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  const fileName = `Rapport_CE_${cleanName}.pdf`;
  doc.save(fileName);
}
