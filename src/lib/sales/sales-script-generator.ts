/**
 * Générateur de Scripts de Vente
 * Produit des approches personnalisées basées sur le métier et les signaux de douleur
 */

export interface SalesScript {
  id: string;
  approach: 'empathique' | 'solution' | 'urgence';
  title: string;
  opener: string;
  body: string;
  closing: string;
  tags: string[];
}

export interface ROICalculation {
  heuresEconomisees: number;
  coutHoraireMoyen: number;
  economieHebdo: number;
  economieMensuelle: number;
  economieAnnuelle: number;
  detailsCalcul: string[];
}

interface PainSignal {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  examples: string[];
}

interface RealQuote {
  text: string;
  category: string;
  authorName?: string;
  rating: number;
  date: Date;
}

interface ScriptHook {
  category: string;
  hook: string;
  frequency: number;
  suggestedOpener: string;
}

interface ProspectContext {
  metier: string;
  painScore: number;
  painSignals: PainSignal[];
  nombreAvis: number;
  noteGoogle?: number;
  volumeChantiers?: number;
  // Nouveaux champs pour les avis réels
  realQuotes?: RealQuote[];
  scriptHooks?: ScriptHook[];
}

// ============================================================================
// TEMPLATES DE SCRIPTS PAR MÉTIER
// ============================================================================

