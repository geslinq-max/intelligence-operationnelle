/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * COMPLIANCE REPOSITORY - Données Réglementaires CEE
 * Capital Énergie - Source unique de vérité pour conformité légale
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Ce fichier centralise TOUTES les données réglementaires.
 * En cas de changement législatif, modifier UNIQUEMENT ce fichier.
 */

export interface CEEFiche {
  code: string;
  nom: string;
  description: string;
  secteur: 'IND' | 'BAT' | 'TRA' | 'AGRI' | 'RES';
  
  // Références légales
  arrete: {
    reference: string;
    date: string;
    lien?: string;
  };
  
  // Mention légale obligatoire
  mentionLegale: string;
  
  // Seuils techniques minimums
  seuilsTechniques: {
    puissanceMinKW?: number;
    puissanceMaxKW?: number;
    rendementMin?: number;
    dureeVieAns?: number;
    [key: string]: number | string | undefined;
  };
  
  // Formule de calcul kWh cumac
  formuleCumac: string;
  coefficients: {
    [key: string]: number;
  };
  
  // Versioning
  version: string;
  lastUpdated: string;
  isActive: boolean;
  
  // Historique des modifications
  changelog?: Array<{
    date: string;
    modification: string;
  }>;
}

export interface ComplianceConfig {
  mentionGenerale: string;
  validiteDossierJours: number;
  tauxTVA: number;
  prixMWhCumac: number;
}

/**
 * Configuration générale de conformité
 */
export const COMPLIANCE_CONFIG: ComplianceConfig = {
  mentionGenerale: "Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.",
  validiteDossierJours: 30,
  tauxTVA: 20,
  prixMWhCumac: 9.50, // €/MWh cumac - cours moyen 2026
};

/**
 * Registre central des fiches CEE
 */
export const CEE_REGISTRY: Record<string, CEEFiche> = {
  'IND-UT-102': {
    code: 'IND-UT-102',
    nom: 'Système de variation électronique de vitesse sur un moteur asynchrone',
    description: 'Installation d\'un variateur électronique de vitesse (VEV) sur un moteur asynchrone existant ou neuf.',
    secteur: 'IND',
    
    arrete: {
      reference: 'Arrêté du 22 décembre 2025',
      date: '2025-12-22',
      lien: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000050853882',
    },
    
    mentionLegale: "Opération standardisée conforme à la fiche IND-UT-102 selon l'arrêté du 22 décembre 2025 relatif aux opérations standardisées d'économies d'énergie.",
    
    seuilsTechniques: {
      puissanceMinKW: 0.1,
      puissanceMaxKW: 3000,
      rendementMin: 0.97,
      dureeVieAns: 15,
      classeRendementIE: 'IE3',
    },
    
    formuleCumac: 'kWh cumac = P × H × C × FE',
    coefficients: {
      facteurEnergie: 0.30, // Économie moyenne de 30%
      dureeVieConventionnelle: 15,
      coefficientClimatique: 1.0,
    },
    
    version: '2026.1',
    lastUpdated: '2026-01-01',
    isActive: true,
    
    changelog: [
      { date: '2026-01-01', modification: 'Mise à jour selon arrêté du 22/12/2025' },
      { date: '2025-01-01', modification: 'Version initiale' },
    ],
  },
  
  'IND-UT-117': {
    code: 'IND-UT-117',
    nom: 'Système de récupération de chaleur sur un groupe de production de froid',
    description: 'Installation d\'un système de récupération de chaleur sur un groupe frigorifique.',
    secteur: 'IND',
    
    arrete: {
      reference: 'Arrêté du 22 décembre 2025',
      date: '2025-12-22',
    },
    
    mentionLegale: "Opération standardisée conforme à la fiche IND-UT-117 selon l'arrêté du 22 décembre 2025.",
    
    seuilsTechniques: {
      puissanceMinKW: 5,
      rendementRecuperation: 0.75,
      dureeVieAns: 15,
    },
    
    formuleCumac: 'kWh cumac = Qrec × H × FE',
    coefficients: {
      facteurEnergie: 0.75,
      dureeVieConventionnelle: 15,
    },
    
    version: '2026.1',
    lastUpdated: '2026-01-01',
    isActive: true,
  },
  
  'BAT-TH-116': {
    code: 'BAT-TH-116',
    nom: 'Plancher chauffant hydraulique à basse température',
    description: 'Installation d\'un plancher chauffant hydraulique basse température dans un bâtiment tertiaire.',
    secteur: 'BAT',
    
    arrete: {
      reference: 'Arrêté du 22 décembre 2025',
      date: '2025-12-22',
    },
    
    mentionLegale: "Opération standardisée conforme à la fiche BAT-TH-116 selon l'arrêté du 22 décembre 2025.",
    
    seuilsTechniques: {
      temperatureMaxEau: 45,
      surfaceMinM2: 10,
      dureeVieAns: 30,
    },
    
    formuleCumac: 'kWh cumac = S × C × FE',
    coefficients: {
      facteurEnergie: 0.25,
      dureeVieConventionnelle: 30,
    },
    
    version: '2026.1',
    lastUpdated: '2026-01-01',
    isActive: true,
  },
  
  'BAT-EN-101': {
    code: 'BAT-EN-101',
    nom: 'Isolation de combles ou de toitures',
    description: 'Mise en place d\'une isolation thermique en comble perdu ou en rampant de toiture.',
    secteur: 'BAT',
    
    arrete: {
      reference: 'Arrêté du 22 décembre 2025',
      date: '2025-12-22',
    },
    
    mentionLegale: "Opération standardisée conforme à la fiche BAT-EN-101 selon l'arrêté du 22 décembre 2025.",
    
    seuilsTechniques: {
      resistanceThermique: 7,
      surfaceMinM2: 1,
      dureeVieAns: 30,
    },
    
    formuleCumac: 'kWh cumac = S × R × Cef × FE',
    coefficients: {
      facteurEnergie: 1.0,
      dureeVieConventionnelle: 30,
    },
    
    version: '2026.1',
    lastUpdated: '2026-01-01',
    isActive: true,
  },
};

