'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, Image, X, CheckCircle, Loader2, Camera } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

// Détection mobile
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export default function FileUpload({
  onFileSelect,
  accept = '.pdf,.png,.jpg,.jpeg,.webp',
  maxSizeMB = 10,
  className = '',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const validateFile = (file: File): boolean => {
    setError(null);
    
    // Vérifier le type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Format non supporté. Utilisez PDF, PNG, JPG ou WEBP.');
      return false;
    }
    
    // Vérifier la taille
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Fichier trop volumineux. Maximum ${maxSizeMB} Mo.`);
      return false;
    }
    
    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      setIsUploading(true);
      
      // Simuler un court délai d'upload pour le feedback visuel
      setTimeout(() => {
        setIsUploading(false);
        onFileSelect(file);
      }, 500);
    }
  }, [onFileSelect, maxSizeMB]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-400" />;
    }
    return <Image className="w-8 h-8 text-blue-400" />;
  };

  return (
    <div className={className}>
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200 ease-out
            ${isDragging 
              ? 'border-cyan-500 bg-cyan-500/10 scale-[1.02]' 
              : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
          />
          
          {/* Input caméra pour mobile */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleInputChange}
            className="hidden"
          />
          
          {isMobile ? (
            /* Version Mobile - Boutons grands pour le pouce */
            <div className="space-y-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-medium text-lg transition-all min-h-[64px] shadow-lg"
              >
                <Camera className="w-7 h-7" />
                Prendre une photo
              </button>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all min-h-[56px] border border-slate-700"
              >
                <Upload className="w-5 h-5" />
                Choisir un fichier
              </button>
              
              <p className="text-slate-500 text-xs text-center">
                PDF, PNG, JPG • Max {maxSizeMB} Mo
              </p>
            </div>
          ) : (
            /* Version Desktop - Drag & Drop */
            <>
              <div className={`
                w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center
                transition-all duration-200
                ${isDragging ? 'bg-cyan-500/20' : 'bg-slate-800'}
              `}>
                <Upload className={`w-8 h-8 ${isDragging ? 'text-cyan-400' : 'text-slate-500'}`} />
              </div>
              
              <p className="text-white font-medium mb-1">
                {isDragging ? 'Déposez le fichier ici' : 'Glissez-déposez votre document'}
              </p>
              <p className="text-slate-500 text-sm mb-3">
                ou <span className="text-cyan-400 hover:underline">parcourez vos fichiers</span>
              </p>
              
              <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> PDF
                </span>
                <span className="flex items-center gap-1">
                  <Image className="w-3 h-3" /> PNG, JPG
                </span>
                <span>Max {maxSizeMB} Mo</span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="border border-slate-700 rounded-xl p-4 bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              ) : (
                getFileIcon(selectedFile.type)
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{selectedFile.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500 text-sm">{formatFileSize(selectedFile.size)}</span>
                {!isUploading && (
                  <span className="flex items-center gap-1 text-green-400 text-sm">
                    <CheckCircle className="w-3 h-3" />
                    Prêt
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={handleRemove}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Preview hint */}
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
              Ce document sera joint à l&apos;analyse et traité par l&apos;Agent Scout
            </p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
