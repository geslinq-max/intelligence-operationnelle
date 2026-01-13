'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Zap, 
  Leaf, 
  FileCheck, 
  TrendingUp, 
  CheckCircle2, 
  Shield,
  Clock,
  Building2,
  Euro,
  ArrowRight
} from 'lucide-react';
import SignatureCanvas from '@/components/SignatureCanvas';
import { supabase } from '@/lib/supabase/client';

interface PlanData {
  id: string;
  entreprise: string;
  secteur: string;
  actions: ActionItem[];
  total_economie: number;
  total_investissement: number;
  created_at: string;
}

interface ActionItem {
  nom: string;
  economie_annuelle: number;
  investissement: number;
  code_cee?: string;
  co2_evite?: number;
}

const DEMO_DATA: Record<string, PlanData> = {
  'test-dupont': {
    id: 'test-dupont',
    entreprise: 'Métallurgie Dupont SARL',
    secteur: 'Métallurgie',
    actions: [
      {
        nom: 'Installation de variateurs de vitesse',
        economie_annuelle: 8500,
        investissement: 12000,
        code_cee: 'IND-UT-102',
        co2_evite: 2.8
      },
      {
        nom: 'Récupération de chaleur sur compresseurs',
        economie_annuelle: 4200,
        investissement: 8500,
        code_cee: 'IND-UT-117',
        co2_evite: 1.4
      }
    ],
    total_economie: 12700,
    total_investissement: 20500,
    created_at: '2026-01-05T10:00:00Z'
  },
  'test-garage': {
    id: 'test-garage',
    entreprise: 'Garage Auto Plus',
    secteur: 'Automobile',
    actions: [
      {
        nom: 'Éclairage LED haute performance',
        economie_annuelle: 3200,
        investissement: 5500,
        code_cee: 'BAT-EQ-133',
        co2_evite: 1.1
      },
      {
        nom: 'Moteurs haute efficacité',
        economie_annuelle: 2100,
        investissement: 4200,
        code_cee: 'IND-UT-103',
        co2_evite: 0.7
      }
    ],
    total_economie: 5300,
    total_investissement: 9700,
    created_at: '2026-01-08T14:30:00Z'
  }
};

interface PortalData {
  plan: PlanData | null;
  loading: boolean;
  error: string | null;
  signed: boolean;
}