const SCRIPT_TEMPLATES: Record<string, Record<string, SalesScript[]>> = {
  PAYSAGISTE: {
    administratif: [
      {
        id: 'pays-admin-1',
        approach: 'empathique',
        title: 'La paperasse en fin de journée',
        opener: "Je sais que quand on rentre d'un chantier à 18h, la dernière chose qu'on veut faire c'est de la paperasse.",
        body: "J'ai remarqué que la gestion des BSD vous prend beaucoup de temps en fin de journée. J'ai une solution pour valider vos évacuations de terre en 30 secondes directement sur le chantier, depuis votre téléphone.",
        closing: "Est-ce que 15 minutes la semaine prochaine pour une démo rapide vous conviendrait ?",
        tags: ['BSD', 'Mobile', 'Terrain'],
      },
      {
        id: 'pays-admin-2',
        approach: 'solution',
        title: 'Trackdéchets simplifié',
        opener: "Beaucoup de paysagistes me disent que Trackdéchets est une usine à gaz.",
        body: "Notre module BSD Express pré-remplit 80% des informations et génère le bordereau conforme en un scan. Plus de risque d'erreur, plus de bordereaux perdus.",
        closing: "Voulez-vous que je vous montre comment ça fonctionne sur un exemple concret ?",
        tags: ['Trackdéchets', 'Conformité', 'Automatisation'],
      },
    ],
    reactivite: [
      {
        id: 'pays-react-1',
        approach: 'empathique',
        title: 'Les devis qui traînent',
        opener: "Je comprends, entre les chantiers et les imprévus, répondre rapidement aux demandes de devis c'est compliqué.",
        body: "Nos clients paysagistes ont réduit leur temps de réponse de 48h à 4h grâce à des modèles de devis intelligents qui se pré-remplissent selon le type de projet.",
        closing: "Ça vous parle ? Je peux vous montrer en 10 minutes.",
        tags: ['Devis', 'Réactivité', 'Clients'],
      },
    ],
    planification: [
      {
        id: 'pays-plan-1',
        approach: 'urgence',
        title: 'Optimisation des tournées',
        opener: "Avec la hausse du carburant, chaque kilomètre compte.",
        body: "Notre outil de planification regroupe automatiquement vos chantiers par zone géographique. Les équipes qui l'utilisent économisent en moyenne 2h de route par semaine.",
        closing: "Je peux vous faire une simulation gratuite basée sur vos chantiers actuels ?",
        tags: ['Carburant', 'Planification', 'Économies'],
      },
    ],
  },
  
  ARTISAN_CEE: {
    administratif: [
      {
        id: 'cee-admin-1',
        approach: 'empathique',
        title: 'La complexité des dossiers CEE',
        opener: "Les dossiers CEE, c'est un vrai casse-tête. Entre les attestations, les photos et les délais, je comprends la frustration.",
        body: "Notre plateforme vérifie automatiquement la conformité de chaque dossier avant envoi. Résultat : 95% de taux d'acceptation dès le premier dépôt.",
        closing: "Combien de dossiers déposez-vous par mois ? Je peux vous montrer le gain de temps concret.",
        tags: ['CEE', 'Conformité', 'Dossiers'],
      },
      {
        id: 'cee-admin-2',
        approach: 'solution',
        title: 'Primes maximisées',
        opener: "Saviez-vous que beaucoup d'artisans laissent de l'argent sur la table avec les CEE ?",
        body: "Notre système identifie automatiquement les bonifications possibles : coup de pouce, précarité énergétique, zones géographiques prioritaires. En moyenne, +23% de prime récupérée.",
        closing: "Je peux analyser vos 3 derniers dossiers gratuitement pour voir le potentiel ?",
        tags: ['Primes', 'Bonifications', 'Revenus'],
      },
    ],
    reactivite: [
      {
        id: 'cee-react-1',
        approach: 'empathique',
        title: 'Les relances clients',
        opener: "Quand un client attend son attestation depuis 3 semaines, ça crée des tensions.",
        body: "Notre tableau de bord envoie des notifications automatiques à chaque étape du dossier. Le client est informé en temps réel, vous n'avez plus à gérer les appels de suivi.",
        closing: "C'est quelque chose qui vous aiderait au quotidien ?",
        tags: ['Suivi', 'Communication', 'Clients'],
      },
    ],
  },
  
  VITICULTURE: {
    administratif: [
      {
        id: 'viti-admin-1',
        approach: 'empathique',
        title: 'Le registre phytosanitaire',
        opener: "Le registre phyto, c'est une obligation mais ça prend un temps fou à tenir à jour.",
        body: "Notre solution mobile permet de saisir les traitements directement à la vigne. Scan du produit, parcelle géolocalisée, tout est enregistré en 30 secondes.",
        closing: "Vous gérez combien de parcelles ? Je peux vous montrer le gain de temps.",
        tags: ['Phyto', 'Registre', 'Mobile'],
      },
    ],
    planification: [
      {
        id: 'viti-plan-1',
        approach: 'solution',
        title: 'Gestion des saisonniers',
        opener: "La gestion des contrats saisonniers, c'est un pic de charge administrative chaque année.",
        body: "Notre module génère les contrats conformes en un clic, avec suivi des heures et des équipes. Fini les erreurs et les oublis.",
        closing: "Combien de saisonniers embauchez-vous pour les vendanges ?",
        tags: ['Saisonniers', 'Contrats', 'RH'],
      },
    ],
  },
};

// ============================================================================
// GÉNÉRATEUR DE SCRIPTS
// ============================================================================

function detectMetierCategory(metier: string): string {
  const metierLower = metier.toLowerCase();
  
  if (metierLower.includes('paysag') || metierLower.includes('espace') || metierLower.includes('jardin') || metierLower.includes('démol')) {
    return 'PAYSAGISTE';
  }
  if (metierLower.includes('viti') || metierLower.includes('vigne') || metierLower.includes('cave') || metierLower.includes('domaine')) {
    return 'VITICULTURE';
  }
  return 'ARTISAN_CEE';
}

