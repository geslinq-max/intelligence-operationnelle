/**
 * ============================================================================
 * CAPITAL ÉNERGIE - AGENT ROUTEUR (CAMPAGNES EMAIL)
 * ============================================================================
 * Gestion des campagnes d'emailing vers les prospects RGE
 * 
 * Usage :
 *   node agent-routeur.js liste           Liste les prospects disponibles
 *   node agent-routeur.js apercu [id]     Aperçu d'un email personnalisé
 *   node agent-routeur.js campagne        Lance une campagne (simulation)
 *   node agent-routeur.js envoyer [id]    Envoie à un prospect spécifique
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
  expediteur: {
    nom: 'Max Geslin',
    cabinet: 'Capital Énergie',
    email: 'contact@capital-energie.fr',
    telephone: '01 23 45 67 89',
  },
  resendApiKey: process.env.RESEND_API_KEY,
  testEmail: process.env.TEST_EMAIL || 'geslinq@gmail.com',
};

// ============================================================================
// CHARGEMENT DES PROSPECTS
// ============================================================================

function chargerProspects() {
  const chemin = path.resolve(CONFIG.fichierProspects);
  
  if (!fs.existsSync(chemin)) {
    throw new Error(`Fichier prospects non trouvé: ${chemin}`);
  }
  
  const data = JSON.parse(fs.readFileSync(chemin, 'utf8'));
  return data.prospects || [];
}

// ============================================================================
// GÉNÉRATION DES EMAILS PERSONNALISÉS
// ============================================================================

function genererEmailPersonnalise(prospect) {
  // Extraire le prénom/titre du dirigeant
  const nomDirigeant = extraireNomDirigeant(prospect.dirigeant);
  const nomEntreprise = prospect.nom;
  
  // Objet de l'email
  const objet = `Analyse immédiate de vos zones de risque de trésorerie - ${nomEntreprise}`;

  // Corps du message (modèle "avenant" v2)
  const corps = `Bonjour ${nomDirigeant},

Je sais qu'en tant qu'artisan RGE, votre place est sur vos chantiers et non coincé derrière un bureau à gérer la complexité des dossiers CEE.

C'est pour vous redonner cette liberté que j'ai créé un cabinet d'accompagnement d'un nouveau genre. J'ai bâti une solution technique propriétaire qui me permet de sécuriser vos primes beaucoup plus vite que les méthodes traditionnelles, tout en vous déchargeant totalement de la paperasse.

Concrètement, j'ai automatisé les tâches les plus lourdes pour me concentrer sur l'essentiel : la sécurité de vos paiements. Grâce aux outils de précision que j'utilise, je peux vous offrir :

✅ Une analyse immédiate de vos zones de risque de trésorerie : En quelques instants, je détecte les failles qui pourraient bloquer ou retarder le paiement de vos primes CEE.

✅ Un Indice de Sécurité fiable : Vous savez avant même le dépôt si le dossier est valide à 100%.

✅ Un suivi client aux petits soins : Si une pièce manque, mon système s'occupe de relancer poliment vos clients pour vous, afin que vous n'ayez pas à courir après les documents.

Pour vous démontrer l'efficacité de cette approche, je vous offre un check-up complet, totalement gratuit et sans aucun engagement.

👉 Envoyez-moi simplement vos derniers dossiers (que ce soit votre dernier devis ou vos 10 derniers dossiers finalisés).

Je vous renverrai une analyse détaillée avec l'Indice de Sécurité de chaque dossier. Vous pourrez ainsi juger par vous-même de la précision de mon accompagnement.

Dans l'attente de découvrir vos projets, je vous souhaite une excellente journée sur vos chantiers.

Bien cordialement,

${CONFIG.expediteur.nom}
Fondateur de ${CONFIG.expediteur.cabinet}

---
Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.`;

  return {
    destinataire: {
      nom: prospect.nom,
      dirigeant: prospect.dirigeant,
      email: prospect.email,
      ville: prospect.ville,
    },
    objet,
    corps,
    variables: {
      nomDirigeant,
      nomEntreprise,
      ville: prospect.ville,
    },
  };
}

function extraireNomDirigeant(dirigeant) {
  if (!dirigeant || dirigeant === 'Responsable') {
    return 'Madame, Monsieur';
  }
  
  // Extraire le nom après "M." ou "Mme"
  const match = dirigeant.match(/^(M\.|Mme|Mr)\s*(.+)$/i);
  if (match) {
    return match[0]; // Retourne "M. Machin" ou "Mme X"
  }
  
  return dirigeant;
}

// ============================================================================
// AFFICHAGE
// ============================================================================

function afficherListeProspects(prospects) {
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  📋 LISTE DES PROSPECTS                                 │');
  console.log('  └─────────────────────────────────────────────────────────┘\n');
  
  console.log('  ┌──────────────┬─────────────────────────┬────────────────┬───────────────┐');
  console.log('  │ ID           │ Entreprise              │ Dirigeant      │ Ville         │');
  console.log('  ├──────────────┼─────────────────────────┼────────────────┼───────────────┤');
  
  prospects.forEach(p => {
    const id = (p.id || 'N/A').padEnd(12);
    const nom = p.nom.substring(0, 23).padEnd(23);
    const dirigeant = (p.dirigeant || 'N/A').substring(0, 14).padEnd(14);
    const ville = (p.ville || 'N/A').substring(0, 13).padEnd(13);
    console.log(`  │ ${id} │ ${nom} │ ${dirigeant} │ ${ville} │`);
  });
  
  console.log('  └──────────────┴─────────────────────────┴────────────────┴───────────────┘\n');
  console.log(`  📊 Total : ${prospects.length} prospect(s)\n`);
}

function afficherApercuEmail(email) {
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  📧 APERÇU EMAIL PERSONNALISÉ                           │');
  console.log('  └─────────────────────────────────────────────────────────┘\n');
  
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  DESTINATAIRE\n');
  console.log(`     🏢 Entreprise : ${email.destinataire.nom}`);
  console.log(`     👤 Dirigeant  : ${email.destinataire.dirigeant}`);
  console.log(`     📧 Email      : ${email.destinataire.email}`);
  console.log(`     📍 Ville      : ${email.destinataire.ville}`);
  
  console.log('\n  ─────────────────────────────────────────────────────────');
  console.log('  OBJET\n');
  console.log(`     ${email.objet}`);
  
  console.log('\n  ─────────────────────────────────────────────────────────');
  console.log('  CORPS DU MESSAGE\n');
  console.log('  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐');
  
  // Afficher le corps avec indentation
  const lignes = email.corps.split('\n');
  lignes.forEach(ligne => {
    console.log(`  │ ${ligne}`);
  });
  
  console.log('  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘\n');
  
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  VARIABLES UTILISÉES\n');
  console.log(`     [Nom du Dirigeant]  → ${email.variables.nomDirigeant}`);
  console.log(`     [Nom de l'Entreprise] → ${email.variables.nomEntreprise}`);
  console.log(`     [Ville]             → ${email.variables.ville}\n`);
}

function afficherResumeCampagne(prospects) {
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  🚀 RÉSUMÉ CAMPAGNE PRÊTE                               │');
  console.log('  └─────────────────────────────────────────────────────────┘\n');
  
  console.log(`     📊 Nombre de destinataires : ${prospects.length}`);
  console.log(`     📧 Expéditeur : ${CONFIG.expediteur.nom} <${CONFIG.expediteur.email}>`);
  console.log(`     📋 Modèle : Audit CEE Automatisé (avenant)\n`);
  
  console.log('     📍 Répartition par ville :');
  const parVille = {};
  prospects.forEach(p => {
    parVille[p.ville] = (parVille[p.ville] || 0) + 1;
  });
  Object.entries(parVille).forEach(([ville, count]) => {
    console.log(`        - ${ville} : ${count}`);
  });
  
  console.log('\n  ─────────────────────────────────────────────────────────');
  console.log('  💡 COMMANDES DISPONIBLES\n');
  console.log('     node agent-routeur.js apercu prospect-001   Voir email');
  console.log('     node agent-routeur.js envoyer prospect-001  Envoyer (test)');
  console.log('     node agent-routeur.js campagne --test       Campagne test\n');
}

// ============================================================================
// ENVOI EMAIL (via Resend)
// ============================================================================

async function envoyerEmail(prospect, testMode = true) {
  const email = genererEmailPersonnalise(prospect);
  const destinataire = testMode ? CONFIG.testEmail : prospect.email;
  
  if (!CONFIG.resendApiKey) {
    console.log('\n  📧 [SIMULATION] Email préparé :');
    console.log(`     À : ${destinataire}`);
    console.log(`     Objet : ${email.objet}`);
    console.log(`     Mode : ${testMode ? 'TEST' : 'RÉEL'}\n`);
    return { success: true, mode: 'simulation' };
  }
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${CONFIG.expediteur.nom} <onboarding@resend.dev>`,
        to: destinataire,
        subject: email.objet,
        text: email.corps,
        tags: [
          { name: 'campagne', value: 'prospection-rge' },
          { name: 'prospect', value: prospect.id || 'unknown' },
        ],
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erreur Resend');
    }
    
    return { success: true, mode: testMode ? 'test' : 'real', id: result.id };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// INTERFACE LIGNE DE COMMANDE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const commande = args[0] || 'help';

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   CAPITAL ÉNERGIE - AGENT ROUTEUR v1.0.0                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  switch (commande) {
    case 'liste':
    case 'list': {
      try {
        const prospects = chargerProspects();
        afficherListeProspects(prospects);
      } catch (error) {
        console.error(`\n  ❌ Erreur : ${error.message}\n`);
      }
      break;
    }
    
    case 'apercu':
    case 'preview': {
      try {
        const prospects = chargerProspects();
        const prospectId = args[1];
        
        let prospect;
        if (prospectId) {
          prospect = prospects.find(p => p.id === prospectId);
          if (!prospect) {
            console.log(`\n  ❌ Prospect "${prospectId}" non trouvé.\n`);
            break;
          }
        } else {
          // Premier prospect par défaut
          prospect = prospects[0];
        }
        
        const email = genererEmailPersonnalise(prospect);
        afficherApercuEmail(email);
        
      } catch (error) {
        console.error(`\n  ❌ Erreur : ${error.message}\n`);
      }
      break;
    }
    
    case 'campagne':
    case 'campaign': {
      try {
        const prospects = chargerProspects();
        const testMode = args.includes('--test');
        
        afficherResumeCampagne(prospects);
        
        if (testMode) {
          console.log('  ⚠️  MODE TEST : Les emails seront envoyés à ' + CONFIG.testEmail);
          console.log('     Ajoutez --confirm pour lancer l\'envoi.\n');
          
          if (args.includes('--confirm')) {
            console.log('  🚀 Lancement de la campagne test...\n');
            
            for (const prospect of prospects) {
              const result = await envoyerEmail(prospect, true);
              const status = result.success ? '✅' : '❌';
              console.log(`     ${status} ${prospect.nom} → ${CONFIG.testEmail}`);
            }
            
            console.log('\n  ✅ Campagne test terminée.\n');
          }
        }
        
      } catch (error) {
        console.error(`\n  ❌ Erreur : ${error.message}\n`);
      }
      break;
    }
    
    case 'envoyer':
    case 'send': {
      try {
        const prospectId = args[1];
        
        if (!prospectId) {
          console.log('\n  ❌ Usage : node agent-routeur.js envoyer <prospect_id>\n');
          break;
        }
        
        const prospects = chargerProspects();
        const prospect = prospects.find(p => p.id === prospectId);
        
        if (!prospect) {
          console.log(`\n  ❌ Prospect "${prospectId}" non trouvé.\n`);
          break;
        }
        
        const email = genererEmailPersonnalise(prospect);
        console.log(`\n  📤 Envoi à ${prospect.nom} (${CONFIG.testEmail})...\n`);
        
        const result = await envoyerEmail(prospect, true);
        
        if (result.success) {
          console.log(`  ✅ Email envoyé avec succès ! (Mode: ${result.mode})\n`);
        } else {
          console.log(`  ❌ Échec : ${result.error}\n`);
        }
        
      } catch (error) {
        console.error(`\n  ❌ Erreur : ${error.message}\n`);
      }
      break;
    }
    
    case 'help':
    default: {
      console.log('\n  📖 COMMANDES DISPONIBLES :\n');
      console.log('  liste                Liste tous les prospects');
      console.log('');
      console.log('  apercu [id]          Aperçu d\'un email personnalisé');
      console.log('                       (défaut: premier prospect)');
      console.log('');
      console.log('  campagne             Prépare une campagne');
      console.log('                       Options : --test, --confirm');
      console.log('');
      console.log('  envoyer <id>         Envoie à un prospect (mode test)');
      console.log('');
      console.log('  help                 Affiche cette aide');
      console.log('');
      console.log('  📁 FICHIERS :');
      console.log(`     Prospects : ${CONFIG.fichierProspects}`);
      console.log('');
      console.log('  💡 EXEMPLE :');
      console.log('     node agent-routeur.js apercu prospect-001');
      console.log('');
    }
  }
}

// Exécution
main().catch(console.error);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  chargerProspects,
  genererEmailPersonnalise,
  envoyerEmail,
  CONFIG,
};
