'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-xl border border-slate-700">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            Données indisponibles
          </h3>
          <p className="text-slate-400 text-sm text-center mb-4">
            Une erreur s&apos;est produite lors du chargement de ce composant.
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function DataUnavailable({ message = 'Données indisponibles' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-800/30 rounded-xl border border-slate-700/50">
      <AlertTriangle className="w-8 h-8 text-slate-500 mb-2" />
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}
