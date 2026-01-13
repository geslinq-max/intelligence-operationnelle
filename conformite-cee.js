/**
 * ============================================================================
 * CAPITAL ÉNERGIE - SERVICE DE CONTRÔLE CONFORMITÉ CEE
 * ============================================================================
 * Script de vérification automatisée de la conformité des dossiers CEE
 * 
 * Usage :
 *   node conformite-cee.js verifier <fichier.json>
 *   node conformite-cee.js regles BAR-TH-104
 *   node conformite-cee.js test
 * 
 * Intégration avec lecteur-devis.js :
 *   const { verifierDossier } = require('./conformite-cee');
 *   const resultat = verifierDossier(donneesDevis);
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// STATUTS DE CONTRÔLE
// ============================================================================

const STATUTS = {
  CONFORME: { code: 'CONFORME', emoji: '✅', label: 'Conforme', poids: 0 },
  ALERTE: { code: 'ALERTE', emoji: '⚠️', label: 'Alerte', poids: 10 },
  BLOQUANT: { code: 'BLOQUANT', emoji: '❌', label: 'Bloquant', poids: 30 },
  NON_VERIFIE: { code: 'NON_VERIFIE', emoji: '❓', label: 'Non vérifié', poids: 5 },
};

// ============================================================================
// BASE DE CONNAISSANCES - RÈGLES D'OR CEE
// ============================================================================

const REGLES_CEE = {
  // =========================================================================
  // BAR-TH-104 : Pompe à chaleur de type air/eau ou eau/eau
  // =========================================================================
  'BAR-TH-104': {
    code: 'BAR-TH-104',
    nom: 'Pompe à chaleur de type air/eau ou eau/eau',
    secteur: 'Résidentiel',
    categorie: 'Thermique',
    description: 'Installation d\'une PAC air/eau ou eau/eau pour le chauffage ou chauffage + ECS',
    
    // Critères techniques obligatoires
    criteresTechniques: {
      efficaciteEnergetique: {
        description: 'Efficacité énergétique saisonnière (ηs) ≥ 111%',
        seuilMin: 111,
        unite: '%',
        obligatoire: true,
      },
      cop: {
        description: 'COP ≥ 3.4 (conditions A7/W35)',
        seuilMin: 3.4,
        unite: '',
        obligatoire: false,
      },
      puissanceMax: {
        description: 'Puissance thermique nominale ≤ 400 kW',
        seuilMax: 400,
        unite: 'kW',
        obligatoire: true,
      },
    },
    
    // Documents obligatoires
    documentsObligatoires: [
      'Devis détaillé signé',
      'Facture avec mentions obligatoires',
      'Attestation sur l\'honneur',
      'Fiche technique du matériel',
      'Justificatif RGE de l\'installateur',
    ],
    
    // Mentions obligatoires sur devis/facture
    mentionsObligatoires: [
      { id: 'fiche_operation', pattern: /BAR-TH-104/i, description: 'Mention de la fiche BAR-TH-104' },
      { id: 'siret_installateur', pattern: /siret\s*[:\s]*\d{14}/i, description: 'SIRET de l\'installateur' },
      { id: 'rge', pattern: /rge|qualipac|qualifelec/i, description: 'Mention qualification RGE' },
      { id: 'marque_modele', pattern: /.+/, description: 'Marque et modèle du matériel', champ: 'materiel.marque' },
      { id: 'puissance', pattern: /\d+\s*kw/i, description: 'Puissance nominale en kW' },
    ],
    
    // Règles métier spécifiques
    reglesMetier: [
      {
        id: 'puissance_coherente',
        description: 'Puissance entre 5 et 25 kW pour résidentiel individuel',
        verification: (donnees) => {
          const puissance = donnees.travaux?.puissance;
          if (!puissance) return { status: 'NON_VERIFIE', message: 'Puissance non renseignée' };
          if (puissance >= 5 && puissance <= 25) return { status: 'CONFORME', message: `Puissance ${puissance} kW cohérente` };
          if (puissance > 25 && puissance <= 50) return { status: 'ALERTE', message: `Puissance ${puissance} kW élevée pour résidentiel` };
          return { status: 'BLOQUANT', message: `Puissance ${puissance} kW hors plage résidentielle` };
        },
      },
      {
        id: 'montant_coherent',
        description: 'Montant TTC cohérent avec le marché (8 000 € - 25 000 €)',
        verification: (donnees) => {
          const montant = donnees.montants?.totalTTC;
          if (!montant) return { status: 'NON_VERIFIE', message: 'Montant TTC non renseigné' };
          if (montant >= 8000 && montant <= 25000) return { status: 'CONFORME', message: `Montant ${montant} € dans la fourchette marché` };
          if (montant >= 5000 && montant < 8000) return { status: 'ALERTE', message: `Montant ${montant} € inférieur à la moyenne` };
          if (montant > 25000 && montant <= 35000) return { status: 'ALERTE', message: `Montant ${montant} € supérieur à la moyenne` };
          return { status: 'BLOQUANT', message: `Montant ${montant} € anormal` };
        },
      },
    ],
    
    // Calcul prime CEE
    calculPrime: {
      baseKWhCumac: 12500, // par kW installé
      prixMWhCumac: 9.50,
      formule: 'puissance_kW × 12500 × 9.50 / 1000',
    },
  },

  // =========================================================================
  // BAR-TH-106 : Chaudière individuelle à haute performance énergétique
  // =========================================================================
  'BAR-TH-106': {
    code: 'BAR-TH-106',
    nom: 'Chaudière individuelle à haute performance énergétique',
    secteur: 'Résidentiel',
    categorie: 'Thermique',
    description: 'Installation d\'une chaudière individuelle HPE',
    
    criteresTechniques: {
      efficaciteEnergetique: {
        description: 'Efficacité énergétique saisonnière (ηs) ≥ 90%',
        seuilMin: 90,
        unite: '%',
        obligatoire: true,
      },
    },
    
    mentionsObligatoires: [
      { id: 'fiche_operation', pattern: /BAR-TH-106/i, description: 'Mention de la fiche BAR-TH-106' },
      { id: 'siret_installateur', pattern: /siret\s*[:\s]*\d{14}/i, description: 'SIRET de l\'installateur' },
      { id: 'rge', pattern: /rge|qualigaz/i, description: 'Mention qualification RGE' },
    ],
    
    reglesMetier: [
      {
        id: 'montant_coherent',
        description: 'Montant TTC cohérent (3 000 € - 8 000 €)',
        verification: (donnees) => {
          const montant = donnees.montants?.totalTTC;
          if (!montant) return { status: 'NON_VERIFIE', message: 'Montant TTC non renseigné' };
          if (montant >= 3000 && montant <= 8000) return { status: 'CONFORME', message: `Montant ${montant} € cohérent` };
          return { status: 'ALERTE', message: `Montant ${montant} € à vérifier` };
        },
      },
    ],
  },

  // =========================================================================
  // BAR-EN-101 : Isolation de combles ou de toitures
  // =========================================================================
  'BAR-EN-101': {
    code: 'BAR-EN-101',
    nom: 'Isolation de combles ou de toitures',
    secteur: 'Résidentiel',
    categorie: 'Enveloppe',
    description: 'Isolation thermique de combles perdus ou aménagés',
    
    criteresTechniques: {
      resistanceThermique: {
        description: 'Résistance thermique R ≥ 7 m².K/W (combles perdus)',
        seuilMin: 7,
        unite: 'm².K/W',
        obligatoire: true,
      },
    },
    
    mentionsObligatoires: [
      { id: 'fiche_operation', pattern: /BAR-EN-101/i, description: 'Mention de la fiche BAR-EN-101' },
      { id: 'surface', pattern: /\d+\s*m[²2]/i, description: 'Surface isolée en m²' },
      { id: 'rge', pattern: /rge|qualibat/i, description: 'Mention qualification RGE' },
    ],
    
    reglesMetier: [
      {
        id: 'surface_coherente',
        description: 'Surface entre 20 et 200 m² pour résidentiel',
        verification: (donnees) => {
          const surface = donnees.travaux?.surface;
          if (!surface) return { status: 'NON_VERIFIE', message: 'Surface non renseignée' };
          if (surface >= 20 && surface <= 200) return { status: 'CONFORME', message: `Surface ${surface} m² cohérente` };
          return { status: 'ALERTE', message: `Surface ${surface} m² à vérifier` };
        },
      },
    ],
  },
};

// ============================================================================
// CONTRÔLES GÉNÉRIQUES (applicables à tous les dossiers)
// ============================================================================

const CONTROLES_GENERIQUES = [
  {
    id: 'presence_ficheCEE',
    categorie: 'Document',
    description: 'Présence d\'une fiche CEE identifiée',
    poids: 20,
    verification: (donnees) => {
      const fiches = donnees.travaux?.fichesCEE || [];
      if (fiches.length > 0) {
        return { status: 'CONFORME', message: `Fiche(s) CEE détectée(s): ${fiches.join(', ')}` };
      }
      return { status: 'BLOQUANT', message: 'Aucune fiche CEE détectée sur le devis' };
    },
  },
  {
    id: 'presence_montantTTC',
    categorie: 'Financier',
    description: 'Montant TTC présent',
    poids: 15,
    verification: (donnees) => {
      if (donnees.montants?.totalTTC && donnees.montants.totalTTC > 0) {
        return { status: 'CONFORME', message: `Montant TTC: ${donnees.montants.totalTTC.toFixed(2)} €` };
      }
      return { status: 'BLOQUANT', message: 'Montant TTC manquant ou invalide' };
    },
  },
  {
    id: 'presence_siret',
    categorie: 'Administratif',
    description: 'SIRET de l\'installateur présent',
    poids: 15,
    verification: (donnees) => {
      const siret = donnees.entreprise?.siret;
      if (siret && siret.replace(/\s/g, '').length === 14) {
        return { status: 'CONFORME', message: `SIRET: ${siret}` };
      }
      if (siret) {
        return { status: 'ALERTE', message: `SIRET incomplet: ${siret}` };
      }
      return { status: 'BLOQUANT', message: 'SIRET de l\'artisan manquant sur le devis' };
    },
  },
  {
    id: 'presence_rge',
    categorie: 'Qualification',
    description: 'Mention RGE présente',
    poids: 15,
    verification: (donnees) => {
      const rge = donnees.entreprise?.rge;
      if (rge && rge.length > 0) {
        return { status: 'CONFORME', message: `Qualification: ${rge}` };
      }
      return { status: 'BLOQUANT', message: 'Mention RGE absente du devis' };
    },
  },
  {
    id: 'presence_materiel',
    categorie: 'Technique',
    description: 'Référence matériel identifiée',
    poids: 10,
    verification: (donnees) => {
      const ref = donnees.materiel?.reference;
      const marque = donnees.materiel?.marque;
      if (ref && marque) {
        return { status: 'CONFORME', message: `Matériel: ${marque} - ${ref}` };
      }
      if (marque) {
        return { status: 'ALERTE', message: `Marque détectée (${marque}) mais référence manquante` };
      }
      return { status: 'ALERTE', message: 'Référence matériel non détectée' };
    },
  },
  {
    id: 'presence_client',
    categorie: 'Bénéficiaire',
    description: 'Coordonnées client présentes',
    poids: 10,
    verification: (donnees) => {
      const email = donnees.client?.email;
      const tel = donnees.client?.telephone;
      if (email || tel) {
        return { status: 'CONFORME', message: `Contact: ${email || tel}` };
      }
      return { status: 'ALERTE', message: 'Coordonnées client incomplètes' };
    },
  },
  {
    id: 'coherence_tva',
    categorie: 'Financier',
    description: 'Taux TVA cohérent (5.5% ou 10% pour travaux énergie)',
    poids: 5,
    verification: (donnees) => {
      const ht = donnees.montants?.totalHT;
      const ttc = donnees.montants?.totalTTC;
      if (!ht || !ttc) return { status: 'NON_VERIFIE', message: 'Calcul TVA impossible' };
      
      const tauxTVA = ((ttc - ht) / ht) * 100;
      if (tauxTVA >= 5 && tauxTVA <= 6) {
        return { status: 'CONFORME', message: `TVA réduite 5.5% appliquée` };
      }
      if (tauxTVA >= 9 && tauxTVA <= 11) {
        return { status: 'CONFORME', message: `TVA intermédiaire 10% appliquée` };
      }
      if (tauxTVA >= 19 && tauxTVA <= 21) {
        return { status: 'ALERTE', message: `TVA 20% - Vérifier éligibilité taux réduit` };
      }
      return { status: 'ALERTE', message: `Taux TVA inhabituel: ${tauxTVA.toFixed(1)}%` };
    },
  },
];

// ============================================================================
// FONCTION PRINCIPALE : VÉRIFIER DOSSIER
// ============================================================================

/**
 * Vérifie la conformité d'un dossier CEE
 * @param {Object} donnees - Données extraites par lecteur-devis.js
 * @returns {Object} Résultat de la vérification avec indice de sécurité
 */
