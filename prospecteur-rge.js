/**
 * ============================================================================
 * CAPITAL ÉNERGIE - PROSPECTEUR RGE
 * ============================================================================
 * Script de prospection automatisée pour artisans RGE en France
 * 
 * Cibles : Chauffagistes, Menuisiers, Entreprises d'isolation, Électriciens
 * 
 * Usage :
 *   node prospecteur-rge.js [commande] [options]
 * 
 * Commandes :
 *   search [ville]     - Recherche des artisans RGE dans une ville
 *   list               - Affiche la liste des prospects
 *   send [id]          - Envoie un email à un prospect
 *   campaign           - Lance une campagne d'envoi groupé
 * 
 * Exemple :
 *   node prospecteur-rge.js search Lyon
 *   node prospecteur-rge.js campaign --limit 10
 * ============================================================================
 */

require('dotenv').config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const PAPPERS_API_KEY = process.env.PAPPERS_API_KEY;
const FROM_EMAIL = 'Capital Energie <onboarding@resend.dev>';
const AUDIENCE_NAME = 'Prospection Capital Energie';
const TEST_EMAIL = 'geslinq@gmail.com'; // Email de test (mode sandbox Resend)

// Vérification des clés API
if (!RESEND_API_KEY) {
  console.warn('⚠️  RESEND_API_KEY non trouvée dans .env - Mode SIMULATION activé');
}
if (!PAPPERS_API_KEY) {
  console.warn('⚠️  PAPPERS_API_KEY non trouvée dans .env - Health Check désactivé');
}

// ============================================================================
// MODULE HEALTH CHECK (API PAPPERS)
// ============================================================================

/**
 * Vérifie la santé financière d'une entreprise via l'API Pappers
 * @param {string} siret - Numéro SIRET de l'entreprise (ou raison sociale)
 * @param {string} raisonSociale - Nom de l'entreprise (fallback)
 * @returns {Promise<Object>} Résultat du health check
 */
async function healthCheckEntreprise(siret, raisonSociale) {
  // Mode simulation si pas de clé API
  if (!PAPPERS_API_KEY) {
    return {
      checked: false,
      status: 'non_verifie',
      message: 'Health check non disponible (PAPPERS_API_KEY manquante)',
      saine: null,
    };
  }

  try {
    // Recherche par SIRET ou raison sociale
    const searchParam = siret || encodeURIComponent(raisonSociale);
    const endpoint = siret 
      ? `https://api.pappers.fr/v2/entreprise?api_token=${PAPPERS_API_KEY}&siret=${searchParam}`
      : `https://api.pappers.fr/v2/recherche?api_token=${PAPPERS_API_KEY}&q=${searchParam}&par_page=1`;

    const response = await fetch(endpoint);
    const data = await response.json();

    // Debug: afficher la réponse brute si erreur
    if (!response.ok) {
      console.error('   Erreur API Pappers:', data.message || response.status);
      return {
        checked: true,
        status: 'erreur',
        message: data.message || `Erreur HTTP ${response.status}`,
        saine: null,
      };
    }

    // Vérifier si résultats trouvés
    const hasResults = siret ? data.siren : (data.resultats && data.resultats.length > 0);
    if (!hasResults) {
      return {
        checked: true,
        status: 'non_trouve',
        message: 'Entreprise non trouvée dans Pappers',
        saine: null,
      };
    }

    // Extraction des données entreprise
    const entreprise = siret ? data : data.resultats[0];
    
    // Vérifications de santé
    const checks = verifierSanteEntreprise(entreprise);
    
    return {
      checked: true,
      status: checks.saine ? 'saine' : 'risque',
      saine: checks.saine,
      details: checks,
      entreprise: {
        siren: entreprise.siren,
        siret: entreprise.siret_siege || entreprise.siret,
        denomination: entreprise.nom_entreprise || entreprise.denomination,
        date_creation: entreprise.date_creation,
        statut_rcs: entreprise.statut_rcs,
        procedure_collective: entreprise.procedure_collective,
      },
    };

  } catch (error) {
    console.error('❌ Erreur Health Check:', error.message);
    return {
      checked: true,
      status: 'erreur',
      message: error.message,
      saine: null,
    };
  }
}

