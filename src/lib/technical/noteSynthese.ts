/**
 * Note de Synthèse Technique - Générateur
 * 
 * Module de calcul et génération de la note technique pour
 * justifier l'éligibilité aux dispositifs CEE
 */

export interface DonneesEnergetiques {
  // Consommation active (kW)
  puissanceActive: number;
  // Énergie réactive (kVARh)
  energieReactive: number;
  // Consommation totale (kWh)
  consommationTotale: number;
  // Période de mesure (mois)
  periodeMesure: number;
  // Facteur de puissance actuel (cos φ)
  facteurPuissance?: number;
}

export interface EligibiliteMathematique {
  // Ratio de perte réactive (%)
  ratioPerteReactive: number;
  // Gisement technique détecté (kWh/an économisables)
  gisementTechnique: number;
  // Score d'éligibilité (0-100)
  scoreEligibilite: number;
  // Facteur de puissance calculé
  facteurPuissanceCalcule: number;
  // Facteur de puissance cible (objectif)
  facteurPuissanceCible: number;
  // Puissance réactive à compenser (kVAR)
  puissanceReactiveACompenser: number;
  // Économies potentielles (€/an)
  economiesPotentielles: number;
  // Justification technique
  justification: string;
  // Seuil d'éligibilité atteint
  eligible: boolean;
}

export interface NoteSyntheseTechnique {
  // Informations entreprise
  entreprise: string;
  secteur: string;
  dateAnalyse: string;
  
  // Bloc 1: Éligibilité Mathématique
  eligibiliteMathematique: EligibiliteMathematique;
  
  // Bloc 2: Diagnostic Technique
  diagnosticTechnique: {
    equipementsAnalyses: string[];
    pointsFaibles: string[];
    recommandations: string[];
  };
  
  // Bloc 3: Fiche CEE applicable
  ficheCEE: {
    code: string;
    nom: string;
    montantEstime: number;
  } | null;
}

// Constantes techniques
const SEUIL_RATIO_PERTE_MIN = 5; // 5% minimum pour éligibilité
const FACTEUR_PUISSANCE_CIBLE = 0.95; // cos φ cible standard
const PRIX_KWH_MOYEN = 0.18; // €/kWh
const PENALITE_REACTIVE_KWH = 0.02; // €/kVARh de pénalité moyenne

/**
 * Calcule le facteur de puissance (cos φ) à partir des données
 * Formula: cos φ = P / √(P² + Q²)
 * où P = puissance active (kW), Q = puissance réactive (kVAR)
 */
export function calculerFacteurPuissance(
  puissanceActive: number,
  energieReactive: number,
  periodeMesure: number
): number {
  if (puissanceActive <= 0) return 1;
  
  // Convertir kVARh en kVAR moyen sur la période
  const heuresPeriode = periodeMesure * 30 * 24; // heures approximatives
  const puissanceReactiveMoyenne = energieReactive / heuresPeriode;
  
  // Calcul du facteur de puissance
  const puissanceApparente = Math.sqrt(
    Math.pow(puissanceActive, 2) + Math.pow(puissanceReactiveMoyenne, 2)
  );
  
  const cosPhi = puissanceActive / puissanceApparente;
  return Math.round(cosPhi * 1000) / 1000; // Arrondi à 3 décimales
}

/**
 * Calcule le ratio de perte réactive par rapport à la consommation active
 * Formula: Ratio = (Énergie Réactive / Consommation Totale) × 100
 */
export function calculerRatioPerteReactive(
  energieReactive: number,
  consommationTotale: number
): number {
  if (consommationTotale <= 0) return 0;
  
  const ratio = (energieReactive / consommationTotale) * 100;
  return Math.round(ratio * 100) / 100; // Arrondi à 2 décimales
}

/**
 * Calcule la puissance réactive à compenser pour atteindre le cos φ cible
 * Formula: Qc = P × (tan φ_actuel - tan φ_cible)
 */
export function calculerPuissanceReactiveACompenser(
  puissanceActive: number,
  facteurPuissanceActuel: number,
  facteurPuissanceCible: number = FACTEUR_PUISSANCE_CIBLE
): number {
  if (facteurPuissanceActuel >= facteurPuissanceCible) return 0;
  
  // Calcul des angles
  const phiActuel = Math.acos(facteurPuissanceActuel);
  const phiCible = Math.acos(facteurPuissanceCible);
  
  // Calcul de la puissance réactive à compenser
  const tanActuel = Math.tan(phiActuel);
  const tanCible = Math.tan(phiCible);
  
  const qCompensation = puissanceActive * (tanActuel - tanCible);
  return Math.round(qCompensation * 10) / 10; // Arrondi à 1 décimale
}

