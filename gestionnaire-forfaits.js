/**
 * ============================================================================
 * CAPITAL ÉNERGIE - SERVICE DE GESTION DES FORFAITS
 * ============================================================================
 * Module de gestion des forfaits clients, quotas et priorisation
 * 
 * Forfaits disponibles :
 *   - Essentiel (149€/mois) : 3 dossiers max, priorité normale
 *   - Sérénité (390€/mois)  : 15 dossiers, priorité haute
 *   - Expert (890€/mois)    : Illimité, priorité critique
 * 
 * Usage :
 *   const gf = require('./gestionnaire-forfaits');
 *   gf.verifierQuota('client-001');
 *   gf.prioriserFileAttente(fichiers);
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  fichierClients: './clients-privileges.json',
  moisFormat: () => new Date().toISOString().slice(0, 7), // YYYY-MM
};

// ============================================================================
// CHARGEMENT DES DONNÉES
// ============================================================================

/**
 * Charge les données des clients et forfaits
 */
function chargerDonnees() {
  const chemin = path.resolve(CONFIG.fichierClients);
  
  if (!fs.existsSync(chemin)) {
    console.error('  ❌ Fichier clients-privileges.json non trouvé');
    return null;
  }
  
  try {
    return JSON.parse(fs.readFileSync(chemin, 'utf8'));
  } catch (e) {
    console.error('  ❌ Erreur lecture clients-privileges.json:', e.message);
    return null;
  }
}

/**
 * Sauvegarde les données des clients
 */
function sauvegarderDonnees(donnees) {
  const chemin = path.resolve(CONFIG.fichierClients);
  
  try {
    donnees.metadata.derniereMAJ = new Date().toISOString().split('T')[0];
    fs.writeFileSync(chemin, JSON.stringify(donnees, null, 2));
    return true;
  } catch (e) {
    console.error('  ❌ Erreur sauvegarde:', e.message);
    return false;
  }
}

// ============================================================================
// GESTION DES CLIENTS
// ============================================================================

/**
 * Recherche un client par son ID, email ou nom
 */
function trouverClient(identifiant) {
  const donnees = chargerDonnees();
  if (!donnees) return null;
  
  const idLower = identifiant.toLowerCase();
  
  return donnees.clients.find(c => 
    c.id === identifiant ||
    c.email.toLowerCase() === idLower ||
    c.nom.toLowerCase().includes(idLower)
  );
}

/**
 * Récupère le forfait d'un client
 */
function getForfaitClient(client) {
  const donnees = chargerDonnees();
  if (!donnees || !client) return null;
  
  return donnees.forfaits[client.forfait] || null;
}

/**
 * Récupère les infos complètes d'un client avec son forfait
 */
function getInfosClient(identifiant) {
  const client = trouverClient(identifiant);
  if (!client) return null;
  
  const forfait = getForfaitClient(client);
  
  return {
    ...client,
    forfaitDetails: forfait,
  };
}

// ============================================================================
// GESTION DES QUOTAS
// ============================================================================

/**
 * Vérifie si un client a atteint son quota mensuel
 * @returns {Object} { autorise, restant, limite, message }
 */
function verifierQuota(identifiant) {
  const donnees = chargerDonnees();
  if (!donnees) {
    return { autorise: true, restant: 999, limite: -1, message: null };
  }
  
  const client = donnees.clients.find(c => 
    c.id === identifiant ||
    c.email.toLowerCase() === identifiant.toLowerCase() ||
    c.nom.toLowerCase().includes(identifiant.toLowerCase())
  );
  
  if (!client) {
    // Client non trouvé = client gratuit avec limite très basse
    return {
      autorise: false,
      restant: 0,
      limite: 0,
      message: '⚠️ Client non enregistré - Contactez Capital Énergie pour activer votre forfait.',
    };
  }
  
  const forfait = donnees.forfaits[client.forfait];
  if (!forfait) {
    return { autorise: true, restant: 999, limite: -1, message: null };
  }
  
  // Réinitialiser le compteur si nouveau mois
  const moisActuel = CONFIG.moisFormat();
  if (client.moisEnCours !== moisActuel) {
    client.dossiersTraitesCeMois = 0;
    client.moisEnCours = moisActuel;
    sauvegarderDonnees(donnees);
  }
  
  // Forfait illimité
  if (forfait.dossiersMax === -1) {
    return {
      autorise: true,
      restant: -1, // Illimité
      limite: -1,
      forfait: forfait.nom,
      badge: forfait.badge,
      message: null,
    };
  }
  
  const restant = forfait.dossiersMax - client.dossiersTraitesCeMois;
  const autorise = restant > 0;
  
  return {
    autorise,
    restant,
    limite: forfait.dossiersMax,
    utilises: client.dossiersTraitesCeMois,
    forfait: forfait.nom,
    badge: forfait.badge,
    priorite: forfait.priorite,
    message: autorise ? null : genererMessageLimite(forfait),
  };
}

