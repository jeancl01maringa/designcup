import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallback
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_KEY;

// Clean quotes from environment variables if present
let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  supabaseUrl = rawUrl ? rawUrl.replace(/^"(.*)"$/, '$1') : '';
  supabaseAnonKey = rawKey ? rawKey.replace(/^"(.*)"$/, '$1') : '';
} catch (error) {
  console.error('Error processing Supabase environment variables:', error);
}

// Fallback configuration if environment variables are not properly set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Using fallback Supabase configuration');
  supabaseUrl = 'https://kmunxjuiuxaqitbovjls.supabase.co';
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttdW54anVpdXhhcWl0Ym92amxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5MDIwNjYsImV4cCI6MjA2MTQ3ODA2Nn0.h-Sk_FnkNVQJOKE8nKkR8LhK3LO2f19S15eGWEuAr0M';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);