/**
 * Applique les filtres de qualité sur une entreprise
 * @param {Object} entreprise - Données Pappers de l'entreprise
 * @returns {Object} Résultat des vérifications
 */
function verifierSanteEntreprise(entreprise) {
  const maintenant = new Date();
  const deuxAns = 2 * 365 * 24 * 60 * 60 * 1000; // 2 ans en ms
  
  // 1. Vérification : Entreprise active (pas de liquidation/redressement)
  const statutsInactifs = ['Radié', 'Liquidation', 'Liquidation judiciaire', 'Redressement judiciaire'];
  const estActive = !statutsInactifs.includes(entreprise.statut_rcs) && 
                    !entreprise.procedure_collective;
  
  // 2. Vérification : Plus de 2 ans d'existence
  const dateCreation = entreprise.date_creation ? new Date(entreprise.date_creation) : null;
  const anciennete = dateCreation ? maintenant - dateCreation : 0;
  const plusDeDeuxAns = anciennete > deuxAns;
  const anneesExistence = dateCreation 
    ? Math.floor(anciennete / (365 * 24 * 60 * 60 * 1000)) 
    : null;

  // Résultat global
  const saine = estActive && plusDeDeuxAns;

  return {
    saine,
    estActive,
    plusDeDeuxAns,
    anneesExistence,
    dateCreation: entreprise.date_creation,
    statutRCS: entreprise.statut_rcs || 'Inconnu',
    procedureCollective: entreprise.procedure_collective || false,
    alertes: [
      !estActive ? '⚠️ Entreprise inactive ou en procédure collective' : null,
      !plusDeDeuxAns ? `⚠️ Moins de 2 ans d'existence (${anneesExistence || 0} an(s))` : null,
    ].filter(Boolean),
  };
}

/**
 * Effectue un health check sur une liste de prospects
 * @param {Array} prospects - Liste des prospects
 * @returns {Promise<Array>} Prospects enrichis avec health check
 */