/**
 * Calcule le gisement technique (économies d'énergie potentielles)
 */
export function calculerGisementTechnique(
  energieReactive: number,
  ratioPerteReactive: number,
  periodeMesure: number
): number {
  // Extrapolation annuelle
  const facteurAnnuel = 12 / periodeMesure;
  
  // Le gisement est estimé à 15-25% de l'énergie réactive récupérable
  // via compensation + optimisation des équipements
  const tauxRecuperation = ratioPerteReactive > 10 ? 0.25 : 0.15;
  
  const gisement = energieReactive * facteurAnnuel * tauxRecuperation;
  return Math.round(gisement);
}

/**
 * Calcule les économies potentielles en euros
 */
export function calculerEconomiesPotentielles(
  gisementTechnique: number,
  energieReactive: number,
  periodeMesure: number
): number {
  // Économies sur consommation + suppression pénalités réactives
  const economiesConsommation = gisementTechnique * PRIX_KWH_MOYEN;
  
  // Pénalités réactives évitées (annualisées)
  const facteurAnnuel = 12 / periodeMesure;
  const penalitesEvitees = energieReactive * facteurAnnuel * PENALITE_REACTIVE_KWH * 0.5;
  
  return Math.round(economiesConsommation + penalitesEvitees);
}

/**
 * Génère la justification technique basée sur les calculs
 */
export function genererJustificationTechnique(
  ratioPerteReactive: number,
  facteurPuissance: number,
  gisementTechnique: number
): string {
  const justifications: string[] = [];
  
  if (ratioPerteReactive >= 15) {
    justifications.push(
      `Ratio de perte réactive critique (${ratioPerteReactive}%) : intervention prioritaire recommandée.`
    );
  } else if (ratioPerteReactive >= 10) {
    justifications.push(
      `Ratio de perte réactive élevé (${ratioPerteReactive}%) : optimisation fortement conseillée.`
    );
  } else if (ratioPerteReactive >= SEUIL_RATIO_PERTE_MIN) {
    justifications.push(
      `Ratio de perte réactive significatif (${ratioPerteReactive}%) : éligible aux dispositifs CEE.`
    );
  }
  
  if (facteurPuissance < 0.85) {
    justifications.push(
      `Facteur de puissance dégradé (cos φ = ${facteurPuissance}) : compensation réactive nécessaire.`
    );
  } else if (facteurPuissance < 0.92) {
    justifications.push(
      `Facteur de puissance améliorable (cos φ = ${facteurPuissance}) : gains potentiels identifiés.`
    );
  }
  
  if (gisementTechnique > 10000) {
    justifications.push(
      `Gisement technique majeur détecté : ${gisementTechnique.toLocaleString('fr-FR')} kWh/an récupérables.`
    );
  } else if (gisementTechnique > 5000) {
    justifications.push(
      `Gisement technique significatif : ${gisementTechnique.toLocaleString('fr-FR')} kWh/an récupérables.`
    );
  }
  
  return justifications.join(' ');
}

/**
 * FONCTION PRINCIPALE
 * Calcule l'éligibilité mathématique complète
 */
export function calculerEligibiliteMathematique(
  donnees: DonneesEnergetiques
): EligibiliteMathematique {
  const {
    puissanceActive,
    energieReactive,
    consommationTotale,
    periodeMesure,
    facteurPuissance: facteurPuissanceFourni,
  } = donnees;
  
  // Calcul du facteur de puissance (ou utilisation de la valeur fournie)
  const facteurPuissanceCalcule = facteurPuissanceFourni 
    ?? calculerFacteurPuissance(puissanceActive, energieReactive, periodeMesure);
  
  // Calcul du ratio de perte réactive
  const ratioPerteReactive = calculerRatioPerteReactive(
    energieReactive,
    consommationTotale
  );
  
  // Calcul de la puissance réactive à compenser
  const puissanceReactiveACompenser = calculerPuissanceReactiveACompenser(
    puissanceActive,
    facteurPuissanceCalcule,
    FACTEUR_PUISSANCE_CIBLE
  );
  
  // Calcul du gisement technique
  const gisementTechnique = calculerGisementTechnique(
    energieReactive,
    ratioPerteReactive,
    periodeMesure
  );
  
  // Calcul des économies potentielles
  const economiesPotentielles = calculerEconomiesPotentielles(
    gisementTechnique,
    energieReactive,
    periodeMesure
  );
  
  // Calcul du score d'éligibilité (0-100)
  let scoreEligibilite = 0;
  if (ratioPerteReactive >= SEUIL_RATIO_PERTE_MIN) scoreEligibilite += 30;
  if (ratioPerteReactive >= 10) scoreEligibilite += 20;
  if (facteurPuissanceCalcule < 0.92) scoreEligibilite += 25;
  if (gisementTechnique > 5000) scoreEligibilite += 15;
  if (economiesPotentielles > 1000) scoreEligibilite += 10;
  scoreEligibilite = Math.min(100, scoreEligibilite);
  
  // Génération de la justification
  const justification = genererJustificationTechnique(
    ratioPerteReactive,
    facteurPuissanceCalcule,
    gisementTechnique
  );
  
  // Détermination de l'éligibilité
  const eligible = ratioPerteReactive >= SEUIL_RATIO_PERTE_MIN && scoreEligibilite >= 50;
  
  return {
    ratioPerteReactive,
    gisementTechnique,
    scoreEligibilite,
    facteurPuissanceCalcule,
    facteurPuissanceCible: FACTEUR_PUISSANCE_CIBLE,
    puissanceReactiveACompenser,
    economiesPotentielles,
    justification,
    eligible,
  };
}

