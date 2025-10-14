import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, role } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* Mobile Header with Drawer */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b bg-background flex items-center px-4" style={{ paddingTop: 'var(--safe-top)' }}>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <AppSidebar />
            </SheetContent>
          </Sheet>
          <span className="ml-4 font-semibold">App Hipertrofia</span>
        </div>

        {/* Main Content */}
        <main className="flex-1 md:pt-0 pt-14 no-overscroll" style={{ paddingBottom: 'var(--safe-bottom)' }}>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
