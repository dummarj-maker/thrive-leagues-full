import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home.jsx';
import Onboarding from './Onboarding.jsx'; // our login/create-league page
import React, { useEffect, useState } from 'react'
import { Link, Routes, Route, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

import Home from './Home.jsx'
import Onboarding from './Onboarding.jsx'
import JoinLeague from './JoinLeague.jsx'
import CreateLeague from './CreateLeague.jsx'
import Challenges from './Challenges.jsx'
import Schedule from './Schedule.jsx'
import Scoreboard from './Scoreboard.jsx'
import Standings from './Standings.jsx'
import Admin from './Admin.jsx'
import OwnerConsole from './OwnerConsole.jsx'

export default function App(){
  const [session, setSession] = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null))
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const signInEmail = async (email)=>{
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
    return error
  }
  const signOut = async ()=>{ await supabase.auth.signOut(); navigate('/') }

  return (
    <>
      <header className="header">
        <div className="brand">
          <span className="logo" aria-hidden="true"></span>
          Thrive Leagues
        </div>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/challenges">Challenges</Link>
          <Link to="/schedule">Schedule</Link>
          <Link to="/scoreboard">Scoreboard</Link>
          <Link to="/standings">Standings</Link>
          <Link to="/admin">Admin</Link>
          <Link to="/owner">Owner</Link>
          {session ? <button className="btn ghost" onClick={signOut}>Sign out</button> : <Link to="/onboarding">Login</Link>}
        </nav>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home session={session} />} />
          <Route path="/onboarding" element={<Onboarding signInEmail={signInEmail} />} />
          <Route path="/join" element={<JoinLeague />} />
          <Route path="/create" element={<CreateLeague />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/scoreboard" element={<Scoreboard />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/owner" element={<OwnerConsole />} />
        </Routes>
      </main>
    </>
  )
}