function detectPainCategories(signals: PainSignal[]): string[] {
  const categories: string[] = [];
  
  for (const signal of signals) {
    const cat = signal.category.toLowerCase();
    if (cat.includes('admin') || cat.includes('papier') || cat.includes('dossier') || cat.includes('document')) {
      if (!categories.includes('administratif')) categories.push('administratif');
    }
    if (cat.includes('réactiv') || cat.includes('délai') || cat.includes('réponse') || cat.includes('devis')) {
      if (!categories.includes('reactivite')) categories.push('reactivite');
    }
    if (cat.includes('planif') || cat.includes('organis') || cat.includes('planning') || cat.includes('route')) {
      if (!categories.includes('planification')) categories.push('planification');
    }
  }
  
  if (categories.length === 0) {
    categories.push('administratif');
  }
  
  return categories;
}

export function generateSalesScripts(context: ProspectContext): SalesScript[] {
  const metierCategory = detectMetierCategory(context.metier);
  const painCategories = detectPainCategories(context.painSignals);
  
  const scripts: SalesScript[] = [];
  const templates = SCRIPT_TEMPLATES[metierCategory];
  
  // Si on a des hooks basés sur des avis réels, générer des scripts personnalisés
  if (context.scriptHooks && context.scriptHooks.length > 0) {
    const personalizedScripts = generatePersonalizedScripts(context);
    if (personalizedScripts.length > 0) {
      return personalizedScripts.slice(0, 3);
    }
  }
  
  if (!templates) {
    return getDefaultScripts(context);
  }
  
  for (const category of painCategories) {
    const categoryScripts = templates[category];
    if (categoryScripts) {
      scripts.push(...categoryScripts);
    }
  }
  
  if (scripts.length === 0) {
    const allScripts = Object.values(templates).flat();
    scripts.push(...allScripts.slice(0, 3));
  }
  
  return scripts.slice(0, 3);
}

/**
 * Génère des scripts personnalisés basés sur les avis réels Google
 */
function generatePersonalizedScripts(context: ProspectContext): SalesScript[] {
  const scripts: SalesScript[] = [];
  const hooks = context.scriptHooks || [];
  const quotes = context.realQuotes || [];
  
  for (let i = 0; i < Math.min(3, hooks.length); i++) {
    const hook = hooks[i];
    const relatedQuote = quotes.find(q => q.category === hook.category);
    
    // Déterminer l'approche selon la fréquence du problème
    let approach: 'empathique' | 'solution' | 'urgence' = 'empathique';
    if (hook.frequency >= 3) approach = 'urgence';
    else if (hook.frequency >= 2) approach = 'solution';
    
    // Construire l'opener personnalisé
    let opener = hook.suggestedOpener;
    
    // Si on a une citation réelle, l'intégrer subtilement
    if (relatedQuote) {
      opener = buildOpenerWithQuote(hook, relatedQuote);
    }
    
    // Construire le corps du script selon la catégorie
    const body = buildScriptBody(hook.category, context.metier);
    
    // Construire le closing
    const closing = buildClosing(hook.category, context.painScore);
    
    scripts.push({
      id: `real-${hook.category}-${i}`,
      approach,
      title: getTitleForCategory(hook.category),
      opener,
      body,
      closing,
      tags: getTagsForCategory(hook.category),
    });
  }
  
  return scripts;
}

/**
 * Construit une accroche intégrant une citation réelle (sans la citer directement)
 */
