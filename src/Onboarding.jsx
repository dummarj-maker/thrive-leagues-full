import React, { useState } from 'react'
import { Link } from 'react-router-dom'
export default function Onboarding({ signInEmail }){
  const [email,setEmail] = useState('')
  const [msg,setMsg] = useState('')
  const [loading,setLoading] = useState(false)

  const submit = async (e)=>{
    e.preventDefault()
    setLoading(true); setMsg('')
    const err = await signInEmail(email)
    setLoading(false)
    setMsg(err ? err.message : 'Magic link sent! Check your email.')
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Get Started</h2>
        <p>Log in to join or create a league.</p>
        <form onSubmit={submit} className="grid">
          <input className="input" placeholder="you@domain.com" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <button className="btn" disabled={loading}>{loading?'Sending…':'Send magic link'}</button>
        </form>
        {msg && <p className="mono" style={{marginTop:8}}>{msg}</p>}
      </div>
      <div className="card">
        <h3>After login</h3>
        <p><Link to="/join" className="btn ghost">Join a League</Link></p>
        <p><Link to="/create" className="btn">Create a League</Link></p>
      </div>
    </div>
  )
}
