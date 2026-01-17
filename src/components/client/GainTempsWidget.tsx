'use client';

import { useState, useEffect } from 'react';
import { Clock, TrendingUp, Zap } from 'lucide-react';

interface GainTempsWidgetProps {
  heuresEconomisees: number;
  dossiersTraites?: number;
  tauxAutomatisation?: number;
}

export default function GainTempsWidget({
  heuresEconomisees,
  dossiersTraites = 0,
  tauxAutomatisation = 85,
}: GainTempsWidgetProps) {
  const [displayHours, setDisplayHours] = useState(0);

  // Animation du compteur
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = heuresEconomisees / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= heuresEconomisees) {
        setDisplayHours(heuresEconomisees);
        clearInterval(timer);
      } else {
        setDisplayHours(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [heuresEconomisees]);

  // Calcul des équivalences
  const joursEconomises = Math.round(heuresEconomisees / 8);
  const valeurEstimee = Math.round(heuresEconomisees * 45); // 45€/h moyen

  return (
    <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 rounded-2xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-500/20 rounded-xl">
          <Clock className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white">Gain de Temps</h2>
          <p className="text-xs sm:text-sm text-emerald-400/80">Grâce à votre solution</p>
        </div>
      </div>

      {/* Compteur principal */}
      <div className="text-center py-4 sm:py-6">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-4xl sm:text-6xl font-bold text-emerald-400 tabular-nums">
            {displayHours}
          </span>
          <span className="text-lg sm:text-2xl text-emerald-400/70">heures</span>
        </div>
        <p className="text-slate-400 text-sm mt-2">
          d'administration économisées
        </p>
      </div>

      {/* Stats secondaires */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-emerald-500/20">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-white">{joursEconomises}</p>
          <p className="text-xs text-slate-400">jours gagnés</p>
        </div>

        <div className="text-center border-x border-emerald-500/20">
          <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
            <Zap className="w-4 h-4" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-white">{tauxAutomatisation}%</p>
          <p className="text-xs text-slate-400">automatisé</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
            <span className="text-sm">€</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-white">{valeurEstimee.toLocaleString()}</p>
          <p className="text-xs text-slate-400">valeur estimée</p>
        </div>
      </div>

      {/* Message motivationnel */}
      <div className="mt-4 p-3 bg-emerald-500/10 rounded-xl text-center">
        <p className="text-xs sm:text-sm text-emerald-300">
          🎯 Vous pouvez maintenant vous concentrer sur votre cœur de métier
        </p>
      </div>
    </div>
  );
}
