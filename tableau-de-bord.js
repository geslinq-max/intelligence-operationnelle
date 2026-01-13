/**
 * ============================================================================
 * CAPITAL ÉNERGIE - TABLEAU DE BORD STRATÉGIQUE
 * ============================================================================
 * Module de consolidation des indicateurs clés pour la direction
 * Génère stats-patron.html - DOCUMENT CONFIDENTIEL
 * 
 * Usage :
 *   node tableau-de-bord.js generer    Génère le rapport stats-patron.html
 *   node tableau-de-bord.js console    Affiche les indicateurs en console
 *   node tableau-de-bord.js mrr        Affiche le MRR détaillé
 * 
 * Sources de données :
 *   - clients-privileges.json (forfaits, quotas)
 *   - service-reception.js (volume d'activité)
 *   - service-facturation.js (revenus)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  fichierClients: './clients-privileges.json',
  fichierSortie: './stats-patron.html',
  tauxCharges: 0.22, // 22% de charges (net = HT × 0.78)
  tauxTVA: 0.20,
  couleurs: {
    primaire: '#0891b2',
    secondaire: '#06b6d4',
    succes: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    texte: '#1e293b',
    gris: '#64748b',
    fond: '#f8fafc',
    expert: '#7c3aed',
    serenite: '#0891b2',
    essentiel: '#64748b',
  },
};

// ============================================================================
// CHARGEMENT DES DONNÉES
// ============================================================================

/**
 * Charge les données consolidées de toutes les sources
 */
function chargerDonneesConsolidees() {
  const chemin = path.resolve(CONFIG.fichierClients);
  
  if (!fs.existsSync(chemin)) {
    console.error('  ❌ Fichier clients-privileges.json non trouvé');
    return null;
  }
  
  try {
    const donnees = JSON.parse(fs.readFileSync(chemin, 'utf8'));
    return consolideDonnees(donnees);
  } catch (e) {
    console.error('  ❌ Erreur lecture:', e.message);
    return null;
  }
}

/**
 * Consolide toutes les données pour le tableau de bord
 */
function consolideDonnees(donnees) {
  const clients = donnees.clients;
  const forfaits = donnees.forfaits;
  
  // Calcul MRR
  let mrrTotal = 0;
  let mrrParForfait = { essentiel: 0, serenite: 0, expert: 0 };
  let clientsParForfait = { essentiel: 0, serenite: 0, expert: 0 };
  let dossiersParForfait = { essentiel: 0, serenite: 0, expert: 0 };
  let totalDossiers = 0;
  
  const santeClients = [];
  
  clients.forEach(client => {
    const forfait = forfaits[client.forfait];
    const prixHT = forfait.prix;
    
    mrrTotal += prixHT;
    mrrParForfait[client.forfait] += prixHT;
    clientsParForfait[client.forfait]++;
    
    const dossiers = client.dossiersTraitesCeMois || 0;
    dossiersParForfait[client.forfait] += dossiers;
    totalDossiers += dossiers;
    
    // Calcul santé client (consommation quota)
    let quotaUtilise = 0;
    let quotaMax = forfait.dossiersMax;
    let sante = 'excellent';
    
    if (quotaMax === -1) {
      quotaUtilise = dossiers;
      quotaMax = 'illimité';
      sante = 'excellent';
    } else {
      quotaUtilise = (dossiers / quotaMax) * 100;
      if (quotaUtilise >= 100) sante = 'critique';
      else if (quotaUtilise >= 80) sante = 'attention';
      else if (quotaUtilise >= 50) sante = 'modere';
      else sante = 'excellent';
    }
    
    santeClients.push({
      nom: client.nom,
      email: client.email,
      forfait: forfait.nom,
      forfaitKey: client.forfait,
      badge: forfait.badge,
      couleur: forfait.couleur,
      dossiers,
      quotaMax: forfait.dossiersMax,
      quotaUtilise: typeof quotaMax === 'number' ? quotaUtilise : 0,
      sante,
      prixHT: prixHT,
    });
  });
  
  // Estimation salaire net
  const salaireNetEstime = mrrTotal * (1 - CONFIG.tauxCharges);
  
  // ARR (Annual Recurring Revenue)
  const arrTotal = mrrTotal * 12;
  
  return {
    mrr: {
      total: mrrTotal,
      parForfait: mrrParForfait,
      ttc: mrrTotal * (1 + CONFIG.tauxTVA),
    },
    arr: arrTotal,
    salaireNet: salaireNetEstime,
    clients: {
      total: clients.length,
      parForfait: clientsParForfait,
    },
    dossiers: {
      total: totalDossiers,
      parForfait: dossiersParForfait,
    },
    santeClients,
    forfaits,
    dateGeneration: new Date().toLocaleString('fr-FR'),
  };
}

