'use client';

import { useState } from 'react';
import { Sidebar } from '@/components';
import { useAuth, ProtectedRoute } from '@/contexts/AuthContext';
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Mail,
  Save,
  Check
} from 'lucide-react';

function ParametresPageContent() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    nouveauDossier: true,
    dossierValide: true,
    relances: false,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      
      <main className="p-4 lg:p-8 pt-20 lg:pt-8 transition-all duration-300 lg:ml-64">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Parametres</h1>
              <p className="text-slate-400 text-sm font-medium">
                Configuration de votre espace
              </p>
            </div>
          </div>
        </header>

        <div className="max-w-3xl space-y-6">
          {/* Profil */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Profil Administrateur</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-400 cursor-not-allowed"
                />
                <p className="text-slate-500 text-xs mt-1">L'email ne peut pas etre modifie</p>
              </div>
              
              <div>
                <label className="block text-slate-400 text-sm mb-2">Nom d'affichage</label>
                <input
                  type="text"
                  defaultValue={user?.nom || ''}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl cursor-pointer hover:bg-slate-900/50 transition-colors">
                <div>
                  <p className="text-white font-medium">Notifications par email</p>
                  <p className="text-slate-400 text-sm">Recevoir les alertes par email</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                  className="w-5 h-5 rounded accent-emerald-500"
                />
              </label>
              
              <label className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl cursor-pointer hover:bg-slate-900/50 transition-colors">
                <div>
                  <p className="text-white font-medium">Nouveau dossier</p>
                  <p className="text-slate-400 text-sm">Alerte quand un artisan depose un dossier</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.nouveauDossier}
                  onChange={(e) => setNotifications({ ...notifications, nouveauDossier: e.target.checked })}
                  className="w-5 h-5 rounded accent-emerald-500"
                />
              </label>
              
              <label className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl cursor-pointer hover:bg-slate-900/50 transition-colors">
                <div>
                  <p className="text-white font-medium">Dossier valide</p>
                  <p className="text-slate-400 text-sm">Confirmation de validation CEE</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.dossierValide}
                  onChange={(e) => setNotifications({ ...notifications, dossierValide: e.target.checked })}
                  className="w-5 h-5 rounded accent-emerald-500"
                />
              </label>
              
              <label className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl cursor-pointer hover:bg-slate-900/50 transition-colors">
                <div>
                  <p className="text-white font-medium">Relances automatiques</p>
                  <p className="text-slate-400 text-sm">Rappels pour les dossiers en attente</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.relances}
                  onChange={(e) => setNotifications({ ...notifications, relances: e.target.checked })}
                  className="w-5 h-5 rounded accent-emerald-500"
                />
              </label>
            </div>
          </section>

          {/* Securite */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">Securite</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-emerald-400 font-medium">Compte securise</p>
                    <p className="text-slate-400 text-sm">Authentification Supabase active</p>
                  </div>
                </div>
              </div>
              
              <button className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white hover:bg-slate-700 transition-colors text-left">
                Changer le mot de passe
              </button>
            </div>
          </section>

          {/* Bouton sauvegarder */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                saved 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Enregistre</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ParametresPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <ParametresPageContent />
    </ProtectedRoute>
  );
}
