// src/AuthCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function AuthCallback() {
  const [msg, setMsg] = useState('Finishing sign-in…');
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) {
        setMsg(`Sign-in failed: ${error.message}`);
        return;
      }
      // success → go to home (router will show you as logged in)
      if (mounted) navigate('/home', { replace: true });
    })();

    return () => { mounted = false; };
  }, [navigate]);

  return <div className="card"><p>{msg}</p></div>;
}
