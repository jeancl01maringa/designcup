import React, { useEffect, useState } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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

  const handleForgotPassword = async () => {
    if (!forgotEmail || !forgotEmail.includes("@")) {
      toast({
        title: "E-mail inválido",
        description: "Por favor, insira um e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingReset(true);
    try {
      const response = await apiRequest('POST', '/api/forgot-password', { email: forgotEmail });
      const data = await response.json();
      setResetSent(true);
      toast({
        title: "E-mail enviado!",
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao enviar e-mail de recuperação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSendingReset(false);
    }
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
        <button
          type="button"
          onClick={() => {
            setIsForgotPasswordOpen(true);
            setResetSent(false);
            setForgotEmail("");
          }}
          className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          Esqueceu sua senha?
        </button>
      </div>

      {/* Modal de recuperação de senha */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperar Senha</DialogTitle>
            <DialogDescription>
              {resetSent
                ? "Verifique sua caixa de entrada (e spam) para encontrar o link de recuperação."
                : "Digite seu e-mail cadastrado e enviaremos um link para redefinir sua senha."
              }
            </DialogDescription>
          </DialogHeader>

          {!resetSent ? (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="forgot-email" className="text-sm font-medium">E-mail</label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
                    className="h-12"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsForgotPasswordOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleForgotPassword}
                  disabled={isSendingReset}
                  className="bg-primary"
                >
                  {isSendingReset ? "Enviando..." : "Enviar Link"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <DialogFooter>
              <Button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="bg-primary w-full"
              >
                Entendi
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}