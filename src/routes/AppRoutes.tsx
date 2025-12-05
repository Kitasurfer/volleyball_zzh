import { Suspense, lazy, type ComponentType } from 'react';
import { Routes, Route } from 'react-router-dom';

import HomePage from '../pages/HomePage';
import AboutPage from '../pages/AboutPage';
import GalleryPage from '../pages/GalleryPage';
import HallPage from '../pages/HallPage';
import BeachPage from '../pages/BeachPage';
import TrainingPage from '../pages/TrainingPage';
import ContactPage from '../pages/ContactPage';
import CompetitionsPage from '../pages/CompetitionsPage';
import AdminRouteGuard from '../components/admin/AdminRouteGuard';
import AdminLoginPage from '../pages/admin/AdminLoginPage';

const AdminLayout = lazy(() => import('../components/admin/AdminLayout'));
const AdminOverviewPage = lazy(() => import('../pages/admin/AdminOverviewPage'));
const AdminContentPage = lazy(() => import('../pages/admin/AdminContentPage'));
const AdminMediaPage = lazy(() => import('../pages/admin/AdminMediaPage'));
const AdminVectorJobsPage = lazy(() => import('../pages/admin/AdminVectorJobsPage'));
const AdminChatsPage = lazy(() => import('../pages/admin/AdminChatsPage'));
const AdminAlbumsPage = lazy(() => import('../pages/admin/AdminAlbumsPage'));

interface AppRoutesProps {
  PageFallback: ComponentType;
  AdminFallback: ComponentType;
}

export function AppRoutes({ PageFallback, AdminFallback }: AppRoutesProps) {
  return (
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
  );
}
