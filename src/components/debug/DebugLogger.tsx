'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bug, X, Copy, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  time: string;
  type: 'error' | 'rejection' | 'warning';
  message: string;
  stack?: string;
  url: string;
}

export default function DebugLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Génération d'un ID unique
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Capture des erreurs - DIFFÉRÉE pour éviter "setState during render"
  const captureError = useCallback((message: string, stack?: string, type: 'error' | 'rejection' | 'warning' = 'error') => {
    // Utilisation de setTimeout pour sortir du cycle de rendu actuel de React
    setTimeout(() => {
      const entry: LogEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString('fr-FR'),
        type,
        message: String(message),
        stack,
        url: typeof window !== 'undefined' ? window.location.href : '',
      };
      setLogs(prev => [...prev.slice(-49), entry]); // Garder max 50 logs
    }, 0);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Intercepter window.onerror
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      captureError(
        `${message} (${source}:${lineno}:${colno})`,
        error?.stack,
        'error'
      );
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Intercepter les rejets de promesses non gérées
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      captureError(
        reason?.message || String(reason),
        reason?.stack,
        'rejection'
      );
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Intercepter console.error
    const originalConsoleError = console.error;
    console.error = (...args) => {
      captureError(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), undefined, 'error');
      originalConsoleError.apply(console, args);
    };

    // Intercepter console.warn
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      // Filtrer les warnings Next.js de développement
      if (!msg.includes('Warning:') && !msg.includes('ReactDOM.render')) {
        captureError(msg, undefined, 'warning');
      }
      originalConsoleWarn.apply(console, args);
    };

    return () => {
      window.onerror = originalOnError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, [captureError]);

  // Copier le rapport complet
  const copyReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      application: 'CAPITAL ÉNERGIE',
      environment: process.env.NODE_ENV,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      currentUrl: typeof window !== 'undefined' ? window.location.href : '',
      totalErrors: logs.filter(l => l.type === 'error').length,
      totalRejections: logs.filter(l => l.type === 'rejection').length,
      totalWarnings: logs.filter(l => l.type === 'warning').length,
      logs: logs.map(({ id, ...rest }) => rest),
    };

    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Effacer les logs
  const clearLogs = () => {
    setLogs([]);
    setIsOpen(false);
  };

  const errorCount = logs.filter(l => l.type === 'error' || l.type === 'rejection').length;

  // Ne pas afficher si aucun log
  if (logs.length === 0) return null;

  return (
    <div 
      className="fixed bottom-4 right-4"
      style={{ zIndex: 9999 }}
    >
      {/* Badge flottant */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-all animate-pulse"
        >
          <Bug className="w-5 h-5" />
          <span className="font-bold">{logs.length}</span>
          {errorCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 text-red-900 text-xs font-bold rounded-full flex items-center justify-center">
              {errorCount}
            </span>
          )}
        </button>
      )}

      {/* Panel de debug */}
      {isOpen && (
        <div className="w-96 max-h-[500px] bg-slate-900 border border-red-500/50 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-red-600 text-white">
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              <span className="font-bold">Debug Logger</span>
              <span className="px-2 py-0.5 bg-white/20 rounded text-xs">{logs.length} logs</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={copyReport}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                title="Copier le rapport JSON"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={clearLogs}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                title="Effacer les logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="px-3 py-2 bg-slate-800 border-b border-slate-700 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span>Date: {new Date().toLocaleDateString('fr-FR')}</span>
              <span>Heure: {new Date().toLocaleTimeString('fr-FR')}</span>
            </div>
            <div className="truncate mt-1">
              URL: {typeof window !== 'undefined' ? window.location.pathname : ''}
            </div>
          </div>

          {/* Liste des logs */}
          <div className="max-h-80 overflow-y-auto">
            {logs.slice().reverse().map((log) => (
              <div 
                key={log.id}
                className={`p-3 border-b border-slate-700 ${
                  log.type === 'error' ? 'bg-red-500/10' :
                  log.type === 'rejection' ? 'bg-orange-500/10' :
                  'bg-yellow-500/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`w-4 h-4 ${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'rejection' ? 'text-orange-400' :
                    'text-yellow-400'
                  }`} />
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                    log.type === 'error' ? 'bg-red-500/20 text-red-400' :
                    log.type === 'rejection' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {log.type.toUpperCase()}
                  </span>
                  <span className="text-slate-500 text-xs ml-auto">{log.time}</span>
                </div>
                <p className="text-slate-300 text-sm break-words">{log.message}</p>
                {log.stack && (
                  <pre className="mt-2 text-xs text-slate-500 bg-slate-800 p-2 rounded overflow-x-auto">
                    {log.stack.slice(0, 200)}...
                  </pre>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-2 bg-slate-800 border-t border-slate-700">
            <button
              onClick={copyReport}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Rapport copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier le rapport complet (JSON)
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