// ============================================================================
// GÉNÉRATION HTML
// ============================================================================

/**
 * Génère le fichier stats-patron.html
 */
function genererHTML(donnees) {
  const { couleurs } = CONFIG;
  
  // Calcul des pourcentages pour le graphique
  const totalClients = donnees.clients.total;
  const pctEssentiel = totalClients > 0 ? (donnees.clients.parForfait.essentiel / totalClients * 100) : 0;
  const pctSerenite = totalClients > 0 ? (donnees.clients.parForfait.serenite / totalClients * 100) : 0;
  const pctExpert = totalClients > 0 ? (donnees.clients.parForfait.expert / totalClients * 100) : 0;
  
  // Calcul répartition MRR
  const mrrTotal = donnees.mrr.total;
  const pctMrrEssentiel = mrrTotal > 0 ? (donnees.mrr.parForfait.essentiel / mrrTotal * 100) : 0;
  const pctMrrSerenite = mrrTotal > 0 ? (donnees.mrr.parForfait.serenite / mrrTotal * 100) : 0;
  const pctMrrExpert = mrrTotal > 0 ? (donnees.mrr.parForfait.expert / mrrTotal * 100) : 0;
  
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Capital Énergie - Tableau de Bord Stratégique</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', system-ui, sans-serif; 
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); 
      min-height: 100vh;
      color: #f8fafc;
    }
    .container { max-width: 1400px; margin: 0 auto; padding: 30px; }
    
    /* En-tête */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .logo { font-size: 28px; font-weight: 700; }
    .logo span { color: ${couleurs.primaire}; }
    .subtitle { color: #94a3b8; font-size: 14px; margin-top: 5px; }
    .confidential {
      background: rgba(220, 38, 38, 0.2);
      color: #fca5a5;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .date { color: #64748b; font-size: 12px; margin-top: 10px; }
    
    /* Grille principale */
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 40px; }
    
    /* Cartes KPI */
    .kpi-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 24px;
      position: relative;
      overflow: hidden;
    }
    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
    }
    .kpi-card.primary::before { background: ${couleurs.primaire}; }
    .kpi-card.success::before { background: ${couleurs.succes}; }
    .kpi-card.warning::before { background: ${couleurs.warning}; }
    .kpi-card.purple::before { background: ${couleurs.expert}; }
    
    .kpi-label { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .kpi-value { font-size: 36px; font-weight: 700; margin-bottom: 4px; }
    .kpi-subtext { color: #64748b; font-size: 13px; }
    .kpi-icon { position: absolute; top: 20px; right: 20px; font-size: 24px; opacity: 0.5; }
    
    /* Section graphiques */
    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 40px; }
    
    .chart-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 24px;
    }
    .chart-title { font-size: 16px; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
    
    /* Graphique barres horizontales */
    .bar-chart { display: flex; flex-direction: column; gap: 16px; }
    .bar-item { display: flex; align-items: center; gap: 12px; }
    .bar-label { width: 100px; font-size: 13px; color: #94a3b8; }
    .bar-container { flex: 1; height: 24px; background: rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 12px; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; font-size: 12px; font-weight: 600; min-width: 40px; }
    .bar-fill.essentiel { background: linear-gradient(90deg, ${couleurs.essentiel}, #94a3b8); }
    .bar-fill.serenite { background: linear-gradient(90deg, ${couleurs.serenite}, #22d3ee); }
    .bar-fill.expert { background: linear-gradient(90deg, ${couleurs.expert}, #a78bfa); }
    .bar-value { width: 80px; text-align: right; font-weight: 600; font-size: 14px; }
    
    /* Graphique circulaire CSS */
    .pie-container { display: flex; align-items: center; gap: 30px; }
    .pie-chart {
      width: 160px; height: 160px;
      border-radius: 50%;
      background: conic-gradient(
        ${couleurs.expert} 0deg ${pctMrrExpert * 3.6}deg,
        ${couleurs.serenite} ${pctMrrExpert * 3.6}deg ${(pctMrrExpert + pctMrrSerenite) * 3.6}deg,
        ${couleurs.essentiel} ${(pctMrrExpert + pctMrrSerenite) * 3.6}deg 360deg
      );
      position: relative;
    }
    .pie-chart::after {
      content: '';
      position: absolute;
      top: 30px; left: 30px; right: 30px; bottom: 30px;
      background: #1e293b;
      border-radius: 50%;
    }
    .pie-legend { display: flex; flex-direction: column; gap: 12px; }
    .legend-item { display: flex; align-items: center; gap: 10px; font-size: 13px; }
    .legend-dot { width: 12px; height: 12px; border-radius: 50%; }
    .legend-dot.essentiel { background: ${couleurs.essentiel}; }
    .legend-dot.serenite { background: ${couleurs.serenite}; }
    .legend-dot.expert { background: ${couleurs.expert}; }
    
    /* Tableau santé clients */
    .clients-section { margin-bottom: 40px; }
    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
    
    .clients-table {
      width: 100%;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      overflow: hidden;
    }
    .clients-table thead { background: rgba(255,255,255,0.05); }
    .clients-table th { 
      padding: 16px 20px; 
      text-align: left; 
      font-size: 11px; 
      text-transform: uppercase; 
      letter-spacing: 1px; 
      color: #64748b;
      font-weight: 600;
    }
    .clients-table td { padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.05); }
    .clients-table tr:hover { background: rgba(255,255,255,0.02); }
    
    .client-name { font-weight: 600; }
    .client-email { color: #64748b; font-size: 12px; }
    
    .forfait-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .forfait-badge.essentiel { background: rgba(100, 116, 139, 0.2); color: #cbd5e1; }
    .forfait-badge.serenite { background: rgba(8, 145, 178, 0.2); color: #22d3ee; }
    .forfait-badge.expert { background: rgba(124, 58, 237, 0.2); color: #a78bfa; }
    
    .quota-bar { width: 120px; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }
    .quota-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
    .quota-fill.excellent { background: ${couleurs.succes}; }
    .quota-fill.modere { background: ${couleurs.primaire}; }
    .quota-fill.attention { background: ${couleurs.warning}; }
    .quota-fill.critique { background: ${couleurs.danger}; }
    
    .sante-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
    }
    .sante-indicator.excellent { color: ${couleurs.succes}; }
    .sante-indicator.modere { color: ${couleurs.primaire}; }
    .sante-indicator.attention { color: ${couleurs.warning}; }
    .sante-indicator.critique { color: ${couleurs.danger}; }
    
    /* Footer */
    .footer {
      text-align: center;
      padding-top: 30px;
      border-top: 1px solid rgba(255,255,255,0.1);
      color: #64748b;
      font-size: 12px;
    }
    .footer-brand { font-weight: 600; color: ${couleurs.primaire}; }
    
    /* Responsive */
    @media (max-width: 1200px) {
      .grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .grid { grid-template-columns: 1fr; }
      .charts-row { grid-template-columns: 1fr; }
      .header { flex-direction: column; text-align: center; gap: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- En-tête -->
    <header class="header">
      <div>
        <div class="logo">⚡ Capital <span>Énergie</span></div>
        <div class="subtitle">Indicateurs du Système d'Audit</div>
        <div class="date">Généré le ${donnees.dateGeneration}</div>
      </div>
      <div class="confidential">🔒 Document Confidentiel - Direction</div>
    </header>
    
    <!-- KPIs principaux -->
    <div class="grid">
      <div class="kpi-card primary">
        <span class="kpi-icon">💰</span>
        <div class="kpi-label">MRR (Revenu Mensuel)</div>
        <div class="kpi-value">${donnees.mrr.total.toLocaleString('fr-FR')} €</div>
        <div class="kpi-subtext">HT • ${donnees.mrr.ttc.toLocaleString('fr-FR')} € TTC</div>
      </div>
      
      <div class="kpi-card success">
        <span class="kpi-icon">👤</span>
        <div class="kpi-label">Estimation Salaire Net</div>
        <div class="kpi-value">${donnees.salaireNet.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</div>
        <div class="kpi-subtext">Après charges (×0.78)</div>
      </div>
      
      <div class="kpi-card warning">
        <span class="kpi-icon">📊</span>
        <div class="kpi-label">ARR (Revenu Annuel)</div>
        <div class="kpi-value">${donnees.arr.toLocaleString('fr-FR')} €</div>
        <div class="kpi-subtext">Projection sur 12 mois</div>
      </div>
      
      <div class="kpi-card purple">
        <span class="kpi-icon">📁</span>
        <div class="kpi-label">Dossiers Protégés</div>
        <div class="kpi-value">${donnees.dossiers.total}</div>
        <div class="kpi-subtext">Ce mois • ${donnees.clients.total} clients actifs</div>
      </div>
    </div>
    
    <!-- Graphiques -->
    <div class="charts-row">
      <!-- Répartition par forfait -->
      <div class="chart-card">
        <div class="chart-title">📊 Répartition Clients par Forfait</div>
        <div class="bar-chart">
          <div class="bar-item">
            <div class="bar-label">👑 Expert</div>
            <div class="bar-container">
              <div class="bar-fill expert" style="width: ${Math.max(pctExpert, 5)}%">${donnees.clients.parForfait.expert}</div>
            </div>
            <div class="bar-value">${pctExpert.toFixed(0)}%</div>
          </div>
          <div class="bar-item">
            <div class="bar-label">⭐ Sérénité</div>
            <div class="bar-container">
              <div class="bar-fill serenite" style="width: ${Math.max(pctSerenite, 5)}%">${donnees.clients.parForfait.serenite}</div>
            </div>
            <div class="bar-value">${pctSerenite.toFixed(0)}%</div>
          </div>
          <div class="bar-item">
            <div class="bar-label">🔵 Essentiel</div>
            <div class="bar-container">
              <div class="bar-fill essentiel" style="width: ${Math.max(pctEssentiel, 5)}%">${donnees.clients.parForfait.essentiel}</div>
            </div>
            <div class="bar-value">${pctEssentiel.toFixed(0)}%</div>
          </div>
        </div>
      </div>
      
      <!-- Répartition MRR -->
      <div class="chart-card">
        <div class="chart-title">💰 Répartition du MRR</div>
        <div class="pie-container">
          <div class="pie-chart"></div>
          <div class="pie-legend">
            <div class="legend-item">
              <div class="legend-dot expert"></div>
              <span>Expert: ${donnees.mrr.parForfait.expert.toLocaleString('fr-FR')} € (${pctMrrExpert.toFixed(0)}%)</span>
            </div>
            <div class="legend-item">
              <div class="legend-dot serenite"></div>
              <span>Sérénité: ${donnees.mrr.parForfait.serenite.toLocaleString('fr-FR')} € (${pctMrrSerenite.toFixed(0)}%)</span>
            </div>
            <div class="legend-item">
              <div class="legend-dot essentiel"></div>
              <span>Essentiel: ${donnees.mrr.parForfait.essentiel.toLocaleString('fr-FR')} € (${pctMrrEssentiel.toFixed(0)}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Santé Clients -->
    <div class="clients-section">
      <div class="section-title">🏥 Santé Client - Consommation des Quotas</div>
      <table class="clients-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Forfait</th>
            <th>Dossiers</th>
            <th>Quota Utilisé</th>
            <th>Santé</th>
            <th>MRR</th>
          </tr>
        </thead>
        <tbody>
          ${donnees.santeClients.map(client => `
          <tr>
            <td>
              <div class="client-name">${client.nom}</div>
              <div class="client-email">${client.email}</div>
            </td>
            <td>
              <span class="forfait-badge ${client.forfaitKey}">${client.badge} ${client.forfait}</span>
            </td>
            <td>${client.dossiers} / ${client.quotaMax === -1 ? '∞' : client.quotaMax}</td>
            <td>
              <div class="quota-bar">
                <div class="quota-fill ${client.sante}" style="width: ${client.quotaMax === -1 ? 30 : Math.min(client.quotaUtilise, 100)}%"></div>
              </div>
            </td>
            <td>
              <span class="sante-indicator ${client.sante}">
                ${client.sante === 'excellent' ? '✅ Excellent' : 
                  client.sante === 'modere' ? '🟡 Modéré' : 
                  client.sante === 'attention' ? '🟠 Attention' : '🔴 Critique'}
              </span>
            </td>
            <td style="font-weight: 600;">${client.prixHT.toLocaleString('fr-FR')} €</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <!-- Footer -->
    <footer class="footer">
      <p>Ce rapport est une estimation par IA. Validation technique par un professionnel RGE requise.</p>
      <p style="margin-top: 10px;">
        <span class="footer-brand">Capital Énergie</span> © 2025 • Indicateurs du Système d'Audit
      </p>
    </footer>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Sauvegarde le fichier HTML
 */
function sauvegarderHTML(html) {
  const chemin = path.resolve(CONFIG.fichierSortie);
  fs.writeFileSync(chemin, html, 'utf8');
  return chemin;
}

// ============================================================================
// AFFICHAGE CONSOLE
// ============================================================================

/**
 * Affiche les indicateurs en console
 */
function afficherConsole(donnees) {
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  📊 TABLEAU DE BORD STRATÉGIQUE                         │');
  console.log('  │  🔒 Document Confidentiel - Direction                   │');
  console.log('  └─────────────────────────────────────────────────────────┘\n');
  
  console.log('  ═══════════════════════════════════════════════════════════');
  console.log('  💰 INDICATEURS FINANCIERS\n');
  console.log(`     MRR (Mensuel HT)     : ${donnees.mrr.total.toLocaleString('fr-FR')} €`);
  console.log(`     MRR TTC              : ${donnees.mrr.ttc.toLocaleString('fr-FR')} €`);
  console.log(`     ARR (Annuel HT)      : ${donnees.arr.toLocaleString('fr-FR')} €`);
  console.log('');
  console.log(`     💼 Salaire Net Estimé : ${donnees.salaireNet.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € /mois`);
  console.log('        (MRR × 0.78 après charges)');
  
  console.log('\n  ═══════════════════════════════════════════════════════════');
  console.log('  📊 RÉPARTITION MRR PAR FORFAIT\n');
  console.log(`     👑 Expert    : ${donnees.mrr.parForfait.expert.toLocaleString('fr-FR')} € (${donnees.clients.parForfait.expert} client(s))`);
  console.log(`     ⭐ Sérénité  : ${donnees.mrr.parForfait.serenite.toLocaleString('fr-FR')} € (${donnees.clients.parForfait.serenite} client(s))`);
  console.log(`     🔵 Essentiel : ${donnees.mrr.parForfait.essentiel.toLocaleString('fr-FR')} € (${donnees.clients.parForfait.essentiel} client(s))`);
  
  console.log('\n  ═══════════════════════════════════════════════════════════');
  console.log('  📁 VOLUME D\'ACTIVITÉ\n');
  console.log(`     Total clients        : ${donnees.clients.total}`);
  console.log(`     Dossiers ce mois     : ${donnees.dossiers.total}`);
  console.log(`       └ Expert           : ${donnees.dossiers.parForfait.expert}`);
  console.log(`       └ Sérénité         : ${donnees.dossiers.parForfait.serenite}`);
  console.log(`       └ Essentiel        : ${donnees.dossiers.parForfait.essentiel}`);
  
  console.log('\n  ═══════════════════════════════════════════════════════════');
  console.log('  🏥 SANTÉ CLIENTS\n');
  
  donnees.santeClients.forEach(client => {
    const santeEmoji = client.sante === 'excellent' ? '✅' : 
                       client.sante === 'modere' ? '🟡' : 
                       client.sante === 'attention' ? '🟠' : '🔴';
    const quotaStr = client.quotaMax === -1 ? '∞' : `${client.quotaUtilise.toFixed(0)}%`;
    console.log(`     ${client.badge} ${client.nom.padEnd(20)} ${santeEmoji} ${quotaStr.padStart(4)} utilisé | ${client.prixHT}€/mois`);
  });
  
  console.log('\n  ═══════════════════════════════════════════════════════════\n');
}

/**
 * Affiche le MRR détaillé
 */
function afficherMRR(donnees) {
  console.log('\n  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │  💰 MRR DÉTAILLÉ                                        │');
  console.log('  └─────────────────────────────────────────────────────────┘\n');
  
  console.log(`  📈 REVENU RÉCURRENT MENSUEL\n`);
  console.log(`     ┌─────────────────────────────────────────────────────┐`);
  console.log(`     │  MRR Total HT                       ${donnees.mrr.total.toLocaleString('fr-FR').padStart(10)} € │`);
  console.log(`     │  TVA (20%)                          ${(donnees.mrr.ttc - donnees.mrr.total).toLocaleString('fr-FR').padStart(10)} € │`);
  console.log(`     │  MRR Total TTC                      ${donnees.mrr.ttc.toLocaleString('fr-FR').padStart(10)} € │`);
  console.log(`     ├─────────────────────────────────────────────────────┤`);
  console.log(`     │  👤 Estimation Salaire Net          ${donnees.salaireNet.toLocaleString('fr-FR', {maximumFractionDigits: 0}).padStart(10)} € │`);
  console.log(`     └─────────────────────────────────────────────────────┘\n`);
  
  console.log(`  📊 PROJECTION ANNUELLE\n`);
  console.log(`     ARR (Annual Recurring Revenue) : ${donnees.arr.toLocaleString('fr-FR')} € HT\n`);
}

// ============================================================================
// INTERFACE LIGNE DE COMMANDE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const commande = args[0] || 'help';

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   CAPITAL ÉNERGIE - TABLEAU DE BORD STRATÉGIQUE           ║');
  console.log('║   Indicateurs du Système d\'Audit                          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const donnees = chargerDonneesConsolidees();
  
  if (!donnees && commande !== 'help') {
    console.log('\n  ❌ Impossible de charger les données.\n');
    return;
  }

  switch (commande) {
    case 'generer':
    case 'generate': {
      console.log('\n  📄 Génération du tableau de bord...\n');
      
      const html = genererHTML(donnees);
      const chemin = sauvegarderHTML(html);
      
      console.log('  ✅ Tableau de bord généré avec succès !\n');
      console.log(`     📁 Fichier : ${chemin}`);
      console.log(`     💰 MRR     : ${donnees.mrr.total.toLocaleString('fr-FR')} € HT`);
      console.log(`     👤 Salaire : ${donnees.salaireNet.toLocaleString('fr-FR', {maximumFractionDigits: 0})} € net estimé\n`);
      console.log('  💡 Ouvrez le fichier dans un navigateur pour visualiser.\n');
      break;
    }
    
    case 'console':
    case 'afficher': {
      afficherConsole(donnees);
      break;
    }
    
    case 'mrr': {
      afficherMRR(donnees);
      break;
    }
    
    case 'help':
    default: {
      console.log('\n  📖 COMMANDES DISPONIBLES :\n');
      console.log('  generer              Génère stats-patron.html');
      console.log('                       Tableau de bord visuel complet');
      console.log('');
      console.log('  console              Affiche les indicateurs en console');
      console.log('');
      console.log('  mrr                  Affiche le MRR détaillé');
      console.log('');
      console.log('  help                 Affiche cette aide');
      console.log('');
      console.log('  🔒 CONFIDENTIALITÉ :');
      console.log('     Ce module génère des données sensibles');
      console.log('     réservées à la direction uniquement.');
      console.log('');
      console.log('  📊 INDICATEURS :');
      console.log('     - MRR (Revenu Mensuel Récurrent)');
      console.log('     - ARR (Revenu Annuel Récurrent)');
      console.log('     - Estimation Salaire Net (×0.78)');
      console.log('     - Répartition par forfait');
      console.log('     - Santé clients (quotas)');
      console.log('');
      console.log('  💡 EXEMPLE :');
      console.log('     node tableau-de-bord.js generer\n');
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
  chargerDonneesConsolidees,
  consolideDonnees,
  genererHTML,
  sauvegarderHTML,
  afficherConsole,
  afficherMRR,
  CONFIG,
};
