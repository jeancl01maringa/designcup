import React, { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { usePlatformLogo } from "@/hooks/use-platform-logo";
import LoginPage from "./login";
import RegisterPage from "./register";

export default function LoguinPage() {
  const [location, navigate] = useLocation();
  const { logoUrl, hasCustomLogo, isLoading } = usePlatformLogo();

  // Facebook Pixel tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView', {
        pageName: 'loguin'
      });
      console.log('📊 Facebook Pixel: PageView tracked', { pageName: 'loguin' });
    }
  }, []);

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-background">
      {/* Modal centralizado */}
      <div className="relative z-10 bg-card rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 border border-border">
        {/* Logo no topo do modal */}
        <div className="text-center mb-8 flex flex-col items-center">
          {!isLoading && hasCustomLogo ? (
            <img
              src={logoUrl}
              alt="DesignCup"
              className="h-7 md:h-8 w-auto max-w-[180px] object-contain mb-6 mx-auto"
              style={{
                imageRendering: 'crisp-edges',
                filter: 'contrast(1.1) brightness(1.05)'
              }}
            />
          ) : !isLoading && !hasCustomLogo ? (
            <div className="flex justify-center items-center mb-4">
              <svg className="h-8 md:h-10 w-8 md:w-10 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              <span className="ml-2 font-bold text-2xl md:text-3xl">
                <span className="text-foreground">Design</span><span className="text-primary">Cup</span>
              </span>
            </div>
          ) : null}
          <p className="text-muted-foreground text-sm">
            Acesse sua conta ou crie uma nova para continuar
          </p>
        </div>

        <Switch>
          <Route path="/loguin/cadastro" component={RegisterPage} />
          <Route path="/loguin" component={LoginPage} />
        </Switch>
      </div>
    </div>
  );
}