/**
 * Génère le message d'avertissement quand la limite est atteinte
 */
function genererMessageLimite(forfaitActuel) {
  const forfaitsSupérieurs = {
    'essentiel': 'Sérénité (390€/mois - 15 dossiers)',
    'serenite': 'Expert (890€/mois - Illimité)',
    'expert': null,
  };
  
  const superieur = forfaitsSupérieurs[forfaitActuel.nom.toLowerCase().replace('é', 'e')];
  
  if (superieur) {
    return `⚠️ LIMITE DE PROTECTION ATTEINTE - Pour sécuriser ce dossier, passez au Forfait ${superieur}`;
  }
  
  return '⚠️ LIMITE DE PROTECTION ATTEINTE';
}

/**
 * Incrémente le compteur de dossiers traités pour un client
 */
function incrementerCompteur(identifiant) {
  const donnees = chargerDonnees();
  if (!donnees) return false;
  
  const client = donnees.clients.find(c => 
    c.id === identifiant ||
    c.email.toLowerCase() === identifiant.toLowerCase() ||
    c.nom.toLowerCase().includes(identifiant.toLowerCase())
  );
  
  if (!client) return false;
  
  // Réinitialiser si nouveau mois
  const moisActuel = CONFIG.moisFormat();
  if (client.moisEnCours !== moisActuel) {
    client.dossiersTraitesCeMois = 0;
    client.moisEnCours = moisActuel;
  }
  
  client.dossiersTraitesCeMois++;
  return sauvegarderDonnees(donnees);
}

// ============================================================================
// PRIORISATION DE LA FILE D'ATTENTE
// ============================================================================

/**
 * Trie la file d'attente par priorité de forfait
 * @param {Array} fichiers - Liste des fichiers avec métadonnées client
 * @returns {Array} Liste triée par priorité décroissante
 */
function prioriserFileAttente(fichiers) {
  const donnees = chargerDonnees();
  if (!donnees) return fichiers;
  
  return fichiers
    .map(fichier => {
      // Extraire l'identifiant client du nom de fichier ou métadonnées
      const clientId = extraireClientId(fichier);
      const client = clientId ? trouverClient(clientId) : null;
      const forfait = client ? donnees.forfaits[client.forfait] : null;
      
      return {
        ...fichier,
        nomFichier: typeof fichier === 'string' ? fichier : fichier.nomFichier,
        client: client?.nom || 'Inconnu',
        forfait: forfait?.nom || 'Standard',
        prioriteNiveau: forfait?.prioriteNiveau || 0,
        priorite: forfait?.priorite || 'basse',
        badge: forfait?.badge || '⚪',
      };
    })
    .sort((a, b) => b.prioriteNiveau - a.prioriteNiveau);
}

/**
 * Extrait l'identifiant client d'un nom de fichier
 * Convention: [CLIENT-ID]_devis.pdf ou client-xxx_*.pdf
 */
function extraireClientId(fichier) {
  const nom = typeof fichier === 'string' ? fichier : fichier.nomFichier || fichier.nom || '';
  
  // Pattern: client-xxx_...
  const match = nom.match(/^(client-\d+)/i);
  if (match) return match[1];
  
  // Pattern: [NomEntreprise]_...
  const matchNom = nom.match(/^\[([^\]]+)\]/);
  if (matchNom) return matchNom[1];
  
  // Pattern: NomEntreprise_devis...
  const matchSimple = nom.match(/^([A-Za-z]+(?:-[A-Za-z]+)*)/);
  if (matchSimple) return matchSimple[1];
  
  return null;
}

