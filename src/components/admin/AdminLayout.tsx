import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Users,
  UserCog,
  Shield,
  Mail,
  Database,
  Settings,
  FileText,
  LayoutDashboard,
} from 'lucide-react';

const navItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard, exact: true },
  { title: 'Usuarios', url: '/admin/users', icon: Users },
  { title: 'Roles', url: '/admin/roles', icon: Shield },
  { title: 'Coaches', url: '/admin/coaches', icon: UserCog },
  { title: 'Invitaciones', url: '/admin/invitations', icon: Mail },
  { title: 'Catálogos', url: '/admin/catalogs', icon: Database },
  { title: 'Semillas & Migración', url: '/admin/seed-migrate', icon: Database },
  { title: 'Auditoría', url: '/admin/audit', icon: FileText },
  { title: 'Configuración', url: '/admin/settings', icon: Settings },
];

export function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="w-64 shrink-0">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? location.pathname === item.url
                  : location.pathname.startsWith(item.url);

                return (
                  <Link
                    key={item.url}
                    to={item.url}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
