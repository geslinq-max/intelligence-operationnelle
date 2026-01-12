'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Check, RotateCcw, Pen } from 'lucide-react';

interface SignatureCanvasProps {
  onSignatureChange: (signatureData: string | null) => void;
  onConsentChange: (consent: boolean) => void;
  disabled?: boolean;
}

export default function SignatureCanvas({
  onSignatureChange,
  onConsentChange,
  disabled = false
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [rgpdConsent, setRgpdConsent] = useState(false);
  const [commercialConsent, setCommercialConsent] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration du canvas
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (isDrawing && hasSignature) {
      const canvas = canvasRef.current;
      if (canvas) {
        onSignatureChange(canvas.toDataURL('image/png'));
      }
    }
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange(null);
  };

  const handleRgpdConsent = (checked: boolean) => {
    setRgpdConsent(checked);
    onConsentChange(checked);
  };

  return (
    <div className="space-y-6">
      {/* Zone de signature */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Pen className="w-4 h-4" />
            Signature du représentant légal
          </label>
          {hasSignature && (
            <button
              onClick={clearSignature}
              disabled={disabled}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Effacer
            </button>
          )}
        </div>
        
        <div className={`relative rounded-xl border-2 border-dashed transition-colors ${
          disabled 
            ? 'border-slate-700 bg-slate-800/30' 
            : hasSignature 
              ? 'border-cyan-500/50 bg-white' 
              : 'border-slate-600 bg-white hover:border-slate-500'
        }`}>
          <canvas
            ref={canvasRef}
            width={500}
            height={150}
            className="w-full h-32 rounded-lg cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasSignature && !disabled && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-slate-400 text-sm">Signez ici avec votre souris ou doigt</span>
            </div>
          )}
        </div>
      </div>

      {/* Consentements RGPD */}
      <div className="space-y-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <h4 className="text-sm font-semibold text-white">Consentements requis</h4>
        
        {/* Consentement RGPD obligatoire */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={rgpdConsent}
              onChange={(e) => handleRgpdConsent(e.target.checked)}
              disabled={disabled}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
              rgpdConsent 
                ? 'bg-cyan-500 border-cyan-500' 
                : 'border-slate-500 group-hover:border-slate-400'
            }`}>
              {rgpdConsent && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>
          <div className="text-sm">
            <span className="text-white font-medium">Consentement RGPD</span>
            <span className="text-red-400 ml-1">*</span>
            <p className="text-slate-400 mt-1 text-xs leading-relaxed">
              J'accepte que mes données personnelles et celles de mon entreprise soient traitées par 
              CAPITAL ÉNERGIE dans le cadre de cette analyse énergétique. Je comprends que ces données 
              seront utilisées uniquement pour établir le diagnostic et les recommandations d'optimisation, 
              conformément au Règlement Général sur la Protection des Données (UE) 2016/679.
            </p>
          </div>
        </label>

        {/* Consentement commercial optionnel */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={commercialConsent}
              onChange={(e) => setCommercialConsent(e.target.checked)}
              disabled={disabled}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
              commercialConsent 
                ? 'bg-cyan-500 border-cyan-500' 
                : 'border-slate-500 group-hover:border-slate-400'
            }`}>
              {commercialConsent && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>
          <div className="text-sm">
            <span className="text-white font-medium">Communication commerciale</span>
            <span className="text-slate-500 ml-1">(optionnel)</span>
            <p className="text-slate-400 mt-1 text-xs leading-relaxed">
              J'accepte de recevoir des informations sur les aides et subventions énergétiques, 
              ainsi que sur les services de CAPITAL ÉNERGIE et de ses partenaires certifiés RGE.
            </p>
          </div>
        </label>

        {/* Mentions légales */}
        <div className="pt-3 border-t border-slate-700">
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong className="text-slate-400">CAPITAL ÉNERGIE</strong> est une initiative privée indépendante. 
            Ce rapport ne constitue pas un document officiel émanant des services publics (État, ADEME, Anah). 
            Nous ne sommes mandatés par aucune administration pour réaliser des contrôles obligatoires.
            <br /><br />
            Vos données sont conservées pendant 3 ans et vous disposez d'un droit d'accès, de rectification 
            et de suppression en contactant contact@capital-energie.fr
          </p>
        </div>
      </div>

      {/* Indicateur de validation */}
      {hasSignature && rgpdConsent && (
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <Check className="w-4 h-4" />
          <span>Signature et consentements validés</span>
        </div>
      )}
    </div>
  );
}

export interface SignatureData {
  imageData: string;
  signedAt: string;
  rgpdConsent: boolean;
  commercialConsent: boolean;
  ipAddress?: string;
}
