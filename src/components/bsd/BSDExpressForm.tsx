'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Scale, 
  Trash2, 
  Leaf, 
  Mountain,
  FileText,
  Send,
  Calendar,
  Building2,
  User,
  Phone
} from 'lucide-react';
import SignaturePad from '@/components/signature/SignaturePad';

// ============================================================================
// TYPES
// ============================================================================

export interface BSDFormData {
  // Informations chantier
  chantierNom: string;
  chantierAdresse: string;
  dateEnlevement: string;
  
  // Producteur
  producteurNom: string;
  producteurSiret: string;
  producteurTel: string;
  
  // Déchet
  typeDechet: 'TERRE' | 'GRAVATS' | 'VERTS' | 'MIXTE' | 'DANGEREUX';
  codeDechet: string;
  tonnageEstime: number;
  volumeEstime?: number;
  conditionnement: 'VRAC' | 'BIG_BAG' | 'BENNE' | 'CAISSON';
  
  // Destination
  destinationNom: string;
  destinationAdresse: string;
  destinationType: 'ISDI' | 'ISDND' | 'RECYCLAGE' | 'VALORISATION';
  
  // Transporteur
  transporteurNom: string;
  transporteurSiret: string;
  immatriculationVehicule: string;
  
  // Signatures
  signatureProducteur: string | null;
  signatureTransporteur: string | null;
}

const TYPES_DECHETS = [
  { value: 'TERRE', label: 'Terres et cailloux', icon: Mountain, code: '17 05 04', color: 'text-amber-400' },
  { value: 'GRAVATS', label: 'Gravats / Béton', icon: Trash2, code: '17 01 07', color: 'text-slate-400' },
  { value: 'VERTS', label: 'Déchets verts', icon: Leaf, code: '20 02 01', color: 'text-green-400' },
  { value: 'MIXTE', label: 'Déchets mélangés', icon: Trash2, code: '17 09 04', color: 'text-purple-400' },
  { value: 'DANGEREUX', label: 'Déchets dangereux', icon: Trash2, code: '17 06 05*', color: 'text-red-400' },
];

const CONDITIONNEMENTS = [
  { value: 'VRAC', label: 'Vrac' },
  { value: 'BIG_BAG', label: 'Big Bag' },
  { value: 'BENNE', label: 'Benne' },
  { value: 'CAISSON', label: 'Caisson' },
];

const DESTINATIONS = [
  { value: 'ISDI', label: 'ISDI (Inertes)' },
  { value: 'ISDND', label: 'ISDND (Non dangereux)' },
  { value: 'RECYCLAGE', label: 'Centre de recyclage' },
  { value: 'VALORISATION', label: 'Valorisation matière' },
];

