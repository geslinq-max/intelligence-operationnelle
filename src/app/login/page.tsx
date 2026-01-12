'use client';

import { useState, useEffect } from 'react';
import { supabase, supabaseStatus } from '@/lib/supabase/client';
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseStatus.hasUrl || !supabaseStatus.hasKey) {
      setConfigError('Configuration Supabase manquante. Contactez l\'administrateur.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        if (data?.user) {
          setError(null);
          setIsRedirecting(true);
          window.location.href = '/';
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        setError('✅ Compte créé ! Vérifie ton email pour confirmer.');
        setIsLoading(false);
        return;
      }
    } catch (err: unknown) {
      let errorMessage = 'Une erreur est survenue';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = '❌ Email ou mot de passe incorrect';
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = '📧 Confirme ton email avant de te connecter';
        } else if (errorMessage.includes('User already registered')) {
          errorMessage = '⚠️ Cet email est déjà utilisé. Essaie de te connecter.';
        } else if (errorMessage.includes('Password should be')) {
          errorMessage = '🔑 Le mot de passe doit contenir au moins 6 caractères';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Affichage de l'état de redirection
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Connexion en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* 🚨 ERREUR GÉANTE DE CONFIGURATION */}
      {configError && (
        <div className="fixed inset-0 bg-red-900/95 z-50 flex items-center justify-center p-8">
          <div className="bg-red-950 border-4 border-red-500 rounded-2xl p-8 max-w-2xl text-center">
            <AlertTriangle className="w-24 h-24 text-red-500 mx-auto mb-6 animate-pulse" />
            <h1 className="text-4xl font-bold text-white mb-4">⚠️ ERREUR DE CONFIGURATION</h1>
            <p className="text-red-200 text-xl mb-6">Les clés Supabase ne sont pas configurées sur Vercel !</p>
            <div className="bg-red-900/50 rounded-lg p-4 text-left mb-6">
              <p className="text-red-300 font-mono text-sm whitespace-pre-wrap">{configError}</p>
            </div>
            <div className="text-white text-left space-y-2 mb-6">
              <p className="font-bold text-lg">📋 Pour corriger :</p>
              <p>1. Va sur <span className="text-cyan-400">vercel.com</span> → Ton projet</p>
              <p>2. Clique sur <span className="text-cyan-400">Settings</span> → <span className="text-cyan-400">Environment Variables</span></p>
              <p>3. Ajoute ces 2 variables :</p>
              <code className="block bg-slate-800 p-2 rounded text-green-400 text-sm">NEXT_PUBLIC_SUPABASE_URL</code>
              <code className="block bg-slate-800 p-2 rounded text-green-400 text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
              <p>4. Clique sur <span className="text-cyan-400">Deployments</span> → <span className="text-cyan-400">Redeploy</span></p>
            </div>
            <button 
              onClick={() => setConfigError(null)}
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg"
            >
              Fermer (pour tester quand même)
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">CAPITAL ÉNERGIE</h1>
          <p className="text-slate-400 mt-2">Plateforme d&apos;optimisation pour PME industrielles</p>
        </div>

        {/* Diagnostic rapide */}
        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-xs font-mono">
          <p className="text-slate-400">🔍 Diagnostic Supabase:</p>
          <p className={supabaseStatus.hasUrl ? 'text-green-400' : 'text-red-400'}>
            URL: {supabaseStatus.hasUrl ? '✅' : '❌'} ({supabaseStatus.urlLength} chars)
          </p>
          <p className={supabaseStatus.hasKey ? 'text-green-400' : 'text-red-400'}>
            Key: {supabaseStatus.hasKey ? '✅' : '❌'} ({supabaseStatus.keyLength} chars)
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>

          {error && (
            <div className={`flex items-start gap-2 p-4 rounded-lg mb-6 ${
              error.includes('✅') 
                ? 'bg-green-500/20 border-2 border-green-500 text-green-400' 
                : 'bg-red-500/20 border-2 border-red-500 text-red-400'
            }`}>
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <span className="text-base font-medium whitespace-pre-wrap">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="ton@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === 'login' ? 'Connexion en cours...' : 'Création en cours...'}
                </>
              ) : (
                mode === 'login' ? 'Se connecter' : 'Créer le compte'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
            >
              {mode === 'login' 
                ? 'Pas encore de compte ? Créer un compte' 
                : 'Déjà un compte ? Se connecter'}
            </button>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-sm">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Données cryptées et conformes au RGPD</span>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-slate-600 text-xs">
            © 2026 CAPITAL ÉNERGIE • Tous droits réservés
          </p>
          <div className="flex justify-center gap-3 text-xs text-slate-500">
            <a href="/mentions-legales" className="hover:text-slate-400 transition-colors">
              Mentions légales
            </a>
            <span>•</span>
            <a href="/confidentialite" className="hover:text-slate-400 transition-colors">
              Confidentialité
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
