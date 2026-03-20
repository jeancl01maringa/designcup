import React, { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar} 
        currentPath={location}
        userData={user}
      />
      
      {/* Botão mobile fixo para abrir sidebar - estilo Instagram */}
      {!sidebarOpen && isMobile && (
        <Button
          onClick={toggleSidebar}
          size="lg"
          className="fixed top-4 left-4 z-40 bg-card shadow-lg border border-border text-muted-foreground hover:bg-muted rounded-full p-3 min-w-[48px] min-h-[48px] md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      
      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-x-hidden transition-all duration-200 ease-in-out",
        sidebarOpen ? "md:pl-60" : "md:pl-16"
      )}>
        <div className="p-4 md:p-6 max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}