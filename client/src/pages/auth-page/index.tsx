import React, { useEffect } from "react";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import LoginPage from "./login";
import RegisterPage from "./register";

export default function AuthPage() {
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
  
  // Redireciona para login se estiver apenas em /auth
  useEffect(() => {
    if (location === "/auth") {
      navigate("/auth/login");
    }
  }, [location, navigate]);
  
  return (
    <div 
      className="min-h-screen relative flex items-center justify-center"
      style={{
        backgroundImage: `url('/attached_assets/image_1752186866191.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black bg-opacity-40" />
      
      {/* Logo no topo */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        {logoData?.imageUrl ? (
          <img
            src={logoData.imageUrl}
            alt="Estetfix"
            className="h-16"
          />
        ) : logoData?.dataUrl ? (
          <img
            src={logoData.dataUrl}
            alt="Estetfix"
            className="h-16"
          />
        ) : (
          <div className="flex items-center justify-center">
            <div className="bg-gradient-to-r from-[#F84930] to-[#F8A441] text-white px-6 py-3 rounded-lg">
              <span className="text-2xl font-bold">🤍 Estetfix</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal centralizado */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
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