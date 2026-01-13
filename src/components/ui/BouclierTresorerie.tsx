'use client';

import { useState, useEffect, useRef } from 'react';
import { Shield } from 'lucide-react';

interface BouclierTresorerieProps {
  montantTotal: number;
  nombreDossiers?: number;
}

function useCountAnimation(target: number, duration: number = 2000) {
  const [count, setCount] = useState<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(easeOutQuart * target);

      setCount(currentValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    startTimeRef.current = null;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration]);

  return count;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function BouclierTresorerie({ montantTotal, nombreDossiers = 0 }: BouclierTresorerieProps) {
  const animatedValue = useCountAnimation(montantTotal, 2500);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20 p-6 mb-6">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative flex items-center gap-4">
        {/* Shield Icon */}
        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 rounded-xl flex items-center justify-center border border-emerald-500/40 shadow-inner">
          <span className="text-3xl">🛡️</span>
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <p className="text-emerald-400/80 text-sm font-medium tracking-wide uppercase mb-1">
            Cellule d'Expertise • Capital Protégé
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
              <span className="text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]">
                {formatCurrency(animatedValue)}
              </span>
              <span className="text-emerald-400/80 text-2xl ml-1">€</span>
            </p>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Capital Sécurisé par la Cellule
            {nombreDossiers > 0 && (
              <span className="ml-2 text-emerald-400/70">
                • {nombreDossiers} dossier{nombreDossiers > 1 ? 's' : ''} validé{nombreDossiers > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>

        {/* Status Badge */}
        <div className="hidden sm:flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-xs font-semibold">Système d'Audit Actif</span>
          </div>
          <span className="text-slate-500 text-xs">
            Mise à jour en temps réel
          </span>
        </div>
      </div>
    </div>
  );
}