/**
 * Récupère une fiche CEE par son code
 */
export function getFicheCEE(code: string): CEEFiche | null {
  return CEE_REGISTRY[code] || null;
}

/**
 * Récupère toutes les fiches actives
 */
export function getActiveFiches(): CEEFiche[] {
  return Object.values(CEE_REGISTRY).filter(fiche => fiche.isActive);
}

/**
 * Récupère les fiches par secteur
 */
export function getFichesBySecteur(secteur: CEEFiche['secteur']): CEEFiche[] {
  return Object.values(CEE_REGISTRY).filter(
    fiche => fiche.secteur === secteur && fiche.isActive
  );
}

/**
 * Génère la mention légale complète pour un dossier
 */
export function genererMentionLegale(ficheCEE: string): string {
  const fiche = getFicheCEE(ficheCEE);
  if (!fiche) {
    return COMPLIANCE_CONFIG.mentionGenerale;
  }
  
  return `${fiche.mentionLegale}\n${COMPLIANCE_CONFIG.mentionGenerale}`;
}

/**
 * Récupère la référence de l'arrêté pour une fiche
 */
export function getArreteReference(ficheCEE: string): string {
  const fiche = getFicheCEE(ficheCEE);
  return fiche?.arrete.reference || 'Arrêté en vigueur';
}

/**
 * Calcule la date de validité d'un dossier
 */
export function calculerDateValidite(dateGeneration: Date = new Date()): Date {
  const validite = new Date(dateGeneration);
  validite.setDate(validite.getDate() + COMPLIANCE_CONFIG.validiteDossierJours);
  return validite;
}

/**
 * Formate une date en français
 */
export function formatDateFR(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Génère le texte légal obligatoire pour un devis artisan
 * Ce texte doit être copié sur le devis pour garantir la conformité CEE
 */
export function genererTexteLegalDevis(params: {
  ficheCEE: string;
  puissanceKW: number;
  kWhCumac: number;
  entreprise?: string;
}): string {
  const { ficheCEE, puissanceKW, kWhCumac, entreprise } = params;
  const fiche = getFicheCEE(ficheCEE);
  
  if (!fiche) {
    return `Travaux d'économies d'énergie - Puissance : ${puissanceKW} kW - Économies estimées : ${kWhCumac.toLocaleString('fr-FR')} kWh cumac.`;
  }

  const texte = `MENTIONS OBLIGATOIRES CEE

Travaux relevant de la fiche d'opération standardisée ${fiche.code} (${fiche.arrete.reference}).

${fiche.nom}.

Caractéristiques techniques :
• Puissance installée : ${puissanceKW} kW
• Économies d'énergie estimées : ${kWhCumac.toLocaleString('fr-FR')} kWh cumac
• Durée de vie conventionnelle : ${fiche.seuilsTechniques.dureeVieAns || 15} ans

${entreprise ? `Client : ${entreprise}` : ''}

Le professionnel s'engage à respecter les conditions d'éligibilité définies par la fiche ${fiche.code} et à fournir les justificatifs requis pour l'obtention des Certificats d'Économies d'Énergie.`;

  return texte.trim();
}

/**
 * Génère le texte légal en HTML pour copie riche (emails)
 */
export function genererTexteLegalHTML(params: {
  ficheCEE: string;
  puissanceKW: number;
  kWhCumac: number;
  entreprise?: string;
}): string {
  const { ficheCEE, puissanceKW, kWhCumac, entreprise } = params;
  const fiche = getFicheCEE(ficheCEE);
  
  if (!fiche) {
    return `<p>Travaux d'économies d'énergie - Puissance : ${puissanceKW} kW</p>`;
  }

  return `
<div style="font-family: Arial, sans-serif; padding: 16px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
  <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 14px;">📋 MENTIONS OBLIGATOIRES CEE</h3>
  
  <p style="margin: 0 0 8px 0; color: #1e293b; font-size: 13px;">
    Travaux relevant de la fiche d'opération standardisée <strong>${fiche.code}</strong> (${fiche.arrete.reference}).
  </p>
  
  <p style="margin: 0 0 12px 0; color: #475569; font-size: 12px; font-style: italic;">
    ${fiche.nom}
  </p>
  
  <p style="margin: 0 0 4px 0; color: #1e293b; font-size: 13px;"><strong>Caractéristiques techniques :</strong></p>
  <ul style="margin: 0 0 12px 0; padding-left: 20px; color: #334155; font-size: 12px;">
    <li>Puissance installée : <strong>${puissanceKW} kW</strong></li>
    <li>Économies d'énergie estimées : <strong>${kWhCumac.toLocaleString('fr-FR')} kWh cumac</strong></li>
    <li>Durée de vie conventionnelle : ${fiche.seuilsTechniques.dureeVieAns || 15} ans</li>
  </ul>
  
  ${entreprise ? `<p style="margin: 0 0 8px 0; color: #1e293b; font-size: 12px;">Client : <strong>${entreprise}</strong></p>` : ''}
  
  <p style="margin: 0; color: #64748b; font-size: 11px; border-top: 1px solid #cbd5e1; padding-top: 8px;">
    Le professionnel s'engage à respecter les conditions d'éligibilité définies par la fiche ${fiche.code}.
  </p>
</div>
  `.trim();
}
