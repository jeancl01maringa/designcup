import React, { useEffect } from "react";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { usePlatformLogo } from "@/hooks/use-platform-logo";
import LoginPage from "./login";
import RegisterPage from "./register";

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { logoUrl, hasCustomLogo, isLoading } = usePlatformLogo();

  // Redireciona para login se estiver apenas em /auth
  useEffect(() => {
    if (location === "/auth") {
      navigate("/auth/login");
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-background">
      {/* Logo no topo */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
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
          <div className="flex items-center">
            <svg className="h-8 md:h-10 w-8 md:w-10 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            <span className="ml-2 font-bold text-2xl md:text-3xl">
              <span className="text-foreground">Design</span><span className="text-primary">Cup</span>
            </span>
          </div>
        ) : null}
      </div>

      {/* Modal centralizado */}
      <div className="relative z-10 bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 border border-border">
        <Switch>
          <Route path="/auth/login" component={LoginPage} />
          <Route path="/auth/register" component={RegisterPage} />
          <Route path="/auth">
            <Redirect to="/auth/login" />
          </Route>
        </Switch>
      </div>
    </div>
  );
}