import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './lib/LanguageContext';
import { AuthProvider } from './lib/AuthContext';
import { queryClient } from './lib/queryClient';
import Header from './components/Header';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import { Spinner } from './components/ui';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import GalleryPage from './pages/GalleryPage';
import HallPage from './pages/HallPage';
import BeachPage from './pages/BeachPage';
import TrainingPage from './pages/TrainingPage';
import ContactPage from './pages/ContactPage';
import CompetitionsPage from './pages/CompetitionsPage';
import AdminRouteGuard from './components/admin/AdminRouteGuard';
import AdminLoginPage from './pages/admin/AdminLoginPage';

// Lazy load pages for code splitting
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage'));
const AdminContentPage = lazy(() => import('./pages/admin/AdminContentPage'));
const AdminMediaPage = lazy(() => import('./pages/admin/AdminMediaPage'));
const AdminVectorJobsPage = lazy(() => import('./pages/admin/AdminVectorJobsPage'));
const AdminChatsPage = lazy(() => import('./pages/admin/AdminChatsPage'));
const AdminAlbumsPage = lazy(() => import('./pages/admin/AdminAlbumsPage'));

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-background-page">
              <Header />
              <main className="flex-grow">
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/gallery" element={<GalleryPage />} />
                    <Route path="/hall" element={<HallPage />} />
                    <Route path="/beach" element={<BeachPage />} />
                    <Route path="/training" element={<TrainingPage />} />
                    <Route path="/competitions" element={<CompetitionsPage />} />
                    <Route path="/contact" element={<ContactPage />} />

                    <Route path="/admin/login" element={<AdminLoginPage />} />

                    <Route
                      path="/admin"
                      element={
                        <AdminRouteGuard>
                          <Suspense fallback={<AdminFallback />}>
                            <AdminLayout />
                          </Suspense>
                        </AdminRouteGuard>
                      }
                    >
                      <Route index element={<AdminOverviewPage />} />
                      <Route path="content" element={<AdminContentPage />} />
                      <Route path="media" element={<AdminMediaPage />} />
                      <Route path="albums" element={<AdminAlbumsPage />} />
                      <Route path="vector-jobs" element={<AdminVectorJobsPage />} />
                      <Route path="chats" element={<AdminChatsPage />} />
                    </Route>
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <Chatbot />
            </div>
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
