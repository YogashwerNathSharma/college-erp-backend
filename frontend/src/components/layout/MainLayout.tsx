import { useState, useEffect, Component, ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import TopNavbar from "../TopNavbar";

//////////////////////////////////////////////////////
// 🛡️ ERROR BOUNDARY
//////////////////////////////////////////////////////

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center animate-fade-in">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            className="btn-primary"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

//////////////////////////////////////////////////////
// 🔄 PAGE TRANSITION LOADER
//////////////////////////////////////////////////////

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center h-64 animate-fade-in">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-slate-700" />
      <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
    </div>
    <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">Loading...</p>
  </div>
);

//////////////////////////////////////////////////////
// 🏠 MAIN LAYOUT COMPONENT
//////////////////////////////////////////////////////

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [tenant, setTenant] = useState<any>(() => {
    const saved = localStorage.getItem("tenant");
    return saved ? JSON.parse(saved) : null;
  });
  const location = useLocation();

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Detect print mode
  useEffect(() => {
    const beforePrint = () => setIsPrinting(true);
    const afterPrint = () => setIsPrinting(false);
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);

  // Listen for storage changes (tenant updates)
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem("tenant");
      if (saved) setTenant(JSON.parse(saved));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <div className={`flex min-h-screen min-h-[100dvh] relative bg-gray-50 dark:bg-slate-900 transition-colors duration-200 ${isPrinting ? "printing" : ""}`}>

      {/* ═══════════ Sidebar (single render) ═══════════ */}
      <Sidebar tenant={tenant} sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ═══════════ Main Content Area ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0 main-content-wrapper md:ml-[260px]">
        {/* Mobile hamburger button */}
        <button
          className="hamburger-btn fixed top-3 left-3 z-[990] p-2.5 bg-primary-500 text-white rounded-xl shadow-lg md:hidden tap-target active:scale-95 transition-transform"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Top Navbar */}
        {!isPrinting && <TopNavbar tenant={tenant} />}

        {/* Page Content */}
        <main
          className="flex-1 p-3 md:p-6 overflow-auto"
          role="main"
          aria-label="Main content"
        >
          <ErrorBoundary>
            <div className="page-container">
              <Outlet context={{ setTenant }} />
            </div>
          </ErrorBoundary>
        </main>

        {/* Toast Container Position Reference */}
        <div id="toast-container" className="fixed top-4 right-4 z-[10000] pointer-events-none" />
      </div>
    </div>
  );
}

export { ErrorBoundary, PageLoader };
