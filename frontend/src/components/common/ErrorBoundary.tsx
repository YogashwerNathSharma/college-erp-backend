import { Component, ReactNode } from "react";

/**
 * 🛡️ Reusable Error Boundary
 *
 * Modes:
 *  - "page"    → full-screen error with retry + dashboard link
 *  - "section" → compact in-place error within a card
 *  - "silent"  → hides the broken component, renders nothing
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  mode?: "page" | "section" | "silent";
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    // Custom fallback takes priority
    if (this.props.fallback) return this.props.fallback;

    const mode = this.props.mode ?? "page";
    const isChunk =
      this.state.error?.message?.includes("Loading chunk") ||
      this.state.error?.message?.includes("Failed to fetch dynamically imported module") ||
      this.state.error?.message?.includes("error loading dynamically imported module");

    // ── silent ────────────────────────────────────────────────
    if (mode === "silent") return null;

    // ── section (inline card) ────────────────────────────────
    if (mode === "section") {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 p-6 text-center">
          <svg
            className="w-8 h-8 text-red-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
            Something went wrong
          </p>
          <p className="text-xs text-red-500/70 dark:text-red-400/50 mb-3 max-w-xs break-words">
            {this.state.error?.message || "Unexpected error"}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      );
    }

    // ── page (full-screen) ───────────────────────────────────
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          {isChunk ? "Page failed to load" : "Something went wrong"}
        </h2>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
          {isChunk
            ? "Please check your internet connection and try again."
            : this.state.error?.message || "An unexpected error occurred."}
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={this.handleReload}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
          >
            Try Again
          </button>
          <button
            onClick={this.handleGoHome}
            className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
}
