import React, { useState } from 'react'
export default function CreateLeague(){
  const [plan,setPlan] = useState('basic')
  const [promo,setPromo] = useState('')
  const create = (e)=>{ e.preventDefault(); alert('Create '+plan+' league. Promo: '+promo+' (checkout wired next)') }
  return (
    <div className="card">
      <h2>Create a League</h2>
      <div className="grid">
        <label>Plan
          <select className="input" value={plan} onChange={e=>setPlan(e.target.value)}>
            <option value="basic">Basic — $4.99 (≈1 month, up to 8)</option>
            <option value="premium">Premium — $9.99 (up to 12 weeks, up to 20)</option>
            <option value="annual">Annual — $99.99 (host up to 3 premium leagues)</option>
          </select>
        </label>
        <label>Promo code (optional)
          <input className="input" placeholder="FIRSTFREE" value={promo} onChange={e=>setPromo(e.target.value)} />
        </label>
      </div>
      <div style={{height:10}} />
      <button className="btn" onClick={create}>Continue</button>
      <p className="mono" style={{marginTop:8}}>Checkout & activation happen next.</p>
    </div>
  )
}
