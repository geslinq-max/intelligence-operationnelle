'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Check, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (signatureData: string | null) => void;
  width?: number;
  height?: number;
  label?: string;
  required?: boolean;
}

export default function SignaturePad({
  onSignatureChange,
  width = 400,
  height = 200,
  label = 'Signature',
  required = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // Initialiser le canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Style du trait
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  }, []);

  const startDrawing = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    setLastPoint(coords);
  }, [getCoordinates]);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || !lastPoint) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setLastPoint(coords);
    setHasSignature(true);
  }, [isDrawing, lastPoint, getCoordinates]);

  const stopDrawing = useCallback(() => {
    if (isDrawing && hasSignature) {
      const canvas = canvasRef.current;
      if (canvas) {
        const signatureData = canvas.toDataURL('image/png');
        onSignatureChange(signatureData);
      }
    }
    setIsDrawing(false);
    setLastPoint(null);
  }, [isDrawing, hasSignature, onSignatureChange]);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange(null);
  }, [onSignatureChange]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-200">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      <div className="relative bg-white rounded-xl overflow-hidden border-2 border-slate-600 touch-none">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full cursor-crosshair"
          style={{ touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Ligne guide */}
        <div 
          className="absolute bottom-8 left-4 right-4 border-b border-dashed border-slate-300 pointer-events-none"
          style={{ height: '1px' }}
        />

        {/* Placeholder */}
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-500 text-base font-medium">Signez ici avec votre doigt</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={clearSignature}
          className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] min-w-[44px] bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-slate-200 rounded-xl text-sm font-medium transition-colors touch-manipulation"
        >
          <RotateCcw className="w-5 h-5" />
          Effacer
        </button>

        {hasSignature && (
          <div className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 rounded-xl text-sm font-medium">
            <Check className="w-5 h-5" />
            Signature enregistrée
          </div>
        )}
      </div>
    </div>
  );
}