export default function PortalPage() {
  const params = useParams();
  const portalId = params.id as string;
  
  const [data, setData] = useState<PortalData>({
    plan: null,
    loading: true,
    error: null,
    signed: false
  });
  
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadPortalData();
  }, [portalId]);

  const loadPortalData = async () => {
    // Check for demo data first
    if (DEMO_DATA[portalId]) {
      setData({
        plan: DEMO_DATA[portalId],
        loading: false,
        error: null,
        signed: false
      });
      return;
    }

    try {
      const { data: plan, error } = await supabase
        .from('plans_actions')
        .select('*')
        .eq('id', portalId)
        .single();

      if (error) throw error;

      setData({
        plan,
        loading: false,
        error: null,
        signed: plan?.signature_date !== null
      });
    } catch (err) {
      setData({
        plan: null,
        loading: false,
        error: 'Ce lien de consultation n\'est pas valide ou a expiré.',
        signed: false
      });
    }
  };

  const calculateROI = () => {
    if (!data.plan) return { gainNet5Ans: 0, roi: 0 };
    const economieAnnuelle = data.plan.total_economie || 0;
    const investissement = data.plan.total_investissement || 0;
    const gainNet5Ans = (economieAnnuelle * 5) - investissement;
    const roi = investissement > 0 ? ((economieAnnuelle * 5) / investissement) * 100 : 0;
    return { gainNet5Ans, roi };
  };

  const calculateCO2 = () => {
    if (!data.plan?.actions) return 0;
    return data.plan.actions.reduce((total, action) => {
      return total + (action.co2_evite || 0);
    }, 0);
  };

  const getCEECodes = () => {
    if (!data.plan?.actions) return [];
    return data.plan.actions
      .filter(action => action.code_cee)
      .map(action => ({
        code: action.code_cee!,
        nom: action.nom
      }));
  };

  const handleSubmitSignature = async () => {
    if (!signatureData || !consentGiven || !data.plan) return;
    
    setIsSubmitting(true);
    
    try {
      // For demo data, just show success
      if (DEMO_DATA[portalId]) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setShowSuccess(true);
        setData(prev => ({ ...prev, signed: true }));
        return;
      }

      // Update plan with signature and maturity to 100%
      await supabase
        .from('plans_actions')
        .update({
          signature_data: signatureData,
          signature_date: new Date().toISOString(),
          signed_at: new Date().toISOString(),
          consent_rgpd: true,
          maturity_score: 100
        })
        .eq('id', portalId);

      // Also update related reports maturity
      await supabase
        .from('reports')
        .update({
          maturity_score: 100,
          signed_at: new Date().toISOString()
        })
        .eq('plan_id', portalId);

      setShowSuccess(true);
      setData(prev => ({ ...prev, signed: true }));
    } catch (err) {
      console.error('Erreur lors de la signature:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { gainNet5Ans, roi } = calculateROI();
  const co2Total = calculateCO2();
  const ceeCodes = getCEECodes();

  if (data.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement de votre dossier...</p>
        </div>
      </div>
    );
  }

  if (data.error || !data.plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Accès non autorisé</h1>
          <p className="text-slate-400">{data.error}</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-lg text-center bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-emerald-500/30">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Félicitations !</h1>
          <p className="text-xl text-emerald-400 font-medium mb-4">
            Votre dossier est transmis avec succès.
          </p>
          <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-cyan-400 mb-2">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Prochaine étape</span>
            </div>
            <p className="text-slate-300">
              Un artisan RGE partenaire vous contactera sous <strong className="text-white">48h</strong> pour 
              planifier la mise en œuvre de votre plan d'économies d'énergie.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Référence du dossier : {portalId.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">CAPITAL ÉNERGIE</h1>
                <p className="text-xs text-slate-400">Portail de consultation</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Dossier</p>
              <p className="text-sm font-mono text-cyan-400">{portalId.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Entreprise */}
        <section className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{data.plan.entreprise}</h2>
              <p className="text-slate-400 capitalize">{data.plan.secteur?.replace('_', ' ')}</p>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* ROI - Cellule d'Expertise */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl p-6 border border-cyan-500/30">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Cellule d'Expertise</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {gainNet5Ans.toLocaleString('fr-FR')} €
            </p>
            <p className="text-sm text-slate-400">Gain net projeté sur 5 ans</p>
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-xs text-slate-500">
                ROI : <span className="text-cyan-400 font-semibold">{roi.toFixed(0)}%</span>
              </p>
            </div>
          </div>

          {/* Écologie */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl p-6 border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Impact Écologique</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {co2Total.toFixed(1)} t
            </p>
            <p className="text-sm text-slate-400">CO₂ évité par an</p>
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-xs text-slate-500">
                Équivalent : <span className="text-emerald-400 font-semibold">{Math.round(co2Total * 5)} arbres</span>
              </p>
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-6 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-3">
              <FileCheck className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Système d'Audit</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {ceeCodes.length}
            </p>
            <p className="text-sm text-slate-400">Fiches CEE 2026 identifiées</p>
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-xs text-slate-500">Éligibilité confirmée</p>
            </div>
          </div>
        </div>

        {/* Détail des fiches CEE */}
        {ceeCodes.length > 0 && (
          <section className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-400" />
              Fiches d'Opérations Standardisées CEE 2026
            </h3>
            <div className="space-y-3">
              {ceeCodes.map((cee, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-xl"
                >
                  <code className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-mono font-semibold">
                    {cee.code}
                  </code>
                  <span className="text-slate-300 text-sm">{cee.nom}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Source : Ministère de la Transition Énergétique - Arrêté du 22 décembre 2025
            </p>
          </section>
        )}

        {/* Actions recommandées */}
        <section className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Plan d'actions recommandé
          </h3>
          <div className="space-y-3">
            {data.plan.actions?.map((action, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-cyan-400 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{action.nom}</p>
                    {action.code_cee && (
                      <p className="text-xs text-slate-500">Code CEE : {action.code_cee}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-semibold">
                    +{action.economie_annuelle?.toLocaleString('fr-FR')} €/an
                  </p>
                  <p className="text-xs text-slate-500">
                    Invest. : {action.investissement?.toLocaleString('fr-FR')} €
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Signature */}
        {!data.signed && (
          <section className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Validation et signature
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              En signant ce document, vous autorisez CAPITAL ÉNERGIE à transmettre votre dossier 
              à un artisan RGE partenaire pour établir un devis détaillé.
            </p>

            <SignatureCanvas
              onSignatureChange={setSignatureData}
              onConsentChange={setConsentGiven}
              disabled={isSubmitting}
            />

            <button
              onClick={handleSubmitSignature}
              disabled={!signatureData || !consentGiven || isSubmitting}
              className={`w-full mt-6 py-5 px-6 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all ${
                signatureData && consentGiven && !isSubmitting
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-xl shadow-cyan-500/30 active:scale-[0.98]'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  Transmission en cours...
                </>
              ) : (
                <>
                  <Euro className="w-6 h-6" />
                  Valider l'Audit et Lancer le Financement
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </section>
        )}

        {/* Déjà signé */}
        {data.signed && !showSuccess && (
          <section className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/30 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Dossier déjà validé</h3>
            <p className="text-slate-400">
              Ce dossier a été signé et transmis. Un artisan RGE vous contactera prochainement.
            </p>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800/50 border-t border-slate-700 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-500" />
              <span className="font-semibold text-white">CAPITAL ÉNERGIE</span>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Initiative privée indépendante • Ne constitue pas un document officiel de l'État
            </p>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Tous droits réservés
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
