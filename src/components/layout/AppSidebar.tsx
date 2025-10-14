import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/user.types';
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
  Play,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Dashboard', url: '/', icon: Home, roles: ['admin', 'coach', 'user'] },
  { title: 'Hoy', url: '/workout/today', icon: Play, roles: ['user'] },
  { title: 'Ejercicios', url: '/exercises', icon: Dumbbell, roles: ['admin', 'coach', 'user'] },
  { title: 'Clientes', url: '/coach/clients', icon: Users, roles: ['coach', 'admin'] },
  { title: 'Entrenamientos', url: '/workouts', icon: Calendar, roles: ['user', 'coach'] },
  { title: 'Progreso', url: '/progress', icon: BarChart3, roles: ['user', 'coach'] },
  { title: 'Mensajes', url: '/messages', icon: MessageSquare, roles: ['coach', 'user'] },
  { title: 'Admin', url: '/admin', icon: Settings, roles: ['admin'] },
  { title: 'Configuración', url: '/settings', icon: Settings, roles: ['admin', 'coach', 'user'] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { profile, role, loading, signOut } = useAuth();
  const location = useLocation();

  // Durante carga, mostrar items básicos; después filtrar por role
  const filteredItems = loading 
    ? [] 
    : navItems.filter(item => {
        if (!role) return item.roles.includes('user'); // Fallback a items de user
        return item.roles.includes(role);
      });

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const collapsed = state === 'collapsed';

  const getRoleBadgeVariant = (role: UserRole | null) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'coach': return 'default';
      default: return 'secondary';
    }
  };

  const getRoleInitial = (role: UserRole | null) => {
    switch (role) {
      case 'admin': return 'A';
      case 'coach': return 'C';
      default: return 'U';
    }
  };

  return (
    <Sidebar className={cn(
      'transition-all duration-200',
      collapsed ? 'w-14' : 'w-60'
    )} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b">
          {!collapsed ? (
            <div className="animate-fade-in">
              <h2 className="font-bold text-lg">App Hipertrofia</h2>
              {loading ? (
                <>
                  <Skeleton className="h-4 w-32 mt-1" />
                  <Skeleton className="h-5 w-16 mt-1" />
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">{profile?.name}</p>
                  <Badge className="mt-1" variant={getRoleBadgeVariant(role)}>{role}</Badge>
                </>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              {loading ? (
                <Skeleton className="h-8 w-8 rounded-full" />
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant={getRoleBadgeVariant(role)} 
                      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
                    >
                      {getRoleInitial(role)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-medium">{profile?.name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                // Skeleton durante carga
                Array.from({ length: 6 }).map((_, i) => (
                  <SidebarMenuItem key={`skeleton-${i}`}>
                    <SidebarMenuButton disabled>
                      <Skeleton className="h-4 w-4 rounded" />
                      {!collapsed && <Skeleton className="h-4 w-24" />}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                // Menu real después de cargar con animación
                <div className="animate-fade-in space-y-1">
                  {filteredItems.map((item, idx) => (
                    <SidebarMenuItem 
                      key={item.title}
                      style={{ animationDelay: `${idx * 50}ms` }}
                      className="animate-fade-in"
                    >
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <NavLink 
                          to={item.url} 
                          end={item.url === '/'}
                          className="transition-all duration-200"
                        >
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </div>
              )}
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
