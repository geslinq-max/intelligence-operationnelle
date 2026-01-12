'use client';

import { CheckCircle2, XCircle, Camera, FileCheck } from 'lucide-react';

interface TechnicalValidationBadgeProps {
  photos_plaques: boolean;
  photos_tableau: boolean;
  className?: string;
}

export default function TechnicalValidationBadge({
  photos_plaques,
  photos_tableau,
  className = '',
}: TechnicalValidationBadgeProps) {
  const isValidated = photos_plaques && photos_tableau;

  if (isValidated) {
    return (
      <div className={`flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg ${className}`}>
        <CheckCircle2 className="w-5 h-5 text-green-400" />
        <span className="text-green-400 font-semibold text-sm">QUALIFICATION TECHNIQUE VALIDÉE</span>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <XCircle className="w-5 h-5 text-amber-400" />
        <span className="text-amber-400 font-semibold text-sm">QUALIFICATION EN ATTENTE</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Camera className={`w-4 h-4 ${photos_plaques ? 'text-green-400' : 'text-slate-500'}`} />
          <span className={`text-sm ${photos_plaques ? 'text-green-400' : 'text-slate-400'}`}>
            Photos plaques signalétiques
          </span>
          {photos_plaques ? (
            <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />
          ) : (
            <span className="text-xs text-amber-400 ml-auto">Requise</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <FileCheck className={`w-4 h-4 ${photos_tableau ? 'text-green-400' : 'text-slate-500'}`} />
          <span className={`text-sm ${photos_tableau ? 'text-green-400' : 'text-slate-400'}`}>
            Photos tableau électrique
          </span>
          {photos_tableau ? (
            <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />
          ) : (
            <span className="text-xs text-amber-400 ml-auto">Requise</span>
          )}
        </div>
      </div>
    </div>
  );
}
