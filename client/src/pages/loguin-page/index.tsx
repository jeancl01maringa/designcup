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
  
  // Redireciona para login se estiver apenas em /loguin
  useEffect(() => {
    if (location === "/loguin") {
      navigate("/loguin/login");
    }
  }, [location, navigate]);

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
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Fundo com mosaico de imagens */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><pattern id="aesthetic-grid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="%23F84930" opacity="0.1"/><circle cx="50" cy="50" r="30" fill="%23F8A441" opacity="0.2"/></pattern></defs><rect width="400" height="400" fill="url(%23aesthetic-grid)"/></svg>')`,
          backgroundSize: '200px 200px',
          backgroundRepeat: 'repeat'
        }}
      />
      
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Modal centralizado */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 border border-gray-200/50">
        {/* Logo no topo do modal */}
        <div className="text-center mb-8">
          {logoData?.imageUrl ? (
            <img
              src={logoData.imageUrl}
              alt="Estetflix"
              className="h-12 mx-auto mb-4"
            />
          ) : logoData?.dataUrl ? (
            <img
              src={logoData.dataUrl}
              alt="Estetflix"
              className="h-12 mx-auto mb-4"
            />
          ) : (
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-[#F84930] to-[#F8A441] text-white px-4 py-2 rounded-lg">
                <span className="text-xl font-bold">🤍 Estetflix</span>
              </div>
            </div>
          )}
          <p className="text-gray-600 text-sm">
            Acesse sua conta ou crie uma nova para continuar
          </p>
        </div>
        
        <Switch>
          <Route path="/loguin/login" component={LoginPage} />
          <Route path="/loguin/register" component={RegisterPage} />
          <Route path="/loguin">
            <Redirect to="/loguin/login" />
          </Route>
        </Switch>
      </div>
    </div>
  );
}