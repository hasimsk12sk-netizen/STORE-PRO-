import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    let readable = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(readable);
      if (parsed?.error) {
        readable = `Database operation blocked (${parsed.operationType || 'read'}): ${parsed.error}`;
      }
    } catch {
      // Non-JSON error message
    }
    return { hasError: true, message: readable };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen sp-light-canvas text-[#0B0D12] flex items-center justify-center p-6">
          <div className="sp-rgb-card max-w-md w-full p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#161924] border border-white/15 flex items-center justify-center text-[#FFD700]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold font-display text-white">
              Unable to complete request
            </h2>
            <p className="mt-2 text-sm text-[#B8BFCE] leading-relaxed break-words">
              {this.state.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="sp-install-btn mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-[#00E5FF]" />
              Reload STORE PRO
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
