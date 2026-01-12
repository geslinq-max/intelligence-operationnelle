/**
 * Service d'export CSV pour les données de plans d'optimisation
 */

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
}

interface PlanData {
  entreprise: string;
  titre: string;
  dateCreation: string;
  investissementTotal: number;
  economiesAnnuelles: number;
  tempsRetourMois: number;
  actions: PlanAction[];
  subventions: Subvention[];
}

/**
 * Génère et télécharge un fichier CSV à partir des données du plan
 */
export function exportPlanToCSV(plan: PlanData): void {
  const rows: string[][] = [];
  
  // En-tête du document
  rows.push(['PLAN D\'OPTIMISATION - EXPORT CSV']);
  rows.push(['Généré le', new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })]);
  rows.push([]);
  
  // Informations générales
  rows.push(['INFORMATIONS GÉNÉRALES']);
  rows.push(['Entreprise', plan.entreprise]);
  rows.push(['Titre du plan', plan.titre]);
  rows.push(['Date de création', plan.dateCreation]);
  rows.push(['Investissement total (€)', formatNumber(plan.investissementTotal)]);
  rows.push(['Économies annuelles (€)', formatNumber(plan.economiesAnnuelles)]);
  rows.push(['Temps de retour (mois)', plan.tempsRetourMois.toString()]);
  rows.push([]);
  
  // Actions d'optimisation
  rows.push(['ACTIONS D\'OPTIMISATION']);
  rows.push([
    'N°',
    'Titre',
    'Domaine',
    'Description',
    'Coût (€)',
    'Économies annuelles (€)',
    'Délai',
    'Complexité',
    'ROI (mois)'
  ]);
  
  plan.actions.forEach((action, index) => {
    const roi = action.coutImplementation > 0 
      ? Math.round((action.coutImplementation / action.economiesAnnuelles) * 12)
      : 0;
    
    rows.push([
      (index + 1).toString(),
      action.titre,
      action.domaine,
      action.description.replace(/"/g, '""'), // Escape des guillemets
      formatNumber(action.coutImplementation),
      formatNumber(action.economiesAnnuelles),
      action.delaiMiseEnOeuvre,
      action.complexite,
      roi.toString()
    ]);
  });
  
  rows.push([]);
  
  // Subventions
  if (plan.subventions && plan.subventions.length > 0) {
    rows.push(['SUBVENTIONS DISPONIBLES']);
    rows.push([
      'N°',
      'Nom',
      'Type',
      'Montant estimé (€)',
      'Pourcentage couvert (%)'
    ]);
    
    plan.subventions.forEach((sub, index) => {
      rows.push([
        (index + 1).toString(),
        sub.nom,
        sub.type,
        formatNumber(sub.montantEstime),
        sub.pourcentageCouvert.toString()
      ]);
    });
    
    rows.push([]);
    
    // Total subventions
    const totalSubventions = plan.subventions.reduce((sum, s) => sum + s.montantEstime, 0);
    rows.push(['Total subventions (€)', formatNumber(totalSubventions)]);
    rows.push(['Investissement net après aides (€)', formatNumber(plan.investissementTotal - totalSubventions)]);
  }
  
  rows.push([]);
  
  // Synthèse
  rows.push(['SYNTHÈSE FINANCIÈRE']);
  rows.push(['Investissement initial (€)', formatNumber(plan.investissementTotal)]);
  rows.push(['Économies annuelles (€)', formatNumber(plan.economiesAnnuelles)]);
  rows.push(['Retour sur investissement (mois)', plan.tempsRetourMois.toString()]);
  
  if (plan.subventions && plan.subventions.length > 0) {
    const totalSubventions = plan.subventions.reduce((sum, s) => sum + s.montantEstime, 0);
    const investissementNet = plan.investissementTotal - totalSubventions;
    const roiApresAides = investissementNet > 0 
      ? Math.round((investissementNet / plan.economiesAnnuelles) * 12)
      : 0;
    rows.push(['ROI après aides (mois)', roiApresAides.toString()]);
  }
  
  // Projection sur 5 ans
  rows.push([]);
  rows.push(['PROJECTION SUR 5 ANS']);
  rows.push(['Année', 'Économies cumulées (€)', 'Rentabilité']);
  for (let i = 1; i <= 5; i++) {
    const cumulatedSavings = plan.economiesAnnuelles * i;
    const rentabilite = cumulatedSavings > plan.investissementTotal ? 'Rentable' : 'En cours';
    rows.push([
      `Année ${i}`,
      formatNumber(cumulatedSavings),
      rentabilite
    ]);
  }
  
  // Convertir en CSV
  const csvContent = rows.map(row => 
    row.map(cell => `"${cell}"`).join(';')
  ).join('\n');
  
  // Télécharger le fichier
  downloadCSV(csvContent, `Plan_Optimisation_${sanitizeFilename(plan.entreprise)}_${getDateString()}.csv`);
}

/**
 * Exporte plusieurs plans en un seul fichier CSV (synthèse)
 */
export function exportAllPlansToCSV(plans: PlanData[]): void {
  const rows: string[][] = [];
  
  // En-tête
  rows.push(['SYNTHÈSE DES PLANS D\'OPTIMISATION']);
  rows.push(['Exporté le', new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })]);
  rows.push(['Nombre de plans', plans.length.toString()]);
  rows.push([]);
  
  // Tableau récapitulatif
  rows.push([
    'Entreprise',
    'Titre du plan',
    'Date création',
    'Investissement (€)',
    'Économies/an (€)',
    'ROI (mois)',
    'Nb actions',
    'Subventions (€)'
  ]);
  
  let totalInvestissement = 0;
  let totalEconomies = 0;
  let totalSubventions = 0;
  
  plans.forEach(plan => {
    const subventionsTotal = plan.subventions?.reduce((sum, s) => sum + s.montantEstime, 0) || 0;
    
    rows.push([
      plan.entreprise,
      plan.titre,
      plan.dateCreation,
      formatNumber(plan.investissementTotal),
      formatNumber(plan.economiesAnnuelles),
      plan.tempsRetourMois.toString(),
      plan.actions.length.toString(),
      formatNumber(subventionsTotal)
    ]);
    
    totalInvestissement += plan.investissementTotal;
    totalEconomies += plan.economiesAnnuelles;
    totalSubventions += subventionsTotal;
  });
  
  rows.push([]);
  rows.push(['TOTAUX']);
  rows.push(['Investissement total (€)', formatNumber(totalInvestissement)]);
  rows.push(['Économies annuelles totales (€)', formatNumber(totalEconomies)]);
  rows.push(['Subventions totales (€)', formatNumber(totalSubventions)]);
  rows.push(['Investissement net (€)', formatNumber(totalInvestissement - totalSubventions)]);
  
  // Convertir en CSV
  const csvContent = rows.map(row => 
    row.map(cell => `"${cell}"`).join(';')
  ).join('\n');
  
  // Télécharger
  downloadCSV(csvContent, `Synthese_Plans_${getDateString()}.csv`);
}

/**
 * Télécharge un fichier CSV
 */
function downloadCSV(content: string, filename: string): void {
  // Ajouter BOM pour Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value));
}

/**
 * Nettoie un nom de fichier
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
}

/**
 * Retourne la date au format YYYYMMDD
 */
function getDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}
