import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid as nanoidOriginal } from "nanoid";

/**
 * Combines multiple class names using clsx and ensures they are properly merged with Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as a price with currency symbol
 */
export function formatPrice(
  price: number,
  options: {
    currency?: "BRL" | "USD" | "EUR";
    notation?: Intl.NumberFormatOptions["notation"];
  } = {}
) {
  const { currency = "BRL", notation = "standard" } = options;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    notation,
  }).format(price);
}

/**
 * Truncates text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Formats a date into a readable string
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Gera um ID único para uso em componentes e outros identificadores de curta duração
 */
export function nanoid(): string {
  return nanoidOriginal(8);
}

/**
 * Converte uma string para slug (URL-friendly)
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD') // Normaliza caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/[^\w-]+/g, '') // Remove caracteres não alfanuméricos
    .replace(/--+/g, '-'); // Remove hífens duplicados
}