async function healthCheckProspects(prospects) {
  const resultats = [];
  
  for (const prospect of prospects) {
    console.log(`   🔍 Vérification: ${prospect.entreprise}...`);
    
    const healthResult = await healthCheckEntreprise(
      prospect.siret,
      prospect.entreprise
    );
    
    resultats.push({
      ...prospect,
      healthCheck: healthResult,
    });
    
    // Délai entre les appels API
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return resultats;
}

// ============================================================================
// DÉFINITION DES CIBLES RGE
// ============================================================================

const CIBLES_RGE = {
  chauffagistes: {
    code: 'CHAUFF',
    label: 'Chauffagistes',
    qualifications: ['QualiPAC', 'Qualigaz', 'RGE Chauffage+'],
    fiches_cee: ['BAR-TH-104', 'BAR-TH-106', 'BAR-TH-159'],
    keywords: ['chauffage', 'pompe à chaleur', 'PAC', 'chaudière', 'climatisation'],
  },
  menuisiers: {
    code: 'MENU',
    label: 'Menuisiers',
    qualifications: ['Qualibat RGE', 'RGE Fenêtres'],
    fiches_cee: ['BAR-EN-104', 'BAR-EN-105'],
    keywords: ['menuiserie', 'fenêtres', 'portes', 'vitrerie', 'huisseries'],
  },
  isolation: {
    code: 'ISOL',
    label: 'Entreprises d\'isolation',
    qualifications: ['Qualibat RGE', 'RGE Isolation'],
    fiches_cee: ['BAR-EN-101', 'BAR-EN-102', 'BAR-EN-103'],
    keywords: ['isolation', 'ITE', 'ITI', 'combles', 'thermique'],
  },
  electriciens: {
    code: 'ELEC',
    label: 'Électriciens',
    qualifications: ['Qualifelec RGE', 'QualiPV'],
    fiches_cee: ['BAR-TH-160', 'RES-EC-104'],
    keywords: ['électricité', 'photovoltaïque', 'solaire', 'installation électrique'],
  },
};

// ============================================================================
// BASE DE DONNÉES PROSPECTS (Simulation - à remplacer par API réelle)
// ============================================================================

const PROSPECTS_DB = [
  // Chauffagistes
  {
    id: 'rge-001',
    entreprise: 'Thermi-Confort SARL',
    type: 'chauffagistes',
    ville: 'Lyon',
    code_postal: '69003',
    email: 'contact@thermi-confort.fr',
    telephone: '04 78 12 34 56',
    rge_numero: 'RGE-2024-001234',
    qualifications: ['QualiPAC', 'Qualigaz'],
    contact_nom: 'Jean Dupont',
    statut: 'nouveau',
  },
  {
    id: 'rge-002',
    entreprise: 'Éco-Chaleur Services',
    type: 'chauffagistes',
    ville: 'Marseille',
    code_postal: '13008',
    email: 'direction@eco-chaleur.fr',
    telephone: '04 91 22 33 44',
    rge_numero: 'RGE-2024-005678',
    qualifications: ['QualiPAC'],
    contact_nom: 'Marie Martin',
    statut: 'nouveau',
  },
  // Menuisiers
  {
    id: 'rge-003',
    entreprise: 'Fenêtres & Co',
    type: 'menuisiers',
    ville: 'Nantes',
    code_postal: '44000',
    email: 'info@fenetres-co.fr',
    telephone: '02 40 11 22 33',
    rge_numero: 'RGE-2024-009012',
    qualifications: ['Qualibat RGE'],
    contact_nom: 'Pierre Leroy',
    statut: 'nouveau',
  },
  {
    id: 'rge-004',
    entreprise: 'Menuiserie Dubois',
    type: 'menuisiers',
    ville: 'Bordeaux',
    code_postal: '33000',
    email: 'contact@menuiserie-dubois.fr',
    telephone: '05 56 33 44 55',
    rge_numero: 'RGE-2024-003456',
    qualifications: ['RGE Fenêtres'],
    contact_nom: 'François Dubois',
    statut: 'nouveau',
  },
  // Isolation
  {
    id: 'rge-005',
    entreprise: 'Isol\'Expert',
    type: 'isolation',
    ville: 'Lille',
    code_postal: '59000',
    email: 'devis@isolexpert.fr',
    telephone: '03 20 44 55 66',
    rge_numero: 'RGE-2024-007890',
    qualifications: ['Qualibat RGE', 'RGE Isolation'],
    contact_nom: 'Sophie Bernard',
    statut: 'nouveau',
  },
  {
    id: 'rge-006',
    entreprise: 'Thermo-Façades',
    type: 'isolation',
    ville: 'Strasbourg',
    code_postal: '67000',
    email: 'commercial@thermo-facades.fr',
    telephone: '03 88 55 66 77',
    rge_numero: 'RGE-2024-002345',
    qualifications: ['RGE Isolation'],
    contact_nom: 'Laurent Weber',
    statut: 'nouveau',
  },
  // Électriciens
  {
    id: 'rge-007',
    entreprise: 'Élec-Solaire Plus',
    type: 'electriciens',
    ville: 'Toulouse',
    code_postal: '31000',
    email: 'contact@elec-solaire.fr',
    telephone: '05 61 66 77 88',
    rge_numero: 'RGE-2024-006789',
    qualifications: ['Qualifelec RGE', 'QualiPV'],
    contact_nom: 'Marc Fabre',
    statut: 'nouveau',
  },
  {
    id: 'rge-008',
    entreprise: 'Énergie Verte Installation',
    type: 'electriciens',
    ville: 'Nice',
    code_postal: '06000',
    email: 'info@energie-verte.fr',
    telephone: '04 93 77 88 99',
    rge_numero: 'RGE-2024-008901',
    qualifications: ['QualiPV'],
    contact_nom: 'Julien Rossi',
    statut: 'nouveau',
  },
];

// ============================================================================
// FONCTIONS DE RECHERCHE
// ============================================================================

/**
 * Recherche des artisans RGE selon critères
 * @param {Object} criteres - Critères de recherche
 * @returns {Array} Liste des prospects trouvés
 */
function rechercherArtisansRGE(criteres = {}) {
  const { ville, type, keyword, limit = 50 } = criteres;
  
  let resultats = [...PROSPECTS_DB];
  
  // Filtre par ville
  if (ville) {
    resultats = resultats.filter(p => 
      p.ville.toLowerCase().includes(ville.toLowerCase())
    );
  }
  
  // Filtre par type d'artisan
  if (type && CIBLES_RGE[type]) {
    resultats = resultats.filter(p => p.type === type);
  }
  
  // Filtre par mot-clé
  if (keyword) {
    const kw = keyword.toLowerCase();
    resultats = resultats.filter(p => {
      const cible = CIBLES_RGE[p.type];
      return cible && cible.keywords.some(k => k.toLowerCase().includes(kw));
    });
  }
  
  // Limite
  resultats = resultats.slice(0, limit);
  
  return {
    total: resultats.length,
    prospects: resultats.map(p => extraireInfosProspect(p)),
  };
}

/**
 * Extrait les informations essentielles d'un prospect
 * @param {Object} prospect - Prospect brut
 * @returns {Object} Infos extraites (nom, ville, email)
 */
function extraireInfosProspect(prospect) {
  return {
    id: prospect.id,
    entreprise: prospect.entreprise,
    ville: prospect.ville,
    code_postal: prospect.code_postal,
    email: prospect.email,
    telephone: prospect.telephone,
    contact: prospect.contact_nom,
    type: CIBLES_RGE[prospect.type]?.label || prospect.type,
    qualifications: prospect.qualifications,
    rge_numero: prospect.rge_numero,
    statut: prospect.statut,
  };
}

/**
 * Génère un message de prospection personnalisé
 * @param {Object} prospect - Prospect cible
 * @returns {Object} Message personnalisé avec objet et corps
 */
function genererMessageProspection(prospect) {
  // Extraction des variables
  const nomDirigeant = prospect.contact 
    ? prospect.contact.split(' ')[0] 
    : 'Madame, Monsieur';
  const nomEntreprise = prospect.entreprise || 'votre entreprise';
  const expediteur = {
    nom: 'Max Geslin',
    cabinet: 'Capital Énergie',
  };

  // Objet de l'email
  const objet = `Audit de conformité CEE automatisé pour ${nomEntreprise}`;

  // Corps du message
  const corps = `Bonjour ${nomDirigeant},

Je sais qu'en tant qu'artisan RGE, votre place est sur vos chantiers et non coincé derrière un bureau à gérer la complexité des dossiers CEE.

C'est pour vous redonner cette liberté que j'ai créé un cabinet d'accompagnement d'un nouveau genre. J'ai bâti une solution technique propriétaire qui me permet de sécuriser vos primes beaucoup plus vite que les méthodes traditionnelles, tout en vous déchargeant totalement de la paperasse.

Concrètement, j'ai automatisé les tâches les plus lourdes pour me concentrer sur l'essentiel : la sécurité de vos paiements. Grâce aux outils de précision que j'utilise, je peux vous offrir :

✅ Un diagnostic immédiat : En quelques instants, je vérifie la conformité technique de vos devis (critères ηs, COP, mentions obligatoires) pour m'assurer qu'aucun détail ne bloquera votre prime.

✅ Un Indice de Sécurité fiable : Vous savez avant même le dépôt si le dossier est valide à 100%.

✅ Un suivi client aux petits soins : Si une pièce manque, mon système s'occupe de relancer poliment vos clients pour vous, afin que vous n'ayez pas à courir après les documents.

Pour vous démontrer l'efficacité de cette approche sans aucun engagement de votre part, je vous propose un test simple : Envoyez-moi un devis actuel (ou un ancien dossier qui vous a posé problème).

Je vous renverrai son Rapport de Conformité complet avec son Indice de Sécurité. Vous pourrez ainsi juger par vous-même de la précision de mon accompagnement.

Dans l'attente de découvrir vos projets, je vous souhaite une excellente journée sur vos chantiers.

Bien cordialement,

${expediteur.nom}
Fondateur de ${expediteur.cabinet}

---
Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.`;

  return {
    objet,
    corps,
    variables: {
      nomDirigeant,
      nomEntreprise,
      expediteurNom: expediteur.nom,
      expediteurCabinet: expediteur.cabinet,
    },
  };
}

// ============================================================================
// FONCTIONS D'ENVOI EMAIL (RESEND)
// ============================================================================

/**
 * Envoie un email via l'API Resend
 * @param {Object} options - Options d'envoi
 * @returns {Promise<Object>} Résultat de l'envoi
 */
async function envoyerEmail(options) {
  const { to, toName, subject, message } = options;
  
  // Mode simulation si pas de clé API
  if (!RESEND_API_KEY) {
    console.log('\n📧 [SIMULATION] Email préparé :');
    console.log(`   À : ${toName} <${to}>`);
    console.log(`   Sujet : ${subject}`);
    console.log(`   Message : ${message.substring(0, 100)}...`);
    return { success: true, mode: 'simulation', id: `sim_${Date.now()}` };
  }
  
  // Envoi réel via Resend
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0891b2, #06b6d4); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Capital Énergie</h2>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">
            Partenariat CEE - ${AUDIENCE_NAME}
          </p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="color: #334155; line-height: 1.6; white-space: pre-wrap; margin: 0;">
            ${message.replace(/\n/g, '<br>')}
          </p>
        </div>
        <div style="background: #1e293b; padding: 16px; border-radius: 0 0 8px 8px;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
            Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.
          </p>
        </div>
      </div>
    `;
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: subject,
        html: htmlContent,
        text: message,
        tags: [
          { name: 'campaign', value: 'prospection_rge' },
          { name: 'audience', value: 'prospection_capital_energie' },
        ],
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Erreur Resend:', result);
      return { success: false, error: result.message || 'Erreur envoi' };
    }
    
    console.log(`✅ Email envoyé à ${to} (ID: ${result.id})`);
    return { success: true, mode: 'real', id: result.id };
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Envoie une campagne d'emails à plusieurs prospects
 * @param {Array} prospects - Liste des prospects
 * @param {Object} options - Options de campagne
 */
async function lancerCampagne(prospects, options = {}) {
  const { delayMs = 2000, dryRun = false, testMode = false } = options;
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  🚀 CAMPAGNE PROSPECTION - ${AUDIENCE_NAME}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Cibles : ${prospects.length} artisan(s) RGE`);
  console.log(`  Mode : ${dryRun ? 'SIMULATION (--dry-run)' : testMode ? `TEST (→ ${TEST_EMAIL})` : RESEND_API_KEY ? 'RÉEL' : 'SIMULATION (pas de clé API)'}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  let envoyes = 0;
  let erreurs = 0;
  
  for (const prospect of prospects) {
    const messageData = genererMessageProspection(prospect);
    const subject = messageData.objet;
    const message = messageData.corps;
    
    console.log(`📤 [${envoyes + erreurs + 1}/${prospects.length}] ${prospect.entreprise} (${prospect.ville})`);
    
    if (dryRun) {
      console.log(`   → Email préparé pour ${prospect.email}`);
      console.log(`   → Objet: ${subject}`);
      envoyes++;
    } else {
      const targetEmail = testMode ? TEST_EMAIL : prospect.email;
      const result = await envoyerEmail({
        to: targetEmail,
        toName: prospect.contact || prospect.entreprise,
        subject,
        message,
      });
      if (testMode) {
        console.log(`   → Redirigé vers ${TEST_EMAIL}`);
      }
      
      if (result.success) {
        envoyes++;
      } else {
        erreurs++;
      }
      
      // Délai anti-spam entre les envois
      if (prospects.indexOf(prospect) < prospects.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  📊 RÉSUMÉ CAMPAGNE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✅ Envoyés : ${envoyes}`);
  console.log(`  ❌ Erreurs : ${erreurs}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  return { envoyes, erreurs };
}

// ============================================================================
// INTERFACE LIGNE DE COMMANDE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const commande = args[0] || 'help';
  
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║      CAPITAL ÉNERGIE - PROSPECTEUR RGE v1.0.0            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  switch (commande) {
    case 'search': {
      const ville = args[1];
      const type = args.find(a => a.startsWith('--type='))?.split('=')[1];
      const withHealthCheck = args.includes('--check');
      
      console.log(`🔍 Recherche d'artisans RGE${ville ? ` à ${ville}` : ''}${type ? ` (${type})` : ''}...`);
      if (withHealthCheck) {
        console.log(`🏥 Health Check activé (API Pappers)${PAPPERS_API_KEY ? '' : ' - MODE SIMULATION'}`);
      }
      console.log('');
      
      let resultats = rechercherArtisansRGE({ ville, type });
      
      // Health Check si demandé
      if (withHealthCheck && resultats.total > 0) {
        console.log('📊 Vérification santé des entreprises...\n');
        resultats.prospects = await healthCheckProspects(resultats.prospects);
      }
      
      console.log(`\n📋 ${resultats.total} prospect(s) trouvé(s) :\n`);
      
      let saines = 0, risques = 0, nonVerifiees = 0;
      
      resultats.prospects.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.entreprise}`);
        console.log(`     📍 ${p.ville} (${p.code_postal})`);
        console.log(`     📧 ${p.email}`);
        console.log(`     🏷️  ${p.type} - ${p.qualifications.join(', ')}`);
        
        // Affichage Health Check
        if (p.healthCheck) {
          if (p.healthCheck.saine === true) {
            console.log(`     ✅ Entreprise Saine (${p.healthCheck.details?.anneesExistence || '?'} ans d'existence)`);
            saines++;
          } else if (p.healthCheck.saine === false) {
            console.log(`     ⚠️  Risque détecté`);
            p.healthCheck.details?.alertes?.forEach(alerte => {
              console.log(`        ${alerte}`);
            });
            risques++;
          } else {
            console.log(`     ❓ Non vérifiée`);
            nonVerifiees++;
          }
        }
        console.log('');
      });
      
      // Résumé Health Check
      if (withHealthCheck) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('  🏥 RÉSUMÉ HEALTH CHECK');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`  ✅ Entreprises Saines : ${saines}`);
        console.log(`  ⚠️  Risques détectés : ${risques}`);
        console.log(`  ❓ Non vérifiées : ${nonVerifiees}`);
        console.log('═══════════════════════════════════════════════════════════\n');
      }
      break;
    }
    
    case 'list': {
      const type = args.find(a => a.startsWith('--type='))?.split('=')[1];
      const resultats = rechercherArtisansRGE({ type });
      
      console.log(`📋 Liste des ${resultats.total} prospect(s) :\n`);
      
      console.log('┌────────────┬──────────────────────────────┬──────────────┬────────────────────────────────┐');
      console.log('│ ID         │ Entreprise                   │ Ville        │ Email                          │');
      console.log('├────────────┼──────────────────────────────┼──────────────┼────────────────────────────────┤');
      
      resultats.prospects.forEach(p => {
        const id = p.id.padEnd(10);
        const entreprise = p.entreprise.substring(0, 28).padEnd(28);
        const ville = p.ville.substring(0, 12).padEnd(12);
        const email = p.email.substring(0, 30).padEnd(30);
        console.log(`│ ${id} │ ${entreprise} │ ${ville} │ ${email} │`);
      });
      
      console.log('└────────────┴──────────────────────────────┴──────────────┴────────────────────────────────┘\n');
      break;
    }
    
    case 'send': {
      const prospectId = args[1];
      
      if (!prospectId) {
        console.log('❌ Usage : node prospecteur-rge.js send <prospect_id>');
        console.log('   Exemple : node prospecteur-rge.js send rge-001\n');
        break;
      }
      
      const prospect = PROSPECTS_DB.find(p => p.id === prospectId);
      
      if (!prospect) {
        console.log(`❌ Prospect "${prospectId}" non trouvé.\n`);
        break;
      }
      
      const infos = extraireInfosProspect(prospect);
      const messageData = genererMessageProspection(infos);
      
      console.log(`📤 Envoi à ${infos.entreprise} (${infos.email})...`);
      console.log(`   Objet: ${messageData.objet}\n`);
      
      const result = await envoyerEmail({
        to: infos.email,
        toName: infos.contact || infos.entreprise,
        subject: messageData.objet,
        message: messageData.corps,
      });
      
      if (result.success) {
        console.log(`\n✅ Email envoyé avec succès ! (Mode: ${result.mode})\n`);
      } else {
        console.log(`\n❌ Échec de l'envoi : ${result.error}\n`);
      }
      break;
    }
    
    case 'campaign': {
      const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '10');
      const type = args.find(a => a.startsWith('--type='))?.split('=')[1];
      const dryRun = args.includes('--dry-run');
      const testMode = args.includes('--test');
      
      const resultats = rechercherArtisansRGE({ type, limit });
      
      if (resultats.total === 0) {
        console.log('❌ Aucun prospect trouvé pour cette campagne.\n');
        break;
      }
      
      await lancerCampagne(resultats.prospects, { dryRun, testMode });
      break;
    }
    
    case 'types': {
      console.log('📋 Types d\'artisans RGE ciblés :\n');
      
      Object.entries(CIBLES_RGE).forEach(([key, value]) => {
        console.log(`  ${value.code} - ${value.label}`);
        console.log(`      Qualifications : ${value.qualifications.join(', ')}`);
        console.log(`      Fiches CEE : ${value.fiches_cee.join(', ')}`);
        console.log('');
      });
      break;
    }
    
    case 'healthcheck': {
      const entreprise = args[1];
      
      if (!entreprise) {
        console.log('❌ Usage : node prospecteur-rge.js healthcheck <nom_entreprise>');
        console.log('   Exemple : node prospecteur-rge.js healthcheck "Thermi-Confort SARL"\n');
        break;
      }
      
      console.log(`🏥 Health Check : ${entreprise}\n`);
      
      if (!PAPPERS_API_KEY) {
        console.log('⚠️  PAPPERS_API_KEY non configurée - Mode SIMULATION');
        console.log('');
        console.log('📋 Résultat (simulé) :');
        console.log('   ✅ Entreprise Saine (simulation)');
        console.log('   📅 Ancienneté : Non vérifiée');
        console.log('   📊 Statut RCS : Non vérifié');
        console.log('');
        console.log('💡 Ajoutez PAPPERS_API_KEY dans .env pour activer la vérification réelle.');
        break;
      }
      
      const result = await healthCheckEntreprise(null, entreprise);
      
      console.log('📋 Résultat :\n');
      
      if (result.status === 'saine') {
        console.log('   ✅ Entreprise Saine');
        console.log(`   📅 Ancienneté : ${result.details.anneesExistence} ans (créée le ${result.details.dateCreation})`);
        console.log(`   📊 Statut RCS : ${result.details.statutRCS}`);
        console.log(`   🔢 SIREN : ${result.entreprise?.siren || 'N/A'}`);
      } else if (result.status === 'risque') {
        console.log('   ⚠️  Risque détecté');
        result.details?.alertes?.forEach(alerte => {
          console.log(`   ${alerte}`);
        });
        console.log(`   📊 Statut RCS : ${result.details?.statutRCS || 'Inconnu'}`);
      } else {
        console.log(`   ❓ ${result.message || 'Vérification impossible'}`);
      }
      console.log('');
      break;
    }
    
    case 'help':
    default: {
      console.log('📖 COMMANDES DISPONIBLES :\n');
      console.log('  search [ville]     Recherche des artisans RGE');
      console.log('                     Options : --type=<type>, --check (health check)');
      console.log('');
      console.log('  list               Affiche tous les prospects');
      console.log('                     Options : --type=<type>');
      console.log('');
      console.log('  healthcheck <nom>  Vérifie la santé d\'une entreprise (API Pappers)');
      console.log('                     Filtres : active, >2 ans d\'existence');
      console.log('');
      console.log('  send <id>          Envoie un email à un prospect');
      console.log('');
      console.log('  campaign           Lance une campagne d\'envoi');
      console.log('                     Options : --limit=N, --type=<type>, --dry-run, --test');
      console.log('');
      console.log('  types              Affiche les types d\'artisans ciblés');
      console.log('');
      console.log('  help               Affiche cette aide');
      console.log('');
      console.log('🔑 CLÉS API :');
      console.log('   📧 Resend  : ' + (RESEND_API_KEY ? '✅ Configurée' : '❌ Non configurée'));
      console.log('   🏥 Pappers : ' + (PAPPERS_API_KEY ? '✅ Configurée' : '❌ Non configurée'));
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
  CIBLES_RGE,
  rechercherArtisansRGE,
  extraireInfosProspect,
  genererMessageProspection,
  envoyerEmail,
  lancerCampagne,
  healthCheckEntreprise,
  healthCheckProspects,
  verifierSanteEntreprise,
};
