'use client';

import React, { useState, useEffect } from 'react';
import {
  Leaf,
  Calendar,
  Droplets,
  AlertTriangle,
  Check,
  Clock,
  MapPin,
  Beaker,
  ChevronDown,
  Plus,
  Info
} from 'lucide-react';
import {
  PhytoProduct,
  TraitementPhyto,
  Parcelle,
  PHYTO_PRODUCTS,
  DEMO_PARCELLES,
  calculateDateRecolteAutorisee,
  getJoursRestantsDAR,
  getTypeLabel,
  getTypeColor,
  formatDateFR
} from '@/lib/phyto/phyto-products';

interface PhytoRegistreFormProps {
  onSubmit: (traitement: TraitementPhyto) => void;
  onCancel?: () => void;
}

export default function PhytoRegistreForm({ onSubmit, onCancel }: PhytoRegistreFormProps) {
  const [step, setStep] = useState(1);
  const [parcelles] = useState<Parcelle[]>(DEMO_PARCELLES);
  
  // Form state
  const [selectedParcelle, setSelectedParcelle] = useState<Parcelle | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<PhytoProduct | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dose, setDose] = useState('');
  const [operateur, setOperateur] = useState('');
  const [conditions, setConditions] = useState('');
  
  // UI state
  const [showParcelleDropdown, setShowParcelleDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productFilter, setProductFilter] = useState<PhytoProduct['type'] | 'all'>('all');

  // Calcul automatique du DAR
  const dateRecolteAutorisee = selectedProduct && date
    ? calculateDateRecolteAutorisee(date, selectedProduct.dar)
    : null;
  
  const joursRestantsDAR = selectedProduct && date
    ? getJoursRestantsDAR(date, selectedProduct.dar)
    : null;

  const isFormValid = selectedParcelle && selectedProduct && date && dose && operateur;

  const handleSubmit = () => {
    if (!isFormValid || !selectedParcelle || !selectedProduct || !dateRecolteAutorisee) return;

    const traitement: TraitementPhyto = {
      id: `trt-${Date.now()}`,
      date,
      parcelle: selectedParcelle.nom,
      superficie: selectedParcelle.superficie,
      produit: selectedProduct,
      doseAppliquee: parseFloat(dose),
      operateur,
      conditions: conditions || undefined,
      dateRecolteAutorisee,
      alerteDAR: joursRestantsDAR !== null && joursRestantsDAR <= 7
    };

    onSubmit(traitement);
  };

  const filteredProducts = productFilter === 'all'
    ? PHYTO_PRODUCTS
    : PHYTO_PRODUCTS.filter(p => p.type === productFilter);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
      {/* Header avec étapes */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-400" />
            Nouveau Traitement
          </h2>
          <span className="text-sm text-slate-400">Étape {step}/3</span>
        </div>
        
        {/* Progress bar */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                s <= step ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* ÉTAPE 1 : Parcelle et Date */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              Où et Quand ?
            </h3>

            {/* Sélection Parcelle */}
            <div className="relative">
              <label className="block text-sm text-slate-400 mb-2">Parcelle *</label>
              <button
                type="button"
                onClick={() => setShowParcelleDropdown(!showParcelleDropdown)}
                className="w-full flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl transition-colors text-left"
              >
                {selectedParcelle ? (
                  <div>
                    <p className="text-white font-medium">{selectedParcelle.nom}</p>
                    <p className="text-sm text-slate-400">
                      {selectedParcelle.superficie} ha • {selectedParcelle.cepage}
                    </p>
                  </div>
                ) : (
                  <span className="text-slate-400">Sélectionner une parcelle</span>
                )}
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showParcelleDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showParcelleDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowParcelleDropdown(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                    {parcelles.map((parcelle) => (
                      <button
                        key={parcelle.id}
                        type="button"
                        onClick={() => {
                          setSelectedParcelle(parcelle);
                          setShowParcelleDropdown(false);
                        }}
                        className={`w-full p-4 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0 ${
                          selectedParcelle?.id === parcelle.id ? 'bg-emerald-500/10' : ''
                        }`}
                      >
                        <p className="text-white font-medium">{parcelle.nom}</p>
                        <p className="text-sm text-slate-400">
                          {parcelle.superficie} ha • {parcelle.cepage} • {parcelle.commune}
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Date du traitement */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Date du traitement *</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!selectedParcelle || !date}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
            >
              Continuer
            </button>
          </div>
        )}

        {/* ÉTAPE 2 : Produit et Dose */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Beaker className="w-4 h-4 text-cyan-400" />
              Produit et Dosage
            </h3>

            {/* Filtre par type */}
            <div className="flex flex-wrap gap-2">
              {(['all', 'fongicide', 'insecticide', 'herbicide', 'acaricide'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setProductFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    productFilter === type
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {type === 'all' ? 'Tous' : getTypeLabel(type)}
                </button>
              ))}
            </div>

            {/* Sélection Produit */}
            <div className="relative">
              <label className="block text-sm text-slate-400 mb-2">Produit *</label>
              <button
                type="button"
                onClick={() => setShowProductDropdown(!showProductDropdown)}
                className="w-full flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl transition-colors text-left"
              >
                {selectedProduct ? (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{selectedProduct.nom}</p>
                      <span className={`px-2 py-0.5 rounded text-xs border ${getTypeColor(selectedProduct.type)}`}>
                        {getTypeLabel(selectedProduct.type)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 truncate">
                      DAR: {selectedProduct.dar} jours • Max: {selectedProduct.doseMax} {selectedProduct.unite}
                    </p>
                  </div>
                ) : (
                  <span className="text-slate-400">Sélectionner un produit</span>
                )}
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${showProductDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showProductDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProductDropdown(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowProductDropdown(false);
                        }}
                        className={`w-full p-4 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0 ${
                          selectedProduct?.id === product.id ? 'bg-emerald-500/10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{product.nom}</p>
                          <span className={`px-2 py-0.5 rounded text-xs border ${getTypeColor(product.type)}`}>
                            {getTypeLabel(product.type)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">
                          {product.substanceActive}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          DAR: {product.dar}j • Dose max: {product.doseMax} {product.unite} • ZNT: {product.znt}m
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Dose appliquée */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Dose appliquée * {selectedProduct && `(max: ${selectedProduct.doseMax} ${selectedProduct.unite})`}
              </label>
              <div className="relative">
                <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  step="0.1"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  placeholder="Ex: 2.5"
                  className="w-full pl-12 pr-20 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {selectedProduct?.unite || 'L/ha'}
                </span>
              </div>
              {selectedProduct && dose && parseFloat(dose) > parseFloat(selectedProduct.doseMax) && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Dose supérieure à la dose maximale autorisée !
                </p>
              )}
            </div>

            {/* Alerte DAR */}
            {selectedProduct && date && dateRecolteAutorisee && (
              <div className={`p-4 rounded-xl border ${
                joursRestantsDAR !== null && joursRestantsDAR <= 7
                  ? 'bg-amber-500/10 border-amber-500/40'
                  : 'bg-emerald-500/10 border-emerald-500/40'
              }`}>
                <div className="flex items-start gap-3">
                  <Clock className={`w-5 h-5 flex-shrink-0 ${
                    joursRestantsDAR !== null && joursRestantsDAR <= 7 ? 'text-amber-400' : 'text-emerald-400'
                  }`} />
                  <div>
                    <p className="font-medium text-white">Délai Avant Récolte (DAR)</p>
                    <p className={`text-sm ${
                      joursRestantsDAR !== null && joursRestantsDAR <= 7 ? 'text-amber-300' : 'text-emerald-300'
                    }`}>
                      {selectedProduct.dar} jours • Récolte autorisée à partir du{' '}
                      <span className="font-semibold">{formatDateFR(dateRecolteAutorisee)}</span>
                    </p>
                    {joursRestantsDAR !== null && joursRestantsDAR <= 7 && joursRestantsDAR >= 0 && (
                      <p className="text-amber-400 text-sm mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Attention : seulement {joursRestantsDAR} jour(s) restant(s) !
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!selectedProduct || !dose}
                className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : Opérateur et Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              Confirmation
            </h3>

            {/* Résumé */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Parcelle</span>
                <span className="text-white font-medium">{selectedParcelle?.nom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date</span>
                <span className="text-white font-medium">{formatDateFR(date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Produit</span>
                <span className="text-white font-medium">{selectedProduct?.nom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dose</span>
                <span className="text-white font-medium">{dose} {selectedProduct?.unite}</span>
              </div>
              <div className="border-t border-slate-600 pt-3 flex justify-between">
                <span className="text-slate-400">Récolte autorisée</span>
                <span className={`font-semibold ${
                  joursRestantsDAR !== null && joursRestantsDAR <= 7 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {dateRecolteAutorisee && formatDateFR(dateRecolteAutorisee)}
                </span>
              </div>
            </div>

            {/* Opérateur */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Nom de l'opérateur *</label>
              <input
                type="text"
                value={operateur}
                onChange={(e) => setOperateur(e.target.value)}
                placeholder="Ex: Jean Dupont"
                className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Conditions (optionnel) */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Conditions météo (optionnel)</label>
              <input
                type="text"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="Ex: Temps sec, 18°C, vent faible"
                className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Mentions produit */}
            {selectedProduct && selectedProduct.mentions.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-xl">
                <p className="text-sm text-red-400 flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4" />
                  Mentions de danger
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.mentions.map((mention) => (
                    <span key={mention} className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">
                      {mention}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!operateur}
                className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
