import React, { useState, lazy, Suspense, useEffect } from 'react';
import Navigation from './components/Navigation';
import HeroBackground from './components/HeroBackground';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import { NotificationProvider } from './contexts/NotificationContext';
import { initializeJolpicaApi } from './api/jolpica';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRaceStatus } from './hooks/useRaceStatus';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes default stale time
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Backend Status Indicator Component
const BackendStatusIndicator = () => {
  const { data: status, isLoading, isError } = useRaceStatus();

  // Check if offline
  // status might be undefined if error, or match our fallback mocks
  const isOffline = isError || (status?.raceId === 'offline-demo') || (status?.name === 'Backend Initializing...');

  if (!isOffline && !isLoading) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-[9999] px-4 py-2 rounded-full border backdrop-blur-md text-xs font-bold flex items-center gap-2 shadow-2xl transition-all duration-500 ${isOffline
        ? 'bg-red-500/10 border-red-500 text-red-500'
        : 'bg-[#E10600]/10 border-[#E10600] text-[#E10600]'
      }`}>
      {isLoading ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>CONNECTING...</span>
        </>
      ) : isOffline ? (
        <>
          <AlertTriangle className="w-3 h-3" />
          <span>BACKEND OFFLINE - DEMO MODE</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="w-3 h-3" />
          <span>LIVE</span>
        </>
      )}
    </div>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Page loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-white text-2xl font-bold mb-4">Page Loading Error</h2>
            <p className="text-gray-400 mb-6">Sorry, there was an error loading this page.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy load all pages for better performance with timeout
const lazyWithTimeout = (importFn: () => Promise<any>, timeout = 10000) => {
  return lazy(() => {
    return Promise.race([
      importFn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Page loading timeout')), timeout)
      )
    ]);
  });
};

const HomePage = lazyWithTimeout(() => import('./pages/HomePage'));
const DriversPage = lazyWithTimeout(() => import('./pages/DriversPage'));
const TelemetryPage = lazyWithTimeout(() => import('./pages/TelemetryPage'));
const SchedulePage = lazyWithTimeout(() => import('./pages/SchedulePage'));
const TeamsPage = lazyWithTimeout(() => import('./pages/TeamsPage'));
const SimulationPage = lazyWithTimeout(() => import('./pages/SimulationPage'));
const ResultsPage = lazyWithTimeout(() => import('./pages/ResultsPage'));
const IntelligencePage = lazyWithTimeout(() => import('./pages/IntelligencePage'));
const AboutPage = lazyWithTimeout(() => import('./pages/AboutPage'));

function App() {
  // Helper to extract page name from hash (ignoring query params)
  const getPageFromHash = (hash: string) => {
    const cleanHash = hash.replace('#/', '');
    return cleanHash.split('?')[0] || 'home';
  };

  // Get initial page from hash
  const getInitialPage = () => {
    return getPageFromHash(window.location.hash);
  };

  const [currentPage, setCurrentPageState] = useState(getInitialPage());
  const [raceData, setRaceData] = useState<any>(null);

  // Initialize Jolpica API with fallback data on app start
  useEffect(() => {
    initializeJolpicaApi();
  }, []);

  // Update hash on page change
  const setCurrentPage = (page: string, data?: any) => {
    // Check if page string already has params
    const pageName = page.split('?')[0];
    setCurrentPageState(pageName);
    setRaceData(data || null);

    // If we're updating manual state, we update hash.
    // If page string implies params (e.g. 'intelligence?driver=VER'), set it directly.
    if (page.startsWith('/')) {
      window.location.hash = page;
    } else {
      window.location.hash = '/' + page;
    }
  };

  // Listen for hash changes (e.g., browser back/forward)
  React.useEffect(() => {
    const onHashChange = () => {
      const page = getPageFromHash(window.location.hash);
      setCurrentPageState(page);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const renderPage = () => {
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          {(() => {
            try {
              switch (currentPage) {
                case 'home':
                  return <HomePage setCurrentPage={setCurrentPage} />;
                case 'driver':
                  return <DriversPage />;
                case 'telemetry':
                  return <TelemetryPage />;
                case 'schedule':
                  return <SchedulePage onPageChange={setCurrentPage} />;
                case 'teams':
                  return <TeamsPage />;
                case 'simulation':
                  return <SimulationPage />;
                case 'results':
                  return <ResultsPage />;
                case 'intelligence':
                  return <IntelligencePage />;
                case 'about':
                  return <AboutPage />;
                default:
                  return <HomePage setCurrentPage={setCurrentPage} />;
              }
            } catch (error) {
              console.error('Page rendering error:', error);
              return (
                <div className="min-h-screen bg-black flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-white text-2xl font-bold mb-4">Page Error</h2>
                    <p className="text-gray-400 mb-6">Unable to load this page.</p>
                    <button
                      onClick={() => setCurrentPage('home')}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Go Home
                    </button>
                  </div>
                </div>
              );
            }
          })()}
        </Suspense>
      </ErrorBoundary>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <BackendStatusIndicator />
        {/* Premium static hero background with adaptive blur */}
        <HeroBackground currentPage={currentPage} />
        {/* TODO: Implement navbar auto-hide on scroll */}
        <div className="min-h-screen text-white relative z-50 flex flex-col">
          <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
          <main className="flex-grow">
            {renderPage()}
          </main>
          <Footer />
        </div>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;