import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import type { AdminNavItem } from '../../types/admin';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../lib/AuthContext';
import { Seo } from '../Seo';

const navItems: AdminNavItem[] = [
  { key: 'overview', path: '/admin' },
  { key: 'content', path: '/admin/content' },
  { key: 'media', path: '/admin/media' },
  { key: 'albums', path: '/admin/albums' },
  { key: 'vectorJobs', path: '/admin/vector-jobs' },
  { key: 'chats', path: '/admin/chats' },
];

const AdminLayout = () => {
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const nav = t.admin.nav;

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <Seo title="Admin" description="Admin" noIndex />
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm font-semibold text-primary-600">
              ← {nav.backToSite}
            </Link>
            <h1 className="text-lg font-semibold uppercase tracking-wide text-neutral-700">
              {nav.headerTitle}
            </h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
        <aside className="w-64 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                `block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-neutral-600 hover:bg-neutral-200'
                }`
              }
            >
              {nav.items[item.key]}
            </NavLink>
          ))}

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            Logout
          </button>
        </aside>

        <section className="flex-1 rounded-xl bg-white p-6 shadow-sm">
          <Outlet />
        </section>
      </div>
    </div>
  );
};

export default AdminLayout;
