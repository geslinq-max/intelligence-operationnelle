'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Activity,
  Phone,
  Mail,
  MapPin,
  Globe,
  Star,
  AlertTriangle,
  TrendingUp,
  Clock,
  Target,
  FileText,
  Copy,
  Check,
  Briefcase,
  Calculator,
  MessageSquare,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { useIndustry } from '@/contexts/IndustryContext';
import {
  generateSalesScripts,
  calculateROI,
  generatePainSummary,
  SalesScript,
  ROICalculation
} from '@/lib/sales/sales-script-generator';

// ============================================================================
// TYPES
// ============================================================================

interface Prospect {
  id: string;
  raison_sociale: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  site_web?: string;
  activite_principale?: string;
  pain_score?: number;
  urgency_level?: string;
  pain_summary?: string;
  top_issues?: string[];
  note_google?: number;
  nombre_avis?: number;
  statut?: string;
  created_at?: string;
}

interface PainSignal {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  examples: string[];
}

interface MockProspectData {
  prospect: Prospect;
  painSignals: PainSignal[];
  scripts: SalesScript[];
  roi: ROICalculation;
  painSummary: string;
}

// ============================================================================
// DONNÉES DE SIMULATION RICHES
// ============================================================================

const MOCK_PROSPECTS: Record<string, MockProspectData> = {
  '1': {
    prospect: {
      id: '1',
      raison_sociale: 'Dupont Plomberie',
      email: 'martin@dupont-plomberie.fr',
      telephone: '06 12 34 56 78',
      adresse: '45 rue de la République',
      ville: 'Lyon',
      code_postal: '69002',
      site_web: 'https://dupont-plomberie.fr',
      activite_principale: 'Plombier Chauffagiste RGE',
      pain_score: 72,
      urgency_level: 'high',
      top_issues: ['Croissance rapide', 'Surcharge administrative', 'Délais de traitement CEE'],
      note_google: 4.2,
      nombre_avis: 47,
      statut: 'actif',
    },
    painSignals: [
      { category: 'Croissance rapide', severity: 'high', count: 12, examples: ['12 dossiers en cours simultanément'] },
      { category: 'Surcharge administrative', severity: 'high', count: 8, examples: ['Trop de paperasse', 'Manque de temps'] },
      { category: 'Délais CEE', severity: 'medium', count: 4, examples: ['Attente validation', 'Dossiers incomplets'] },
    ],
    scripts: [
      {
        id: 'dupont-1',
        approach: 'empathique',
        title: 'La croissance qui déborde',
        opener: "Martin, avec 12 dossiers CEE en cours, je comprends que vous n'ayez plus une minute pour respirer.",
        body: "C'est le signe d'une entreprise qui cartonne, mais aussi le moment où beaucoup de plombiers perdent le fil. Notre plateforme centralise tous vos dossiers CEE et vous alerte automatiquement des pièces manquantes. Résultat : 95% d'acceptation dès le premier envoi.",
        closing: "On fait un point de 15 minutes cette semaine pour voir comment débloquer vos dossiers en attente ?",
        tags: ['CEE', 'Croissance', 'Productivité'],
      },
      {
        id: 'dupont-2',
        approach: 'solution',
        title: 'Optimiser sans recruter',
        opener: "Vous gérez 12 chantiers en parallèle - c'est impressionnant, mais à quel prix pour votre temps personnel ?",
        body: "Nos clients dans votre situation ont automatisé 80% de leur administratif CEE. Concrètement : les attestations se génèrent seules, les relances clients sont automatiques, et le suivi ANAH est centralisé. C'est comme avoir un assistant dédié aux dossiers.",
        closing: "Je peux vous montrer en 10 minutes comment récupérer vos soirées. Ça vous dit ?",
        tags: ['Automatisation', 'Temps', 'Assistant virtuel'],
      },
      {
        id: 'dupont-3',
        approach: 'urgence',
        title: 'Avant que ça déborde',
        opener: "Martin, 12 dossiers en cours avec les délais actuels de l'ANAH, c'est une bombe à retardement.",
        body: "Un dossier mal suivi = une prime perdue + un client mécontent. Notre système vérifie chaque dossier en temps réel et vous alerte AVANT qu'il y ait un problème. Les artisans qui l'utilisent ont réduit leurs rejets de 73%.",
        closing: "On en parle cette semaine avant que la charge augmente encore ?",
        tags: ['Urgence', 'Conformité', 'Prévention'],
      },
    ],
    roi: {
      heuresEconomisees: 8.5,
      coutHoraireMoyen: 45,
      economieHebdo: 383,
      economieMensuelle: 1532,
      economieAnnuelle: 18380,
      detailsCalcul: [
        'Dossiers CEE pré-remplis : ~3h/semaine économisées',
        'Suivi automatique 12 dossiers : ~2.5h/semaine',
        'Génération attestations : ~1.5h/semaine',
        'Bonus volume (12 dossiers) : +1.5h/semaine',
      ],
    },
    painSummary: "Détresse détectée sur la gestion de volume : 12 dossiers CEE en cours créent une surcharge administrative critique. Risque de perte de primes par manque de suivi.",
  },
  '2': {
    prospect: {
      id: '2',
      raison_sociale: 'Bernard Chauffage',
      email: 'sophie@bernard-chauffage.fr',
      telephone: '06 98 76 54 32',
      adresse: '12 avenue des Champs',
      ville: 'Paris',
      code_postal: '75008',
      site_web: 'https://bernard-chauffage.fr',
      activite_principale: 'Chauffagiste RGE',
      pain_score: 68,
      urgency_level: 'high',
      top_issues: ['Délais de devis', 'Réactivité client', 'Suivi des relances'],
      note_google: 3.8,
      nombre_avis: 32,
      statut: 'actif',
    },
    painSignals: [
      { category: 'Réactivité', severity: 'critical', count: 4, examples: ['Devis jamais reçu', 'Pas de retour', 'Attente trop longue', 'Impossible de les joindre'] },
      { category: 'Délais de devis', severity: 'high', count: 2, examples: ['Devis arrivé après 2 semaines', 'J\'ai dû relancer 3 fois'] },
      { category: 'Communication', severity: 'medium', count: 3, examples: ['Manque d\'information', 'Pas de suivi'] },
    ],
    scripts: [
      {
        id: 'bernard-1',
        approach: 'empathique',
        title: 'Les devis qui traînent',
        opener: "Sophie, entre les chantiers et les urgences dépannage, je sais que répondre aux demandes de devis en 24h c'est mission impossible.",
        body: "4 avis Google mentionnent des délais de réponse trop longs - ce n'est pas un problème de volonté, c'est un problème d'outils. Notre système génère des devis personnalisés en 2 clics depuis votre téléphone, directement sur le chantier. Vos clients reçoivent leur devis en 4h au lieu de 48h.",
        closing: "On fait un test ensemble sur votre prochain devis pompe à chaleur ?",
        tags: ['Devis', 'Réactivité', 'Mobile'],
      },
      {
        id: 'bernard-2',
        approach: 'solution',
        title: 'Transformer les avis négatifs',
        opener: "Votre note Google de 3.8 cache une vraie pépite : vos clients adorent votre travail, ils critiquent juste l'attente.",
        body: "Avec notre module de devis express et de relances automatiques, vous pouvez passer à 4.5 étoiles en 3 mois. Un client qui reçoit son devis dans l'heure laisse un avis positif dans 67% des cas. On a les chiffres.",
        closing: "Je vous montre comment ça marche en partage d'écran ?",
        tags: ['Avis Google', 'Réputation', 'Conversion'],
      },
      {
        id: 'bernard-3',
        approach: 'urgence',
        title: 'Chaque jour perdu = un client perdu',
        opener: "Sophie, un prospect qui attend un devis plus de 24h a 60% de chances d'aller voir ailleurs.",
        body: "Avec la concurrence actuelle sur les PAC, chaque demande non traitée rapidement part chez le concurrent d'à côté. Notre outil vous notifie en temps réel des nouvelles demandes et propose des créneaux de rappel automatiques.",
        closing: "Combien de demandes avez-vous reçues ce mois-ci ? Je vous calcule le manque à gagner potentiel.",
        tags: ['Concurrence', 'Leads perdus', 'Urgence'],
      },
    ],
    roi: {
      heuresEconomisees: 6,
      coutHoraireMoyen: 45,
      economieHebdo: 270,
      economieMensuelle: 1080,
      economieAnnuelle: 12960,
      detailsCalcul: [
        'Devis automatisés : ~2h/semaine économisées',
        'Relances clients programmées : ~1.5h/semaine',
        'Suivi prospects centralisé : ~1.5h/semaine',
        'Moins de rappels clients mécontents : ~1h/semaine',
      ],
    },
    painSummary: "Détresse détectée sur la réactivité : 4 avis mentionnent des délais de réponse trop longs, 2 avis évoquent des devis jamais reçus. Opportunité forte d'amélioration de la conversion.",
  },
  '3': {
    prospect: {
      id: '3',
      raison_sociale: 'Vert Paysage SARL',
      email: 'contact@vert-paysage.fr',
      telephone: '06 55 44 33 22',
      adresse: '8 chemin des Vignes',
      ville: 'Bordeaux',
      code_postal: '33000',
      site_web: 'https://vert-paysage.fr',
      activite_principale: 'Paysagiste - Espaces verts',
      pain_score: 75,
      urgency_level: 'critical',
      top_issues: ['Gestion BSD', 'Traçabilité déchets', 'Conformité Trackdéchets'],
      note_google: 4.5,
      nombre_avis: 28,
      statut: 'actif',
    },
    painSignals: [
      { category: 'Gestion BSD', severity: 'critical', count: 5, examples: ['Bordereaux perdus', 'Paperasse en fin de journée', 'Erreurs de saisie'] },
      { category: 'Traçabilité déchets', severity: 'high', count: 3, examples: ['Suivi compliqué', 'Pas de visibilité'] },
      { category: 'Conformité', severity: 'high', count: 2, examples: ['Peur du contrôle', 'Réglementation floue'] },
    ],
    scripts: [
      {
        id: 'vert-1',
        approach: 'empathique',
        title: 'La paperasse en fin de journée',
        opener: "Je sais que quand on rentre d'un chantier à 18h après avoir évacué 3 tonnes de terre, la dernière chose qu'on veut faire c'est remplir des bordereaux.",
        body: "Notre module BSD Express vous permet de valider vos évacuations en 30 secondes directement sur le chantier, depuis votre téléphone. Scan du QR code déchetterie, signature du client sur l'écran, et c'est fini. Le bordereau conforme est généré automatiquement.",
        closing: "Vous faites combien d'évacuations par semaine ? Je vous montre le gain de temps concret.",
        tags: ['BSD', 'Mobile', 'Terrain'],
      },
      {
        id: 'vert-2',
        approach: 'solution',
        title: 'Trackdéchets sans prise de tête',
        opener: "Trackdéchets, c'est une usine à gaz. Même la DREAL l'admet.",
        body: "Notre solution pré-remplit 80% des champs automatiquement : codes déchets, coordonnées transporteur, numéros SIRET. Vous n'avez plus qu'à valider. En cas de contrôle, tout est archivé et accessible en 1 clic depuis votre téléphone.",
        closing: "Vous avez déjà eu un contrôle ? Je vous montre comment être serein pour le prochain.",
        tags: ['Trackdéchets', 'Conformité', 'Contrôle'],
      },
      {
        id: 'vert-3',
        approach: 'urgence',
        title: 'Avant le prochain contrôle',
        opener: "Les contrôles DREAL sur les BSD se sont intensifiés de 40% cette année en Nouvelle-Aquitaine.",
        body: "Un bordereau manquant ou mal rempli, c'est jusqu'à 75 000€ d'amende. Notre système garantit la conformité de chaque évacuation et archive tout pendant 5 ans. Vous dormez tranquille.",
        closing: "On fait le point sur vos BSD des 6 derniers mois ? C'est gratuit et ça prend 15 minutes.",
        tags: ['Contrôle', 'Amende', 'Sécurité'],
      },
    ],
    roi: {
      heuresEconomisees: 7,
      coutHoraireMoyen: 45,
      economieHebdo: 315,
      economieMensuelle: 1260,
      economieAnnuelle: 15120,
      detailsCalcul: [
        'BSD Express terrain : ~2.5h/semaine économisées',
        'Trackdéchets automatisé : ~2h/semaine',
        'Archivage et recherche : ~1.5h/semaine',
        'Préparation contrôles : ~1h/semaine',
      ],
    },
    painSummary: "Détresse critique sur la gestion des BSD : 5 mentions de bordereaux perdus ou mal remplis. Risque réglementaire élevé avec les contrôles DREAL en hausse.",
  },
};

