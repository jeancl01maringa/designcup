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

const registerSchema = z.object({
  username: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  whatsapp: z.string().min(10, "WhatsApp deve ter pelo menos 10 dígitos").optional().or(z.literal("")),
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
      whatsapp: "",
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
      {/* Texto de cabeçalho */}
      <div className="text-center">
        <p className="text-gray-600 text-sm">
          Acesse sua conta ou crie uma nova para continuar
        </p>
      </div>

      {/* Abas Login/Cadastro */}
      <div className="flex bg-gray-100 rounded-lg p-1">
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

      {/* Título da seção */}
      <div className="text-left">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Cadastre-se</h2>
        <p className="text-sm text-gray-600">Crie sua conta para começar a usar nossa plataforma</p>
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
                      className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
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
                      placeholder="exemplo@email.com"
                      type="email"
                      {...field}
                      className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
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
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">WhatsApp</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <select
                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-sm text-gray-700 w-28 flex-shrink-0 outline-none transition-colors focus:border-[#F84930] focus:ring-2 focus:ring-[#F84930]/20"
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
                          const isValid = validateWhatsAppByCountry(field.value || '', selectedCountryCode);
                          if (field.value && !isValid) {
                            form.setError('whatsapp', {
                              type: 'manual',
                              message: `Número de WhatsApp inválido para ${selectedCountryCode === '+55' ? 'Brasil' : 'o país selecionado'}`
                            });
                          } else {
                            form.clearErrors('whatsapp');
                          }
                        }}
                        className="h-12 border-gray-300 focus:border-[#F84930] focus:ring-[#F84930] flex-1"
                      />
                    </div>
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
                      className="h-12 border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-white font-semibold bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 transition-all duration-200 rounded-lg"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <div className="flex items-center justify-center">
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