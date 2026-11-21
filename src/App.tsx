import { useEffect } from 'react';
import { BrowserRouter as Router, useLocation, useMatch } from 'react-router-dom';
import { AppProviders } from './lib/AppProviders';
import Header from './components/Header';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import { Spinner } from './components/ui';
import { AppRoutes } from './routes/AppRoutes';
import ScrollToTop from './components/ScrollToTop';
import CookieConsent from './components/CookieConsent';

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
function SiteContent({ isPrerender }: { isPrerender: boolean }) {
  const display = useMatch('/scoreboard/:matchId/display');
  const control = useMatch('/scoreboard/:matchId/control');
  const scoreboard = useMatch('/scoreboard/*');
  const tournament = useMatch('/competitions/:competitionId');
  if (display) return <AppRoutes PageFallback={PageFallback} AdminFallback={AdminFallback} />;
  const Content = scoreboard || tournament ? 'div' : 'main';
  return (
    <div className="flex min-h-screen flex-col bg-background-page">
      <div className="contents print:hidden"><Header /></div>
      <Content className="flex-grow">
        <AppRoutes PageFallback={PageFallback} AdminFallback={AdminFallback} />
      </Content>
      <div className="contents print:hidden">
        <Footer />
        {!isPrerender && <CookieConsent />}
        {!isPrerender && !control && <Chatbot />}
      </div>
    </div>
  );
}

function App() {
  const isPrerender =
    typeof window !== 'undefined' && Boolean((window as unknown as { __PRERENDER_INJECTED?: { prerender?: boolean } }).__PRERENDER_INJECTED?.prerender);

  return (
    <AppProviders>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <PrerenderReadySignal enabled={isPrerender} />
        <ScrollToTop />
        <SiteContent isPrerender={isPrerender} />
      </Router>
    </AppProviders>
  );
}

export default App;
