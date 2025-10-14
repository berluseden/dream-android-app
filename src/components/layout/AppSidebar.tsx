import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  Dumbbell,
  Users,
  Calendar,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const navItems = [
  { title: 'Dashboard', url: '/', icon: Home, roles: ['admin', 'coach', 'user'] },
  { title: 'Ejercicios', url: '/exercises', icon: Dumbbell, roles: ['admin', 'coach', 'user'] },
  { title: 'Clientes', url: '/coach/clients', icon: Users, roles: ['coach', 'admin'] },
  { title: 'Entrenamientos', url: '/workouts', icon: Calendar, roles: ['user', 'coach'] },
  { title: 'Progreso', url: '/progress', icon: BarChart3, roles: ['user', 'coach'] },
  { title: 'Mensajes', url: '/messages', icon: MessageSquare, roles: ['coach', 'user'] },
  { title: 'Configuración', url: '/settings', icon: Settings, roles: ['admin', 'coach', 'user'] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { profile, role, signOut } = useAuth();
  const location = useLocation();

  const filteredItems = navItems.filter(item => 
    role && item.roles.includes(role)
  );

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const collapsed = state === 'collapsed';

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b">
          {!collapsed && (
            <div>
              <h2 className="font-bold text-lg">App Hipertrofia</h2>
              <p className="text-sm text-muted-foreground">{profile?.name}</p>
              <Badge className="mt-1" variant="secondary">{role}</Badge>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end={item.url === '/'}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Cerrar Sesión</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
