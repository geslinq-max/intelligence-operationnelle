/**
 * ============================================================================
 * CAPITAL ÉNERGIE - SERVICE DE PROSPECTION
 * ============================================================================
 * Gestion des campagnes d'emailing vers les prospects RGE
 * Ciblage automatique selon le profil (artisan/pme/leader)
 * 
 * Usage :
 *   node service-prospection.js liste           Liste les prospects
 *   node service-prospection.js tester          Simule tous les emails
 *   node service-prospection.js apercu [id]     Aperçu d'un email
 *   node service-prospection.js campagne        Lance une campagne
 *   node service-prospection.js envoyer [id]    Envoie à un prospect
 * 
 * Modèles :
 *   - ESSENTIEL : profil "artisan" (petits artisans indépendants)
 *   - SÉRÉNITÉ  : profil "pme" (PME du bâtiment)
 *   - EXPERT    : profil "leader" (leaders régionaux)
 * ============================================================================
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  fichierProspects: './prospects.json',
  dossierAudits: './audits-demo',
  expediteur: {
    nom: 'Max Geslin',
    cabinet: 'Capital Énergie',
    titre: 'Cellule d\'Expertise Réglementaire',
    email: 'contact@capital-energie.fr',
    telephone: '01 23 45 67 89',
  },
  resendApiKey: process.env.RESEND_API_KEY,
  testEmail: process.env.TEST_EMAIL || 'geslinq@gmail.com',
};

// ============================================================================
// MODÈLES D'EMAILS PAR FORFAIT
// ============================================================================

const MODELES_EMAILS = {
  essentiel: {
    forfait: 'Essentiel',
    badge: '🔵',
    objet: (vars) => `Protégez vos 3 prochains dossiers CEE gratuitement - ${vars.nomEntreprise}`,
    corps: (vars) => `Bonjour ${vars.nomGerant},

En tant qu'artisan RGE, vous méritez de vous concentrer sur vos chantiers, pas sur la paperasse administrative.

J'ai créé Capital Énergie pour offrir aux artisans comme vous une solution simple et accessible. Mon Système d'Audit analyse vos dossiers CEE en quelques instants et détecte les risques de blocage de paiement AVANT le dépôt.

🔵 **OFFRE ESSENTIEL - Idéale pour démarrer**

Pour vous permettre de tester sans risque, je vous propose :

✅ **3 audits de dossiers offerts** - Envoyez-moi vos 3 prochains devis
✅ **Indice de Sécurité immédiat** - Vous savez si le dossier passera
✅ **Correction guidée** - Je vous indique exactement quoi corriger

C'est gratuit, sans engagement, et ça prend 2 minutes.

👉 **Répondez simplement à cet email avec vos devis en pièce jointe.**

Je vous renvoie l'analyse dans la journée.

Bien cordialement,

${CONFIG.expediteur.nom}
Fondateur de ${CONFIG.expediteur.cabinet}
${CONFIG.expediteur.titre}

---
Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.`,
  },
  
  serenite: {
    forfait: 'Sérénité',
    badge: '⭐',
    objet: (vars) => `Sécurisez 15 dossiers/mois avec un accompagnement prioritaire - ${vars.nomEntreprise}`,
    corps: (vars) => `Bonjour ${vars.nomGerant},

Je me permets de vous contacter car ${vars.nomEntreprise} fait partie des entreprises RGE qui traitent un volume significatif de dossiers CEE.

À ce niveau d'activité, une erreur administrative peut avoir des conséquences lourdes sur votre trésorerie. C'est exactement pour des entreprises comme la vôtre que j'ai conçu le forfait Sérénité.

⭐ **FORFAIT SÉRÉNITÉ - Accompagnement PME**

Voici ce que je vous propose :

✅ **15 dossiers sécurisés par mois** - Volume adapté à votre activité
✅ **Priorité de traitement haute** - Vos dossiers passent en premier
✅ **Alertes réglementaires** - Je vous préviens des changements de règles
✅ **Espace partenaire dédié** - Suivi en temps réel de vos dossiers
✅ **Support prioritaire** - Réponse sous 24h garantie

Pour vous démontrer la valeur de cet accompagnement, je vous offre un audit complet de vos 5 derniers dossiers, totalement gratuit.

👉 **Envoyez-moi vos dossiers et je vous renvoie un rapport détaillé avec l'Indice de Sécurité de chacun.**

Vous pourrez ainsi mesurer concrètement les risques évités.

Dans l'attente de collaborer avec vous,

${CONFIG.expediteur.nom}
Fondateur de ${CONFIG.expediteur.cabinet}
${CONFIG.expediteur.titre}

---
Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.`,
  },
  
  expert: {
    forfait: 'Expert',
    badge: '👑',
    objet: (vars) => `Partenariat stratégique CEE pour ${vars.nomEntreprise} - Accompagnement illimité`,
    corps: (vars) => `Bonjour ${vars.nomGerant},

${vars.nomEntreprise} est identifiée comme un acteur majeur de la rénovation énergétique dans votre région.

À votre niveau d'activité, la sécurisation de vos dossiers CEE n'est plus une option mais une nécessité stratégique. Un seul dossier bloqué peut représenter des dizaines de milliers d'euros de trésorerie immobilisée.

C'est pourquoi je souhaite vous présenter notre accompagnement Expert, conçu spécifiquement pour les leaders du secteur.

👑 **FORFAIT EXPERT - Accompagnement Stratégique**

Ce partenariat premium inclut :

✅ **Dossiers illimités** - Aucune limite sur votre volume d'activité
✅ **Priorité critique** - Traitement immédiat de vos dossiers
✅ **Veille réglementaire avancée** - Anticipation des évolutions CEE
✅ **Accompagnement personnalisé** - Interlocuteur dédié
✅ **Support 24/7** - Disponibilité totale
✅ **Rapports de direction** - Tableaux de bord stratégiques

Je vous propose un rendez-vous de 30 minutes pour vous présenter concrètement comment nous pouvons sécuriser l'intégralité de votre flux de dossiers.

En amont de cet échange, je me permets de joindre à cet email un exemple d'audit que nous réalisons. Vous pourrez ainsi apprécier le niveau de détail et de précision de notre Système d'Audit.

👉 **Répondez à cet email pour convenir d'un créneau, ou appelez-moi directement au ${CONFIG.expediteur.telephone}.**

Je reste à votre disposition,

${CONFIG.expediteur.nom}
Fondateur de ${CONFIG.expediteur.cabinet}
${CONFIG.expediteur.titre}

---
Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.`,
  },
};

// ============================================================================
// CHARGEMENT DES PROSPECTS
// ============================================================================

function chargerProspects() {
  const chemin = path.resolve(CONFIG.fichierProspects);
  
  if (!fs.existsSync(chemin)) {
    console.error('  ❌ Fichier prospects.json non trouvé');
    return [];
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(chemin, 'utf8'));
    return data.prospects || [];
  } catch (e) {
    console.error('  ❌ Erreur lecture prospects:', e.message);
    return [];
  }
}

function trouverProspect(identifiant) {
  const prospects = chargerProspects();
  const idLower = identifiant.toLowerCase();
  
  return prospects.find(p => 
    p.id === identifiant ||
    p.nom.toLowerCase().includes(idLower) ||
    p.email.toLowerCase() === idLower
  );
}

// ============================================================================
// LOGIQUE DE CIBLAGE
// ============================================================================

/**
 * Détermine le modèle d'email selon le profil du prospect
 * @param {string} profil - artisan, pme, ou leader
 * @returns {Object} Modèle d'email correspondant
 */
