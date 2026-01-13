/**
 * ============================================================================
 * CAPITAL ÉNERGIE - SERVICE LECTEUR DE DEVIS
 * ============================================================================
 * Script d'extraction automatisée des informations depuis les devis PDF
 * 
 * Usage :
 *   node lecteur-devis.js <chemin_fichier.pdf>
 *   node lecteur-devis.js analyser ./devis/exemple.pdf
 *   node lecteur-devis.js batch ./devis/
 * 
 * Exemple :
 *   node lecteur-devis.js analyser "C:\Users\gesli\Documents\devis.pdf"
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// ============================================================================
// STRUCTURE DE DONNÉES - INFORMATIONS À EXTRAIRE
// ============================================================================

/**
 * Structure de données pour un devis analysé
 * @typedef {Object} DevisInfo
 */
const DEVIS_TEMPLATE = {
  // Métadonnées du fichier
  fichier: {
    chemin: '',
    nom: '',
    taille: 0,
    dateAnalyse: null,
  },
  
  // Informations client
  client: {
    nom: '',
    adresse: '',
    codePostal: '',
    ville: '',
    telephone: '',
    email: '',
  },
  
  // Informations entreprise émettrice
  entreprise: {
    raisonSociale: '',
    siret: '',
    rge: '',
    adresse: '',
    telephone: '',
  },
  
  // Détails des travaux
  travaux: {
    type: '',              // Ex: "Installation PAC", "Isolation combles"
    description: '',
    fichesCEE: [],         // Ex: ["BAR-TH-104", "BAR-TH-106"]
    surface: null,         // m²
    puissance: null,       // kW
  },
  
  // Montants
  montants: {
    totalHT: null,
    tva: null,
    totalTTC: null,
    acompte: null,
    primesCEE: null,
    resteACharge: null,
  },
  
  // Matériel
  materiel: {
    reference: '',
    marque: '',
    modele: '',
    caracteristiques: '',
  },
  
  // Métadonnées d'extraction
  extraction: {
    confiance: 0,          // Score de confiance 0-100
    champsExtraits: 0,
    champsTotaux: 0,
    alertes: [],
  },
};

// ============================================================================
// PATTERNS DE RECONNAISSANCE (REGEX)
// ============================================================================

