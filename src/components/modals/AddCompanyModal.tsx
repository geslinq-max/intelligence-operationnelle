'use client';

import { useState } from 'react';
import { X, Building2, FileText, Factory, MapPin, Users, Search, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CompanyFormData) => void;
}

export interface CompanyFormData {
  id?: string;
  nom: string;
  siret: string;
  secteur: string;
  ville: string;
  effectif: string;
  email: string;
  adresse?: string;
  codeNAF?: string;
}

const SECTEURS = [
  'Métallurgie',
  'Plasturgie',
  'Fonderie',
  'Textile',
  'Agroalimentaire',
  'Chimie',
  'Papeterie',
  'Logistique',
  'Autre',
];

export default function AddCompanyModal({ isOpen, onClose, onSubmit }: AddCompanyModalProps) {
  const [formData, setFormData] = useState<CompanyFormData>({
    nom: '',
    siret: '',
    secteur: '',
    ville: '',
    effectif: '',
    email: '',
    adresse: '',
    codeNAF: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingSiret, setIsSearchingSiret] = useState(false);
  const [siretError, setSiretError] = useState<string | null>(null);
  const [siretSuccess, setSiretSuccess] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // RECHERCHE SIRET - API entreprise.data.gouv.fr
  // ═══════════════════════════════════════════════════════════════
  const fetchSiret = async () => {
    const siretClean = formData.siret.replace(/\s/g, '');
    
    if (siretClean.length !== 14) {
      setSiretError('Le SIRET doit contenir 14 chiffres');
      return;
    }

    setIsSearchingSiret(true);
    setSiretError(null);
    setSiretSuccess(false);

    try {
      const response = await fetch(
        `https://entreprise.data.gouv.fr/api/sirene/v3/etablissements/${siretClean}`
      );

      if (!response.ok) {
        throw new Error('SIRET non trouvé');
      }

      const data = await response.json();
      const etablissement = data.etablissement;
      const uniteLegale = etablissement.unite_legale;

      // Extraire les données
      const nomEntreprise = uniteLegale.denomination || 
                           `${uniteLegale.prenom_1 || ''} ${uniteLegale.nom || ''}`.trim() ||
                           'Entreprise';
      
      const adresse = [
        etablissement.numero_voie,
        etablissement.type_voie,
        etablissement.libelle_voie,
      ].filter(Boolean).join(' ');

      const ville = etablissement.libelle_commune || '';
      const codeNAF = etablissement.activite_principale || '';
      const effectif = etablissement.tranche_effectifs || '';

      // Mapper le code NAF à un secteur
      const secteurFromNAF = mapNAFToSecteur(codeNAF);

      // Mettre à jour le formulaire
      setFormData(prev => ({
        ...prev,
        nom: nomEntreprise,
        ville: ville,
        adresse: adresse,
        codeNAF: codeNAF,
        effectif: mapEffectif(effectif),
        secteur: secteurFromNAF || prev.secteur,
      }));

      setSiretSuccess(true);
      console.log('SIRET trouvé:', { nomEntreprise, adresse, ville, codeNAF });

    } catch (error) {
      console.error('Erreur recherche SIRET:', error);
      setSiretError('SIRET non trouvé, saisie manuelle requise');
    } finally {
      setIsSearchingSiret(false);
    }
  };

  // Mapper code NAF vers secteur
  const mapNAFToSecteur = (naf: string): string => {
    const nafPrefix = naf.substring(0, 2);
    const mapping: Record<string, string> = {
      '24': 'Métallurgie',
      '25': 'Métallurgie',
      '22': 'Plasturgie',
      '23': 'Fonderie',
      '13': 'Textile',
      '14': 'Textile',
      '10': 'Agroalimentaire',
      '11': 'Agroalimentaire',
      '20': 'Chimie',
      '17': 'Papeterie',
      '49': 'Logistique',
      '52': 'Logistique',
    };
    return mapping[nafPrefix] || '';
  };

  // Mapper tranche effectifs
  const mapEffectif = (tranche: string): string => {
    const mapping: Record<string, string> = {
      '00': '0',
      '01': '1-2',
      '02': '3-5',
      '03': '6-9',
      '11': '10-19',
      '12': '20-49',
      '21': '50-99',
      '22': '100-199',
      '31': '200-249',
      '32': '250-499',
      '41': '500-999',
      '42': '1000-1999',
      '51': '2000-4999',
      '52': '5000-9999',
      '53': '10000+',
    };
    return mapping[tranche] || tranche;
  };

  if (!isOpen) return null;

  // ═══════════════════════════════════════════════════════════════
  // SOUMISSION FORMULAIRE - Insertion Supabase
  // ═══════════════════════════════════════════════════════════════
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Formulaire soumis : Nouvelle entreprise', formData);
    
    setIsSubmitting(true);
    setSiretError(null);

    try {
      // Préparer les données pour Supabase
      const companyData = {
        name: formData.nom,
        siret: formData.siret.replace(/\s/g, ''),
        address: formData.adresse || null,
        city: formData.ville || null,
        sector: formData.secteur || null,
        naf_code: formData.codeNAF || null,
        employee_count: formData.effectif || null,
        email: formData.email || null,
        status: 'prospect',
      };

      console.log('Insertion Supabase:', companyData);

      // Insertion dans Supabase
      const { data, error } = await supabase
        .from('companies')
        .insert([companyData])
        .select()
        .single();

      if (error) {
        // Log erreur dans DebugLogger via console.error
        console.error('Erreur Supabase insertion company:', error);
        
        // Gestion erreur SIRET dupliqué
        if (error.code === '23505') {
          setSiretError('Ce SIRET existe déjà dans la base de données');
          return;
        }
        
        throw error;
      }

      console.log('Entreprise créée avec succès:', data);

      // Callback parent avec les données
      await onSubmit({ ...formData, id: data.id });
      
      // Reset formulaire
      setFormData({ 
        nom: '', siret: '', secteur: '', ville: '', 
        effectif: '', email: '', adresse: '', codeNAF: '' 
      });
      setSiretSuccess(false);
      onClose();

    } catch (error) {
      console.error('Erreur création entreprise:', error);
      setSiretError('Erreur lors de l\'enregistrement. Vérifiez votre connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Building2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ajouter une entreprise</h2>
              <p className="text-slate-400 text-sm">Nouvelle PME cliente</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-slate-400 text-sm mb-1.5">
              Raison sociale *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                placeholder="Ex: Métallurgie Dupont SARL"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* SIRET avec recherche automatique */}
          <div>
            <label className="block text-slate-400 text-sm mb-1.5">
              Numéro SIRET *
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="siret"
                  value={formData.siret}
                  onChange={(e) => {
                    handleChange(e);
                    setSiretError(null);
                    setSiretSuccess(false);
                  }}
                  required
                  placeholder="Ex: 123 456 789 00012"
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none ${
                    siretError ? 'border-red-500' : siretSuccess ? 'border-green-500' : 'border-slate-700 focus:border-cyan-500'
                  }`}
                />
                {siretSuccess && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                )}
              </div>
              <button
                type="button"
                onClick={fetchSiret}
                disabled={isSearchingSiret || formData.siret.replace(/\s/g, '').length < 14}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {isSearchingSiret ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Rechercher</span>
              </button>
            </div>
            {siretError && (
              <div className="flex items-center gap-1.5 mt-1.5 text-red-400 text-sm">
                <AlertCircle className="w-3.5 h-3.5" />
                {siretError}
              </div>
            )}
            {siretSuccess && (
              <div className="flex items-center gap-1.5 mt-1.5 text-green-400 text-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Entreprise trouvée et champs pré-remplis
              </div>
            )}
          </div>

          {/* Code NAF (auto-rempli) */}
          {formData.codeNAF && (
            <div className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg">
              <span className="text-slate-500 text-xs">Code NAF détecté : </span>
              <span className="text-cyan-400 text-sm font-mono">{formData.codeNAF}</span>
            </div>
          )}

          {/* Secteur */}
          <div>
            <label className="block text-slate-400 text-sm mb-1.5">
              Secteur d'activité *
            </label>
            <div className="relative">
              <Factory className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                name="secteur"
                value={formData.secteur}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 appearance-none"
              >
                <option value="">Sélectionner un secteur</option>
                {SECTEURS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ville + Effectif */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Ville</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="ville"
                  value={formData.ville}
                  onChange={handleChange}
                  placeholder="Ex: Lyon"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Effectif</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="effectif"
                  value={formData.effectif}
                  onChange={handleChange}
                  placeholder="Ex: 50-100"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-slate-400 text-sm mb-1.5">Email de contact</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contact@entreprise.fr"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Enregistrement...' : 'Ajouter l\'entreprise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
