// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js';



const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;



export const supabase = createClient(supabaseUrl, supabaseAnonKey, {

  auth: {

    persistSession: true,        // keep user logged in

    autoRefreshToken: true,      // refresh automatically

    detectSessionInUrl: true,    // parse magic-link tokens on redirect

  },

});
