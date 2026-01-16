'use client';

import Link from 'next/link';
import { ShieldX, Home, ArrowLeft, Lock } from 'lucide-react';

/**
 * Page 403 - Accès Refusé
 * 
 * Affichée lorsqu'un utilisateur tente d'accéder à une route protégée
 * sans les autorisations nécessaires.
 */
export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icône */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/50">
            <ShieldX className="w-12 h-12 text-red-500" />
          </div>
        </div>

        {/* Code d'erreur */}
        <h1 className="text-8xl font-bold text-red-500 mb-4">403</h1>
        
        {/* Message */}
        <h2 className="text-2xl font-semibold text-white mb-4">
          Accès Refusé
        </h2>
        
        <p className="text-slate-400 mb-8 leading-relaxed">
          Vous n&apos;avez pas les autorisations nécessaires pour accéder à cette page.
          Cette zone est réservée aux administrateurs.
        </p>

        {/* Détails de sécurité */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-8 text-left">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-400 font-medium text-sm">Zone Protégée</p>
              <p className="text-slate-500 text-xs mt-1">
                Seuls les utilisateurs autorisés peuvent accéder à cette section.
                Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez l&apos;administrateur.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            Retour au Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Page précédente
          </button>
        </div>

        {/* Footer */}
        <p className="mt-12 text-slate-600 text-sm">
          © 2026 CAPITAL ÉNERGIE • Sécurité renforcée
        </p>
      </div>
    </div>
  );
}
