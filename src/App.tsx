import { BrowserRouter as Router } from 'react-router-dom';
import { AppProviders } from './lib/AppProviders';
import Header from './components/Header';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import { Spinner } from './components/ui';
import { AppRoutes } from './routes/AppRoutes';

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
  return (
    <AppProviders>
      <Router>
        <div className="flex flex-col min-h-screen bg-background-page">
          <Header />
          <main className="flex-grow">
            <AppRoutes PageFallback={PageFallback} AdminFallback={AdminFallback} />
          </main>
          <Footer />
          <Chatbot />
        </div>
      </Router>
    </AppProviders>
  );
}

export default App;
