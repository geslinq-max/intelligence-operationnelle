'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components';
import { supabase } from '@/lib/supabase/client';
import { 
  User, 
  Mail, 
  Shield, 
  Key, 
  Building2, 
  Trash2, 
  Save, 
  Loader2, 
  CheckCircle,
  AlertTriangle,
  X,
  Upload,
  Palette,
  Image
} from 'lucide-react';
import { useBranding, THEMES, type ThemeVariant } from '@/contexts/ThemeContext';

interface UserProfile {
  id: string;
  email: string;
  nom?: string;
  role?: string;
  cabinet_nom?: string;
  created_at?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Formulaire
  const [nom, setNom] = useState('');
  const [cabinetNom, setCabinetNom] = useState('');
  
  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(1);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Branding
  const { theme, setTheme, logoUrl, setLogoUrl, setCabinetNom: setBrandingCabinet } = useBranding();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useState<HTMLInputElement | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // Charger le profil depuis la table user_profiles si elle existe
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        setUser({
          id: authUser.id,
          email: authUser.email || '',
          nom: profile?.nom || authUser.user_metadata?.full_name || '',
          role: profile?.role || 'Analyste Senior',
          cabinet_nom: profile?.cabinet_nom || '',
          created_at: authUser.created_at,
        });
        
        setNom(profile?.nom || authUser.user_metadata?.full_name || '');
        setCabinetNom(profile?.cabinet_nom || '');
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      // Upsert dans user_profiles
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          nom,
          cabinet_nom: cabinetNom,
          role: 'Analyste Senior',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setUser(prev => prev ? { ...prev, nom, cabinet_nom: cabinetNom } : null);
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès' });
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }
    
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }

    setIsChangingPassword(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès' });
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      setMessage({ type: 'error', text: 'Erreur lors du changement de mot de passe' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') return;

    try {
      // Supprimer les données utilisateur
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // Supprimer les rapports
        await supabase.from('rapports_scout').delete().eq('user_id', authUser.id);
        // Supprimer les plans
        await supabase.from('plans_optimisation').delete().eq('user_id', authUser.id);
        // Supprimer les entreprises
        await supabase.from('entreprises').delete().eq('user_id', authUser.id);
        // Supprimer le profil
        await supabase.from('user_profiles').delete().eq('user_id', authUser.id);
      }

      // Déconnexion
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erreur suppression:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression du compte' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      <main className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Mon Profil</h1>
          <p className="text-slate-400 mt-1">Gérez vos informations personnelles et paramètres</p>
        </header>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations du compte */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Informations personnelles</h2>
                <p className="text-slate-500 text-sm">Vos coordonnées et identité</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Email (lecture seule) */}
              <div>
                <label className="block text-slate-400 text-sm mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-400 cursor-not-allowed"
                />
              </div>

              {/* Nom */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">Nom complet</label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Votre nom"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Rôle (lecture seule) */}
              <div>
                <label className="block text-slate-400 text-sm mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Rôle
                </label>
                <input
                  type="text"
                  value={user?.role || 'Analyste Senior'}
                  disabled
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-cyan-400 cursor-not-allowed font-medium"
                />
              </div>

              {/* Date d'inscription */}
              <div className="pt-2 text-slate-500 text-sm">
                Membre depuis {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'N/A'}
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Branding Personnel</h2>
                <p className="text-slate-500 text-sm">Personnalisez vos rapports PDF</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Upload Logo */}
              <div>
                <label className="block text-slate-400 text-sm mb-2 flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Logo de votre cabinet
                </label>
                <div className="flex items-center gap-4">
                  {/* Aperçu logo */}
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed ${logoUrl ? 'border-cyan-500/50' : 'border-slate-700'}`}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${THEMES[theme].primary} flex items-center justify-center`}>
                        <span className="text-white font-bold text-xl">IO</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setLogoUrl(event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer transition-colors border border-slate-700"
                    >
                      <Upload className="w-4 h-4" />
                      {logoUrl ? 'Changer le logo' : 'Uploader un logo'}
                    </label>
                    {logoUrl && (
                      <button
                        onClick={() => setLogoUrl(null)}
                        className="ml-2 text-slate-500 hover:text-red-400 text-sm"
                      >
                        Supprimer
                      </button>
                    )}
                    <p className="mt-1 text-slate-500 text-xs">PNG, JPG ou SVG (max 200x200px recommandé)</p>
                  </div>
                </div>
              </div>

              {/* Nom du cabinet */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">Nom de votre cabinet / société</label>
                <input
                  type="text"
                  value={cabinetNom}
                  onChange={(e) => {
                    setCabinetNom(e.target.value);
                    setBrandingCabinet(e.target.value);
                  }}
                  placeholder="Ex: Cabinet Dupont Conseil"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Sélecteur de thème */}
              <div>
                <label className="block text-slate-400 text-sm mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Thème couleur
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.entries(THEMES) as [ThemeVariant, typeof THEMES.bleu][]).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setTheme(key)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        theme === key 
                          ? 'border-white bg-slate-800' 
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-full h-8 rounded-lg bg-gradient-to-r ${config.primary} mb-2`} />
                      <p className={`text-sm font-medium ${theme === key ? 'text-white' : 'text-slate-400'}`}>
                        {config.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prévisualisation */}
              <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                <p className="text-slate-400 text-xs mb-3">Aperçu sur les rapports :</p>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-gradient-to-br ${THEMES[theme].primary}`}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-white font-bold">
                        {cabinetNom ? cabinetNom.charAt(0).toUpperCase() : 'IO'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{cabinetNom || 'CAPITAL ÉNERGIE'}</p>
                    <p className="text-slate-500 text-xs">Analyste : {nom || user?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton Sauvegarder */}
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 min-h-[48px]"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>

          {/* Sécurité */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Sécurité</h2>
                <p className="text-slate-500 text-sm">Gérez votre mot de passe</p>
              </div>
            </div>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all border border-slate-700 min-h-[48px]"
            >
              <Key className="w-5 h-5" />
              Changer mon mot de passe
            </button>
          </div>

          {/* Zone Danger - Suppression */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-400">Zone Danger</h2>
                <p className="text-slate-500 text-sm">Actions irréversibles</p>
              </div>
            </div>

            <p className="text-slate-400 text-sm mb-4">
              La suppression de votre compte entraînera la perte définitive de toutes vos données : 
              entreprises, analyses, rapports et plans d&apos;optimisation.
            </p>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-all border border-red-500/30 min-h-[48px]"
            >
              <Trash2 className="w-5 h-5" />
              Supprimer mon compte et mes données
            </button>
          </div>
        </div>
      </main>

      {/* Modal Changement de mot de passe */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Changer le mot de passe</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retapez le mot de passe"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isChangingPassword ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression de compte */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-red-400">Supprimer le compte</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmStep(1);
                  setDeleteConfirmText('');
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteConfirmStep === 1 ? (
              <>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-medium mb-2">Action irréversible</p>
                      <p className="text-slate-400 text-sm">
                        Cette action supprimera définitivement :
                      </p>
                      <ul className="mt-2 text-slate-400 text-sm space-y-1">
                        <li>• Toutes vos entreprises</li>
                        <li>• Tous vos rapports d&apos;analyse</li>
                        <li>• Tous vos plans d&apos;optimisation</li>
                        <li>• Votre compte utilisateur</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => setDeleteConfirmStep(2)}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                  >
                    Je comprends, continuer
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-400 mb-4">
                  Pour confirmer la suppression, tapez <strong className="text-red-400">SUPPRIMER</strong> ci-dessous :
                </p>

                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="Tapez SUPPRIMER"
                  className="w-full px-4 py-3 bg-slate-800 border border-red-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 mb-6"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setDeleteConfirmStep(1);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'SUPPRIMER'}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Supprimer définitivement
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