function getModeleParProfil(profil) {
  const mapping = {
    'artisan': 'essentiel',
    'pme': 'serenite',
    'leader': 'expert',
  };
  
  const modeleKey = mapping[profil?.toLowerCase()] || 'essentiel';
  return MODELES_EMAILS[modeleKey];
}

/**
 * Extrait le nom du gérant depuis le champ dirigeant
 */
function extraireNomGerant(dirigeant) {
  if (!dirigeant || dirigeant === 'Responsable') {
    return 'Madame, Monsieur';
  }
  
  // Nettoyer les préfixes
  return dirigeant
    .replace(/^(M\.|Mme|Mr|Mlle|Dr)\.?\s*/i, '')
    .trim() || 'Madame, Monsieur';
}

// ============================================================================
// GESTION DES PIÈCES JOINTES
// ============================================================================

/**
 * Génère le chemin de la pièce jointe audit-demo pour un prospect
 */
function getCheminAuditDemo(prospect) {
  const nomSafe = prospect.nom.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  return path.join(CONFIG.dossierAudits, `audit-demo-${nomSafe}.html`);
}

/**
 * Vérifie si la pièce jointe existe
 */
function pieceJointeExiste(prospect) {
  const chemin = getCheminAuditDemo(prospect);
  return fs.existsSync(chemin);
}

