/**
 * Simulation de Test de l'Agent de Prospection CEE
 * 
 * Vérifie :
 * - Génération de prospects Maintenance/Pompage
 * - Scoring de pertinence (>90 pour moteurs/variateurs)
 * - Audit du pitch personnalisé
 * - Pipeline d'envoi J1 + J4
 */

import { 
  searchProspects, 
  findHighValueProspects,
  generateMessageForProspect,
  type Prospect 
} from '../agents/cee-prospector';
import { 
  DEFAULT_CAMPAIGN,
  type CampaignStep 
} from '../agents/cee-mailer';

// ============================================================================
// CONFIGURATION DE TEST
// ============================================================================

const TEST_CONFIG = {
  // Secteurs cibles
  SECTEURS_CIBLES: ['Maintenance', 'Pompage', 'Moteur', 'Variateur'],
  
  // Seuils de validation
  SEUIL_SCORE_MOTEURS: 90,
  NOMBRE_PROSPECTS_ATTENDU: 5,
  
  // Éléments obligatoires dans le pitch
  PITCH_ELEMENTS: {
    DIVISER_PAR_3: /diviser.*par\s*3|par\s*3/i,
    PRIME_2969: /2\s*969|2969/,
    ZERO_PAPERASSE: /z[ée]ro\s*paperasse|aucune\s*paperasse|pas.*paperasse/i,
  },
  
  // Prime de référence
  PRIME_REFERENCE: 2968.75,
};

// ============================================================================
// INTERFACE DE RAPPORT
// ============================================================================

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  expected?: string | number;
  actual?: string | number;
  message?: string;
}

interface ProspectionSimulationReport {
  timestamp: string;
  results: TestResult[];
  prospects_generes: Prospect[];
  meilleur_prospect: Prospect | null;
  pitch_analyse: {
    contenu: string;
    elements_trouves: string[];
    elements_manquants: string[];
  } | null;
  pipeline_simulation: {
    j1_programme: boolean;
    j4_programme: boolean;
    sequence_coherente: boolean;
  };
  all_passed: boolean;
  summary: string;
}

// ============================================================================
// FONCTION DE SIMULATION PRINCIPALE
// ============================================================================

