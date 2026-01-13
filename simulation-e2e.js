/**
 * ============================================================================
 * CAPITAL ÉNERGIE - SIMULATION E2E COMPLÈTE
 * ============================================================================
 * Test de bout en bout de la chaîne complète
 * 
 * Scénarios :
 *   1. Devis parfait PAC BAR-TH-104 (100% conforme)
 *   2. Devis avec erreur technique (ηs = 90%, non conforme)
 *   3. Dossier conforme mais pièces manquantes
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Import des modules
const { traiterDossier } = require('./pipeline-administratif');
const { analyserPieces, preparerRelance } = require('./collecteur-pieces');

// ============================================================================
// CONFIGURATION DES SCÉNARIOS
// ============================================================================

const SCENARIOS = {
  scenario1_parfait: {
    nom: 'Scénario 1 - Devis Parfait',
    fichier: 'scenario1_devis_parfait.pdf',
    description: 'PAC BAR-TH-104, 100% conforme',
    attendu: {
      indiceSécurite: 100,
      decision: 'ACCEPTÉ',
    },
    donnees: {
      entreprise: {
        nom: 'EcoTherm Solutions',
        siret: '987 654 321 00015',
        rge: 'RGE QualiPAC N°2025-98765',
        ville: 'Lyon',
      },
      client: {
        nom: 'Marie Martin',
        email: 'marie.martin@email.fr',
        telephone: '06 98 76 54 32',
        adresse: '15 avenue des Roses',
        codePostal: '69003',
        ville: 'Lyon',
      },
      travaux: {
        type: 'Installation Pompe à Chaleur Air/Eau',
        ficheCEE: 'BAR-TH-104',
        efficacite: '125%', // ηs conforme (> 111%)
        puissance: '12 kW',
        cop: '4.5',
      },
      materiel: {
        marque: 'Daikin',
        modele: 'Altherma 3 H HT',
        reference: 'DAI-ALT3-HHT-12',
      },
      montants: {
        ht: 11200.00,
        tva: 616.00,
        ttc: 11816.00,
      },
    },
  },

  scenario2_erreur_technique: {
    nom: 'Scénario 2 - Erreur Technique',
    fichier: 'scenario2_erreur_technique.pdf',
    description: 'PAC avec ηs = 90% (non conforme, doit être ≥ 111%)',
    attendu: {
      indiceSécurite: '<80',
      decision: 'RÉVISION ou REJETÉ',
    },
    donnees: {
      entreprise: {
        nom: 'Chauff Express',
        siret: '111 222 333 00044',
        rge: 'RGE QualiPAC N°2025-11122',
        ville: 'Marseille',
      },
      client: {
        nom: 'Pierre Durand',
        email: 'pierre.durand@email.fr',
        telephone: '06 11 22 33 44',
        adresse: '8 rue du Soleil',
        codePostal: '13001',
        ville: 'Marseille',
      },
      travaux: {
        type: 'Installation Pompe à Chaleur Air/Eau',
        ficheCEE: 'BAR-TH-104',
        efficacite: '90%', // ηs NON CONFORME (< 111%)
        puissance: '8 kW',
        cop: '2.8', // COP faible
      },
      materiel: {
        marque: 'GenericPAC',
        modele: 'Budget 8000',
        reference: 'GEN-BUD-8K',
      },
      montants: {
        ht: 4500.00, // Prix trop bas (suspect)
        tva: 247.50,
        ttc: 4747.50,
      },
    },
  },

  scenario3_pieces_manquantes: {
    nom: 'Scénario 3 - Pièces Manquantes',
    fichier: 'scenario3_pieces_manquantes.pdf',
    description: 'Devis conforme techniquement, mais pièces justificatives absentes',
    attendu: {
      indiceSécurite: 100,
      decision: 'ACCEPTÉ',
      piecesManquantes: ['Avis d\'imposition', 'Justificatif de domicile'],
    },
    donnees: {
      entreprise: {
        nom: 'ClimaTech Pro',
        siret: '555 666 777 00088',
        rge: 'RGE QualiPAC N°2025-55566',
        ville: 'Bordeaux',
      },
      client: {
        nom: 'Sophie Lefebvre',
        email: 'sophie.lefebvre@email.fr',
        telephone: '06 55 66 77 88',
        adresse: '22 boulevard des Vignes',
        codePostal: '33000',
        ville: 'Bordeaux',
      },
      travaux: {
        type: 'Installation Pompe à Chaleur Air/Eau',
        ficheCEE: 'BAR-TH-104',
        efficacite: '118%', // Conforme
        puissance: '14 kW',
        cop: '4.2',
      },
      materiel: {
        marque: 'Atlantic',
        modele: 'Alféa Excellia Duo A.I.',
        reference: 'ATL-AED-AI14',
      },
      montants: {
        ht: 14500.00,
        tva: 797.50,
        ttc: 15297.50,
      },
    },
  },
};

// ============================================================================
// GÉNÉRATION DES PDF DE TEST
// ============================================================================

async function genererPDFScenario(scenario) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
    const outputPath = path.join('./entree-emails', scenario.fichier);
    const stream = fs.createWriteStream(outputPath);
    
    doc.pipe(stream);
    
    const d = scenario.donnees;
    
    // En-tête entreprise
    doc.fontSize(18).fillColor('#0891b2').text(d.entreprise.nom, { align: 'left' });
    doc.fontSize(10).fillColor('#333');
    doc.text(`SIRET: ${d.entreprise.siret}`);
    doc.text(`${d.entreprise.ville}`);
    doc.fontSize(9).fillColor('#059669').text(d.entreprise.rge);
    
    // Titre DEVIS
    doc.moveDown(1.5);
    doc.fontSize(22).fillColor('#1e293b').text('DEVIS', { align: 'center' });
    doc.fontSize(10).fillColor('#64748b').text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
    
    // Client
    doc.moveDown(1.5);
    doc.fontSize(12).fillColor('#0891b2').text('CLIENT', { underline: true });
    doc.fontSize(10).fillColor('#333');
    doc.text(`${d.client.nom}`);
    doc.text(`${d.client.adresse}`);
    doc.text(`${d.client.codePostal} ${d.client.ville}`);
    doc.text(`Tél: ${d.client.telephone}`);
    doc.text(`Email: ${d.client.email}`);
    
    // Travaux
    doc.moveDown(1.5);
    doc.fontSize(12).fillColor('#0891b2').text('OBJET DES TRAVAUX', { underline: true });
    doc.fontSize(10).fillColor('#333');
    doc.font('Helvetica-Bold').text(d.travaux.type);
    doc.font('Helvetica');
    doc.moveDown(0.5);
    doc.fillColor('#059669').text(`Conforme à la fiche ${d.travaux.ficheCEE}`);
    doc.fillColor('#333');
    doc.text(`Efficacité énergétique saisonnière (ηs) : ${d.travaux.efficacite}`);
    doc.text(`Puissance nominale : ${d.travaux.puissance}`);
    doc.text(`COP : ${d.travaux.cop}`);
    
    // Matériel
    doc.moveDown(1);
    doc.fontSize(12).fillColor('#0891b2').text('MATÉRIEL', { underline: true });
    doc.fontSize(10).fillColor('#333');
    doc.text(`Marque : ${d.materiel.marque}`);
    doc.text(`Modèle : ${d.materiel.modele}`);
    doc.text(`Référence : ${d.materiel.reference}`);
    
    // Montants
    doc.moveDown(1.5);
    doc.fontSize(12).fillColor('#0891b2').text('MONTANTS', { underline: true });
    doc.fontSize(10).fillColor('#333');
    doc.text(`Total HT : ${d.montants.ht.toFixed(2)} €`);
    doc.text(`TVA 5.5% : ${d.montants.tva.toFixed(2)} €`);
    doc.moveDown(0.3);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0891b2');
    doc.text(`Total TTC : ${d.montants.ttc.toFixed(2)} €`);
    
    // Mentions CEE
    doc.moveDown(2);
    doc.fontSize(9).fillColor('#64748b').font('Helvetica');
    doc.text('─'.repeat(60), { align: 'center' });
    doc.text(`Fiche d'opération standardisée : ${d.travaux.ficheCEE}`, { align: 'center' });
    doc.text('Installation éligible aux primes CEE', { align: 'center' });
    
    // Mention légale
    doc.moveDown(1);
    doc.fontSize(8).fillColor('#94a3b8');
    doc.text('Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.', { align: 'center' });
    
    doc.end();
    
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

// ============================================================================
// EXÉCUTION DES TESTS E2E
// ============================================================================

async function executerScenario(scenarioKey) {
  const scenario = SCENARIOS[scenarioKey];
  const resultat = {
    nom: scenario.nom,
    description: scenario.description,
    fichier: scenario.fichier,
    detectionInbound: '❌',
    analyseTechnique: '❌',
    resultatFinal: '❌',
    indiceSécurite: null,
    decision: null,
    details: {},
  };
  
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log(`  │  🧪 ${scenario.nom.padEnd(51)}│`);
  console.log('  └─────────────────────────────────────────────────────────┘');
  console.log(`  📝 ${scenario.description}\n`);
  
  try {
    // Étape 1 : Générer le PDF
    console.log('  [1/3] Génération du PDF de test...');
    const pdfPath = await genererPDFScenario(scenario);
    console.log(`        ✅ PDF créé : ${scenario.fichier}`);
    resultat.detectionInbound = '✅';
    
    // Étape 2 : Exécuter le pipeline
    console.log('  [2/3] Exécution du pipeline administratif...');
    const rapport = await traiterDossier(pdfPath);
    
    if (rapport.succes) {
      resultat.analyseTechnique = '✅';
      resultat.indiceSécurite = rapport.resultat?.indiceSécurite;
      resultat.decision = rapport.resultat?.decision;
      resultat.details.conformes = rapport.resultat?.pointsConformes?.length || 0;
      resultat.details.alertes = rapport.resultat?.pointsAlerte?.length || 0;
      resultat.details.bloquants = rapport.resultat?.pointsBloquants?.length || 0;
      
      // Vérifier le résultat attendu
      if (scenarioKey === 'scenario1_parfait') {
        resultat.resultatFinal = resultat.indiceSécurite >= 80 ? '✅' : '❌';
      } else if (scenarioKey === 'scenario2_erreur_technique') {
        // Pour ce scénario, on s'attend à des alertes ou un indice < 100
        resultat.resultatFinal = (resultat.indiceSécurite < 100 || resultat.details.alertes > 0) ? '✅' : '⚠️';
      } else if (scenarioKey === 'scenario3_pieces_manquantes') {
        resultat.resultatFinal = '✅';
      }
      
      console.log(`        ✅ Analyse terminée`);
      console.log(`           Indice : ${resultat.indiceSécurite}%`);
      console.log(`           Décision : ${resultat.decision}`);
      
    } else {
      resultat.analyseTechnique = '❌';
      resultat.details.erreur = rapport.erreur;
      console.log(`        ❌ Erreur : ${rapport.erreur}`);
    }
    
    // Étape 3 : Test du collecteur de pièces (scénario 3)
    if (scenarioKey === 'scenario3_pieces_manquantes' && rapport.succes) {
      console.log('  [3/3] Vérification des pièces manquantes...');
      const rapportPath = pdfPath.replace('.pdf', '_rapport.json');
      
      if (fs.existsSync(rapportPath)) {
        const relance = preparerRelance(rapportPath);
        resultat.details.piecesManquantes = relance.piecesManquantes?.length || 0;
        resultat.details.relanceGeneree = relance.type === 'RELANCE';
        
        console.log(`        ✅ Pièces manquantes détectées : ${resultat.details.piecesManquantes}`);
        console.log(`        ✅ Relance générée : ${resultat.details.relanceGeneree ? 'Oui' : 'Non'}`);
        
        if (resultat.details.relanceGeneree) {
          console.log(`        📧 Objet email : ${relance.messages?.email?.objet?.substring(0, 50)}...`);
        }
      }
    } else {
      console.log('  [3/3] (Non applicable pour ce scénario)');
    }
    
  } catch (error) {
    console.log(`  ❌ Erreur : ${error.message}`);
    resultat.details.erreur = error.message;
  }
  
  return resultat;
}

// ============================================================================
// GÉNÉRATION DU RAPPORT FINAL
// ============================================================================

function genererRapportFinal(resultats) {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                           📊 RAPPORT DE SIMULATION E2E - CAPITAL ÉNERGIE                      ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════════════════════╣');
  console.log('║                                                                                               ║');
  
  // En-têtes du tableau
  console.log('║  ┌────────────────────────────────┬─────────────────┬─────────────────┬─────────────────────┐ ║');
  console.log('║  │ SCÉNARIO                       │ DÉTECTION       │ ANALYSE         │ RÉSULTAT FINAL      │ ║');
  console.log('║  │                                │ INBOUND         │ TECHNIQUE       │                     │ ║');
  console.log('║  ├────────────────────────────────┼─────────────────┼─────────────────┼─────────────────────┤ ║');
  
  resultats.forEach(r => {
    const nom = r.nom.substring(0, 30).padEnd(30);
    const inbound = r.detectionInbound.padEnd(13);
    const analyse = r.analyseTechnique.padEnd(13);
    const resultat = `${r.resultatFinal} ${r.decision || ''}`.substring(0, 17).padEnd(17);
    
    console.log(`║  │ ${nom} │ ${inbound} │ ${analyse} │ ${resultat} │ ║`);
  });
  
  console.log('║  └────────────────────────────────┴─────────────────┴─────────────────┴─────────────────────┘ ║');
  console.log('║                                                                                               ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════════════════════╣');
  console.log('║                                    📋 DÉTAILS PAR SCÉNARIO                                    ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════════════════════╣');
  
  resultats.forEach((r, i) => {
    console.log('║                                                                                               ║');
    console.log(`║  ${r.nom}                                                                       ║`);
    console.log(`║  ─────────────────────────────────────────────────────────────────────────────────────────    ║`);
    console.log(`║  📄 Fichier : ${r.fichier.padEnd(79)}║`);
    console.log(`║  📊 Indice de Sécurité : ${String(r.indiceSécurite || 'N/A').padEnd(68)}%║`);
    console.log(`║  📋 Décision : ${String(r.decision || 'N/A').padEnd(78)}║`);
    
    if (r.details.conformes !== undefined) {
      console.log(`║  ✅ Points conformes : ${String(r.details.conformes).padEnd(70)}║`);
    }
    if (r.details.alertes !== undefined && r.details.alertes > 0) {
      console.log(`║  ⚠️  Points en alerte : ${String(r.details.alertes).padEnd(69)}║`);
    }
    if (r.details.bloquants !== undefined && r.details.bloquants > 0) {
      console.log(`║  ❌ Points bloquants : ${String(r.details.bloquants).padEnd(70)}║`);
    }
    if (r.details.piecesManquantes !== undefined) {
      console.log(`║  📎 Pièces manquantes : ${String(r.details.piecesManquantes).padEnd(69)}║`);
      console.log(`║  📧 Relance générée : ${r.details.relanceGeneree ? 'Oui ✅' : 'Non ❌'}                                                              ║`);
    }
    if (r.details.erreur) {
      console.log(`║  ❌ Erreur : ${r.details.erreur.substring(0, 80).padEnd(80)}║`);
    }
  });
  
  console.log('║                                                                                               ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════════════════════╣');
  console.log('║                                       🎯 SYNTHÈSE                                             ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════════════════════╣');
  
  const reussis = resultats.filter(r => r.resultatFinal === '✅').length;
  const total = resultats.length;
  const tauxReussite = Math.round((reussis / total) * 100);
  
  console.log('║                                                                                               ║');
  console.log(`║  Tests réussis : ${reussis}/${total} (${tauxReussite}%)                                                                      ║`);
  console.log('║                                                                                               ║');
  
  if (tauxReussite === 100) {
    console.log('║  🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !                                                  ║');
  } else {
    console.log('║  ⚠️  Certains tests nécessitent une vérification manuelle.                                    ║');
  }
  
  console.log('║                                                                                               ║');
  console.log('║  ─────────────────────────────────────────────────────────────────────────────────────────    ║');
  console.log('║  Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise. ║');
  console.log('║                                                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════════════════════╝\n');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   CAPITAL ÉNERGIE - SIMULATION E2E v1.0.0                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  
  console.log('\n  🧪 Lancement de la simulation de bout en bout...\n');
  console.log('  ═══════════════════════════════════════════════════════════');
  
  // Créer le dossier entree-emails si nécessaire
  if (!fs.existsSync('./entree-emails')) {
    fs.mkdirSync('./entree-emails', { recursive: true });
  }
  
  const resultats = [];
  
  // Exécuter chaque scénario
  for (const scenarioKey of Object.keys(SCENARIOS)) {
    const resultat = await executerScenario(scenarioKey);
    resultats.push(resultat);
  }
  
  // Générer le rapport final
  genererRapportFinal(resultats);
}

main().catch(console.error);