/**
 * Génère un audit démo pour un prospect
 */
function genererAuditDemo(prospect) {
  const modele = getModeleParProfil(prospect.profil);
  const nomSafe = prospect.nom.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  
  // Créer le dossier si nécessaire
  if (!fs.existsSync(CONFIG.dossierAudits)) {
    fs.mkdirSync(CONFIG.dossierAudits, { recursive: true });
  }
  
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Audit Démo - ${prospect.nom}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f1f5f9; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: white; padding: 30px; border-radius: 16px 16px 0 0; text-align: center; }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .main { background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .section { margin-bottom: 25px; padding: 20px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #0891b2; }
    .section h3 { color: #0891b2; margin-bottom: 10px; }
    .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge.essentiel { background: #e2e8f0; color: #475569; }
    .badge.serenite { background: #cffafe; color: #0891b2; }
    .badge.expert { background: #ede9fe; color: #7c3aed; }
    .indice { font-size: 48px; font-weight: 700; color: #059669; text-align: center; margin: 20px 0; }
    .footer { margin-top: 30px; text-align: center; color: #64748b; font-size: 12px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 32px; margin-bottom: 10px;">⚡</div>
      <h1>Capital Énergie - Audit Démo</h1>
      <p>Cellule d'Expertise Réglementaire</p>
    </div>
    <div class="main">
      <div class="section">
        <h3>📋 Entreprise Analysée</h3>
        <p><strong>${prospect.nom}</strong></p>
        <p>${prospect.ville} (${prospect.departement})</p>
        <p style="margin-top: 10px;">
          <span class="badge ${modele.forfait.toLowerCase().replace('é', 'e')}">${modele.badge} Forfait recommandé : ${modele.forfait}</span>
        </p>
      </div>
      
      <div class="section">
        <h3>🔒 Indice de Sécurité Simulé</h3>
        <div class="indice">92%</div>
        <p style="text-align: center; color: #059669;">✅ Dossier conforme - Éligible au paiement</p>
      </div>
      
      <div class="section">
        <h3>📊 Points de Contrôle</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 8px 0;">✅ Qualification RGE valide</li>
          <li style="padding: 8px 0;">✅ Fiche CEE BAR-TH-104 applicable</li>
          <li style="padding: 8px 0;">✅ Mentions légales conformes</li>
          <li style="padding: 8px 0;">✅ Délai de rétractation respecté</li>
          <li style="padding: 8px 0;">⚠️ Attestation sur l'honneur à vérifier</li>
        </ul>
      </div>
      
      <div class="section">
        <h3>💡 Recommandations</h3>
        <p>Ce dossier présente un excellent niveau de conformité. Nous recommandons de vérifier la présence de l'attestation sur l'honneur signée avant soumission finale.</p>
      </div>
      
      <div class="footer">
        <p>Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.</p>
        <p style="margin-top: 10px;">Capital Énergie © 2025 • Système d'Audit</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const chemin = path.join(CONFIG.dossierAudits, `audit-demo-${nomSafe}.html`);
  fs.writeFileSync(chemin, html, 'utf8');
  
  return chemin;
}

// ============================================================================
// GÉNÉRATION DES EMAILS
// ============================================================================

/**
 * Génère un email personnalisé pour un prospect
 */
function genererEmail(prospect) {
  const modele = getModeleParProfil(prospect.profil);
  const nomGerant = extraireNomGerant(prospect.dirigeant);
  
  const variables = {
    nomGerant,
    nomEntreprise: prospect.nom,
  };
  
  const objet = modele.objet(variables);
  const corps = modele.corps(variables);
  
  // Vérifier/générer la pièce jointe
  let pieceJointe = null;
  if (!pieceJointeExiste(prospect)) {
    pieceJointe = genererAuditDemo(prospect);
  } else {
    pieceJointe = getCheminAuditDemo(prospect);
  }
  
  return {
    destinataire: {
      nom: prospect.nom,
      dirigeant: prospect.dirigeant,
      email: prospect.email,
      ville: prospect.ville,
    },
    forfaitCible: modele.forfait,
    badge: modele.badge,
    objet,
    corps,
    pieceJointe,
  };
}

// ============================================================================
// MODE SIMULATION / TEST
// ============================================================================

/**
 * Simule l'envoi d'emails pour tous les prospects
 */
function simulerTousEmails() {
  const prospects = chargerProspects();
  
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  📧 SIMULATION DE CAMPAGNE                              │');
  console.log('  │  Mode test - Aucun email envoyé                         │');
  console.log('  └─────────────────────────────────────────────────────────┘\n');
  
  if (prospects.length === 0) {
    console.log('  ⚠️  Aucun prospect trouvé.\n');
    return;
  }
  
  const resultats = { essentiel: 0, serenite: 0, expert: 0 };
  
  prospects.forEach((prospect, index) => {
    const email = genererEmail(prospect);
    
    console.log('  ═══════════════════════════════════════════════════════════');
    console.log(`  📧 EMAIL ${index + 1}/${prospects.length}`);
    console.log('  ═══════════════════════════════════════════════════════════\n');
    
    console.log(`  ${email.badge} Forfait ciblé : ${email.forfaitCible}`);
    console.log(`  👤 Destinataire : ${email.destinataire.nom}`);
    console.log(`  📧 Email : ${email.destinataire.email}`);
    console.log(`  📍 Ville : ${email.destinataire.ville}`);
    console.log(`  🏷️  Profil : ${prospect.profil || 'artisan'}\n`);
    
    console.log(`  📝 OBJET :`);
    console.log(`     ${email.objet}\n`);
    
    console.log(`  📄 PIÈCE JOINTE :`);
    console.log(`     ${email.pieceJointe}\n`);
    
    console.log(`  📋 APERÇU DU CORPS :`);
    console.log('  ─────────────────────────────────────────────────────────');
    const lignes = email.corps.split('\n').slice(0, 10);
    lignes.forEach(l => console.log(`     ${l}`));
    console.log('     [...]\n');
    
    // Comptage
    const forfaitKey = email.forfaitCible.toLowerCase().replace('é', 'e');
    if (resultats[forfaitKey] !== undefined) {
      resultats[forfaitKey]++;
    }
  });
  
  console.log('  ═══════════════════════════════════════════════════════════');
  console.log('  📊 RÉSUMÉ DE LA SIMULATION\n');
  console.log(`     Total prospects    : ${prospects.length}`);
  console.log(`     🔵 Essentiel       : ${resultats.essentiel}`);
  console.log(`     ⭐ Sérénité        : ${resultats.serenite}`);
  console.log(`     👑 Expert          : ${resultats.expert}`);
  console.log('\n  ✅ Simulation terminée - Aucun email envoyé.\n');
}

/**
 * Affiche l'aperçu d'un email pour un prospect spécifique
 */
function afficherApercu(identifiant) {
  const prospect = trouverProspect(identifiant);
  
  if (!prospect) {
    console.log(`\n  ❌ Prospect non trouvé : ${identifiant}\n`);
    return;
  }
  
  const email = genererEmail(prospect);
  
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  📧 APERÇU EMAIL                                        │');
  console.log('  └─────────────────────────────────────────────────────────┘\n');
  
  console.log(`  ${email.badge} Forfait ciblé : ${email.forfaitCible}`);
  console.log(`  👤 Destinataire : ${email.destinataire.nom} (${email.destinataire.dirigeant})`);
  console.log(`  📧 Email : ${email.destinataire.email}`);
  console.log(`  📍 Ville : ${email.destinataire.ville}`);
  console.log(`  🏷️  Profil : ${prospect.profil || 'artisan'}\n`);
  
  console.log('  ─────────────────────────────────────────────────────────');
  console.log(`  📝 OBJET : ${email.objet}`);
  console.log('  ─────────────────────────────────────────────────────────\n');
  
  console.log('  📋 CORPS DU MESSAGE :');
  console.log('  ─────────────────────────────────────────────────────────');
  email.corps.split('\n').forEach(l => console.log(`  ${l}`));
  console.log('  ─────────────────────────────────────────────────────────\n');
  
  console.log(`  📎 PIÈCE JOINTE : ${email.pieceJointe}\n`);
}

/**
 * Liste tous les prospects avec leur forfait ciblé
 */
function listerProspects() {
  const prospects = chargerProspects();
  
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  👥 LISTE DES PROSPECTS                                 │');
  console.log('  └─────────────────────────────────────────────────────────┘\n');
  
  if (prospects.length === 0) {
    console.log('  ⚠️  Aucun prospect trouvé.\n');
    return;
  }
  
  prospects.forEach(prospect => {
    const modele = getModeleParProfil(prospect.profil);
    const pjExiste = pieceJointeExiste(prospect) ? '✅' : '❌';
    
    console.log(`     ${modele.badge} ${prospect.nom}`);
    console.log(`        ID: ${prospect.id} | ${prospect.email}`);
    console.log(`        Profil: ${prospect.profil || 'artisan'} → Forfait ${modele.forfait}`);
    console.log(`        Pièce jointe: ${pjExiste}\n`);
  });
  
  console.log(`  Total : ${prospects.length} prospect(s)\n`);
}

// ============================================================================
// ENVOI D'EMAILS (SIMULATION)
// ============================================================================

/**
 * Simule l'envoi d'une campagne complète
 */
async function lancerCampagne() {
  const prospects = chargerProspects();
  
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  🚀 LANCEMENT DE CAMPAGNE                               │');
  console.log('  │  Mode simulation activé                                 │');
  console.log('  └─────────────────────────────────────────────────────────┘\n');
  
  let envoyes = 0;
  let erreurs = 0;
  
  for (const prospect of prospects) {
    const email = genererEmail(prospect);
    
    console.log(`  📧 ${email.badge} ${prospect.nom}...`);
    
    // Simulation d'envoi
    await new Promise(r => setTimeout(r, 500));
    
    console.log(`     ✅ Email préparé (${email.forfaitCible})`);
    envoyes++;
  }
  
  console.log('\n  ─────────────────────────────────────────────────────────');
  console.log(`  📊 Campagne terminée : ${envoyes} emails préparés, ${erreurs} erreurs\n`);
  console.log('  💡 Pour envoyer réellement, configurez RESEND_API_KEY\n');
}

// ============================================================================
// INTERFACE LIGNE DE COMMANDE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const commande = args[0] || 'help';

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   CAPITAL ÉNERGIE - SERVICE DE PROSPECTION v2.0.0         ║');
  console.log('║   Ciblage automatique par profil                          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  switch (commande) {
    case 'tester':
    case 'test':
    case 'simulation': {
      simulerTousEmails();
      break;
    }
    
    case 'apercu':
    case 'preview': {
      const id = args[1];
      if (!id) {
        console.log('\n  ❌ Usage : node service-prospection.js apercu <id_prospect>\n');
        break;
      }
      afficherApercu(id);
      break;
    }
    
    case 'liste':
    case 'list': {
      listerProspects();
      break;
    }
    
    case 'campagne':
    case 'campaign': {
      await lancerCampagne();
      break;
    }
    
    case 'generer-audits': {
      const prospects = chargerProspects();
      console.log('\n  📄 Génération des audits démo...\n');
      
      prospects.forEach(prospect => {
        const chemin = genererAuditDemo(prospect);
        console.log(`  ✅ ${prospect.nom} → ${chemin}`);
      });
      
      console.log(`\n  📁 ${prospects.length} audits générés dans ${CONFIG.dossierAudits}/\n`);
      break;
    }
    
    case 'help':
    default: {
      console.log('\n  📖 COMMANDES DISPONIBLES :\n');
      console.log('  tester               Simule l\'envoi pour tous les prospects');
      console.log('                       Affiche l\'aperçu de chaque email');
      console.log('');
      console.log('  apercu <id>          Aperçu complet d\'un email');
      console.log('');
      console.log('  liste                Liste les prospects avec leur ciblage');
      console.log('');
      console.log('  campagne             Lance une campagne (simulation)');
      console.log('');
      console.log('  generer-audits       Génère les audits démo pour tous');
      console.log('');
      console.log('  help                 Affiche cette aide');
      console.log('');
      console.log('  🎯 CIBLAGE AUTOMATIQUE :');
      console.log('     profil "artisan" → 🔵 Modèle ESSENTIEL');
      console.log('     profil "pme"     → ⭐ Modèle SÉRÉNITÉ');
      console.log('     profil "leader"  → 👑 Modèle EXPERT');
      console.log('');
      console.log('  📎 PIÈCES JOINTES :');
      console.log('     Audit démo généré automatiquement pour chaque prospect');
      console.log('     ./audits-demo/audit-demo-[nom-client].html');
      console.log('');
      console.log('  💡 EXEMPLE :');
      console.log('     node service-prospection.js tester');
      console.log('     node service-prospection.js apercu CELSIUS\n');
    }
  }
}

// Exécution
if (require.main === module) {
  main().catch(console.error);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  chargerProspects,
  trouverProspect,
  getModeleParProfil,
  genererEmail,
  genererAuditDemo,
  simulerTousEmails,
  afficherApercu,
  listerProspects,
  MODELES_EMAILS,
  CONFIG,
};