function buildOpenerWithQuote(hook: ScriptHook, quote: RealQuote): string {
  const quoteText = quote.text.toLowerCase();
  
  // Détecter les mots-clés spécifiques dans la citation pour personnaliser
  if (quoteText.includes('devis') && (quoteText.includes('attente') || quoteText.includes('attendu') || quoteText.includes('semaine') || quoteText.includes('mois'))) {
    // Extraire la durée si mentionnée
    const durationMatch = quoteText.match(/(\d+)\s*(semaine|mois|jour)/i);
    if (durationMatch) {
      return `J'ai remarqué que la gestion de vos devis vous prend beaucoup de temps. Un client a mentionné avoir attendu ${durationMatch[1]} ${durationMatch[2]}${durationMatch[1] !== '1' ? 's' : ''}. Ma solution automatise l'envoi de devis en quelques clics.`;
    }
    return `J'ai remarqué que la gestion de vos devis vous prend beaucoup de temps. Ma solution génère des devis en 2 clics depuis le terrain.`;
  }
  
  if (quoteText.includes('répond') || quoteText.includes('joindre') || quoteText.includes('rappel')) {
    return `J'ai noté que certains clients ont eu des difficultés à vous joindre. Notre système de notifications automatiques garantit qu'aucune demande ne reste sans réponse.`;
  }
  
  if (quoteText.includes('relance') || quoteText.includes('relancé')) {
    return `J'ai vu qu'un client a dû vous relancer pour avoir un retour. Avec notre outil, les relances se font automatiquement et vous êtes alerté en temps réel.`;
  }
  
  if (quoteText.includes('dossier') || quoteText.includes('document') || quoteText.includes('attestation')) {
    return `J'ai remarqué un souci lié aux dossiers administratifs. Notre plateforme vérifie automatiquement chaque pièce avant envoi pour éviter les rejets.`;
  }
  
  // Fallback sur l'opener généré
  return hook.suggestedOpener;
}

/**
 * Construit le corps du script selon la catégorie de problème
 */
function buildScriptBody(category: string, metier: string): string {
  const metierCategory = detectMetierCategory(metier);
  
  const bodies: Record<string, Record<string, string>> = {
    reactivite: {
      PAYSAGISTE: "Notre module de suivi envoie des confirmations automatiques à chaque étape : devis envoyé, chantier planifié, intervention terminée. Vos clients sont informés sans que vous ayez à lever le petit doigt.",
      ARTISAN_CEE: "Notre tableau de bord centralise toutes les demandes et envoie des notifications automatiques. Le client sait exactement où en est son dossier CEE, sans vous appeler.",
      VITICULTURE: "Notre solution envoie des alertes automatiques à vos clients et fournisseurs. Plus besoin de gérer les appels de suivi.",
    },
    delais: {
      PAYSAGISTE: "Notre générateur de devis intelligent pré-remplit 80% des informations selon le type de projet. Vous envoyez un devis pro en 2 minutes depuis le chantier, directement sur votre téléphone.",
      ARTISAN_CEE: "Nos modèles de devis intelligents calculent automatiquement les primes CEE et génèrent des devis conformes en quelques clics. Fini les heures passées sur la paperasse.",
      VITICULTURE: "Notre système prépare vos documents administratifs en avance. Les attestations et bordereaux se génèrent en un clic.",
    },
    qualite: {
      PAYSAGISTE: "Notre checklist digitale de fin de chantier garantit que chaque point est vérifié avant de partir. Photos avant/après, signature client, tout est tracé.",
      ARTISAN_CEE: "Notre système de photos horodatées et de checklist garantit que chaque installation est documentée correctement pour les contrôles.",
      VITICULTURE: "Notre traçabilité digitale documente chaque intervention avec précision. En cas de contrôle, tout est accessible en 1 clic.",
    },
    prix: {
      PAYSAGISTE: "Notre système de devis détaillé liste chaque poste avec justification. Le client comprend ce qu'il paie et ne négocie plus.",
      ARTISAN_CEE: "Notre devis détaille le montant des primes CEE déduites. Le client voit immédiatement l'économie réelle, ce qui justifie votre tarif.",
      VITICULTURE: "Notre historique de traitements permet de justifier chaque coût avec un suivi précis de vos interventions.",
    },
    conformite: {
      PAYSAGISTE: "Notre module BSD Express vérifie automatiquement chaque bordereau. Plus de risque de rejet ou d'amende Trackdéchets.",
      ARTISAN_CEE: "Notre système vérifie la conformité de chaque dossier CEE AVANT envoi. Résultat : 95% d'acceptation dès le premier dépôt, plus de primes perdues.",
      VITICULTURE: "Notre registre phyto digital est toujours conforme aux dernières réglementations. En cas de contrôle, tout est prêt en 1 clic.",
    },
  };
  
  return bodies[category]?.[metierCategory] || bodies[category]?.ARTISAN_CEE || 
    "Notre solution automatise les tâches répétitives et vous fait gagner plusieurs heures par semaine.";
}

