// src/AuthCallback.jsx

import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { supabase } from './supabaseClient';



export default function AuthCallback() {

  const navigate = useNavigate();



  useEffect(() => {

    // detectSessionInUrl will parse tokens on load.

    // We just wait for Supabase to resolve the session, then move on.

    supabase.auth.getSession().then(({ data: { session } }) => {

      // go somewhere useful after login

      navigate(session ? '/create' : '/onboarding', { replace: true });

    });

  }, [navigate]);



  return (

    <div className="card">

      <h2>Signing you in…</h2>

      <p>Please wait a moment.</p>

    </div>

  );

}