function verifierDossier(donnees) {
  const resultat = {
    dateVerification: new Date().toISOString(),
    fichier: donnees.fichier?.nom || 'inconnu',
    fichesCEE: donnees.travaux?.fichesCEE || [],
    controles: [],
    resume: {
      conformes: 0,
      alertes: 0,
      bloquants: 0,
      nonVerifies: 0,
    },
    indiceSécurite: 0,
    decision: '',
    recommandations: [],
  };

  // 1. Exécuter les contrôles génériques
  CONTROLES_GENERIQUES.forEach(controle => {
    const verification = controle.verification(donnees);
    resultat.controles.push({
      id: controle.id,
      categorie: controle.categorie,
      description: controle.description,
      poids: controle.poids,
      ...verification,
      statut: STATUTS[verification.status],
    });
  });

  // 2. Exécuter les contrôles spécifiques à la fiche CEE
  const fichesCEE = donnees.travaux?.fichesCEE || [];
  fichesCEE.forEach(ficheCode => {
    const fiche = REGLES_CEE[ficheCode];
    if (fiche && fiche.reglesMetier) {
      fiche.reglesMetier.forEach(regle => {
        const verification = regle.verification(donnees);
        resultat.controles.push({
          id: `${ficheCode}_${regle.id}`,
          categorie: 'Fiche CEE',
          description: `[${ficheCode}] ${regle.description}`,
          poids: 10,
          ...verification,
          statut: STATUTS[verification.status],
        });
      });
    }
  });

  // 3. Calculer le résumé
  resultat.controles.forEach(c => {
    switch (c.status) {
      case 'CONFORME': resultat.resume.conformes++; break;
      case 'ALERTE': resultat.resume.alertes++; break;
      case 'BLOQUANT': resultat.resume.bloquants++; break;
      case 'NON_VERIFIE': resultat.resume.nonVerifies++; break;
    }
  });

  // 4. Calculer l'indice de sécurité (0-100%)
  const totalPoids = resultat.controles.reduce((sum, c) => sum + c.poids, 0);
  const poidsPerdu = resultat.controles.reduce((sum, c) => {
    return sum + (c.statut.poids * c.poids / 30);
  }, 0);
  
  resultat.indiceSécurite = Math.max(0, Math.round(100 - (poidsPerdu / totalPoids) * 100));

  // 5. Décision automatique
  if (resultat.resume.bloquants > 0) {
    resultat.decision = 'REJETÉ';
    resultat.recommandations.push('Corriger les points bloquants avant soumission');
  } else if (resultat.resume.alertes > 2) {
    resultat.decision = 'RÉVISION';
    resultat.recommandations.push('Vérification manuelle recommandée');
  } else if (resultat.indiceSécurite >= 80) {
    resultat.decision = 'ACCEPTÉ';
    resultat.recommandations.push('Dossier éligible à la prime CEE');
  } else {
    resultat.decision = 'RÉVISION';
    resultat.recommandations.push('Compléter les informations manquantes');
  }

  // 6. Générer les recommandations spécifiques
  resultat.controles.filter(c => c.status !== 'CONFORME').forEach(c => {
    if (!resultat.recommandations.includes(c.message)) {
      resultat.recommandations.push(c.message);
    }
  });

  return resultat;
}

