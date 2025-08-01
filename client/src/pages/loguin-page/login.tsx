import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
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
  
  // Redirecionar para home após login bem-sucedido
  useEffect(() => {
    if (loginMutation.isSuccess && user) {
      navigate("/");
    }
  }, [loginMutation.isSuccess, user, navigate]);

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
      {/* Abas Login/Cadastro */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          type="button"
          className="flex-1 py-3 text-center text-sm font-semibold rounded-lg bg-white text-gray-900 shadow-sm border border-gray-200"
        >
          Login
        </button>
        <Link 
          to="/loguin/register"
          className="flex-1 py-3 text-center text-sm font-medium rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
        >
          Cadastre-se
        </Link>
      </div>

      {/* Título da seção */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Login</h2>
        <p className="text-sm text-gray-600">Entre com suas credenciais para acessar sua conta</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="exemplo@email.com"
                    type="email"
                    {...field}
                    className="h-12 border-gray-300 focus:border-[#171a2b] focus:ring-[#171a2b] rounded-lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    className="h-12 border-gray-300 focus:border-[#171a2b] focus:ring-[#171a2b] rounded-lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full h-12 text-white font-semibold bg-gradient-to-r from-[#F84930] to-[#F8A441] hover:from-[#E63E29] hover:to-[#E6943A] transition-all duration-200 rounded-lg shadow-lg"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Entrando..." : "Entrar"}
          </Button>

          {loginMutation.error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
              {loginMutation.error.message}
            </div>
          )}
        </form>
      </Form>

      {/* Link para esqueci a senha */}
      <div className="text-center">
        <a 
          href="#" 
          className="text-sm text-gray-500 hover:text-[#F84930] transition-colors"
        >
          Esqueceu sua senha?
        </a>
      </div>
    </div>
  );
}