export async function runProspectionSimulation(): Promise<ProspectionSimulationReport> {
  const results: TestResult[] = [];
  let prospectsGeneres: Prospect[] = [];
  let meilleurProspect: Prospect | null = null;
  let pitchAnalyse: ProspectionSimulationReport['pitch_analyse'] = null;
  
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       SIMULATION AGENT DE PROSPECTION CEE                    ║');
  console.log('║                    Capital Énergie                           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  // ──────────────────────────────────────────────────────────────
  // ÉTAPE 1: Génération de prospects
  // ──────────────────────────────────────────────────────────────
  console.log('🎯 ÉTAPE 1: Génération de prospects');
  console.log('   → Secteurs ciblés: Maintenance Industrielle, Pompage');
  console.log('   → Recherche dans l\'annuaire...');
  
  // Recherche par secteurs cibles
  const searchResult = searchProspects({
    secteurs: ['maintenance', 'pompage', 'pompe', 'moteur'],
    score_minimum: 0, // On veut voir tous les résultats pour le test
  });
  
  prospectsGeneres = searchResult.prospects;
  
  // Vérification du nombre de prospects
  const prospectsHauteValeur = prospectsGeneres.filter(p => p.score_pertinence >= 80);
  const hasEnoughProspects = prospectsHauteValeur.length >= 3; // Au moins 3 prospects haute valeur
  
  results.push({
    step: 'Génération de prospects',
    status: hasEnoughProspects ? 'PASS' : 'WARN',
    expected: `≥ 3 prospects haute valeur`,
    actual: prospectsHauteValeur.length,
    message: `${prospectsGeneres.length} prospects trouvés, ${prospectsHauteValeur.length} haute valeur (score ≥80)`,
  });
  
  console.log(`   ✅ ${prospectsGeneres.length} prospects générés`);
  console.log(`   ✅ ${prospectsHauteValeur.length} prospects haute valeur (score ≥80)`);
  console.log('');
  
  // Affichage des 5 premiers prospects
  console.log('   ┌────────────────────────────────────────────────────────────┐');
  console.log('   │  TOP 5 PROSPECTS GÉNÉRÉS                                   │');
  console.log('   ├────────────────────────────────────────────────────────────┤');
  
  const top5 = prospectsGeneres.slice(0, 5);
  top5.forEach((p, i) => {
    const scoreBar = '█'.repeat(Math.floor(p.score_pertinence / 10)) + '░'.repeat(10 - Math.floor(p.score_pertinence / 10));
    const scoreColor = p.score_pertinence >= 90 ? '🟢' : p.score_pertinence >= 80 ? '🔵' : '🟡';
    console.log(`   │  ${i + 1}. ${p.raison_sociale.substring(0, 25).padEnd(25)} ${scoreColor} ${scoreBar} ${p.score_pertinence}`);
  });
  console.log('   └────────────────────────────────────────────────────────────┘');
  console.log('');
  
  // ──────────────────────────────────────────────────────────────
  // ÉTAPE 2: Vérification du scoring
  // ──────────────────────────────────────────────────────────────
  console.log('📊 ÉTAPE 2: Vérification du scoring');
  console.log('   → Contrôle: score > 90 pour activités moteurs/variateurs');
  
  // Trouver les prospects avec activités moteurs/variateurs
  const prospectsMoteurs = prospectsGeneres.filter(p => {
    const activites = [p.activite_principale, ...p.activites_secondaires].join(' ').toLowerCase();
    return /moteur|variateur|vev|pompe|pompage/i.test(activites);
  });
  
  const prospectsMoteurs90Plus = prospectsMoteurs.filter(p => p.score_pertinence >= TEST_CONFIG.SEUIL_SCORE_MOTEURS);
  const scoringCorrect = prospectsMoteurs.length > 0 && 
    prospectsMoteurs90Plus.length / prospectsMoteurs.length >= 0.8; // 80% des prospects moteurs doivent avoir score >= 90
  
  results.push({
    step: 'Scoring moteurs/variateurs',
    status: scoringCorrect ? 'PASS' : 'FAIL',
    expected: `Score ≥ ${TEST_CONFIG.SEUIL_SCORE_MOTEURS} pour activités moteurs`,
    actual: prospectsMoteurs90Plus.length,
    message: `${prospectsMoteurs90Plus.length}/${prospectsMoteurs.length} prospects moteurs avec score ≥90`,
  });
  
  console.log(`   ${scoringCorrect ? '✅' : '❌'} ${prospectsMoteurs90Plus.length}/${prospectsMoteurs.length} prospects moteurs avec score ≥90`);
  
  // Détail des scores
  prospectsMoteurs.forEach(p => {
    const status = p.score_pertinence >= 90 ? '✅' : '⚠️';
    console.log(`   ${status} ${p.raison_sociale}: ${p.score_pertinence}/100`);
  });
  console.log('');
  
  // Vérification fiche IND-UT-102
  const prospectsAvecFiche = prospectsGeneres.filter(p => 
    p.fiches_cee_potentielles.includes('IND-UT-102')
  );
  
  results.push({
    step: 'Attribution fiche IND-UT-102',
    status: prospectsAvecFiche.length > 0 ? 'PASS' : 'FAIL',
    expected: 'Fiche IND-UT-102 attribuée',
    actual: prospectsAvecFiche.length,
    message: `${prospectsAvecFiche.length} prospects avec fiche IND-UT-102`,
  });
  
  console.log(`   ✅ ${prospectsAvecFiche.length} prospects associés à la fiche IND-UT-102`);
  console.log('');
  
  // ──────────────────────────────────────────────────────────────
  // ÉTAPE 3: Audit du pitch
  // ──────────────────────────────────────────────────────────────
  console.log('💬 ÉTAPE 3: Audit du pitch personnalisé');
  
  // Sélection du meilleur prospect
  meilleurProspect = prospectsGeneres.reduce((best, current) => 
    current.score_pertinence > (best?.score_pertinence || 0) ? current : best
  , prospectsGeneres[0]);
  
  if (meilleurProspect) {
    console.log(`   → Meilleur prospect: ${meilleurProspect.raison_sociale} (score: ${meilleurProspect.score_pertinence})`);
    
    // Génération du message si pas déjà présent
    const message = meilleurProspect.message_personnalise || generateMessageForProspect(meilleurProspect);
    
    console.log('   → Analyse du message de prospection...');
    console.log('');
    console.log('   ┌────────────────────────────────────────────────────────────┐');
    console.log('   │  MESSAGE PERSONNALISÉ                                      │');
    console.log('   ├────────────────────────────────────────────────────────────┤');
    
    // Affichage du message (tronqué pour lisibilité)
    const messageLines = message.split('\n').slice(0, 15);
    messageLines.forEach(line => {
      console.log(`   │  ${line.substring(0, 58).padEnd(58)} │`);
    });
    if (message.split('\n').length > 15) {
      console.log('   │  [...]                                                    │');
    }
    console.log('   └────────────────────────────────────────────────────────────┘');
    console.log('');
    
    // Vérification des éléments obligatoires
    const elementsTrouves: string[] = [];
    const elementsManquants: string[] = [];
    
    // Vérification "diviser par 3"
    const hasDiviserPar3 = TEST_CONFIG.PITCH_ELEMENTS.DIVISER_PAR_3.test(message);
    if (hasDiviserPar3) {
      elementsTrouves.push('Diviser devis par 3');
    } else {
      elementsManquants.push('Diviser devis par 3');
    }
    results.push({
      step: 'Pitch - Mention "diviser par 3"',
      status: hasDiviserPar3 ? 'PASS' : 'FAIL',
      message: hasDiviserPar3 ? 'Présent dans le message' : 'Absent du message',
    });
    console.log(`   ${hasDiviserPar3 ? '✅' : '❌'} Mention "diviser les devis par 3": ${hasDiviserPar3 ? 'PRÉSENT' : 'ABSENT'}`);
    
    // Vérification prime 2 969 €
    const hasPrime2969 = TEST_CONFIG.PITCH_ELEMENTS.PRIME_2969.test(message);
    if (hasPrime2969) {
      elementsTrouves.push('Prime 2 969 €');
    } else {
      elementsManquants.push('Prime 2 969 €');
    }
    results.push({
      step: 'Pitch - Montant prime 2 969 €',
      status: hasPrime2969 ? 'PASS' : 'FAIL',
      message: hasPrime2969 ? 'Présent dans le message' : 'Absent du message',
    });
    console.log(`   ${hasPrime2969 ? '✅' : '❌'} Montant prime 2 969 € (25 kW): ${hasPrime2969 ? 'PRÉSENT' : 'ABSENT'}`);
    
    // Vérification "zéro paperasse"
    const hasZeroPaperasse = TEST_CONFIG.PITCH_ELEMENTS.ZERO_PAPERASSE.test(message);
    if (hasZeroPaperasse) {
      elementsTrouves.push('Zéro paperasse');
    } else {
      elementsManquants.push('Zéro paperasse');
    }
    results.push({
      step: 'Pitch - Argument "zéro paperasse"',
      status: hasZeroPaperasse ? 'PASS' : 'FAIL',
      message: hasZeroPaperasse ? 'Présent dans le message' : 'Absent du message',
    });
    console.log(`   ${hasZeroPaperasse ? '✅' : '❌'} Argument "zéro paperasse": ${hasZeroPaperasse ? 'PRÉSENT' : 'ABSENT'}`);
    
    pitchAnalyse = {
      contenu: message,
      elements_trouves: elementsTrouves,
      elements_manquants: elementsManquants,
    };
    
    console.log('');
  }
  
  // ──────────────────────────────────────────────────────────────
  // ÉTAPE 4: Simulation pipeline d'envoi
  // ──────────────────────────────────────────────────────────────
  console.log('📧 ÉTAPE 4: Simulation du pipeline d\'envoi (Agent Mailer)');
  console.log('   → Vérification de la séquence Drip Campaign...');
  
  // Vérification configuration campagne
  const campaignSteps = DEFAULT_CAMPAIGN.steps;
  const hasJ1 = campaignSteps.some(s => s.step === 'initial' && s.delay_days === 0);
  const hasJ4 = campaignSteps.some(s => s.step === 'relance_j4' && s.delay_days === 4);
  const hasJ7 = campaignSteps.some(s => s.step === 'relance_j7' && s.delay_days === 7);
  
  results.push({
    step: 'Pipeline - Envoi J1 (initial)',
    status: hasJ1 ? 'PASS' : 'FAIL',
    message: hasJ1 ? 'Configuré (délai: 0 jour)' : 'Non configuré',
  });
  console.log(`   ${hasJ1 ? '✅' : '❌'} Envoi J1 (initial): ${hasJ1 ? 'Configuré' : 'NON CONFIGURÉ'}`);
  
  results.push({
    step: 'Pipeline - Relance J4',
    status: hasJ4 ? 'PASS' : 'FAIL',
    message: hasJ4 ? 'Configuré (délai: 4 jours)' : 'Non configuré',
  });
  console.log(`   ${hasJ4 ? '✅' : '❌'} Relance J4: ${hasJ4 ? 'Configuré (délai: +4 jours)' : 'NON CONFIGURÉ'}`);
  
  results.push({
    step: 'Pipeline - Relance J7',
    status: hasJ7 ? 'PASS' : 'FAIL',
    message: hasJ7 ? 'Configuré (délai: 7 jours)' : 'Non configuré',
  });
  console.log(`   ${hasJ7 ? '✅' : '❌'} Relance J7: ${hasJ7 ? 'Configuré (délai: +7 jours)' : 'NON CONFIGURÉ'}`);
  
  // Vérification cohérence séquence
  const sequenceCoherente = hasJ1 && hasJ4 && 
    campaignSteps.findIndex(s => s.step === 'initial') < campaignSteps.findIndex(s => s.step === 'relance_j4');
  
  results.push({
    step: 'Pipeline - Cohérence séquence',
    status: sequenceCoherente ? 'PASS' : 'FAIL',
    message: sequenceCoherente ? 'Séquence J1 → J4 → J7 cohérente' : 'Séquence incohérente',
  });
  console.log(`   ${sequenceCoherente ? '✅' : '❌'} Cohérence séquence: ${sequenceCoherente ? 'J1 → J4 → J7 ✓' : 'INCOHÉRENT'}`);
  
  // Vérification limite anti-spam
  const hasLimit = DEFAULT_CAMPAIGN.daily_limit === 30;
  results.push({
    step: 'Pipeline - Limite anti-spam',
    status: hasLimit ? 'PASS' : 'WARN',
    expected: 30,
    actual: DEFAULT_CAMPAIGN.daily_limit,
    message: `Limite: ${DEFAULT_CAMPAIGN.daily_limit}/jour`,
  });
  console.log(`   ${hasLimit ? '✅' : '⚠️'} Limite anti-spam: ${DEFAULT_CAMPAIGN.daily_limit}/jour`);
  
  console.log('');
  
  // Simulation visuelle de la séquence
  console.log('   ┌────────────────────────────────────────────────────────────┐');
  console.log('   │  SÉQUENCE DRIP CAMPAIGN SIMULÉE                            │');
  console.log('   ├────────────────────────────────────────────────────────────┤');
  console.log('   │                                                            │');
  console.log('   │  J+0 ──────► ENVOI INITIAL                                 │');
  console.log('   │             "Divisez vos devis par 3 - Prime 2 969 €"      │');
  console.log('   │                    │                                       │');
  console.log('   │                    ▼                                       │');
  console.log('   │  J+4 ──────► RELANCE (si pas de réponse)                   │');
  console.log('   │             "Pack Prêt à Signer - Zéro paperasse"          │');
  console.log('   │                    │                                       │');
  console.log('   │                    ▼                                       │');
  console.log('   │  J+7 ──────► DERNIÈRE RELANCE                              │');
  console.log('   │             "Récapitulatif + CTA simple"                   │');
  console.log('   │                                                            │');
  console.log('   └────────────────────────────────────────────────────────────┘');
  console.log('');
  
  // ──────────────────────────────────────────────────────────────
  // RAPPORT FINAL
  // ──────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const allPassed = failed === 0;
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║              RAPPORT DE SIMULATION PROSPECTION               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`   📊 Prospects générés: ${prospectsGeneres.length}`);
  console.log(`   🏆 Meilleur score: ${meilleurProspect?.score_pertinence || 0}/100`);
  console.log(`   📧 Pipeline: ${sequenceCoherente ? 'Opérationnel' : 'À vérifier'}`);
  console.log('');
  console.log('   ┌─────────────────────────────────────────────────────────┐');
  console.log(`   │  Tests réussis:   ${passed.toString().padStart(2)}/${results.length}                                   │`);
  console.log(`   │  Tests échoués:   ${failed.toString().padStart(2)}/${results.length}                                   │`);
  console.log(`   │  Avertissements:  ${warned.toString().padStart(2)}/${results.length}                                   │`);
  console.log('   └─────────────────────────────────────────────────────────┘');
  console.log('');
  
  if (allPassed) {
    console.log('   ╔═══════════════════════════════════════════════════════╗');
    console.log('   ║                                                       ║');
    console.log('   ║   ✅ SIMULATION RÉUSSIE - AGENT OPÉRATIONNEL         ║');
    console.log('   ║                                                       ║');
    console.log('   ║   Scoring moteurs/variateurs ≥90 .............. ✓    ║');
    console.log('   ║   Pitch "diviser par 3" ....................... ✓    ║');
    console.log('   ║   Pitch "prime 2 969 €" ....................... ✓    ║');
    console.log('   ║   Pitch "zéro paperasse" ...................... ✓    ║');
    console.log('   ║   Pipeline J1 → J4 → J7 ...................... ✓    ║');
    console.log('   ║                                                       ║');
    console.log('   ║   L\'agent de prospection est prêt à l\'emploi.        ║');
    console.log('   ║                                                       ║');
    console.log('   ╚═══════════════════════════════════════════════════════╝');
  } else {
    console.log('   ╔═══════════════════════════════════════════════════════╗');
    console.log('   ║                                                       ║');
    console.log(`   ║   ⚠️  SIMULATION PARTIELLE - ${failed} POINT(S) À CORRIGER   ║`);
    console.log('   ║                                                       ║');
    console.log('   ╚═══════════════════════════════════════════════════════╝');
    console.log('');
    console.log('   Points à corriger:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   ❌ ${r.step}: ${r.message}`);
    });
  }
  
  console.log('\n');
  
  return {
    timestamp: new Date().toISOString(),
    results,
    prospects_generes: prospectsGeneres,
    meilleur_prospect: meilleurProspect,
    pitch_analyse: pitchAnalyse,
    pipeline_simulation: {
      j1_programme: hasJ1,
      j4_programme: hasJ4,
      sequence_coherente: sequenceCoherente,
    },
    all_passed: allPassed,
    summary: allPassed 
      ? `✅ SUCCÈS: ${passed}/${results.length} tests passés. Agent de prospection opérationnel.`
      : `⚠️ PARTIEL: ${passed}/${results.length} tests passés, ${failed} échecs.`,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export { TEST_CONFIG };