// ============================================================================
// AFFICHAGE DES RÉSULTATS
// ============================================================================

function afficherResultat(resultat) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  🔍 RAPPORT DE CONFORMITÉ CEE');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Fichier analysé
  console.log(`  📄 Fichier : ${resultat.fichier}`);
  console.log(`  📋 Fiche(s) CEE : ${resultat.fichesCEE.length > 0 ? resultat.fichesCEE.join(', ') : 'Non détectée'}`);
  console.log(`  📅 Date : ${new Date(resultat.dateVerification).toLocaleString('fr-FR')}\n`);
  
  // Indice de sécurité
  const indiceCouleur = resultat.indiceSécurite >= 80 ? '✅' : 
                        resultat.indiceSécurite >= 50 ? '⚠️' : '❌';
  console.log(`  ${indiceCouleur} INDICE DE SÉCURITÉ : ${resultat.indiceSécurite}%`);
  console.log(`  📊 Décision : ${resultat.decision}\n`);
  
  // Résumé
  console.log('  ─────────────────────────────────────────────────────────');
  console.log(`  ✅ Conformes  : ${resultat.resume.conformes}`);
  console.log(`  ⚠️  Alertes    : ${resultat.resume.alertes}`);
  console.log(`  ❌ Bloquants  : ${resultat.resume.bloquants}`);
  console.log(`  ❓ Non vérif. : ${resultat.resume.nonVerifies}`);
  console.log('  ─────────────────────────────────────────────────────────\n');
  
  // Détail des contrôles
  console.log('  📋 DÉTAIL DES CONTRÔLES :\n');
  
  resultat.controles.forEach(c => {
    console.log(`  ${c.statut.emoji} [${c.categorie}] ${c.description}`);
    console.log(`     → ${c.message}\n`);
  });
  
  // Recommandations
  if (resultat.recommandations.length > 0) {
    console.log('  ─────────────────────────────────────────────────────────');
    console.log('  💡 RECOMMANDATIONS :\n');
    resultat.recommandations.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r}`);
    });
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

/**
 * Affiche les règles d'une fiche CEE
 */
function afficherRegles(codeFiche) {
  const fiche = REGLES_CEE[codeFiche];
  
  if (!fiche) {
    console.log(`\n❌ Fiche ${codeFiche} non trouvée dans la base de connaissances.\n`);
    console.log('Fiches disponibles :');
    Object.keys(REGLES_CEE).forEach(code => {
      console.log(`  - ${code}: ${REGLES_CEE[code].nom}`);
    });
    return;
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  📖 RÈGLES D'OR - ${fiche.code}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log(`  📋 ${fiche.nom}`);
  console.log(`  🏠 Secteur : ${fiche.secteur}`);
  console.log(`  📁 Catégorie : ${fiche.categorie}\n`);
  console.log(`  📝 ${fiche.description}\n`);
  
  // Critères techniques
  if (fiche.criteresTechniques) {
    console.log('  🔧 CRITÈRES TECHNIQUES :');
    Object.values(fiche.criteresTechniques).forEach(critere => {
      const seuil = critere.seuilMin ? `≥ ${critere.seuilMin}` : `≤ ${critere.seuilMax}`;
      const obligatoire = critere.obligatoire ? '(obligatoire)' : '(recommandé)';
      console.log(`     - ${critere.description} ${obligatoire}`);
    });
    console.log('');
  }
  
  // Mentions obligatoires
  if (fiche.mentionsObligatoires) {
    console.log('  📝 MENTIONS OBLIGATOIRES SUR DEVIS :');
    fiche.mentionsObligatoires.forEach(mention => {
      console.log(`     - ${mention.description}`);
    });
    console.log('');
  }
  
  // Règles métier
  if (fiche.reglesMetier) {
    console.log('  ⚖️ RÈGLES MÉTIER :');
    fiche.reglesMetier.forEach(regle => {
      console.log(`     - ${regle.description}`);
    });
    console.log('');
  }
  
  // Calcul prime
  if (fiche.calculPrime) {
    console.log('  💰 CALCUL PRIME CEE :');
    console.log(`     Formule : ${fiche.calculPrime.formule}`);
    console.log(`     Base : ${fiche.calculPrime.baseKWhCumac} kWh cumac/kW`);
    console.log(`     Prix : ${fiche.calculPrime.prixMWhCumac} €/MWh cumac`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

// ============================================================================
// INTERFACE LIGNE DE COMMANDE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const commande = args[0] || 'help';
  
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   CAPITAL ÉNERGIE - SERVICE CONFORMITÉ CEE v1.0.0         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  switch (commande) {
    case 'verifier':
    case 'verify': {
      const fichierJson = args[1];
      
      if (!fichierJson) {
        console.log('❌ Usage : node conformite-cee.js verifier <fichier.json>');
        console.log('   Le fichier JSON doit contenir les données extraites par lecteur-devis.js\n');
        break;
      }
      
      try {
        const donnees = JSON.parse(fs.readFileSync(fichierJson, 'utf8'));
        const resultat = verifierDossier(donnees);
        afficherResultat(resultat);
        
        // Export du rapport
        if (args.includes('--export')) {
          const rapportPath = fichierJson.replace('.json', '_rapport.json');
          fs.writeFileSync(rapportPath, JSON.stringify(resultat, null, 2));
          console.log(`💾 Rapport exporté : ${rapportPath}\n`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur: ${error.message}\n`);
      }
      break;
    }
    
    case 'regles':
    case 'rules': {
      const codeFiche = args[1];
      
      if (!codeFiche) {
        console.log('📚 FICHES CEE DISPONIBLES :\n');
        Object.entries(REGLES_CEE).forEach(([code, fiche]) => {
          console.log(`  ${code} - ${fiche.nom}`);
        });
        console.log('\nUsage : node conformite-cee.js regles <CODE_FICHE>\n');
        break;
      }
      
      afficherRegles(codeFiche.toUpperCase());
      break;
    }
    
    case 'test': {
      console.log('🧪 Test avec données simulées...\n');
      
      // Données de test (simulant la sortie de lecteur-devis.js)
      const donneesTest = {
        fichier: { nom: 'devis-test.pdf' },
        client: {
          nom: 'Jean Dupont',
          email: 'jean.dupont@email.fr',
          telephone: '0612345678',
          ville: 'Lyon',
          codePostal: '69002',
        },
        entreprise: {
          raisonSociale: 'Artisans du Rhône',
          siret: '12345678900012',
          rge: 'RGE QualiPAC',
        },
        travaux: {
          type: 'pompe à chaleur',
          fichesCEE: ['BAR-TH-104'],
          puissance: 10,
        },
        montants: {
          totalHT: 12670.00,
          tva: 696.85,
          totalTTC: 13366.85,
        },
        materiel: {
          reference: 'ATL-AEX-AI10',
          marque: 'Atlantic',
          modele: 'Alféa Extensa A.I. 10',
        },
      };
      
      const resultat = verifierDossier(donneesTest);
      afficherResultat(resultat);
      break;
    }
    
    case 'help':
    default: {
      console.log('📖 COMMANDES DISPONIBLES :\n');
      console.log('  verifier <fichier.json>    Vérifie la conformité d\'un dossier');
      console.log('                             Options : --export (sauvegarde rapport)');
      console.log('');
      console.log('  regles [CODE_FICHE]        Affiche les règles d\'une fiche CEE');
      console.log('                             Ex: node conformite-cee.js regles BAR-TH-104');
      console.log('');
      console.log('  test                       Lance un test avec données simulées');
      console.log('');
      console.log('  help                       Affiche cette aide');
      console.log('');
      console.log('📚 Fiches CEE dans la base :');
      Object.keys(REGLES_CEE).forEach(code => {
        console.log(`   - ${code}`);
      });
      console.log('');
    }
  }
}

// Exécution
main().catch(console.error);

// ============================================================================
// EXPORTS (pour utilisation comme module)
// ============================================================================

module.exports = {
  verifierDossier,
  afficherResultat,
  afficherRegles,
  REGLES_CEE,
  CONTROLES_GENERIQUES,
  STATUTS,
};