// ============================================================================
// COMPOSANTS
// ============================================================================

function PainScoreGauge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 70) return { bg: 'bg-red-500', text: 'text-red-400', label: 'Critique' };
    if (score >= 50) return { bg: 'bg-amber-500', text: 'text-amber-400', label: 'Élevé' };
    if (score >= 30) return { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'Modéré' };
    return { bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'Faible' };
  };

  const { bg, text, label } = getColor();

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-red-400" />
          Score de Douleur
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${bg}/20 ${text}`}>
          {label}
        </span>
      </div>

      <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden mb-3">
        <div
          className={`absolute left-0 top-0 h-full ${bg} transition-all duration-1000`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className={`text-4xl font-bold ${text}`}>{score}</span>
        <span className="text-slate-400 text-sm">/100</span>
      </div>
    </div>
  );
}

function ScriptCard({ script, onCopy }: { script: SalesScript; onCopy: (text: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const fullScript = `${script.opener}\n\n${script.body}\n\n${script.closing}`;
    onCopy(fullScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const approachColors = {
    empathique: 'border-blue-500/40 bg-blue-500/10',
    solution: 'border-emerald-500/40 bg-emerald-500/10',
    urgence: 'border-amber-500/40 bg-amber-500/10',
  };

  const approachLabels = {
    empathique: { label: 'Approche Empathique', icon: '💬' },
    solution: { label: 'Approche Solution', icon: '💡' },
    urgence: { label: 'Approche Urgence', icon: '⚡' },
  };

  return (
    <div className={`border rounded-xl p-4 sm:p-5 ${approachColors[script.approach]} overflow-hidden`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{approachLabels[script.approach].icon}</span>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {approachLabels[script.approach].label}
            </span>
          </div>
          <h4 className="text-lg font-semibold text-white">{script.title}</h4>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          title="Copier le script"
        >
          {copied ? (
            <Check className="w-5 h-5 text-emerald-400" />
          ) : (
            <Copy className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <div className="overflow-hidden">
          <p className="text-slate-500 text-xs uppercase mb-1">Accroche</p>
          <p className="text-slate-300 italic break-words">"{script.opener}"</p>
        </div>
        <div className="overflow-hidden">
          <p className="text-slate-500 text-xs uppercase mb-1">Proposition</p>
          <p className="text-slate-300 break-words">{script.body}</p>
        </div>
        <div className="overflow-hidden">
          <p className="text-slate-500 text-xs uppercase mb-1">Closing</p>
          <p className="text-white font-medium break-words">"{script.closing}"</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {script.tags.map((tag, i) => (
          <span
            key={i}
            className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded-md"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function ROICard({ roi }: { roi: ROICalculation }) {
  return (
    <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 rounded-2xl p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-500/30 rounded-xl flex-shrink-0">
          <Calculator className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white">Retour sur Investissement</h3>
          <p className="text-xs sm:text-sm text-slate-400">Estimation basée sur le profil</p>
        </div>
      </div>

      {/* Grille ROI responsive - 3 cols sur mobile aussi mais plus compact */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="text-center p-2 sm:p-4 bg-slate-800/50 rounded-xl">
          <p className="text-xl sm:text-3xl font-bold text-emerald-400">{roi.heuresEconomisees}h</p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">/ semaine</p>
        </div>
        <div className="text-center p-2 sm:p-4 bg-slate-800/50 rounded-xl">
          <p className="text-xl sm:text-3xl font-bold text-cyan-400">{roi.economieMensuelle}€</p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">/ mois</p>
        </div>
        <div className="text-center p-2 sm:p-4 bg-slate-800/50 rounded-xl">
          <p className="text-lg sm:text-3xl font-bold text-amber-400">{roi.economieAnnuelle.toLocaleString()}€</p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">/ an</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider">Détail du calcul</p>
        {roi.detailsCalcul.map((detail, i) => (
          <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>{detail}</span>
          </div>
        ))}
        <p className="text-xs text-slate-500 mt-3">
          *Base : coût horaire moyen {roi.coutHoraireMoyen}€/h
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE PRINCIPALE
// ============================================================================

export default function ProspectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { config } = useIndustry();

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scripts, setScripts] = useState<SalesScript[]>([]);
  const [roi, setRoi] = useState<ROICalculation | null>(null);
  const [painSummary, setPainSummary] = useState('');

  const prospectId = params.id as string;

  useEffect(() => {
    async function fetchProspect() {
      if (!prospectId) return;

      // Vérifier si on a des données mockées pour cet ID
      const mockData = MOCK_PROSPECTS[prospectId];
      
      if (mockData) {
        // Utiliser les données de simulation
        setProspect(mockData.prospect);
        setScripts(mockData.scripts);
        setRoi(mockData.roi);
        setPainSummary(mockData.painSummary);
        setIsLoading(false);
        return;
      }

      // Sinon, essayer de charger depuis Supabase
      try {
        const { data, error } = await supabase
          .from('prospects')
          .select('*')
          .eq('id', prospectId)
          .single();

        if (error) throw error;

        setProspect(data);

        // Générer les scripts et le ROI
        const painSignals: PainSignal[] = (data.top_issues || []).map((issue: string, i: number) => ({
          category: issue,
          severity: i === 0 ? 'high' : 'medium',
          count: Math.floor(Math.random() * 5) + 1,
          examples: [issue],
        }));

        // Récupérer les données d'avis réels si disponibles
        const realQuotes = data.real_quotes || [];
        const scriptHooks = data.script_hooks || [];

        const context = {
          metier: data.activite_principale || 'Artisan',
          painScore: data.pain_score || 50,
          painSignals,
          nombreAvis: data.nombre_avis || 0,
          noteGoogle: data.note_google,
          volumeChantiers: 8,
          // Données réelles des avis Google
          realQuotes,
          scriptHooks,
        };

        setScripts(generateSalesScripts(context));
        setRoi(calculateROI(context));
        setPainSummary(data.pain_summary || generatePainSummary(painSignals, realQuotes));

      } catch (error) {
        console.error('Erreur chargement prospect:', error);
        
        // Fallback : utiliser le premier mock si l'ID n'existe pas
        const fallbackMock = MOCK_PROSPECTS['1'];
        if (fallbackMock) {
          setProspect({ ...fallbackMock.prospect, id: prospectId, raison_sociale: `Prospect #${prospectId}` });
          setScripts(fallbackMock.scripts);
          setRoi(fallbackMock.roi);
          setPainSummary(fallbackMock.painSummary);
        } else {
          showToast({
            type: 'error',
            title: 'Erreur',
            message: 'Impossible de charger les données du prospect.',
          });
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchProspect();
  }, [prospectId, showToast]);

  const handleCopyScript = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast({
      type: 'success',
      title: 'Copié',
      message: 'Script copié dans le presse-papiers.',
      duration: 2000,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Prospect introuvable</h1>
          <p className="text-slate-400 mb-6">Ce prospect n'existe pas ou a été supprimé.</p>
          <Link
            href="/admin/clients"
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium"
          >
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const painScore = prospect.pain_score || 50;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header Mobile-First */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/admin/clients"
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors active:bg-slate-600"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>

            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-white truncate">{prospect.raison_sociale}</h1>
              <p className="text-xs sm:text-sm text-slate-400 truncate">
                {prospect.activite_principale || 'Activité non renseignée'} • {prospect.ville || 'Localisation inconnue'}
              </p>
            </div>

            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
              <span className="text-lg">{config.icon}</span>
              <span className={`text-sm font-medium ${config.color}`}>{config.shortLabel}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal - Mobile-First */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Section État de Santé - Empilage vertical sur mobile */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-400" />
            État de Santé du Prospect
          </h2>

          {/* Grille qui s'empile sur mobile */}
          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
            {/* Pain Score - Full width sur mobile */}
            <PainScoreGauge score={painScore} />

            {/* Résumé douleur - Full width sur mobile */}
            <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Diagnostic Automatique
              </h3>
              
              <p className="text-slate-300 mb-4 text-sm sm:text-lg leading-relaxed">{painSummary}</p>

              {prospect.top_issues && prospect.top_issues.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Points de douleur détectés</p>
                  <div className="flex flex-wrap gap-2">
                    {prospect.top_issues.map((issue, i) => (
                      <span
                        key={i}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs sm:text-sm"
                      >
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Infos Google */}
              {(prospect.note_google || prospect.nombre_avis) && (
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-700">
                  {prospect.note_google && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-white font-medium">{prospect.note_google}</span>
                    </div>
                  )}
                  {prospect.nombre_avis && (
                    <span className="text-slate-400 text-sm">{prospect.nombre_avis} avis Google</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section Scripts de Vente - Empilage vertical sur mobile */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            Scripts de Vente Personnalisés
          </h2>

          {/* Scripts empilés verticalement sur mobile, 3 colonnes sur desktop */}
          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-4">
            {scripts.map((script) => (
              <ScriptCard key={script.id} script={script} onCopy={handleCopyScript} />
            ))}
          </div>
        </section>

        {/* Section ROI - Optimisée mobile */}
        {roi && (
          <section>
            <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Argumentation ROI
            </h2>
            <ROICard roi={roi} />
          </section>
        )}

        {/* Section Contact - Optimisée mobile */}
        <section className="pb-6">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-400" />
            Coordonnées
          </h2>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-3 sm:p-6">
            {/* Grille responsive : 1 col mobile, 2 cols tablette, 4 cols desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {prospect.telephone && (
                <a
                  href={`tel:${prospect.telephone}`}
                  className="flex items-center gap-3 p-4 bg-slate-700/50 hover:bg-slate-700 active:bg-slate-600 rounded-xl transition-colors overflow-hidden"
                >
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Téléphone</p>
                    <p className="text-white font-medium truncate">{prospect.telephone}</p>
                  </div>
                </a>
              )}

              {prospect.email && (
                <a
                  href={`mailto:${prospect.email}`}
                  className="flex items-center gap-3 p-4 bg-slate-700/50 hover:bg-slate-700 active:bg-slate-600 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-white font-medium truncate">{prospect.email}</p>
                  </div>
                </a>
              )}

              {prospect.adresse && (
                <div className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl overflow-hidden">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">Adresse</p>
                    <p className="text-white font-medium break-words text-sm">{prospect.adresse}</p>
                  </div>
                </div>
              )}

              {prospect.site_web && (
                <a
                  href={prospect.site_web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-slate-700/50 hover:bg-slate-700 active:bg-slate-600 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Site web</p>
                    <p className="text-white font-medium truncate">{prospect.site_web}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 flex-shrink-0" />
                </a>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
