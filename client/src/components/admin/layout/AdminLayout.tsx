import React, { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useMediaQuery } from "@/hooks/use-media-query";

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