/**
 * Construit le closing selon l'urgence
 */
function buildClosing(category: string, painScore: number): string {
  if (painScore > 70) {
    return "On peut en parler cette semaine ? Je vous montre en 10 minutes comment résoudre ce problème définitivement.";
  }
  if (painScore > 50) {
    return "Est-ce que 15 minutes pour une démo personnalisée vous intéresserait ?";
  }
  return "Voulez-vous que je vous montre comment ça fonctionne concrètement ?";
}

/**
 * Retourne le titre du script selon la catégorie
 */
function getTitleForCategory(category: string): string {
  const titles: Record<string, string> = {
    reactivite: 'Répondre plus vite, sans effort',
    delais: 'Des devis en 2 clics',
    qualite: 'Zéro oubli, zéro retour',
    prix: 'Justifier chaque euro',
    conformite: 'Conformité garantie',
  };
  return titles[category] || 'Simplifier votre quotidien';
}

/**
 * Retourne les tags pour la catégorie
 */
function getTagsForCategory(category: string): string[] {
  const tags: Record<string, string[]> = {
    reactivite: ['Réactivité', 'Communication', 'Clients'],
    delais: ['Devis', 'Rapidité', 'Mobile'],
    qualite: ['Qualité', 'Checklist', 'Suivi'],
    prix: ['Tarifs', 'Transparence', 'Devis'],
    conformite: ['Conformité', 'Administratif', 'Dossiers'],
  };
  return tags[category] || ['Productivité', 'Automatisation'];
}

function getDefaultScripts(context: ProspectContext): SalesScript[] {
  return [
    {
      id: 'default-1',
      approach: 'empathique',
      title: 'Simplifier le quotidien',
      opener: "Je sais que gérer une entreprise dans votre secteur, c'est jongler entre le terrain et l'administratif.",
      body: "Notre plateforme centralise toute la gestion documentaire et automatise les tâches répétitives. Les professionnels qui l'utilisent gagnent en moyenne 5h par semaine.",
      closing: "Est-ce que 15 minutes pour une démo personnalisée vous intéresserait ?",
      tags: ['Productivité', 'Automatisation'],
    },
    {
      id: 'default-2',
      approach: 'solution',
      title: 'Conformité sans effort',
      opener: "Les réglementations évoluent constamment dans votre secteur.",
      body: "Notre système se met à jour automatiquement et vous alerte en cas de non-conformité. Plus de stress, plus de risque d'amende.",
      closing: "Voulez-vous voir comment ça fonctionne concrètement ?",
      tags: ['Conformité', 'Réglementation'],
    },
    {
      id: 'default-3',
      approach: 'urgence',
      title: 'Avant la saison haute',
      opener: "La période chargée approche et c'est maintenant le bon moment pour s'organiser.",
      body: "Nos clients qui ont implémenté la solution avant leur pic d'activité ont pu absorber 30% de volume en plus sans recruter.",
      closing: "On peut en discuter cette semaine ?",
      tags: ['Saisonnalité', 'Croissance'],
    },
  ];
}

// ============================================================================
// CALCULATEUR DE ROI
// ============================================================================

