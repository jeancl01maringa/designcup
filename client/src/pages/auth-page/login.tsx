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

const loginSchema = z.object({
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation } = useAuth();

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

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      {/* Texto de cabeçalho */}
      <div className="text-center">
        <p className="text-muted-foreground text-sm">
          Acesse sua conta ou crie uma nova para continuar
        </p>
      </div>

      {/* Abas Login/Cadastro */}
      <div className="flex bg-muted rounded-lg p-1">
        <button
          type="button"
          className="flex-1 py-2 text-center text-sm font-medium rounded-md bg-card border-border text-foreground shadow-sm"
        >
          Login
        </button>
        <Link
          to="/auth/register"
          className="flex-1 py-2 text-center text-sm font-medium rounded-md text-muted-foreground hover:text-foreground"
        >
          Cadastre-se
        </Link>
      </div>

      {/* Título da seção */}
      <div className="text-left">
        <h2 className="text-xl font-semibold text-foreground mb-2">Login</h2>
        <p className="text-sm text-muted-foreground">Entre com suas credenciais para acessar sua conta</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="exemplo@email.com"
                      type="email"
                      {...field}
                      className="h-12 border-border focus:border-primary focus:ring-primary"
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
                  <FormLabel className="text-muted-foreground font-medium">Senha</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="••••••••"
                      type="password"
                      {...field}
                      className="h-12 border-border focus:border-primary focus:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-white font-semibold bg-primary hover:opacity-90 transition-all duration-200 rounded-lg"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </div>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}