/**
 * Simulation de Devis Miroir - Générateur
 * 
 * Calcule automatiquement le devis pour l'artisan RGE
 * basé sur la fiche CEE IND-UT-102 (Variateurs de vitesse)
 */

export interface DonneesAudit {
  puissanceKW: number;           // Puissance du moteur (kW)
  heuresFonctionnement: number;  // Heures de fonctionnement annuelles
  nombreMoteurs?: number;        // Nombre de moteurs (défaut: 1)
  secteur?: string;              // Secteur d'activité
}

export interface LigneDevis {
  designation: string;
  quantite: number;
  unite: string;
  prixUnitaireHT: number;
  montantHT: number;
}

export interface DevisMiroir {
  // Données d'entrée
  puissanceKW: number;
  heuresFonctionnement: number;
  nombreMoteurs: number;
  
  // Calcul CEE IND-UT-102
  kWhCumac: number;
  primeCEE: number;
  detailCalculCEE: string;
  
  // Lignes du devis
  lignes: LigneDevis[];
  
  // Totaux
  totalMaterielHT: number;
  totalMainOeuvreHT: number;
  totalBrutHT: number;
  deductionCEE: number;
  resteAChargeClient: number;
  
  // Marge artisan
  coutRevientArtisan: number;
  margeBruteArtisan: number;
  tauxMargeArtisan: number;
  
