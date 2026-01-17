'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIndustry } from '@/contexts/IndustryContext';
import GainTempsWidget from '@/components/client/GainTempsWidget';
import WelcomeBlock from '@/components/client/WelcomeBlock';
import ClientCEEView from '@/components/client/ClientCEEView';
import ClientPaysagisteView from '@/components/client/ClientPaysagisteView';
import ClientViticulteurView from '@/components/client/ClientViticulteurView';

// Type d'industrie client
type ClientIndustry = 'CEE' | 'PAYSAGISTE' | 'VITICULTEUR';

// Configuration des industries
const INDUSTRY_CONFIG: Record<ClientIndustry, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  CEE: {
    label: 'Artisan CEE',
    icon: '⚡',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  PAYSAGISTE: {
    label: 'Paysagiste',
    icon: '🌿',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  VITICULTEUR: {
    label: 'Viticulteur',
    icon: '🍇',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
};

export default function ClientDashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const { currentMode } = useIndustry();
  const router = useRouter();
  
  // Déterminer l'industrie du client basée sur le mode actuel
  const [clientIndustry, setClientIndustry] = useState<ClientIndustry>('CEE');

  useEffect(() => {
    // Mapper le mode industry au type client
    if (currentMode === 'PAYSAGISTE_DEMOLITION') {
      setClientIndustry('PAYSAGISTE');
    } else if (currentMode === 'VITICULTURE') {
      setClientIndustry('VITICULTEUR');
    } else {
      setClientIndustry('CEE');
    }
  }, [currentMode]);

  // Données de gain de temps (à récupérer depuis l'API/base de données)
  const gainTempsData = {
    heuresEconomisees: 47,
    dossiersTraites: 12,
    tauxAutomatisation: 89,
  };

  // Déterminer si le client a des données (pour afficher ou non l'état vide)
  const [hasData, setHasData] = useState(false);
  
  // TODO: Récupérer depuis Supabase si le client a des données
  useEffect(() => {
    // Simulation - à remplacer par une vraie requête
    const checkUserData = async () => {
      // Pour la démo, on considère qu'il y a des données si gain > 0
      setHasData(gainTempsData.dossiersTraites > 0);
    };
    checkUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const config = INDUSTRY_CONFIG[clientIndustry];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header simplifié - Pas de menu technique */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo et titre */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">CE</span>
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white">Ma Solution</h1>
                <div className={`flex items-center gap-1.5 ${config.color}`}>
                  <span>{config.icon}</span>
                  <span className="text-xs sm:text-sm">{config.label}</span>
                </div>
              </div>
            </div>

            {/* Actions utilisateur */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right mr-2">
                <p className="text-sm text-white font-medium">{user?.nom}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              
              <button
                onClick={logout}
                className="p-2.5 hover:bg-slate-700 active:bg-slate-600 rounded-xl transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
        {/* Bloc d'accueil dynamique - Message + Action prioritaire + Guide */}
        <WelcomeBlock
          clientNom={user?.nom || 'Client'}
          industry={clientIndustry}
          hasData={hasData}
        />

        {/* Widget Gain de Temps */}
        {hasData && (
          <GainTempsWidget
            heuresEconomisees={gainTempsData.heuresEconomisees}
            dossiersTraites={gainTempsData.dossiersTraites}
            tauxAutomatisation={gainTempsData.tauxAutomatisation}
          />
        )}

        {/* Vue spécifique à l'industrie */}
        {clientIndustry === 'CEE' && (
          <ClientCEEView
            clientId={user?.id || ''}
            clientNom={user?.nom || ''}
            hasData={hasData}
          />
        )}

        {clientIndustry === 'PAYSAGISTE' && (
          <ClientPaysagisteView
            clientId={user?.id || ''}
            clientNom={user?.nom || ''}
            hasData={hasData}
          />
        )}

        {clientIndustry === 'VITICULTEUR' && (
          <ClientViticulteurView
            clientId={user?.id || ''}
            clientNom={user?.nom || ''}
            hasData={hasData}
            onExportPDF={() => {
              router.push('/viticulture/registre-phyto');
            }}
          />
        )}
      </main>

      {/* Footer minimaliste */}
      <footer className="mt-auto py-6 text-center">
        <p className="text-xs text-slate-500">
          Capital Énergie • Votre solution métier
        </p>
      </footer>
    </div>
  );
}
