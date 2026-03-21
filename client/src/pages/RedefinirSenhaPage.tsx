import React, { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePlatformLogo } from "@/hooks/use-platform-logo";
import { KeyRound, CheckCircle2, XCircle } from "lucide-react";

export default function RedefinirSenhaPage() {
    const [, navigate] = useLocation();
    const search = useSearch();
    const { toast } = useToast();
    const { logoUrl } = usePlatformLogo();

    const token = new URLSearchParams(search).get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setErrorMessage("Link de recuperação inválido. Solicite um novo na página de login.");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast({
                title: "Senha muito curta",
                description: "A senha deve ter no mínimo 6 caracteres.",
                variant: "destructive",
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: "Senhas diferentes",
                description: "A senha e a confirmação devem ser iguais.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const response = await apiRequest('POST', '/api/reset-password', {
                token,
                newPassword,
            });
            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                toast({
                    title: "Senha redefinida!",
                    description: data.message,
                });
            } else {
                setErrorMessage(data.message || "Erro ao redefinir senha.");
            }
        } catch (error: any) {
            setErrorMessage("Erro ao redefinir senha. Tente solicitar um novo link.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-10 mx-auto" />
                    ) : (
                        <h1 className="text-2xl font-bold text-foreground">DesignCup</h1>
                    )}
                </div>

                <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
                    {isSuccess ? (
                        /* Sucesso */
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <CheckCircle2 className="w-16 h-16 text-green-500" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Senha Redefinida!</h2>
                            <p className="text-muted-foreground">
                                Sua senha foi alterada com sucesso. Agora você pode fazer login com a nova senha.
                            </p>
                            <Button
                                onClick={() => navigate("/loguin")}
                                className="w-full h-12 bg-primary text-white font-semibold rounded-lg"
                            >
                                Ir para o Login
                            </Button>
                        </div>
                    ) : errorMessage && !token ? (
                        /* Link inválido */
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <XCircle className="w-16 h-16 text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Link Inválido</h2>
                            <p className="text-muted-foreground">{errorMessage}</p>
                            <Button
                                onClick={() => navigate("/loguin")}
                                className="w-full h-12 bg-primary text-white font-semibold rounded-lg"
                            >
                                Voltar ao Login
                            </Button>
                        </div>
                    ) : (
                        /* Formulário de redefinição */
                        <>
                            <div className="text-center mb-6">
                                <div className="flex justify-center mb-4">
                                    <KeyRound className="w-12 h-12 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground">Redefinir Senha</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Digite sua nova senha abaixo
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="new-password" className="text-sm font-medium text-muted-foreground">
                                        Nova Senha
                                    </label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        placeholder="Mínimo 6 caracteres"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="h-12 rounded-lg"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="confirm-password" className="text-sm font-medium text-muted-foreground">
                                        Confirmar Nova Senha
                                    </label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        placeholder="Repita a nova senha"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="h-12 rounded-lg"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                {errorMessage && (
                                    <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                                        {errorMessage}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-white font-semibold bg-primary hover:opacity-90 transition-all duration-200 rounded-lg shadow-lg"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Redefinindo..." : "Redefinir Senha"}
                                </Button>
                            </form>

                            <div className="text-center mt-4">
                                <button
                                    type="button"
                                    onClick={() => navigate("/loguin")}
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Voltar ao login
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
