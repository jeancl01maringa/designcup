import { createClient } from '@supabase/supabase-js';

// Remove quotes from environment variables if present
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/"/g, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_KEY || '').replace(/"/g, '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase env vars:', { 
    url: import.meta.env.VITE_SUPABASE_URL, 
    key: import.meta.env.VITE_SUPABASE_KEY ? 'present' : 'missing' 
  });
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);