import React, { useEffect } from "react";
import { Route, Switch, useLocation, Redirect } from "wouter";
import LoginPage from "./login";
import RegisterPage from "./register";

export default function AuthPage() {
  const [location, navigate] = useLocation();
  
  // Redireciona para login se estiver apenas em /auth
  useEffect(() => {
    if (location === "/auth") {
      navigate("/auth/login");
    }
  }, [location, navigate]);
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Coluna de formulário - Login ou Registro */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4">
        <Switch>
          <Route path="/auth/login" component={LoginPage} />
          <Route path="/auth/register" component={RegisterPage} />
          <Route path="/auth">
            <Redirect to="/auth/login" />
          </Route>
        </Switch>
      </div>
      
      {/* Coluna de Hero - Conteúdo de destaque */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-b from-blue-500 to-blue-700 flex-col items-center justify-center text-white p-8">
        <div className="max-w-lg text-center">
          <h1 className="text-3xl font-bold mb-4">Design para Estética</h1>
          <p className="text-lg mb-6">
            Acesse templates profissionais exclusivos para sua clínica de estética. 
            Personalize e compartilhe nas redes sociais com apenas alguns cliques.
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg mb-8">
            <p className="text-xl font-semibold mb-2">+ 3.000 membros</p>
            <div className="flex justify-center">
              {[1, 2, 3, 4, 5].map(star => (
                <svg key={star} className="w-5 h-5 text-yellow-300 fill-current" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
              <p className="font-medium">Templates editáveis</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
              <p className="font-medium">Acesso ilimitado</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
              <p className="font-medium">Todos os formatos</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
              <p className="font-medium">Artes exclusivas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}