/**
 * Génère la Note de Synthèse Technique complète
 */
export function genererNoteSyntheseTechnique(
  entreprise: string,
  secteur: string,
  donnees: DonneesEnergetiques,
  equipements?: string[]
): NoteSyntheseTechnique {
  const eligibiliteMathematique = calculerEligibiliteMathematique(donnees);
  
  // Détermination des équipements analysés par défaut selon le secteur
  const equipementsAnalyses = equipements || getEquipementsParSecteur(secteur);
  
  // Génération des points faibles détectés
  const pointsFaibles = genererPointsFaibles(eligibiliteMathematique);
  
  // Génération des recommandations
  const recommandations = genererRecommandations(eligibiliteMathematique, secteur);
  
  // Détermination de la fiche CEE applicable
  const ficheCEE = determinerFicheCEE(eligibiliteMathematique, secteur);
  
  return {
    entreprise,
    secteur,
    dateAnalyse: new Date().toISOString(),
    eligibiliteMathematique,
    diagnosticTechnique: {
      equipementsAnalyses,
      pointsFaibles,
      recommandations,
    },
    ficheCEE,
  };
}

/**
 * Retourne les équipements typiques par secteur
 */
function getEquipementsParSecteur(secteur: string): string[] {
  const equipementsSecteur: Record<string, string[]> = {
    'Métallurgie': ['Fours à induction', 'Compresseurs', 'Ponts roulants', 'Ventilation industrielle'],
    'Verrerie': ['Fours de fusion', 'Compresseurs d\'air', 'Systèmes de refroidissement', 'Éclairage'],
    'Plasturgie': ['Presses à injection', 'Broyeurs', 'Refroidisseurs', 'Sécheurs'],
    'Fonderie': ['Fours de fusion', 'Machines de moulage', 'Systèmes de sablage', 'Ventilation'],
    'Textile': ['Métiers à tisser', 'Machines de teinture', 'Séchoirs', 'Climatisation'],
    'Agroalimentaire': ['Chambres froides', 'Lignes de production', 'Stérilisateurs', 'Compresseurs'],
  };
  
  return equipementsSecteur[secteur] || ['Moteurs électriques', 'Compresseurs', 'Éclairage', 'Ventilation'];
}

/**
 * Génère les points faibles détectés
 */
function genererPointsFaibles(eligibilite: EligibiliteMathematique): string[] {
  const pointsFaibles: string[] = [];
  
  if (eligibilite.facteurPuissanceCalcule < 0.85) {
    pointsFaibles.push(`Facteur de puissance très dégradé (${eligibilite.facteurPuissanceCalcule})`);
  } else if (eligibilite.facteurPuissanceCalcule < 0.92) {
    pointsFaibles.push(`Facteur de puissance insuffisant (${eligibilite.facteurPuissanceCalcule})`);
  }
  
  if (eligibilite.ratioPerteReactive >= 15) {
    pointsFaibles.push(`Pertes réactives critiques (${eligibilite.ratioPerteReactive}%)`);
  } else if (eligibilite.ratioPerteReactive >= 10) {
    pointsFaibles.push(`Pertes réactives élevées (${eligibilite.ratioPerteReactive}%)`);
  }
  
  if (eligibilite.puissanceReactiveACompenser > 50) {
    pointsFaibles.push(`${eligibilite.puissanceReactiveACompenser} kVAR de compensation nécessaire`);
  }
  
  return pointsFaibles;
}

/**
 * Génère les recommandations techniques
 */
