'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronDown,
  Check,
  X,
  Zap,
  Leaf,
  Grape,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';

// Types
type IndustryType = 'CEE' | 'PAYSAGISTE' | 'VITICULTEUR';

interface IndustryOption {
  value: IndustryType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// Configuration des secteurs d'activité
const INDUSTRIES: IndustryOption[] = [
  {
    value: 'CEE',
    label: 'Artisan CEE',
    icon: <Zap className="w-5 h-5 text-emerald-400" />,
    description: 'Pompes à chaleur, isolation, rénovation énergétique',
  },
  {
    value: 'PAYSAGISTE',
    label: 'Paysagiste / Démolition',
    icon: <Leaf className="w-5 h-5 text-amber-400" />,
    description: 'Gestion des déchets, BSD, Trackdéchets',
  },
  {
    value: 'VITICULTEUR',
    label: 'Viticulteur',
    icon: <Grape className="w-5 h-5 text-purple-400" />,
    description: 'Registre phytosanitaire, traçabilité',
  },
];

// Critères de force du mot de passe
interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function checkPasswordStrength(password: string): PasswordCriteria {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
}

function getPasswordStrengthScore(criteria: PasswordCriteria): number {
  return Object.values(criteria).filter(Boolean).length;
}

function getPasswordStrengthLabel(score: number): { label: string; color: string } {
  if (score <= 2) return { label: 'Faible', color: 'text-red-400' };
  if (score <= 3) return { label: 'Moyen', color: 'text-amber-400' };
  if (score <= 4) return { label: 'Bon', color: 'text-blue-400' };
  return { label: 'Excellent', color: 'text-emerald-400' };
}

export default function InscriptionPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation mot de passe
  const passwordCriteria = checkPasswordStrength(password);
  const passwordScore = getPasswordStrengthScore(passwordCriteria);
  const strengthInfo = getPasswordStrengthLabel(passwordScore);

  // Validation du formulaire
  const isFormValid = email.includes('@') && passwordScore >= 3 && selectedIndustry !== null;

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Soumission du formulaire
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!isFormValid) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // 1. Créer le compte avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'client',
            industry: selectedIndustry,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte');
      }

      // 2. Créer le profil utilisateur
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: email,
          role: 'client',
          industry: selectedIndustry,
          created_at: new Date().toISOString(),
        });

      if (profileError) {
        console.warn('Profil non créé (RLS ou table absente):', profileError.message);
      }

      // 3. Message de bienvenue
      showToast({
        type: 'success',
        title: 'Bienvenue chez Capital Énergie, votre solution métier est prête.',
      });

      // 4. Redirection vers le dashboard client
      router.push('/client/dashboard');

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'inscription';
      setError(message);
      showToast({
        type: 'error',
        title: message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const selectedOption = INDUSTRIES.find(i => i.value === selectedIndustry);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <span className="text-white font-bold text-2xl">CE</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Créer votre compte</h1>
          <p className="text-slate-400">Rejoignez Capital Énergie en quelques secondes</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.fr"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-12 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Indicateur de force */}
            {password.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        passwordScore <= 2 ? 'bg-red-500' :
                        passwordScore <= 3 ? 'bg-amber-500' :
                        passwordScore <= 4 ? 'bg-blue-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(passwordScore / 5) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${strengthInfo.color}`}>
                    {strengthInfo.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className={`flex items-center gap-1 ${passwordCriteria.minLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {passwordCriteria.minLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    8 caractères min.
                  </div>
                  <div className={`flex items-center gap-1 ${passwordCriteria.hasUppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {passwordCriteria.hasUppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    Majuscule
                  </div>
                  <div className={`flex items-center gap-1 ${passwordCriteria.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {passwordCriteria.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    Chiffre
                  </div>
                  <div className={`flex items-center gap-1 ${passwordCriteria.hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {passwordCriteria.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    Caractère spécial
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sélecteur de secteur */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Votre Secteur d'Activité
            </label>
            <div className="relative" data-dropdown>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 bg-slate-900/50 border rounded-xl text-left transition-all ${
                  isDropdownOpen 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/50' 
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                {selectedOption ? (
                  <div className="flex items-center gap-3">
                    {selectedOption.icon}
                    <span className="text-white">{selectedOption.label}</span>
                  </div>
                ) : (
                  <span className="text-slate-500">Sélectionnez votre secteur</span>
                )}
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Options du dropdown */}
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden">
                  {INDUSTRIES.map((industry) => (
                    <button
                      key={industry.value}
                      type="button"
                      onClick={() => {
                        setSelectedIndustry(industry.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-700/50 transition-colors ${
                        selectedIndustry === industry.value ? 'bg-emerald-500/10' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">{industry.icon}</div>
                      <div>
                        <p className="font-medium text-white">{industry.label}</p>
                        <p className="text-xs text-slate-400">{industry.description}</p>
                      </div>
                      {selectedIndustry === industry.value && (
                        <Check className="w-5 h-5 text-emerald-400 ml-auto flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Bouton d'inscription */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Création en cours...
              </>
            ) : (
              'Créer mon compte'
            )}
          </button>

          {/* Lien connexion */}
          <p className="text-center text-sm text-slate-400">
            Déjà inscrit ?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Se connecter
            </Link>
          </p>
        </form>

        {/* Mentions légales */}
        <p className="text-center text-xs text-slate-500 mt-6">
          En créant un compte, vous acceptez nos{' '}
          <Link href="/cgv" className="text-slate-400 hover:text-white underline">CGV</Link>
          {' '}et notre{' '}
          <Link href="/confidentialite" className="text-slate-400 hover:text-white underline">Politique de confidentialité</Link>
        </p>
      </div>
    </div>
  );
}
