import React, { useEffect } from "react";
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

const registerSchema = z.object({
  username: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { user, registerMutation } = useAuth();
  
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

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };

  return (
    <div className="w-full max-w-sm space-y-8 bg-white rounded-lg shadow-lg p-8">
      {/* Logo oficial */}
      <div className="text-center">
        {logoData?.imageUrl ? (
          <img
            src={logoData.imageUrl}
            alt="Design para Estética"
            className="h-16 mx-auto mb-6"
          />
        ) : logoData?.dataUrl ? (
          <img
            src={logoData.dataUrl}
            alt="Design para Estética"
            className="h-16 mx-auto mb-6"
          />
        ) : (
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#F84930] to-[#F8A441] bg-clip-text text-transparent mb-6">
            Design para Estética
          </h1>
        )}
        <p className="text-gray-600 text-sm mb-6">
          Acesse sua conta ou crie uma nova para continuar
        </p>
      </div>

      {/* Abas Login/Cadastro */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <Link 
          to="/auth/login"
          className="flex-1 py-2 text-center text-sm font-medium rounded-md text-gray-500 hover:text-gray-900"
        >
          Login
        </Link>
        <button
          type="button"
          className="flex-1 py-2 text-center text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm"
        >
          Cadastre-se
        </button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <FormField
              control={form.control}
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
          </div>
          
          <div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="seu@email.com"
                      type="email"
                      {...field}
                      className="h-12 border-gray-300 focus:border-[#F84930] focus:ring-[#F84930]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormField
              control={form.control}
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
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-white font-medium bg-gradient-to-r from-[#F84930] to-[#F8A441] hover:from-[#E63E29] hover:to-[#E6943A] transition-all duration-200"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cadastrando...
              </div>
            ) : (
              "Cadastrar"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}