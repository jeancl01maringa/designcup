import { ProfileSidebar } from "./ProfileSidebar";
import { ReactNode } from "react";

interface ProfileLayoutProps {
  children: ReactNode;
}

export function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar fixo */}
        <div className="fixed left-0 top-0 h-full z-10">
          <ProfileSidebar />
        </div>
        
        {/* Conteúdo principal com margem para o sidebar */}
        <div className="flex-1 ml-64">
          <main className="min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}