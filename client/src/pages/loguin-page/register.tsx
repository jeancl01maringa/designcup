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

const registerSchema = z.object({
  username: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
  whatsapp: z.string().min(1, "WhatsApp é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// Máscaras por país
const COUNTRY_MASKS = {
  '+55': '(99) 99999-9999', // Brasil
  '+1': '(999) 999-9999',   // EUA
  '+54': '(99) 9999-9999',  // Argentina
  '+56': '9 9999 9999',     // Chile
  '+57': '(999) 999-9999',  // Colômbia
  '+593': '99 999 9999',    // Equador
  '+51': '999 999 999',     // Peru
  '+598': '99 999 999',     // Uruguai
  '+58': '(999) 999-9999',  // Venezuela
  '+595': '(999) 999-999',  // Paraguai
  '+591': '9999-9999'       // Bolívia
};

// Função para aplicar máscara
function applyMask(value: string, mask: string): string {
  const cleanValue = value.replace(/\D/g, '');
  let maskedValue = '';
  let maskIndex = 0;

  for (let i = 0; i < cleanValue.length && maskIndex < mask.length; i++) {
    while (maskIndex < mask.length && mask[maskIndex] !== '9') {
      maskedValue += mask[maskIndex];
      maskIndex++;
    }

    if (maskIndex < mask.length) {
      maskedValue += cleanValue[i];
      maskIndex++;
    }
  }

  return maskedValue;
}

// Função para validar WhatsApp por país
function validateWhatsAppByCountry(phoneNumber: string, countryCode: string): boolean {
  const cleanNumber = phoneNumber.replace(/\D/g, '');

  switch (countryCode) {
    case '+55': // Brasil
      return cleanNumber.length >= 10 && cleanNumber.length <= 11;
    case '+1': // EUA
      return cleanNumber.length === 10;
    case '+54': // Argentina
      return cleanNumber.length >= 8 && cleanNumber.length <= 10;
    case '+56': // Chile
      return cleanNumber.length === 8 || cleanNumber.length === 9;
    case '+57': // Colômbia
      return cleanNumber.length === 10;
    case '+593': // Equador
      return cleanNumber.length === 8 || cleanNumber.length === 9;
    case '+51': // Peru
      return cleanNumber.length === 9;
    case '+598': // Uruguai
      return cleanNumber.length === 8;
    case '+58': // Venezuela
      return cleanNumber.length === 10;
    case '+595': // Paraguai
      return cleanNumber.length === 9;
    case '+591': // Bolívia
      return cleanNumber.length === 8;
    default:
      return cleanNumber.length >= 8 && cleanNumber.length <= 15;
  }
}

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { user, registerMutation } = useAuth();
  const [selectedCountryCode, setSelectedCountryCode] = useState('+55');

  // Redirecionar para home após cadastro bem-sucedido
  useEffect(() => {
    if (registerMutation.isSuccess && user) {
      navigate("/");
    }
  }, [registerMutation.isSuccess, user, navigate]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      whatsapp: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    // Combinar código do país com o número do WhatsApp
    const cleanWhatsApp = values.whatsapp ? values.whatsapp.replace(/\D/g, '') : '';
    const fullWhatsApp = cleanWhatsApp ? `${selectedCountryCode}${cleanWhatsApp}` : '';

    registerMutation.mutate({
      ...values,
      whatsapp: fullWhatsApp
    });
  };

  return (
    <div className="space-y-6">
      {/* Abas Login/Cadastro */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <Link
          to="/loguin"
          className="flex-1 py-3 text-center text-sm font-medium rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
        >
          Login
        </Link>
        <button
          type="button"
          className="flex-1 py-3 text-center text-sm font-semibold rounded-lg bg-white text-gray-900 shadow-sm border border-gray-200"
        >
          Cadastre-se
        </button>
      </div>

      {/* Título da seção */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Criar conta</h2>
        <p className="text-sm text-gray-600">Cadastre-se para começar a usar nossa plataforma</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    className="h-12 border-gray-300 focus:border-[#171a2b] focus:ring-[#171a2b] rounded-lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
            name="whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-medium">WhatsApp</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <select
                      className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-sm text-gray-700 w-28 flex-shrink-0 outline-none transition-colors focus:border-[#171a2b] focus:ring-2 focus:ring-[#171a2b]/20"
                      value={selectedCountryCode}
                      onChange={(e) => {
                        setSelectedCountryCode(e.target.value);
                        // Reaplica a máscara quando o país muda
                        if (field.value) {
                          const newMask = COUNTRY_MASKS[e.target.value as keyof typeof COUNTRY_MASKS] || COUNTRY_MASKS['+55'];
                          field.onChange(applyMask(field.value, newMask));
                        }
                      }}
                      id="country-code"
                    >
                      <option value="+55">BR +55</option>
                      <option value="+1">US +1</option>
                      <option value="+54">AR +54</option>
                      <option value="+56">CL +56</option>
                      <option value="+57">CO +57</option>
                      <option value="+593">EC +593</option>
                      <option value="+51">PE +51</option>
                      <option value="+598">UY +598</option>
                      <option value="+58">VE +58</option>
                      <option value="+595">PY +595</option>
                      <option value="+591">BO +591</option>
                    </select>
                    <Input
                      placeholder={COUNTRY_MASKS[selectedCountryCode as keyof typeof COUNTRY_MASKS] || '(99) 99999-9999'}
                      type="tel"
                      {...field}
                      maxLength={20}
                      id="whatsapp-input"
                      onChange={(e) => {
                        const mask = COUNTRY_MASKS[selectedCountryCode as keyof typeof COUNTRY_MASKS] || COUNTRY_MASKS['+55'];
                        const maskedValue = applyMask(e.target.value, mask);
                        field.onChange(maskedValue);
                      }}
                      onBlur={() => {
                        // Validação quando o campo perde o foco
                        const isValid = validateWhatsAppByCountry(field.value, selectedCountryCode);
                        if (field.value && !isValid) {
                          form.setError('whatsapp', {
                            type: 'manual',
                            message: `Número de WhatsApp inválido para ${selectedCountryCode === '+55' ? 'Brasil' : 'o país selecionado'}`
                          });
                        } else {
                          form.clearErrors('whatsapp');
                        }
                      }}
                      className="h-12 border-gray-300 focus:border-[#171a2b] focus:ring-[#171a2b] flex-1 rounded-lg"
                    />
                  </div>
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

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-medium">Confirmar senha</FormLabel>
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
            className="w-full h-12 text-white font-semibold bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 transition-all duration-200 rounded-lg shadow-lg"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Criando conta..." : "Cadastrar"}
          </Button>

          {registerMutation.error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
              {registerMutation.error.message}
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}