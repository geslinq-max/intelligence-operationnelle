'use client';

import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let x = 0;
      let y = 0;

      switch (position) {
        case 'top':
          x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          y = triggerRect.top - tooltipRect.height - 8;
          break;
        case 'bottom':
          x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          y = triggerRect.bottom + 8;
          break;
        case 'left':
          x = triggerRect.left - tooltipRect.width - 8;
          y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          break;
        case 'right':
          x = triggerRect.right + 8;
          y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          break;
      }

      // Garder dans les limites de l'écran
      x = Math.max(8, Math.min(x, window.innerWidth - tooltipRect.width - 8));
      y = Math.max(8, Math.min(y, window.innerHeight - tooltipRect.height - 8));

      setCoords({ x, y });
    }
  }, [isVisible, position]);

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <span
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onTouchStart={() => setIsVisible(!isVisible)}
        className="cursor-help"
      >
        {children || (
          <Info className="w-4 h-4 text-slate-500 hover:text-cyan-400 transition-colors" />
        )}
      </span>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-[100] px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-w-xs animate-fade-in"
          style={{ left: coords.x, top: coords.y }}
        >
          <span className="text-slate-200 leading-relaxed block">{content}</span>
          <div 
            className={`absolute w-2 h-2 bg-slate-800 border-slate-700 transform rotate-45 ${
              position === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-r border-b' :
              position === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-l border-t' :
              position === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-r border-t' :
              'left-[-5px] top-1/2 -translate-y-1/2 border-l border-b'
            }`}
          />
        </div>
      )}
    </span>
  );
}

// Définitions des termes techniques
export const DEFINITIONS = {
  ROI: "Retour sur Investissement. Indicateur mesurant le temps nécessaire pour que les économies générées couvrent l'investissement initial. Un ROI de 12 mois signifie que le projet sera rentabilisé en 1 an.",
  CEE: "Certificats d'Économies d'Énergie. Dispositif obligeant les fournisseurs d'énergie à financer des travaux d'économie d'énergie. Permet d'obtenir des primes pour vos projets d'optimisation.",
  subventions: "Aides financières de l'État et des collectivités pour encourager la transition énergétique des entreprises. Incluent les CEE, Ma Prime Rénov' Pro, et les aides régionales.",
  economiesAnnuelles: "Montant estimé des réductions de coûts sur une année complète suite à la mise en œuvre des actions recommandées.",
  tempsRetour: "Durée nécessaire pour que les économies réalisées compensent l'investissement initial. Plus ce temps est court, plus le projet est prioritaire.",
  potentielGain: "Estimation des économies potentielles identifiées par l'analyse de vos données. Ce montant représente l'opportunité d'optimisation détectée.",
  anomalie: "Écart significatif entre une consommation observée et une consommation attendue. Peut indiquer un dysfonctionnement, une mauvaise configuration ou une opportunité d'optimisation.",
  scoreEnergie: "Note sur 100 évaluant la performance énergétique de l'entreprise par rapport aux standards du secteur. Plus le score est élevé, meilleure est la performance.",
  tresorerieRecuperable: "Estimation basée sur les montants de subventions CEE 2026 identifiés et les délais moyens de versement des organismes obligés après validation technique.",
};

// Composant helper pour afficher un terme avec tooltip
interface TermWithTooltipProps {
  term: keyof typeof DEFINITIONS;
  label?: string;
  className?: string;
}

export function TermWithTooltip({ term, label, className = '' }: TermWithTooltipProps) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span>{label || term}</span>
      <Tooltip content={DEFINITIONS[term]} position="top">
        <Info className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-400 transition-colors cursor-help" />
      </Tooltip>
    </span>
  );
}
