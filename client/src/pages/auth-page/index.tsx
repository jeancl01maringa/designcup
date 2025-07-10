import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const registerSchema = z.object({
  username: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const { user, loginMutation, registerMutation } = useAuth();
  
  // Buscar logo oficial configurado
  const { data: logoData } = useQuery({
    queryKey: ['/api/logo'],
    queryFn: async () => {
      const res = await fetch('/api/logo');
      if (!res.ok) throw new Error('Failed to fetch logo');
      return res.json();
    },
  });
  
  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Detectar se é login ou registro baseado na URL
  useEffect(() => {
    setIsLogin(!location.includes("/register"));
  }, [location]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };
  
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
        {/* Texto de cabeçalho */}
        <div className="text-center mb-6">
          <p className="text-gray-600 text-sm">
            Acesse sua conta ou crie uma nova para continuar
          </p>
        </div>

        {/* Abas Login/Cadastro */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <Link 
            to="/auth/login"
            className={`flex-1 py-2 text-center text-sm font-medium rounded-md transition-all ${
              isLogin 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Login
          </Link>
          <Link 
            to="/auth/register"
            className={`flex-1 py-2 text-center text-sm font-medium rounded-md transition-all ${
              !isLogin 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Cadastre-se
          </Link>
        </div>

        {isLogin ? (
          <div>
            {/* Título da seção LOGIN */}
            <div className="text-left mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Login</h2>
              <p className="text-sm text-gray-600">Entre com suas credenciais para acessar sua conta</p>
            </div>

            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="exemplo@email.com"
                          type="email"
                          {...field}
                          className="h-12 border-gray-300 focus:border-[#F84930] focus:ring-[#F84930]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Senha</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          {...field}
                          className="h-12 border-gray-300 focus:border-[#F84930] focus:ring-[#F84930]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-12 text-white font-semibold bg-gradient-to-r from-[#F84930] to-[#F8A441] hover:from-[#E63E29] hover:to-[#E6943A] transition-all duration-200 rounded-lg mt-6"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </Form>
          </div>
        ) : (
          <div>
            {/* Título da seção CADASTRO */}
            <div className="text-left mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Cadastre-se</h2>
              <p className="text-sm text-gray-600">Crie sua conta para começar a usar nossa plataforma</p>
            </div>

            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Nome completo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Seu nome completo"
                          {...field}
                          className="h-12 border-gray-300 focus:border-[#F84930] focus:ring-[#F84930]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="exemplo@email.com"
                          type="email"
                          {...field}
                          className="h-12 border-gray-300 focus:border-[#F84930] focus:ring-[#F84930]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Senha</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          {...field}
                          className="h-12 border-gray-300 focus:border-[#F84930] focus:ring-[#F84930]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-12 text-white font-semibold bg-gradient-to-r from-[#F84930] to-[#F8A441] hover:from-[#E63E29] hover:to-[#E6943A] transition-all duration-200 rounded-lg mt-6"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </form>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}