const PATTERNS = {
  // Montants
  montantTTC: /total\s*ttc\s*[:\s]*([0-9\s,.]+)\s*€?/gi,
  montantHT: /total\s*h\.?t\.?\s*[:\s]*([0-9\s,.]+)\s*€?/gi,
  tva: /tva\s*(?:\d+\s*%?)?\s*[:\s]*([0-9\s,.]+)\s*€?/gi,
  
  // Client
  nomClient: /(?:client|destinataire|à l'attention de)\s*[:\s]*([A-ZÀ-Ü][a-zà-ü]+(?:\s+[A-ZÀ-Ü][a-zà-ü]+)*)/gi,
  adresse: /(\d+[,\s]+(?:rue|avenue|boulevard|chemin|allée|place|impasse)[^,\n]+)/gi,
  codePostalVille: /(\d{5})\s+([A-ZÀ-Ü][A-ZÀ-Üa-zà-ü\s-]+)/g,
  telephone: /(?:tél|tel|téléphone|phone)[.\s:]*([0-9.\s]{10,14})/gi,
  email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
  
  // Entreprise
  siret: /siret\s*[:\s]*(\d{3}\s*\d{3}\s*\d{3}\s*\d{5})/gi,
  rge: /(rge[:\s]*[a-z0-9-]+|qualibat|qualipac|qualifelec|qualigaz)/gi,
  
  // Travaux CEE
  typesTravaux: /(pompe\s*à\s*chaleur|pac\s*air|isolation|chaudière|fenêtres?|menuiseries?|chauffage|climatisation|photovoltaïque)/gi,
  fichesCEE: /(BAR-[A-Z]{2}-\d{3}|RES-[A-Z]{2}-\d{3}|IND-[A-Z]{2}-\d{3})/gi,
  puissance: /(\d+(?:[.,]\d+)?)\s*kw/gi,
  surface: /(\d+(?:[.,]\d+)?)\s*m[²2]/gi,
  
  // Matériel
  reference: /r[ée]f(?:[ée]rence)?[.\s:]*([A-Z0-9-]+)/gi,
  marque: /(daikin|atlantic|mitsubishi|panasonic|toshiba|hitachi|lg|samsung|bosch|viessmann|vaillant|saunier\s*duval|de\s*dietrich|frisquet|chaffoteaux)/gi,
};

// ============================================================================
// FONCTION PRINCIPALE : ANALYSER DEVIS
// ============================================================================

/**
 * Analyse un fichier PDF de devis et extrait les informations
 * @param {string} cheminFichier - Chemin vers le fichier PDF
 * @returns {Promise<Object>} Informations extraites du devis
 */
async function analyserDevis(cheminFichier) {
  // Vérification du fichier
  const cheminAbsolu = path.resolve(cheminFichier);
  
  if (!fs.existsSync(cheminAbsolu)) {
    throw new Error(`Fichier non trouvé: ${cheminAbsolu}`);
  }
  
  const stats = fs.statSync(cheminAbsolu);
  const extension = path.extname(cheminAbsolu).toLowerCase();
  
  if (extension !== '.pdf') {
    throw new Error(`Format non supporté: ${extension}. Seuls les fichiers PDF sont acceptés.`);
  }
  
  console.log(`📄 Lecture du fichier: ${path.basename(cheminAbsolu)}`);
  console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} Ko\n`);
  
  // Lecture du PDF
  const dataBuffer = fs.readFileSync(cheminAbsolu);
  const pdfData = await pdfParse(dataBuffer);
  
  console.log(`📝 Extraction du texte...`);
  console.log(`   Pages: ${pdfData.numpages}`);
  console.log(`   Caractères: ${pdfData.text.length}\n`);
  
  // Initialisation du résultat
  const resultat = JSON.parse(JSON.stringify(DEVIS_TEMPLATE));
  
  // Métadonnées fichier
  resultat.fichier = {
    chemin: cheminAbsolu,
    nom: path.basename(cheminAbsolu),
    taille: stats.size,
    dateAnalyse: new Date().toISOString(),
    pages: pdfData.numpages,
  };
  
  // Extraction du texte brut
  const texte = pdfData.text;
  
  // Extraction des informations
  resultat.client = extraireClient(texte);
  resultat.entreprise = extraireEntreprise(texte);
  resultat.travaux = extraireTravaux(texte);
  resultat.montants = extraireMontants(texte);
  resultat.materiel = extraireMateriel(texte);
  
  // Calcul du score de confiance
  resultat.extraction = calculerConfiance(resultat);
  
  return {
    succes: true,
    devis: resultat,
    texteBrut: texte,
  };
}

// ============================================================================
// FONCTIONS D'EXTRACTION
// ============================================================================

/**
 * Extrait les informations client du texte
 */
function extraireClient(texte) {
  const client = {
    nom: '',
    adresse: '',
    codePostal: '',
    ville: '',
    telephone: '',
    email: '',
  };
  
  // Email
  const emailMatch = texte.match(PATTERNS.email);
  if (emailMatch && emailMatch.length > 0) {
    // Prendre le 2ème email (souvent le client, le 1er étant l'entreprise)
    client.email = emailMatch.length > 1 ? emailMatch[1] : emailMatch[0];
  }
  
  // Téléphone
  const telMatch = PATTERNS.telephone.exec(texte);
  if (telMatch) {
    client.telephone = telMatch[1].replace(/[.\s]/g, '').trim();
  }
  
  // Code postal + Ville
  const cpVilleMatches = [...texte.matchAll(PATTERNS.codePostalVille)];
  if (cpVilleMatches.length > 1) {
    // Prendre le 2ème (souvent le client)
    client.codePostal = cpVilleMatches[1][1];
    client.ville = cpVilleMatches[1][2].trim();
  } else if (cpVilleMatches.length === 1) {
    client.codePostal = cpVilleMatches[0][1];
    client.ville = cpVilleMatches[0][2].trim();
  }
  
  return client;
}

/**
 * Extrait les informations entreprise du texte
 */
function extraireEntreprise(texte) {
  const entreprise = {
    raisonSociale: '',
    siret: '',
    rge: '',
    adresse: '',
    telephone: '',
  };
  
  // SIRET
  const siretMatch = PATTERNS.siret.exec(texte);
  if (siretMatch) {
    entreprise.siret = siretMatch[1].replace(/\s/g, '');
  }
  
  // RGE
  const rgeMatches = [...texte.matchAll(PATTERNS.rge)];
  if (rgeMatches.length > 0) {
    entreprise.rge = rgeMatches.map(m => m[1]).join(', ');
  }
  
  return entreprise;
}

/**
 * Extrait les informations travaux du texte
 */
function extraireTravaux(texte) {
  const travaux = {
    type: '',
    description: '',
    fichesCEE: [],
    surface: null,
    puissance: null,
  };
  
  // Type de travaux
  const typeMatches = [...texte.matchAll(PATTERNS.typesTravaux)];
  if (typeMatches.length > 0) {
    travaux.type = [...new Set(typeMatches.map(m => m[1].toLowerCase()))].join(', ');
  }
  
  // Fiches CEE
  const ficheMatches = [...texte.matchAll(PATTERNS.fichesCEE)];
  if (ficheMatches.length > 0) {
    travaux.fichesCEE = [...new Set(ficheMatches.map(m => m[1].toUpperCase()))];
  }
  
  // Puissance (kW)
  const puissanceMatch = PATTERNS.puissance.exec(texte);
  if (puissanceMatch) {
    travaux.puissance = parseFloat(puissanceMatch[1].replace(',', '.'));
  }
  
  // Surface (m²)
  const surfaceMatch = PATTERNS.surface.exec(texte);
  if (surfaceMatch) {
    travaux.surface = parseFloat(surfaceMatch[1].replace(',', '.'));
  }
  
  return travaux;
}

/**
 * Extrait les montants du texte
 */
function extraireMontants(texte) {
  const montants = {
    totalHT: null,
    tva: null,
    totalTTC: null,
    acompte: null,
    primesCEE: null,
    resteACharge: null,
  };
  
  // Fonction helper pour parser les montants
  const parseMontant = (str) => {
    if (!str) return null;
    const clean = str.replace(/\s/g, '').replace(',', '.');
    return parseFloat(clean);
  };
  
  // Total TTC
  const ttcMatches = [...texte.matchAll(PATTERNS.montantTTC)];
  if (ttcMatches.length > 0) {
    // Prendre le dernier (souvent le total final)
    montants.totalTTC = parseMontant(ttcMatches[ttcMatches.length - 1][1]);
  }
  
  // Total HT
  const htMatches = [...texte.matchAll(PATTERNS.montantHT)];
  if (htMatches.length > 0) {
    montants.totalHT = parseMontant(htMatches[htMatches.length - 1][1]);
  }
  
  // TVA
  const tvaMatches = [...texte.matchAll(PATTERNS.tva)];
  if (tvaMatches.length > 0) {
    montants.tva = parseMontant(tvaMatches[tvaMatches.length - 1][1]);
  }
  
  return montants;
}

/**
 * Extrait les informations matériel du texte
 */
function extraireMateriel(texte) {
  const materiel = {
    reference: '',
    marque: '',
    modele: '',
    caracteristiques: '',
  };
  
  // Référence
  const refMatch = PATTERNS.reference.exec(texte);
  if (refMatch) {
    materiel.reference = refMatch[1];
  }
  
  // Marque
  const marqueMatches = [...texte.matchAll(PATTERNS.marque)];
  if (marqueMatches.length > 0) {
    materiel.marque = [...new Set(marqueMatches.map(m => m[1]))].join(', ');
  }
  
  return materiel;
}

/**
 * Calcule le score de confiance de l'extraction
 */
function calculerConfiance(resultat) {
  const champsImportants = [
    resultat.client.nom,
    resultat.client.email || resultat.client.telephone,
    resultat.travaux.type,
    resultat.montants.totalTTC,
    resultat.materiel.reference || resultat.materiel.marque,
  ];
  
  const champsExtraits = champsImportants.filter(c => c).length;
  const champsTotaux = champsImportants.length;
  const confiance = Math.round((champsExtraits / champsTotaux) * 100);
  
  const alertes = [];
  if (!resultat.montants.totalTTC) alertes.push('Montant TTC non détecté');
  if (!resultat.travaux.type) alertes.push('Type de travaux non détecté');
  if (!resultat.client.email && !resultat.client.telephone) alertes.push('Contact client non détecté');
  if (resultat.travaux.fichesCEE.length === 0) alertes.push('Fiches CEE non détectées');
  
  return {
    confiance,
    champsExtraits,
    champsTotaux,
    alertes,
  };
}

// ============================================================================
// AFFICHAGE DES RÉSULTATS
// ============================================================================

function afficherResultat(resultat) {
  const devis = resultat.devis;
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  📋 RÉSULTAT ANALYSE DEVIS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Score de confiance
  const scoreEmoji = devis.extraction.confiance >= 70 ? '✅' : 
                     devis.extraction.confiance >= 40 ? '⚠️' : '❌';
  console.log(`  ${scoreEmoji} Confiance: ${devis.extraction.confiance}% (${devis.extraction.champsExtraits}/${devis.extraction.champsTotaux} champs)\n`);
  
  // Client
  console.log('  👤 CLIENT');
  console.log(`     Nom: ${devis.client.nom || '(non détecté)'}`);
  console.log(`     Email: ${devis.client.email || '(non détecté)'}`);
  console.log(`     Tél: ${devis.client.telephone || '(non détecté)'}`);
  console.log(`     Ville: ${devis.client.ville || '(non détectée)'} ${devis.client.codePostal}\n`);
  
  // Travaux
  console.log('  🔧 TRAVAUX');
  console.log(`     Type: ${devis.travaux.type || '(non détecté)'}`);
  console.log(`     Fiches CEE: ${devis.travaux.fichesCEE.length > 0 ? devis.travaux.fichesCEE.join(', ') : '(non détectées)'}`);
  if (devis.travaux.puissance) console.log(`     Puissance: ${devis.travaux.puissance} kW`);
  if (devis.travaux.surface) console.log(`     Surface: ${devis.travaux.surface} m²`);
  console.log('');
  
  // Montants
  console.log('  💰 MONTANTS');
  console.log(`     Total TTC: ${devis.montants.totalTTC ? devis.montants.totalTTC.toFixed(2) + ' €' : '(non détecté)'}`);
  console.log(`     Total HT: ${devis.montants.totalHT ? devis.montants.totalHT.toFixed(2) + ' €' : '(non détecté)'}`);
  console.log(`     TVA: ${devis.montants.tva ? devis.montants.tva.toFixed(2) + ' €' : '(non détectée)'}\n`);
  
  // Matériel
  console.log('  📦 MATÉRIEL');
  console.log(`     Référence: ${devis.materiel.reference || '(non détectée)'}`);
  console.log(`     Marque: ${devis.materiel.marque || '(non détectée)'}\n`);
  
  // Alertes
  if (devis.extraction.alertes.length > 0) {
    console.log('  ⚠️  ALERTES');
    devis.extraction.alertes.forEach(alerte => {
      console.log(`     - ${alerte}`);
    });
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════════\n');
}

// ============================================================================
// INTERFACE LIGNE DE COMMANDE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const commande = args[0] || 'help';
  
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   CAPITAL ÉNERGIE - SERVICE LECTEUR DE DEVIS v1.0.0      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  switch (commande) {
    case 'analyser':
    case 'analyze': {
      const cheminFichier = args[1];
      
      if (!cheminFichier) {
        console.log('❌ Usage : node lecteur-devis.js analyser <chemin_fichier.pdf>');
        console.log('   Exemple : node lecteur-devis.js analyser "./devis/exemple.pdf"\n');
        break;
      }
      
      try {
        const resultat = await analyserDevis(cheminFichier);
        afficherResultat(resultat);
        
        // Option pour afficher le texte brut
        if (args.includes('--raw')) {
          console.log('\n📝 TEXTE BRUT EXTRAIT:\n');
          console.log('─'.repeat(60));
          console.log(resultat.texteBrut);
          console.log('─'.repeat(60));
        }
        
        // Option pour exporter en JSON
        if (args.includes('--json')) {
          const jsonPath = cheminFichier.replace('.pdf', '_analyse.json');
          fs.writeFileSync(jsonPath, JSON.stringify(resultat.devis, null, 2));
          console.log(`💾 Résultat exporté: ${jsonPath}\n`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur: ${error.message}\n`);
      }
      break;
    }
    
    case 'batch': {
      const dossier = args[1] || './devis';
      
      if (!fs.existsSync(dossier)) {
        console.log(`❌ Dossier non trouvé: ${dossier}\n`);
        break;
      }
      
      const fichiers = fs.readdirSync(dossier).filter(f => f.endsWith('.pdf'));
      
      if (fichiers.length === 0) {
        console.log(`❌ Aucun fichier PDF trouvé dans: ${dossier}\n`);
        break;
      }
      
      console.log(`📁 Analyse de ${fichiers.length} fichier(s) dans ${dossier}...\n`);
      
      const resultats = [];
      for (const fichier of fichiers) {
        const chemin = path.join(dossier, fichier);
        console.log(`\n📄 ${fichier}`);
        
        try {
          const resultat = await analyserDevis(chemin);
          resultats.push({
            fichier,
            succes: true,
            confiance: resultat.devis.extraction.confiance,
            montantTTC: resultat.devis.montants.totalTTC,
            typeTravaux: resultat.devis.travaux.type,
          });
          console.log(`   ✅ Confiance: ${resultat.devis.extraction.confiance}%`);
        } catch (error) {
          resultats.push({ fichier, succes: false, erreur: error.message });
          console.log(`   ❌ ${error.message}`);
        }
      }
      
      // Résumé
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('  📊 RÉSUMÉ BATCH');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`  ✅ Réussis: ${resultats.filter(r => r.succes).length}`);
      console.log(`  ❌ Échecs: ${resultats.filter(r => !r.succes).length}`);
      console.log('═══════════════════════════════════════════════════════════\n');
      break;
    }
    
    case 'template': {
      console.log('📋 STRUCTURE DE DONNÉES DEVIS:\n');
      console.log(JSON.stringify(DEVIS_TEMPLATE, null, 2));
      console.log('');
      break;
    }
    
    case 'help':
    default: {
      console.log('📖 COMMANDES DISPONIBLES :\n');
      console.log('  analyser <fichier.pdf>   Analyse un devis PDF');
      console.log('                           Options : --raw (texte brut), --json (export)');
      console.log('');
      console.log('  batch <dossier>          Analyse tous les PDF d\'un dossier');
      console.log('');
      console.log('  template                 Affiche la structure de données');
      console.log('');
      console.log('  help                     Affiche cette aide');
      console.log('');
      console.log('📄 Informations extraites :');
      console.log('   - Nom du client');
      console.log('   - Type de travaux');
      console.log('   - Montant TTC');
      console.log('   - Référence du matériel');
      console.log('   - Fiches CEE détectées');
      console.log('   - Puissance / Surface');
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
  analyserDevis,
  extraireClient,
  extraireEntreprise,
  extraireTravaux,
  extraireMontants,
  extraireMateriel,
  DEVIS_TEMPLATE,
  PATTERNS,
};
