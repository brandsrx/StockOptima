"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/10 to-rose-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Algo salió mal
          </h3>
          <p className="text-sm mb-4 max-w-md" style={{ color: "var(--text-tertiary)" }}>
            {this.state.error?.message || "Ocurrió un error inesperado al cargar esta sección."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