/**
 * Affiche la file d'attente priorisée
 */
function afficherFileAttente(fichiers) {
  const fileTriee = prioriserFileAttente(fichiers);
  
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  📋 FILE D\'ATTENTE PRIORISÉE                            │');
  console.log('  └─────────────────────────────────────────────────────────┘\n');
  
  if (fileTriee.length === 0) {
    console.log('     ⚪ Aucun fichier en attente\n');
    return fileTriee;
  }
  
  fileTriee.forEach((f, i) => {
    const prioriteLabel = f.priorite === 'critique' ? '🔴 CRITIQUE' :
                          f.priorite === 'haute' ? '🟠 HAUTE' : '🟢 NORMALE';
    console.log(`     ${i + 1}. ${f.badge} ${f.nomFichier}`);
    console.log(`        Client: ${f.client} | Forfait: ${f.forfait} | ${prioriteLabel}\n`);
  });
  
  return fileTriee;
}

// ============================================================================
// GÉNÉRATION DU BANDEAU LIMITE
// ============================================================================

/**
 * Génère le HTML du bandeau de limite atteinte
 */
function genererBandeauLimiteHTML(forfaitActuel) {
  const forfaitsDetails = {
    'essentiel': { suivant: 'Sérénité', prix: '390€/mois', dossiers: '15 dossiers' },
    'serenite': { suivant: 'Expert', prix: '890€/mois', dossiers: 'Illimité' },
  };
  
  const suivant = forfaitsDetails[forfaitActuel.toLowerCase().replace('é', 'e')];
  
  if (!suivant) return '';
  
  return `
    <div style="
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    ">
      <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
      <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px;">
        LIMITE DE PROTECTION ATTEINTE
      </h3>
      <p style="color: #78350f; margin: 0 0 15px 0; font-size: 14px;">
        Votre forfait actuel ne permet plus de sécuriser de nouveaux dossiers ce mois-ci.
      </p>
      <div style="
        background: #059669;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        display: inline-block;
        font-weight: 600;
      ">
        Passer au Forfait ${suivant.suivant} (${suivant.prix} - ${suivant.dossiers})
      </div>
      <p style="color: #92400e; margin: 15px 0 0 0; font-size: 12px;">
        Contactez-nous : contact@capital-energie.fr
      </p>
    </div>
  `;
}

/**
 * Génère le bandeau limite pour le terminal
 */
function afficherBandeauLimiteConsole(client, quota) {
  console.log('\n  ╔═══════════════════════════════════════════════════════════╗');
  console.log('  ║                                                           ║');
  console.log('  ║   ⚠️  LIMITE DE PROTECTION ATTEINTE                        ║');
  console.log('  ║                                                           ║');
  console.log('  ╠═══════════════════════════════════════════════════════════╣');
  console.log(`  ║   Client : ${client.padEnd(46)}║`);
  console.log(`  ║   Forfait : ${quota.forfait.padEnd(45)}║`);
  console.log(`  ║   Dossiers : ${quota.utilises}/${quota.limite} utilisés ce mois                    ║`);
  console.log('  ║                                                           ║');
  console.log('  ║   👉 Passez au forfait supérieur pour continuer           ║');
  console.log('  ║   📧 contact@capital-energie.fr                           ║');
  console.log('  ║                                                           ║');
  console.log('  ╚═══════════════════════════════════════════════════════════╝\n');
}

// ============================================================================
// STATISTIQUES
// ============================================================================

/**
 * Affiche les statistiques des forfaits
 */
function afficherStatistiques() {
  const donnees = chargerDonnees();
  if (!donnees) return;
  
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  📊 STATISTIQUES FORFAITS                               │');
  console.log('  └─────────────────────────────────────────────────────────┘\n');
  
  const stats = {
    essentiel: { count: 0, dossiers: 0 },
    serenite: { count: 0, dossiers: 0 },
    expert: { count: 0, dossiers: 0 },
  };
  
  donnees.clients.forEach(c => {
    if (stats[c.forfait]) {
      stats[c.forfait].count++;
      stats[c.forfait].dossiers += c.dossiersTraitesCeMois || 0;
    }
  });
  
  Object.entries(donnees.forfaits).forEach(([key, forfait]) => {
    const s = stats[key] || { count: 0, dossiers: 0 };
    console.log(`     ${forfait.badge} ${forfait.nom.padEnd(12)} : ${s.count} clients, ${s.dossiers} dossiers ce mois`);
  });
  
  console.log('');
}