export function calculateROI(context: ProspectContext): ROICalculation {
  const coutHoraireMoyen = 45;
  
  let heuresBase = 0;
  
  const metierCategory = detectMetierCategory(context.metier);
  
  switch (metierCategory) {
    case 'PAYSAGISTE':
      heuresBase = 4;
      if (context.volumeChantiers && context.volumeChantiers > 10) {
        heuresBase += Math.min(context.volumeChantiers * 0.3, 4);
      }
      break;
    case 'VITICULTURE':
      heuresBase = 3;
      break;
    case 'ARTISAN_CEE':
    default:
      heuresBase = 5;
      break;
  }
  
  if (context.painScore > 70) {
    heuresBase *= 1.3;
  } else if (context.painScore > 50) {
    heuresBase *= 1.15;
  }
  
  const heuresEconomisees = Math.round(heuresBase * 10) / 10;
  const economieHebdo = Math.round(heuresEconomisees * coutHoraireMoyen);
  const economieMensuelle = economieHebdo * 4;
  const economieAnnuelle = economieMensuelle * 12;
  
  const detailsCalcul: string[] = [];
  
  switch (metierCategory) {
    case 'PAYSAGISTE':
      detailsCalcul.push('BSD Express : ~1.5h/semaine économisées');
      detailsCalcul.push('Planification chantiers : ~1h/semaine');
      detailsCalcul.push('Suivi déchets automatisé : ~1h/semaine');
      if (context.volumeChantiers && context.volumeChantiers > 10) {
        detailsCalcul.push(`Volume élevé (${context.volumeChantiers} chantiers) : +${Math.round(context.volumeChantiers * 0.3 * 10) / 10}h`);
      }
      break;
    case 'VITICULTURE':
      detailsCalcul.push('Registre phyto digital : ~1.5h/semaine');
      detailsCalcul.push('Gestion saisonniers : ~1h/semaine');
      detailsCalcul.push('Traçabilité parcelles : ~0.5h/semaine');
      break;
    default:
      detailsCalcul.push('Dossiers CEE pré-remplis : ~2h/semaine');
      detailsCalcul.push('Suivi automatique : ~1.5h/semaine');
      detailsCalcul.push('Conformité vérifiée : ~1.5h/semaine');
  }
  
  return {
    heuresEconomisees,
    coutHoraireMoyen,
    economieHebdo,
    economieMensuelle,
    economieAnnuelle,
    detailsCalcul,
  };
}

// ============================================================================
// RÉSUMÉ DES SIGNAUX DE DOULEUR
// ============================================================================

export function generatePainSummary(signals: PainSignal[], realQuotes?: RealQuote[]): string {
  if (!signals || signals.length === 0) {
    return "Aucun signal de douleur significatif détecté dans les avis récents.";
  }
  
  const criticalSignals = signals.filter(s => s.severity === 'critical' || s.severity === 'high');
  
  // Si on a des citations réelles, les utiliser pour un résumé plus percutant
  if (realQuotes && realQuotes.length > 0) {
    const topQuote = realQuotes[0];
    const categoryLabel = getCategoryLabel(topQuote.category);
    return `Détresse détectée sur ${categoryLabel.toLowerCase()} : un client écrit "${truncateQuote(topQuote.text, 80)}". Opportunité forte de conversion.`;
  }
  
  if (criticalSignals.length > 0) {
    const topSignal = criticalSignals[0];
    return `Détresse détectée sur ${topSignal.category.toLowerCase()} : ${topSignal.count} avis mentionnent ${topSignal.examples[0] || 'ce problème'}.`;
  }
  
  const mediumSignals = signals.filter(s => s.severity === 'medium');
  if (mediumSignals.length > 0) {
    const categories = mediumSignals.map(s => s.category.toLowerCase()).join(', ');
    return `Points d'attention identifiés : ${categories}. Opportunité de proposition de valeur.`;
  }
  
  return "Signaux faibles détectés. Prospect à qualifier davantage.";
}

/**
 * Tronque une citation pour l'affichage
 */
function truncateQuote(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Retourne le label lisible d'une catégorie
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    reactivite: 'la réactivité',
    delais: 'les délais',
    qualite: 'la qualité',
    prix: 'les prix',
    conformite: 'la conformité',
  };
  return labels[category] || category;
}
