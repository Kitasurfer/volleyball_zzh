import { Link, NavLink, Outlet } from 'react-router-dom';
import type { AdminNavItem } from '../../types/admin';

const navItems: AdminNavItem[] = [
  { label: 'Overview', path: '/admin' },
  { label: 'Content', path: '/admin/content' },
  { label: 'Media', path: '/admin/media' },
  { label: 'Vector Jobs', path: '/admin/vector-jobs' },
  { label: 'Chat Sessions', path: '/admin/chats' },
];

const AdminLayout = () => (
  <div className="min-h-screen bg-neutral-100 text-neutral-900">
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm font-semibold text-primary-600">
            ← Back to site
          </Link>
          <h1 className="text-lg font-semibold uppercase tracking-wide text-neutral-700">
            Admin Control Center
          </h1>
        </div>
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
            {item.label}
          </NavLink>
        ))}
      </aside>

      <section className="flex-1 rounded-xl bg-white p-6 shadow-sm">
        <Outlet />
      </section>
    </div>
  </div>
);

export default AdminLayout;