/**
 * Liste tous les clients avec leur statut de quota
 */
function listerClients() {
  const donnees = chargerDonnees();
  if (!donnees) return [];
  
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  👥 LISTE DES CLIENTS                                   │');
  console.log('  └─────────────────────────────────────────────────────────┘\n');
  
  donnees.clients.forEach(client => {
    const forfait = donnees.forfaits[client.forfait];
    const quota = verifierQuota(client.id);
    
    const restantStr = quota.restant === -1 ? '∞' : `${quota.restant}/${quota.limite}`;
    const statut = quota.autorise ? '✅' : '⚠️';
    
    console.log(`     ${forfait?.badge || '⚪'} ${client.nom}`);
    console.log(`        Forfait: ${forfait?.nom || 'N/A'} | Quota: ${statut} ${restantStr} restants\n`);
  });
  
  return donnees.clients;
}

// ============================================================================
// INTERFACE LIGNE DE COMMANDE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const commande = args[0] || 'help';

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   CAPITAL ÉNERGIE - SERVICE DE GESTION DES FORFAITS       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  switch (commande) {
    case 'quota': {
      const client = args[1];
      if (!client) {
        console.log('\n  ❌ Usage : node gestionnaire-forfaits.js quota <client>\n');
        break;
      }
      
      const quota = verifierQuota(client);
      console.log('\n  📊 VÉRIFICATION QUOTA\n');
      console.log(`     Client    : ${client}`);
      console.log(`     Forfait   : ${quota.badge || '⚪'} ${quota.forfait || 'N/A'}`);
      console.log(`     Autorisé  : ${quota.autorise ? '✅ Oui' : '❌ Non'}`);
      
      if (quota.limite === -1) {
        console.log('     Quota     : ∞ Illimité');
      } else {
        console.log(`     Quota     : ${quota.utilises}/${quota.limite} utilisés`);
        console.log(`     Restant   : ${quota.restant} dossiers`);
      }
      
      if (quota.message) {
        console.log(`\n     ${quota.message}`);
      }
      console.log('');
      break;
    }
    
    case 'liste':
    case 'clients': {
      listerClients();
      break;
    }
    
    case 'stats':
    case 'statistiques': {
      afficherStatistiques();
      break;
    }
    
    case 'priorite':
    case 'file': {
      // Simuler une file d'attente
      const fichiersTest = [
        'client-002_devis-pompe.pdf',
        'client-001_devis-isolation.pdf',
        'client-003_devis-chaudiere.pdf',
        'client-004_devis-fenetre.pdf',
      ];
      afficherFileAttente(fichiersTest);
      break;
    }
    
    case 'help':
    default: {
      console.log('\n  📖 COMMANDES DISPONIBLES :\n');
      console.log('  quota <client>       Vérifie le quota d\'un client');
      console.log('');
      console.log('  liste                Liste tous les clients');
      console.log('');
      console.log('  stats                Affiche les statistiques forfaits');
      console.log('');
      console.log('  file                 Affiche la file d\'attente priorisée');
      console.log('');
      console.log('  help                 Affiche cette aide');
      console.log('');
      console.log('  💼 FORFAITS :');
      console.log('     🔵 Essentiel : 149€/mois - 3 dossiers');
      console.log('     ⭐ Sérénité  : 390€/mois - 15 dossiers');
      console.log('     👑 Expert    : 890€/mois - Illimité');
      console.log('');
    }
  }
}

// Exécution si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  chargerDonnees,
  trouverClient,
  getForfaitClient,
  getInfosClient,
  verifierQuota,
  incrementerCompteur,
  prioriserFileAttente,
  extraireClientId,
  afficherFileAttente,
  genererBandeauLimiteHTML,
  afficherBandeauLimiteConsole,
  afficherStatistiques,
  listerClients,
  CONFIG,
};
