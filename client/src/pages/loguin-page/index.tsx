import React, { useEffect } from "react";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import LoginPage from "./login";
import RegisterPage from "./register";

export default function LoguinPage() {
  const [location, navigate] = useLocation();

  // Buscar logo oficial configurado
  const { data: logoData } = useQuery({
    queryKey: ['/api/logo'],
    queryFn: async () => {
      const res = await fetch('/api/logo');
      if (!res.ok) throw new Error('Failed to fetch logo');
      return res.json();
    },
  });



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
    <div className="min-h-screen relative flex items-center justify-center bg-muted">
      {/* Gradiente sutil de fundo */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50" />

      {/* Modal centralizado */}
      <div className="relative z-10 bg-card rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 border border-border/50">
        {/* Logo no topo do modal */}
        <div className="text-center mb-8">
          {logoData?.imageUrl ? (
            <img
              src={logoData.imageUrl}
              alt="DesignCup"
              className="h-12 mx-auto mb-4"
            />
          ) : logoData?.dataUrl ? (
            <img
              src={logoData.dataUrl}
              alt="DesignCup"
              className="h-12 mx-auto mb-4"
            />
          ) : (
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-[#0066FF] to-[#3B82F6] text-white px-4 py-2 rounded-lg">
                <span className="text-xl font-bold">DesignCup</span>
              </div>
            </div>
          )}
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