/**
 * ============================================================================
 * CAPITAL ÉNERGIE - AGENT VEILLEUR RÉGLEMENTAIRE
 * ============================================================================
 * Surveillance des évolutions réglementaires CEE
 * 
 * Usage :
 *   node agent-veilleur.js surveiller     Compare les règles avec la source
 *   node agent-veilleur.js diff           Affiche les différences détaillées
 *   node agent-veilleur.js maj            Propose la mise à jour automatique
 *   node agent-veilleur.js appliquer      Applique les mises à jour
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  fichierReglesLocales: './regles-or.json',
  fichierSourceOfficielle: './source-reglementaire.json',
  fichierConformite: './conformite-cee.js',
  intervalSurveillance: 24 * 60 * 60 * 1000, // 24 heures
};

// Types de changements
const TYPE_CHANGEMENT = {
  SEUIL_RELEVE: { code: 'SEUIL_RELEVE', emoji: '📈', label: 'Seuil relevé', severite: 'CRITIQUE' },
  SEUIL_ABAISSE: { code: 'SEUIL_ABAISSE', emoji: '📉', label: 'Seuil abaissé', severite: 'INFO' },
  NOUVEAU_DOCUMENT: { code: 'NOUVEAU_DOCUMENT', emoji: '📄', label: 'Nouveau document requis', severite: 'IMPORTANT' },
  MONTANT_MODIFIE: { code: 'MONTANT_MODIFIE', emoji: '💰', label: 'Montant modifié', severite: 'IMPORTANT' },
  NOUVELLE_FICHE: { code: 'NOUVELLE_FICHE', emoji: '🆕', label: 'Nouvelle fiche CEE', severite: 'INFO' },
  FICHE_SUPPRIMEE: { code: 'FICHE_SUPPRIMEE', emoji: '🗑️', label: 'Fiche supprimée', severite: 'CRITIQUE' },
  PRIME_MODIFIEE: { code: 'PRIME_MODIFIEE', emoji: '💎', label: 'Prime modifiée', severite: 'INFO' },
};

const SEVERITE = {
  CRITIQUE: { code: 'CRITIQUE', emoji: '🔴', label: 'Critique', priorite: 1 },
  IMPORTANT: { code: 'IMPORTANT', emoji: '🟠', label: 'Important', priorite: 2 },
  INFO: { code: 'INFO', emoji: '🟢', label: 'Information', priorite: 3 },
};

// ============================================================================
// CHARGEMENT DES DONNÉES
// ============================================================================

function chargerReglesLocales() {
  const chemin = path.resolve(CONFIG.fichierReglesLocales);
  
  if (!fs.existsSync(chemin)) {
    throw new Error(`Fichier règles locales non trouvé: ${chemin}`);
  }
  
  return JSON.parse(fs.readFileSync(chemin, 'utf8'));
}

function chargerSourceOfficielle() {
  const chemin = path.resolve(CONFIG.fichierSourceOfficielle);
  
  if (!fs.existsSync(chemin)) {
    throw new Error(`Fichier source officielle non trouvé: ${chemin}`);
  }
  
  return JSON.parse(fs.readFileSync(chemin, 'utf8'));
}

// ============================================================================
// COMPARAISON DES RÈGLES
// ============================================================================

function comparerRegles(locales, officielles) {
  const differences = [];
  
  // Comparer chaque fiche locale avec la source officielle
  for (const [code, ficheLocale] of Object.entries(locales.fiches)) {
    const ficheOfficielle = officielles.fiches[code];
    
    if (!ficheOfficielle) {
      // Fiche supprimée de la source officielle
      differences.push({
        type: TYPE_CHANGEMENT.FICHE_SUPPRIMEE,
        fiche: code,
        message: `La fiche ${code} n'existe plus dans la source officielle`,
        severite: SEVERITE.CRITIQUE,
        ancien: ficheLocale,
        nouveau: null,
      });
      continue;
    }
    
    // Comparer les critères techniques
    const diffTechniques = comparerCriteresTechniques(code, ficheLocale, ficheOfficielle);
    differences.push(...diffTechniques);
    
    // Comparer les montants
    const diffMontants = comparerMontants(code, ficheLocale, ficheOfficielle);
    differences.push(...diffMontants);
    
    // Comparer les documents obligatoires
    const diffDocuments = comparerDocuments(code, ficheLocale, ficheOfficielle);
    differences.push(...diffDocuments);
    
    // Comparer les primes CEE
    const diffPrimes = comparerPrimes(code, ficheLocale, ficheOfficielle);
    differences.push(...diffPrimes);
  }
  
  // Détecter les nouvelles fiches
  for (const [code, ficheOfficielle] of Object.entries(officielles.fiches)) {
    if (!locales.fiches[code]) {
      differences.push({
        type: TYPE_CHANGEMENT.NOUVELLE_FICHE,
        fiche: code,
        message: `Nouvelle fiche CEE détectée: ${ficheOfficielle.nom}`,
        severite: SEVERITE.INFO,
        ancien: null,
        nouveau: ficheOfficielle,
      });
    }
  }
  
  // Trier par sévérité
  differences.sort((a, b) => a.severite.priorite - b.severite.priorite);
  
  return {
    versionLocale: locales.version,
    versionOfficielle: officielles.version,
    dateComparaison: new Date().toISOString(),
    nombreDifferences: differences.length,
    differences,
    miseAJourRequise: differences.some(d => d.severite.code === 'CRITIQUE'),
  };
}

function comparerCriteresTechniques(code, locale, officielle) {
  const differences = [];
  
  const criteresLocaux = locale.criteresTechniques || {};
  const criteresOfficiels = officielle.criteresTechniques || {};
  
  for (const [critere, valeurOfficielle] of Object.entries(criteresOfficiels)) {
    const valeurLocale = criteresLocaux[critere];
    
    if (!valeurLocale) {
      differences.push({
        type: TYPE_CHANGEMENT.SEUIL_RELEVE,
        fiche: code,
        critere: critere,
        message: `Nouveau critère ${valeurOfficielle.parametre} ajouté: ${valeurOfficielle.condition} ${valeurOfficielle.seuil}${valeurOfficielle.unite}`,
        severite: SEVERITE.IMPORTANT,
        ancien: null,
        nouveau: valeurOfficielle.seuil,
      });
      continue;
    }
    
    if (valeurLocale.seuil !== valeurOfficielle.seuil) {
      const estReleve = valeurOfficielle.seuil > valeurLocale.seuil;
      
      differences.push({
        type: estReleve ? TYPE_CHANGEMENT.SEUIL_RELEVE : TYPE_CHANGEMENT.SEUIL_ABAISSE,
        fiche: code,
        critere: critere,
        parametre: valeurOfficielle.parametre,
        message: `${valeurOfficielle.parametre} modifié: ${valeurLocale.seuil}${valeurLocale.unite} → ${valeurOfficielle.seuil}${valeurOfficielle.unite}`,
        severite: estReleve ? SEVERITE.CRITIQUE : SEVERITE.INFO,
        ancien: valeurLocale.seuil,
        nouveau: valeurOfficielle.seuil,
        unite: valeurOfficielle.unite,
      });
    }
  }
  
  return differences;
}

function comparerMontants(code, locale, officielle) {
  const differences = [];
  
  const montantsLocaux = locale.montants || {};
  const montantsOfficiels = officielle.montants || {};
  
  // Comparer plafond TTC
  if (montantsLocaux.plafondTTC !== montantsOfficiels.plafondTTC) {
    differences.push({
      type: TYPE_CHANGEMENT.MONTANT_MODIFIE,
      fiche: code,
      critere: 'plafondTTC',
      message: `Plafond TTC modifié: ${montantsLocaux.plafondTTC}€ → ${montantsOfficiels.plafondTTC}€`,
      severite: SEVERITE.IMPORTANT,
      ancien: montantsLocaux.plafondTTC,
      nouveau: montantsOfficiels.plafondTTC,
    });
  }
  
  // Comparer plancher TTC
  if (montantsLocaux.plancherTTC !== montantsOfficiels.plancherTTC) {
    differences.push({
      type: TYPE_CHANGEMENT.MONTANT_MODIFIE,
      fiche: code,
      critere: 'plancherTTC',
      message: `Plancher TTC modifié: ${montantsLocaux.plancherTTC}€ → ${montantsOfficiels.plancherTTC}€`,
      severite: SEVERITE.IMPORTANT,
      ancien: montantsLocaux.plancherTTC,
      nouveau: montantsOfficiels.plancherTTC,
    });
  }
  
  return differences;
}

function comparerDocuments(code, locale, officielle) {
  const differences = [];
  
  const docsLocaux = locale.documentsObligatoires || [];
  const docsOfficiels = officielle.documentsObligatoires || [];
  
  // Nouveaux documents requis
  const nouveauxDocs = docsOfficiels.filter(d => !docsLocaux.includes(d));
  
  nouveauxDocs.forEach(doc => {
    differences.push({
      type: TYPE_CHANGEMENT.NOUVEAU_DOCUMENT,
      fiche: code,
      critere: 'documentsObligatoires',
      message: `Nouveau document requis: ${doc}`,
      severite: SEVERITE.IMPORTANT,
      ancien: null,
      nouveau: doc,
    });
  });
  
  return differences;
}

function comparerPrimes(code, locale, officielle) {
  const differences = [];
  
  const primesLocales = locale.montants?.primeCEE || {};
  const primesOfficielles = officielle.montants?.primeCEE || {};
  
  for (const [categorie, montantOfficiel] of Object.entries(primesOfficielles)) {
    const montantLocal = primesLocales[categorie];
    
    if (montantLocal !== montantOfficiel) {
      differences.push({
        type: TYPE_CHANGEMENT.PRIME_MODIFIEE,
        fiche: code,
        critere: `primeCEE.${categorie}`,
        message: `Prime ${categorie} modifiée: ${montantLocal || 0}€ → ${montantOfficiel}€`,
        severite: SEVERITE.INFO,
        ancien: montantLocal,
        nouveau: montantOfficiel,
      });
    }
  }
  
  return differences;
}

// ============================================================================
// GÉNÉRATION DES COMMANDES DE MISE À JOUR
// ============================================================================

function genererCommandeMAJ(differences) {
  const commandes = [];
  
  differences.forEach(diff => {
    if (diff.type.code === 'SEUIL_RELEVE' || diff.type.code === 'SEUIL_ABAISSE') {
      commandes.push({
        description: `Mettre à jour ${diff.parametre} de ${diff.fiche}`,
        fichier: CONFIG.fichierReglesLocales,
        action: 'modifier',
        chemin: `fiches.${diff.fiche}.criteresTechniques.${diff.critere}.seuil`,
        ancienneValeur: diff.ancien,
        nouvelleValeur: diff.nouveau,
      });
    }
    
    if (diff.type.code === 'NOUVELLE_FICHE') {
      commandes.push({
        description: `Ajouter la fiche ${diff.fiche}`,
        fichier: CONFIG.fichierReglesLocales,
        action: 'ajouter',
        chemin: `fiches.${diff.fiche}`,
        nouvelleValeur: diff.nouveau,
      });
    }
    
    if (diff.type.code === 'NOUVEAU_DOCUMENT') {
      commandes.push({
        description: `Ajouter document ${diff.nouveau} à ${diff.fiche}`,
        fichier: CONFIG.fichierReglesLocales,
        action: 'ajouter_liste',
        chemin: `fiches.${diff.fiche}.documentsObligatoires`,
        nouvelleValeur: diff.nouveau,
      });
    }
    
    if (diff.type.code === 'MONTANT_MODIFIE') {
      commandes.push({
        description: `Mettre à jour ${diff.critere} de ${diff.fiche}`,
        fichier: CONFIG.fichierReglesLocales,
        action: 'modifier',
        chemin: `fiches.${diff.fiche}.montants.${diff.critere}`,
        ancienneValeur: diff.ancien,
        nouvelleValeur: diff.nouveau,
      });
    }
  });
  
  return commandes;
}

// ============================================================================
// APPLICATION DES MISES À JOUR
// ============================================================================

function appliquerMiseAJour(commandes) {
  const regles = chargerReglesLocales();
  let modificationsAppliquees = 0;
  
  commandes.forEach(cmd => {
    try {
      const chemins = cmd.chemin.split('.');
      let obj = regles;
      
      // Naviguer jusqu'à l'avant-dernier niveau
      for (let i = 0; i < chemins.length - 1; i++) {
        if (!obj[chemins[i]]) {
          obj[chemins[i]] = {};
        }
        obj = obj[chemins[i]];
      }
      
      const dernierChemin = chemins[chemins.length - 1];
      
      if (cmd.action === 'modifier' || cmd.action === 'ajouter') {
        obj[dernierChemin] = cmd.nouvelleValeur;
        modificationsAppliquees++;
      } else if (cmd.action === 'ajouter_liste') {
        if (!Array.isArray(obj[dernierChemin])) {
          obj[dernierChemin] = [];
        }
        if (!obj[dernierChemin].includes(cmd.nouvelleValeur)) {
          obj[dernierChemin].push(cmd.nouvelleValeur);
          modificationsAppliquees++;
        }
      }
    } catch (error) {
      console.error(`  ❌ Erreur: ${cmd.description} - ${error.message}`);
    }
  });
  
  // Mettre à jour la version et la date
  const officielles = chargerSourceOfficielle();
  regles.version = officielles.version;
  regles.dateMAJ = new Date().toISOString().split('T')[0];
  
  // Sauvegarder
  fs.writeFileSync(CONFIG.fichierReglesLocales, JSON.stringify(regles, null, 2));
  
  return modificationsAppliquees;
}

// ============================================================================
// AFFICHAGE
// ============================================================================

function afficherResultatSurveillance(resultat) {
  console.log('\n' + '═'.repeat(63));
  console.log('  👁️  AGENT VEILLEUR - RAPPORT DE SURVEILLANCE');
  console.log('═'.repeat(63) + '\n');
  
  console.log(`  📅 Date de comparaison : ${new Date().toLocaleString('fr-FR')}`);
  console.log(`  📦 Version locale      : ${resultat.versionLocale}`);
  console.log(`  🌐 Version officielle  : ${resultat.versionOfficielle}`);
  console.log(`  📊 Différences         : ${resultat.nombreDifferences}\n`);
  
  if (resultat.nombreDifferences === 0) {
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  ✅ VOS RÈGLES SONT À JOUR                              │');
    console.log('  └─────────────────────────────────────────────────────────┘\n');
    return;
  }
  
  // Afficher les alertes critiques
  const critiques = resultat.differences.filter(d => d.severite.code === 'CRITIQUE');
  const importants = resultat.differences.filter(d => d.severite.code === 'IMPORTANT');
  const infos = resultat.differences.filter(d => d.severite.code === 'INFO');
  
  if (critiques.length > 0) {
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  🔴 ALERTES CRITIQUES - MISE À JOUR REQUISE             │');
    console.log('  └─────────────────────────────────────────────────────────┘\n');
    
    critiques.forEach(diff => {
      console.log(`     ${diff.type.emoji} [${diff.fiche}] ${diff.message}`);
      if (diff.ancien !== null && diff.nouveau !== null) {
        console.log(`        Ancien: ${diff.ancien}${diff.unite || ''} → Nouveau: ${diff.nouveau}${diff.unite || ''}`);
      }
      console.log('');
    });
  }
  
  if (importants.length > 0) {
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  🟠 CHANGEMENTS IMPORTANTS                              │');
    console.log('  └─────────────────────────────────────────────────────────┘\n');
    
    importants.forEach(diff => {
      console.log(`     ${diff.type.emoji} [${diff.fiche}] ${diff.message}`);
    });
    console.log('');
  }
  
  if (infos.length > 0) {
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  🟢 INFORMATIONS                                        │');
    console.log('  └─────────────────────────────────────────────────────────┘\n');
    
    infos.forEach(diff => {
      console.log(`     ${diff.type.emoji} [${diff.fiche}] ${diff.message}`);
    });
    console.log('');
  }
  
  // Afficher la commande de mise à jour
  if (resultat.miseAJourRequise) {
    console.log('  ═══════════════════════════════════════════════════════════');
    console.log('  ⚠️  MISE À JOUR CRITIQUE REQUISE');
    console.log('  ═══════════════════════════════════════════════════════════\n');
    console.log('  Pour mettre à jour automatiquement vos règles, exécutez :');
    console.log('');
    console.log('     node agent-veilleur.js appliquer');
    console.log('');
  }
}

function afficherDiffDetaille(resultat) {
  console.log('\n' + '═'.repeat(63));
  console.log('  📋 DIFFÉRENCES DÉTAILLÉES');
  console.log('═'.repeat(63) + '\n');
  
  resultat.differences.forEach((diff, i) => {
    console.log(`  ${i + 1}. ${diff.severite.emoji} [${diff.severite.label}] ${diff.type.label}`);
    console.log(`     Fiche: ${diff.fiche}`);
    console.log(`     ${diff.message}`);
    if (diff.ancien !== null) console.log(`     Ancienne valeur: ${diff.ancien}`);
    if (diff.nouveau !== null) console.log(`     Nouvelle valeur: ${diff.nouveau}`);
    console.log('');
  });
}

function afficherCommandesMAJ(commandes) {
  console.log('\n' + '═'.repeat(63));
  console.log('  🔧 COMMANDES DE MISE À JOUR');
  console.log('═'.repeat(63) + '\n');
  
  commandes.forEach((cmd, i) => {
    console.log(`  ${i + 1}. ${cmd.description}`);
    console.log(`     Action: ${cmd.action}`);
    console.log(`     Chemin: ${cmd.chemin}`);
    if (cmd.ancienneValeur !== undefined) console.log(`     Ancienne valeur: ${cmd.ancienneValeur}`);
    console.log(`     Nouvelle valeur: ${typeof cmd.nouvelleValeur === 'object' ? JSON.stringify(cmd.nouvelleValeur).substring(0, 50) + '...' : cmd.nouvelleValeur}`);
    console.log('');
  });
}

// ============================================================================
// INTERFACE LIGNE DE COMMANDE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const commande = args[0] || 'help';

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   CAPITAL ÉNERGIE - AGENT VEILLEUR v1.0.0                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  switch (commande) {
    case 'surveiller':
    case 'watch': {
      try {
        const locales = chargerReglesLocales();
        const officielles = chargerSourceOfficielle();
        const resultat = comparerRegles(locales, officielles);
        afficherResultatSurveillance(resultat);
      } catch (error) {
        console.error(`\n  ❌ Erreur : ${error.message}\n`);
      }
      break;
    }
    
    case 'diff': {
      try {
        const locales = chargerReglesLocales();
        const officielles = chargerSourceOfficielle();
        const resultat = comparerRegles(locales, officielles);
        afficherResultatSurveillance(resultat);
        afficherDiffDetaille(resultat);
      } catch (error) {
        console.error(`\n  ❌ Erreur : ${error.message}\n`);
      }
      break;
    }
    
    case 'maj':
    case 'update': {
      try {
        const locales = chargerReglesLocales();
        const officielles = chargerSourceOfficielle();
        const resultat = comparerRegles(locales, officielles);
        const commandes = genererCommandeMAJ(resultat.differences);
        
        afficherResultatSurveillance(resultat);
        afficherCommandesMAJ(commandes);
        
        console.log('  ─────────────────────────────────────────────────────────');
        console.log('  Pour appliquer ces modifications, exécutez :');
        console.log('');
        console.log('     node agent-veilleur.js appliquer');
        console.log('');
      } catch (error) {
        console.error(`\n  ❌ Erreur : ${error.message}\n`);
      }
      break;
    }
    
    case 'appliquer':
    case 'apply': {
      try {
        console.log('\n  🔄 Application des mises à jour en cours...\n');
        
        const locales = chargerReglesLocales();
        const officielles = chargerSourceOfficielle();
        const resultat = comparerRegles(locales, officielles);
        const commandes = genererCommandeMAJ(resultat.differences);
        
        if (commandes.length === 0) {
          console.log('  ✅ Aucune mise à jour nécessaire.\n');
          break;
        }
        
        const nbModifications = appliquerMiseAJour(commandes);
        
        console.log('  ┌─────────────────────────────────────────────────────────┐');
        console.log('  │  ✅ MISE À JOUR APPLIQUÉE AVEC SUCCÈS                   │');
        console.log('  └─────────────────────────────────────────────────────────┘\n');
        console.log(`  📝 Modifications appliquées : ${nbModifications}`);
        console.log(`  📄 Fichier mis à jour : ${CONFIG.fichierReglesLocales}`);
        console.log(`  📦 Nouvelle version : ${officielles.version}\n`);
        
        console.log('  ⚠️  N\'oubliez pas de redémarrer vos agents pour prendre');
        console.log('     en compte les nouvelles règles.\n');
        
      } catch (error) {
        console.error(`\n  ❌ Erreur : ${error.message}\n`);
      }
      break;
    }
    
    case 'help':
    default: {
      console.log('\n  📖 COMMANDES DISPONIBLES :\n');
      console.log('  surveiller           Compare les règles locales avec la source');
      console.log('                       officielle et affiche les alertes');
      console.log('');
      console.log('  diff                 Affiche les différences détaillées');
      console.log('');
      console.log('  maj                  Propose les commandes de mise à jour');
      console.log('');
      console.log('  appliquer            Applique les mises à jour automatiquement');
      console.log('');
      console.log('  help                 Affiche cette aide');
      console.log('');
      console.log('  📁 FICHIERS :');
      console.log(`     Règles locales    : ${CONFIG.fichierReglesLocales}`);
      console.log(`     Source officielle : ${CONFIG.fichierSourceOfficielle}`);
      console.log('');
      console.log('  💡 EXEMPLE :');
      console.log('     node agent-veilleur.js surveiller');
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
  chargerReglesLocales,
  chargerSourceOfficielle,
  comparerRegles,
  genererCommandeMAJ,
  appliquerMiseAJour,
  TYPE_CHANGEMENT,
  SEVERITE,
};
