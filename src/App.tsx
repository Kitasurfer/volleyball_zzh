import { useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AppProviders } from './lib/AppProviders';
import Header from './components/Header';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import { Spinner } from './components/ui';
import { AppRoutes } from './routes/AppRoutes';
import ScrollToTop from './components/ScrollToTop';
import CookieConsent from './components/CookieConsent';

// Lazy load pages for code splitting
const AdminLayout = () => null;
const AdminOverviewPage = () => null;
const AdminContentPage = () => null;
const AdminMediaPage = () => null;
const AdminVectorJobsPage = () => null;
const AdminChatsPage = () => null;
const AdminAlbumsPage = () => null;

/**
 * Fallback component shown while loading
 */
const PageFallback = () => (
  <div className="flex min-h-[300px] items-center justify-center">
    <Spinner text="Loading page…" />
  </div>
);

const AdminFallback = () => (
  <div className="flex min-h-[300px] items-center justify-center">
    <Spinner text="Loading admin panel…" />
  </div>
);

function PrerenderReadySignal({ enabled }: { enabled: boolean }) {
  const location = useLocation();

  useEffect(() => {
    let timeoutId: number | null = null;

    if (!enabled) return;

    const dispatchReady = () => {
      document.dispatchEvent(new Event('prerender-ready'));
    };

    const scheduleDispatch = () => {
      timeoutId = window.setTimeout(dispatchReady, 0);
    };

    scheduleDispatch();

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [enabled, location.pathname]);

  return null;
}

/**
 * Main App Component
 * 
 * Architecture:
 * - QueryClientProvider for React Query
 * - LanguageProvider for i18n
 * - Router for page routing
 * - Lazy loaded pages for code splitting
 */
function App() {
  const isPrerender =
    typeof window !== 'undefined' && Boolean((window as unknown as { __PRERENDER_INJECTED?: { prerender?: boolean } }).__PRERENDER_INJECTED?.prerender);

  return (
    <AppProviders>
      <Router>
        <PrerenderReadySignal enabled={isPrerender} />
        <ScrollToTop />
        <div className="flex flex-col min-h-screen bg-background-page">
          <Header />
          <main className="flex-grow">
            <AppRoutes PageFallback={PageFallback} AdminFallback={AdminFallback} />
          </main>
          <Footer />
          {!isPrerender && <CookieConsent />}
          {!isPrerender && <Chatbot />}
        </div>
      </Router>
    </AppProviders>
  );
}

export default App;
