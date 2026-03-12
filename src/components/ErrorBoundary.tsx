import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<any, any> {
  public state: any = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-6 glass p-8 rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-neon-pink/20 rounded-full flex items-center justify-center mx-auto text-neon-pink neon-glow">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-xl font-bold text-white uppercase tracking-widest">Erro de Sistema</h1>
            <p className="text-white/60 text-sm leading-relaxed">
              Ocorreu um erro inesperado que impediu a renderização do sistema. Isso pode ser causado por excesso de dados ou falha de conexão.
            </p>
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-left">
              <p className="text-[10px] font-mono text-neon-pink truncate">
                {this.state.error?.message || "Erro desconhecido"}
              </p>
            </div>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full py-3 bg-white text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-white/80 transition-all"
            >
              REINICIAR SISTEMA (LIMPAR CACHE)
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
