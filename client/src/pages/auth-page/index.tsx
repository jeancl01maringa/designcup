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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8">
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