interface BSDExpressFormProps {
  onSubmit: (data: BSDFormData) => Promise<void>;
  onGeneratePDF: (data: BSDFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<BSDFormData>;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function BSDExpressForm({ onSubmit, onGeneratePDF, isLoading, initialData }: BSDExpressFormProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState<BSDFormData>({
    chantierNom: '',
    chantierAdresse: '',
    dateEnlevement: new Date().toISOString().split('T')[0],
    producteurNom: '',
    producteurSiret: '',
    producteurTel: '',
    typeDechet: 'TERRE',
    codeDechet: '17 05 04',
    tonnageEstime: 0,
    volumeEstime: 0,
    conditionnement: 'BENNE',
    destinationNom: '',
    destinationAdresse: '',
    destinationType: 'ISDI',
    transporteurNom: '',
    transporteurSiret: '',
    immatriculationVehicule: '',
    signatureProducteur: null,
    signatureTransporteur: null,
  });

  // Appliquer les données initiales du scanner quand elles changent
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const updateField = useCallback(<K extends keyof BSDFormData>(
    field: K,
    value: BSDFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleTypeDechetChange = useCallback((type: string) => {
    const typeInfo = TYPES_DECHETS.find(t => t.value === type);
    setFormData(prev => ({
      ...prev,
      typeDechet: type as BSDFormData['typeDechet'],
      codeDechet: typeInfo?.code || '',
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const canProceed = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.chantierNom && formData.chantierAdresse && formData.producteurNom);
      case 2:
        return !!(formData.typeDechet && formData.tonnageEstime > 0);
      case 3:
        return !!(formData.destinationNom && formData.transporteurNom);
      case 4:
        return !!(formData.signatureProducteur && formData.signatureTransporteur);
      default:
        return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <button
              onClick={() => s < step && setStep(s as 1 | 2 | 3 | 4)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                s === step
                  ? 'bg-amber-500 text-white'
                  : s < step
                  ? 'bg-emerald-500 text-white cursor-pointer'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {s}
            </button>
            {s < 4 && (
              <div className={`w-16 sm:w-24 h-1 mx-2 rounded ${
                s < step ? 'bg-emerald-500' : 'bg-slate-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ÉTAPE 1: Chantier & Producteur */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-amber-400" />
              Informations Chantier
            </h2>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nom du chantier <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.chantierNom}
                  onChange={(e) => updateField('chantierNom', e.target.value)}
                  placeholder="Ex: Démolition Villa Dupont"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Adresse du chantier <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.chantierAdresse}
                  onChange={(e) => updateField('chantierAdresse', e.target.value)}
                  placeholder="12 rue des Lilas, 10100 Romilly-sur-Seine"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date d'enlèvement
                </label>
                <input
                  type="date"
                  value={formData.dateEnlevement}
                  onChange={(e) => updateField('dateEnlevement', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white flex items-center gap-2 pt-4 border-t border-slate-700">
              <User className="w-5 h-5 text-amber-400" />
              Producteur du déchet
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Raison sociale <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.producteurNom}
                  onChange={(e) => updateField('producteurNom', e.target.value)}
                  placeholder="SARL Espaces Verts Martin"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  N° SIRET
                </label>
                <input
                  type="text"
                  value={formData.producteurSiret}
                  onChange={(e) => updateField('producteurSiret', e.target.value)}
                  placeholder="123 456 789 00012"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.producteurTel}
                  onChange={(e) => updateField('producteurTel', e.target.value)}
                  placeholder="06 12 34 56 78"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 2: Type de déchet */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-amber-400" />
              Nature du Déchet
            </h2>

            <div className="grid gap-3">
              {TYPES_DECHETS.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.typeDechet === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeDechetChange(type.value)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/20'
                        : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${type.color}`} />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-white">{type.label}</p>
                      <p className="text-sm text-slate-400">Code: {type.code}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Scale className="w-4 h-4 inline mr-1" />
                  Tonnage estimé (T) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.tonnageEstime || ''}
                  onChange={(e) => updateField('tonnageEstime', parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 15.5"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Volume estimé (m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.volumeEstime || ''}
                  onChange={(e) => updateField('volumeEstime', parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 10"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Conditionnement
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONNEMENTS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => updateField('conditionnement', c.value as BSDFormData['conditionnement'])}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        formData.conditionnement === c.value
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 3: Destination & Transport */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MapPin className="w-6 h-6 text-amber-400" />
              Destination
            </h2>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nom de l'installation <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.destinationNom}
                  onChange={(e) => updateField('destinationNom', e.target.value)}
                  placeholder="Ex: ISDI du Grand Est"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Adresse destination
                </label>
                <input
                  type="text"
                  value={formData.destinationAdresse}
                  onChange={(e) => updateField('destinationAdresse', e.target.value)}
                  placeholder="Zone industrielle, 10000 Troyes"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Type d'installation
                </label>
                <div className="flex flex-wrap gap-2">
                  {DESTINATIONS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => updateField('destinationType', d.value as BSDFormData['destinationType'])}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        formData.destinationType === d.value
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white flex items-center gap-2 pt-4 border-t border-slate-700">
              <Truck className="w-5 h-5 text-amber-400" />
              Transporteur
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Raison sociale transporteur <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.transporteurNom}
                  onChange={(e) => updateField('transporteurNom', e.target.value)}
                  placeholder="Transport Durand SARL"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  SIRET transporteur
                </label>
                <input
                  type="text"
                  value={formData.transporteurSiret}
                  onChange={(e) => updateField('transporteurSiret', e.target.value)}
                  placeholder="987 654 321 00034"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Immatriculation véhicule
                </label>
                <input
                  type="text"
                  value={formData.immatriculationVehicule}
                  onChange={(e) => updateField('immatriculationVehicule', e.target.value.toUpperCase())}
                  placeholder="AB-123-CD"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors uppercase"
                />
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 4: Signatures */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-amber-400" />
              Validation & Signatures
            </h2>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-white mb-2">Récapitulatif</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Chantier:</span>
                  <span className="text-white">{formData.chantierNom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Déchet:</span>
                  <span className="text-white">{TYPES_DECHETS.find(t => t.value === formData.typeDechet)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tonnage:</span>
                  <span className="text-white font-bold">{formData.tonnageEstime} T</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Destination:</span>
                  <span className="text-white">{formData.destinationNom}</span>
                </div>
              </div>
            </div>

            <SignaturePad
              label="Signature du Producteur (Client)"
              required
              onSignatureChange={(sig) => updateField('signatureProducteur', sig)}
            />

            <SignaturePad
              label="Signature du Transporteur / Chauffeur"
              required
              onSignatureChange={(sig) => updateField('signatureTransporteur', sig)}
            />
          </div>
        )}

        {/* Navigation - Mobile First */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-slate-700">
          {step < 4 ? (
            <>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                  className="order-2 sm:order-1 px-6 py-3.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white rounded-xl font-medium transition-colors text-base"
                >
                  Précédent
                </button>
              )}
              <div className="hidden sm:block flex-1" />
              <button
                type="button"
                onClick={() => setStep((step + 1) as 2 | 3 | 4)}
                disabled={!canProceed(step)}
                className="order-1 sm:order-2 w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors text-base"
              >
                Suivant
              </button>
            </>
          ) : (
            <>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                  className="order-3 px-6 py-3.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white rounded-xl font-medium transition-colors text-base"
                >
                  Précédent
                </button>
              )}
              <div className="hidden sm:block flex-1" />
              <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
                <button
                  type="button"
                  onClick={() => onGeneratePDF(formData)}
                  disabled={!canProceed(4)}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors text-base"
                >
                  <FileText className="w-5 h-5" />
                  Aperçu PDF
                </button>
                
                <button
                  type="submit"
                  disabled={!canProceed(4) || isLoading}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors text-base"
                >
                  <Send className="w-5 h-5" />
                  {isLoading ? 'Envoi...' : 'Valider BSD'}
                </button>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
