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
      <div className="flex bg-muted rounded-xl p-1">
        <button
          type="button"
          className="flex-1 py-3 text-center text-sm font-semibold rounded-lg bg-card border-border text-foreground shadow-sm border border-border"
        >Entrar</button>
        <Link
          to="/loguin/cadastro"
          className="flex-1 py-3 text-center text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          Cadastre-se
        </Link>
      </div>
      {/* Título da seção */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Entre com sua conta</h2>
        <p className="text-sm text-muted-foreground">Entre com suas credenciais para acessar sua conta</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                    className="h-12 border-border focus:border-primary focus:ring-primary rounded-lg"
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
                <FormLabel className="text-muted-foreground font-medium">Senha</FormLabel>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    {...field}
                    className="h-12 border-border focus:border-primary focus:ring-primary rounded-lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-12 text-white font-semibold bg-primary hover:opacity-90 transition-all duration-200 rounded-lg shadow-lg"
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
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Esqueceu sua senha?
        </a>
      </div>
    </div>
  );
}