import React, { useState, lazy, Suspense, useEffect } from 'react';
import Navigation from './components/Navigation';
import HeroBackground from './components/HeroBackground';
import LoadingSpinner from './components/LoadingSpinner';


import { NotificationProvider } from './contexts/NotificationContext';
import { initializeJolpicaApi } from './api/jolpica';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
const DriverDetailPage = lazyWithTimeout(() => import('./pages/DriverDetailPage'));
const TelemetryPage = lazyWithTimeout(() => import('./pages/TelemetryPage'));
const SchedulePage = lazyWithTimeout(() => import('./pages/SchedulePage'));
const TeamsPage = lazyWithTimeout(() => import('./pages/TeamsPage'));
const PredictPage = lazyWithTimeout(() => import('./pages/PredictPage'));
const ResultsPage = lazyWithTimeout(() => import('./pages/ResultsPage'));
const ProfilePage = lazyWithTimeout(() => import('./pages/ProfilePage'));
const IntelligencePage = lazyWithTimeout(() => import('./pages/IntelligencePage'));
const SignUpPage = lazyWithTimeout(() => import('./pages/SignUpPage'));
const SignInPage = lazyWithTimeout(() => import('./pages/SignInPage'));
const AuthCallback = lazyWithTimeout(() => import('./pages/AuthCallback'));

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
                  return <DriverDetailPage />;
                case 'telemetry':
                  return <TelemetryPage />;
                case 'schedule':
                  return <SchedulePage onPageChange={setCurrentPage} />;
                case 'teams':
                  return <TeamsPage />;
                case 'predict':
                  return <PredictPage raceData={raceData} onPageChange={setCurrentPage} />;
                case 'results':
                  return <ResultsPage />;
                case 'profile':
                  return <ProfilePage />;
                case 'intelligence':
                  return <IntelligencePage />;
                case 'signup':
                  return <SignUpPage onPageChange={setCurrentPage} />;
                case 'signin':
                  return <SignInPage onPageChange={setCurrentPage} />;
                case 'auth-callback':
                  return <AuthCallback onComplete={setCurrentPage} />;
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
        {/* Premium static hero background with adaptive blur */}
        <HeroBackground currentPage={currentPage} />
        {/* TODO: Implement navbar auto-hide on scroll */}
        <div className="min-h-screen text-white relative z-50">
          <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
          {renderPage()}
        </div>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;