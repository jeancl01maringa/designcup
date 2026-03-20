import { ProfileSidebar } from "./ProfileSidebar";
import { ProfileMobileNav } from "./ProfileMobileNav";
import { ReactNode } from "react";

interface ProfileLayoutProps {
  children: ReactNode;
}

export function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="min-h-screen bg-muted">
      {/* Navegação mobile */}
      <ProfileMobileNav />
      
      <div className="flex">
        {/* Sidebar - Oculto no mobile, visível no desktop */}
        <div className="hidden lg:block lg:fixed lg:left-0 lg:top-0 lg:h-full lg:z-10">
          <ProfileSidebar />
        </div>
        
        {/* Conteúdo principal - Responsivo */}
        <div className="flex-1 lg:ml-64">
          <main className="min-h-screen p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}