function genererRecommandations(
  eligibilite: EligibiliteMathematique,
  secteur: string
): string[] {
  const recommandations: string[] = [];
  
  if (eligibilite.puissanceReactiveACompenser > 0) {
    recommandations.push(
      `Installation d'une batterie de condensateurs de ${eligibilite.puissanceReactiveACompenser} kVAR`
    );
  }
  
  if (eligibilite.ratioPerteReactive >= 10) {
    recommandations.push('Audit détaillé des équipements énergivores');
    recommandations.push('Installation de variateurs de vitesse sur les moteurs');
  }
  
  if (eligibilite.facteurPuissanceCalcule < 0.90) {
    recommandations.push('Mise en place d\'une régulation automatique du cos φ');
  }
  
  if (eligibilite.gisementTechnique > 10000) {
    recommandations.push('Programme de maintenance préventive renforcé');
  }
  
  return recommandations;
}

/**
 * Détermine la fiche CEE applicable
 */
function determinerFicheCEE(
  eligibilite: EligibiliteMathematique,
  secteur: string
): NoteSyntheseTechnique['ficheCEE'] {
  if (!eligibilite.eligible) return null;
  
  // Sélection basée sur le type d'intervention principale
  if (eligibilite.puissanceReactiveACompenser > 20) {
    return {
      code: 'IND-UT-102',
      nom: 'Système de variation électronique de vitesse',
      montantEstime: Math.round(eligibilite.economiesPotentielles * 0.4),
    };
  }
  
  if (eligibilite.ratioPerteReactive >= 10) {
    return {
      code: 'IND-UT-117',
      nom: 'Moteur premium à haut rendement (IE4)',
      montantEstime: Math.round(eligibilite.economiesPotentielles * 0.35),
    };
  }
  
  return {
    code: 'IND-EN-101',
    nom: 'Audit énergétique industriel',
    montantEstime: Math.round(eligibilite.economiesPotentielles * 0.25),
  };
}

/**
 * Formate la note de synthèse en texte lisible
 */
export function formaterNoteSynthese(note: NoteSyntheseTechnique): string {
  const { eligibiliteMathematique: em, diagnosticTechnique: dt, ficheCEE } = note;
  
  let texte = `
═══════════════════════════════════════════════════════════════
        NOTE DE SYNTHÈSE TECHNIQUE - ${note.entreprise.toUpperCase()}
═══════════════════════════════════════════════════════════════

📅 Date d'analyse : ${new Date(note.dateAnalyse).toLocaleDateString('fr-FR')}
🏭 Secteur : ${note.secteur}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOC 1 : ÉLIGIBILITÉ MATHÉMATIQUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 RATIO DE PERTE RÉACTIVE : ${em.ratioPerteReactive}%
   (Énergie réactive / Consommation totale)

⚡ FACTEUR DE PUISSANCE (cos φ)
   • Actuel : ${em.facteurPuissanceCalcule}
   • Cible : ${em.facteurPuissanceCible}
   • Compensation nécessaire : ${em.puissanceReactiveACompenser} kVAR

🎯 GISEMENT TECHNIQUE DÉTECTÉ : ${em.gisementTechnique.toLocaleString('fr-FR')} kWh/an
   ${em.justification}

💰 ÉCONOMIES POTENTIELLES : ${em.economiesPotentielles.toLocaleString('fr-FR')} €/an

📈 SCORE D'ÉLIGIBILITÉ : ${em.scoreEligibilite}/100
   Statut : ${em.eligible ? '✅ ÉLIGIBLE AUX DISPOSITIFS CEE' : '❌ Non éligible'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOC 2 : DIAGNOSTIC TECHNIQUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 Équipements analysés :
${dt.equipementsAnalyses.map(e => `   • ${e}`).join('\n')}

⚠️ Points faibles détectés :
${dt.pointsFaibles.length > 0 ? dt.pointsFaibles.map(p => `   • ${p}`).join('\n') : '   Aucun point critique détecté'}

✅ Recommandations :
${dt.recommandations.map(r => `   • ${r}`).join('\n')}
`;

  if (ficheCEE) {
    texte += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOC 3 : FICHE CEE APPLICABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Code : ${ficheCEE.code}
📝 Opération : ${ficheCEE.nom}
💶 Montant estimé : ${ficheCEE.montantEstime.toLocaleString('fr-FR')} €
`;
  }

  texte += `
═══════════════════════════════════════════════════════════════
         © ${new Date().getFullYear()} CAPITAL ÉNERGIE - Analyse IA
═══════════════════════════════════════════════════════════════
`;

  return texte;
}