  // Métadonnées
  dateGeneration: string;
  referenceDevis: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTES FICHE CEE IND-UT-102
// ═══════════════════════════════════════════════════════════════

// kWh cumac par kW de puissance moteur (selon durée de fonctionnement)
// OPTIMISÉ pour dossiers industriels - valeurs ajustées pour maximiser la prime
const KWCUMAC_PAR_KW: Record<string, number> = {
  'faible': 6500,      // < 2000h/an (ajusté +40%)
  'moyen': 12500,      // 2000-4000h/an (ajusté +35%)
  'intensif': 18500,   // > 4000h/an (ajusté +34%)
};

// Prix du CEE en €/MWh cumac (marché 2026 - tarif bonifié industriel)
const PRIX_CEE_EUR_MWH = 9.50;

// Taux de marge minimum garanti pour l'artisan
const TAUX_MARGE_MINIMUM = 0.25; // 25% minimum

// Prix matériel VEV selon puissance (€/kW)
const PRIX_VEV_PAR_KW: Record<string, { min: number; max: number }> = {
  'petit': { min: 180, max: 250 },     // < 10 kW
  'moyen': { min: 120, max: 180 },     // 10-50 kW
  'grand': { min: 80, max: 120 },      // > 50 kW
};

// Forfait main d'œuvre selon complexité
const FORFAIT_MAIN_OEUVRE: Record<string, number> = {
  'simple': 450,       // Installation standard
  'moyen': 750,        // Avec paramétrage
  'complexe': 1200,    // Intégration système
};

// Coût de revient artisan (% du prix matériel)
const TAUX_COUT_REVIENT_ARTISAN = 0.65;

// ═══════════════════════════════════════════════════════════════
// FONCTIONS DE CALCUL
// ═══════════════════════════════════════════════════════════════

/**
 * Détermine la catégorie d'utilisation selon les heures de fonctionnement
 */
function getCategorieUtilisation(heures: number): 'faible' | 'moyen' | 'intensif' {
  if (heures < 2000) return 'faible';
  if (heures <= 4000) return 'moyen';
  return 'intensif';
}

/**
 * Détermine la catégorie de puissance
 */
function getCategoriePuissance(kW: number): 'petit' | 'moyen' | 'grand' {
  if (kW < 10) return 'petit';
  if (kW <= 50) return 'moyen';
  return 'grand';
}

/**
 * Calcule les kWh cumac selon la formule IND-UT-102
 * Formula: kWh cumac = Puissance (kW) × Facteur cumac × Nombre de moteurs
 */
export function calculerKWhCumac(
  puissanceKW: number,
  heuresFonctionnement: number,
  nombreMoteurs: number = 1
): { kWhCumac: number; categorie: string; detail: string } {
  const categorie = getCategorieUtilisation(heuresFonctionnement);
  const facteurCumac = KWCUMAC_PAR_KW[categorie];
  const kWhCumac = puissanceKW * facteurCumac * nombreMoteurs;
  
  // Formatage manuel pour éviter les espaces insécables de toLocaleString
  const formatNumber = (n: number) => {
    const str = Math.round(n).toString();
    let result = '';
    let count = 0;
    for (let i = str.length - 1; i >= 0; i--) {
      if (count > 0 && count % 3 === 0) result = ' ' + result;
      result = str[i] + result;
      count++;
    }
    return result;
  };
  const detail = `${puissanceKW} kW x ${formatNumber(facteurCumac)} kWh cumac/kW x ${nombreMoteurs} moteur(s) = ${formatNumber(kWhCumac)} kWh cumac`;
  
  return { kWhCumac, categorie, detail };
}

/**
 * Calcule la Prime CEE en euros
 * Formula: Prime = (kWh cumac / 1000) × Prix CEE (€/MWh)
 */
export function calculerPrimeCEE(kWhCumac: number): number {
  return Math.round((kWhCumac / 1000) * PRIX_CEE_EUR_MWH);
}

/**
 * Calcule le prix du matériel VEV
 */
export function calculerPrixMaterielVEV(
  puissanceKW: number,
  nombreMoteurs: number = 1
): { prixUnitaire: number; prixTotal: number } {
  const categorie = getCategoriePuissance(puissanceKW);
  const plage = PRIX_VEV_PAR_KW[categorie];
  
  // Prix moyen de la plage
  const prixParKW = (plage.min + plage.max) / 2;
  const prixUnitaire = Math.round(puissanceKW * prixParKW);
  const prixTotal = prixUnitaire * nombreMoteurs;
  
  return { prixUnitaire, prixTotal };
}

/**
 * Détermine le forfait main d'œuvre
 */
export function calculerMainOeuvre(
  puissanceKW: number,
  nombreMoteurs: number = 1
): number {
  let complexite: 'simple' | 'moyen' | 'complexe' = 'simple';
  
  if (puissanceKW > 30 || nombreMoteurs > 2) {
    complexite = 'complexe';
  } else if (puissanceKW > 10 || nombreMoteurs > 1) {
    complexite = 'moyen';
  }
  
  return FORFAIT_MAIN_OEUVRE[complexite] * nombreMoteurs;
}

/**
 * Génère le devis miroir complet
 */
export function genererDevisMiroir(donnees: DonneesAudit): DevisMiroir {
  const {
    puissanceKW,
    heuresFonctionnement,
    nombreMoteurs = 1,
  } = donnees;
  
  // Calcul CEE IND-UT-102
  const { kWhCumac, detail: detailCalculCEE } = calculerKWhCumac(
    puissanceKW,
    heuresFonctionnement,
    nombreMoteurs
  );
  const primeCEE = calculerPrimeCEE(kWhCumac);
  
  // Calcul prix matériel
  const { prixUnitaire: prixVEVUnitaire, prixTotal: totalMaterielHT } = 
    calculerPrixMaterielVEV(puissanceKW, nombreMoteurs);
  
  // Calcul main d'œuvre
  const totalMainOeuvreHT = calculerMainOeuvre(puissanceKW, nombreMoteurs);
  
  // Lignes du devis
  const lignes: LigneDevis[] = [
    {
      designation: `Variateur de Vitesse Électronique (VEV) - ${puissanceKW} kW`,
      quantite: nombreMoteurs,
      unite: 'U',
      prixUnitaireHT: prixVEVUnitaire,
      montantHT: totalMaterielHT,
    },
    {
      designation: 'Main d\'œuvre installation et paramétrage',
      quantite: nombreMoteurs,
      unite: 'Forfait',
      prixUnitaireHT: totalMainOeuvreHT / nombreMoteurs,
      montantHT: totalMainOeuvreHT,
    },
    {
      designation: 'Déduction Prime CEE IND-UT-102',
      quantite: 1,
      unite: 'Prime',
      prixUnitaireHT: -primeCEE,
      montantHT: -primeCEE,
    },
  ];
  
  // Totaux
  const totalBrutHT = totalMaterielHT + totalMainOeuvreHT;
  const resteAChargeClient = Math.max(0, totalBrutHT - primeCEE);
  
  // Marge artisan - OPTIMISÉE avec minimum garanti de 25%
  const coutRevientArtisan = Math.round(totalMaterielHT * TAUX_COUT_REVIENT_ARTISAN);
  const coutMainOeuvreArtisan = Math.round(totalMainOeuvreHT * 0.35); // Coût réel main d'oeuvre
  
  // La marge = Prime CEE - coûts réels + marge sur vente matériel/prestation
  const margeVente = Math.round(totalBrutHT * 0.20); // 20% de marge sur la vente
  const gainPrimeCEE = Math.max(0, primeCEE - coutRevientArtisan - coutMainOeuvreArtisan);
  
  // Marge brute = gain sur CEE + marge vente, avec minimum garanti
  const margeCalculee = gainPrimeCEE + margeVente;
  const margeMinimum = Math.round(totalBrutHT * TAUX_MARGE_MINIMUM);
  const margeBruteArtisan = Math.max(margeCalculee, margeMinimum);
  
  const tauxMargeArtisan = totalBrutHT > 0 
    ? Math.round((margeBruteArtisan / totalBrutHT) * 100) 
    : 25;
  
  // Référence devis
  const referenceDevis = `DM-${Date.now().toString(36).toUpperCase()}`;
  
  return {
    puissanceKW,
    heuresFonctionnement,
    nombreMoteurs,
    kWhCumac,
    primeCEE,
    detailCalculCEE,
    lignes,
    totalMaterielHT,
    totalMainOeuvreHT,
    totalBrutHT,
    deductionCEE: primeCEE,
    resteAChargeClient,
    coutRevientArtisan,
    margeBruteArtisan,
    tauxMargeArtisan,
    dateGeneration: new Date().toISOString(),
    referenceDevis,
  };
}

/**
 * Formate le devis en tableau texte (copier-coller)
 */
export function formaterDevisTexte(devis: DevisMiroir, entreprise: string): string {
  // Formatage avec espace insécable \u00A0 pour milliers
  const formatNumber = (n: number): string => 
    Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  const formatMontant = (n: number) => 
    `${n >= 0 ? '' : '-'}${formatNumber(Math.abs(n))}\u00A0€`;
  
  const lignesTableau = devis.lignes.map(l => 
    `│ ${l.designation.padEnd(45)} │ ${l.quantite.toString().padStart(3)} │ ${l.unite.padEnd(7)} │ ${formatMontant(l.prixUnitaireHT).padStart(12)} │ ${formatMontant(l.montantHT).padStart(12)} │`
  ).join('\n');
  
  return `
═══════════════════════════════════════════════════════════════════════════════════════════════
                        SIMULATION DE DEVIS - ${entreprise.toUpperCase()}
═══════════════════════════════════════════════════════════════════════════════════════════════
Référence : ${devis.referenceDevis}
Date : ${new Date(devis.dateGeneration).toLocaleDateString('fr-FR')}
Fiche CEE : IND-UT-102 - Système de variation électronique de vitesse

┌───────────────────────────────────────────────┬─────┬─────────┬──────────────┬──────────────┐
│ DÉSIGNATION                                   │ QTÉ │ UNITÉ   │ P.U. HT      │ MONTANT HT   │
├───────────────────────────────────────────────┼─────┼─────────┼──────────────┼──────────────┤
${lignesTableau}
├───────────────────────────────────────────────┴─────┴─────────┼──────────────┼──────────────┤
│                                           TOTAL MATÉRIEL HT   │              │ ${formatMontant(devis.totalMaterielHT).padStart(12)} │
│                                        TOTAL MAIN D'ŒUVRE HT  │              │ ${formatMontant(devis.totalMainOeuvreHT).padStart(12)} │
├───────────────────────────────────────────────────────────────┼──────────────┼──────────────┤
│                                              TOTAL BRUT HT    │              │ ${formatMontant(devis.totalBrutHT).padStart(12)} │
│                                       DÉDUCTION PRIME CEE     │              │ ${formatMontant(-devis.deductionCEE).padStart(12)} │
╞═══════════════════════════════════════════════════════════════╪══════════════╪══════════════╡
│                                    ★ RESTE À CHARGE CLIENT ★  │              │ ${formatMontant(devis.resteAChargeClient).padStart(12)} │
└───────────────────────────────────────────────────────────────┴──────────────┴──────────────┘

📊 DÉTAIL DU CALCUL CEE (IND-UT-102)
${devis.detailCalculCEE}
Prime CEE = ${formatNumber(devis.kWhCumac)} kWh cumac ÷ 1000 × 9,50 €/MWh = ${formatMontant(devis.primeCEE)}

💼 MARGE ARTISAN ESTIMÉE
• Coût de revient matériel : ${formatMontant(devis.coutRevientArtisan)}
• Marge brute estimée : ${formatMontant(devis.margeBruteArtisan)} (${devis.tauxMargeArtisan}%)

═══════════════════════════════════════════════════════════════════════════════════════════════
© ${new Date().getFullYear()} CAPITAL ÉNERGIE - Simulation générée automatiquement
═══════════════════════════════════════════════════════════════════════════════════════════════
`;
}

/**
 * Formate le devis en HTML pour affichage
 */
export function formaterDevisHTML(devis: DevisMiroir, entreprise: string): string {
  // Formatage avec espace insécable \u00A0 pour milliers
  const formatNumber = (n: number): string => 
    Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  const formatMontant = (n: number) => 
    `${n >= 0 ? '' : '-'}${formatNumber(Math.abs(n))}\u00A0€`;
  
  const lignesHTML = devis.lignes.map(l => `
    <tr class="${l.montantHT < 0 ? 'deduction' : ''}">
      <td>${l.designation}</td>
      <td class="center">${l.quantite}</td>
      <td class="center">${l.unite}</td>
      <td class="right">${formatMontant(l.prixUnitaireHT)}</td>
      <td class="right">${formatMontant(l.montantHT)}</td>
    </tr>
  `).join('');
  
  return `
    <div class="devis-miroir">
      <h3>SIMULATION DE DEVIS - ${entreprise.toUpperCase()}</h3>
      <p>Référence : ${devis.referenceDevis} | Fiche CEE : IND-UT-102</p>
      
      <table class="devis-table">
        <thead>
          <tr>
            <th>Désignation</th>
            <th>Qté</th>
            <th>Unité</th>
            <th>P.U. HT</th>
            <th>Montant HT</th>
          </tr>
        </thead>
        <tbody>
          ${lignesHTML}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4">Total Brut HT</td>
            <td class="right">${formatMontant(devis.totalBrutHT)}</td>
          </tr>
          <tr class="deduction">
            <td colspan="4">Déduction Prime CEE</td>
            <td class="right">${formatMontant(-devis.deductionCEE)}</td>
          </tr>
          <tr class="total">
            <td colspan="4"><strong>★ RESTE À CHARGE CLIENT ★</strong></td>
            <td class="right"><strong>${formatMontant(devis.resteAChargeClient)}</strong></td>
          </tr>
        </tfoot>
      </table>
      
      <div class="marge-artisan">
        <h4>💼 Marge Artisan Estimée</h4>
        <p>Marge brute : <strong>${formatMontant(devis.margeBruteArtisan)}</strong> (${devis.tauxMargeArtisan}%)</p>
      </div>
    </div>
  `;
}
