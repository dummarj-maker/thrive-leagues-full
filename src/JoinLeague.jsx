import React, { useState } from 'react'
export default function JoinLeague(){
  const [code,setCode] = useState('')
  const join = (e)=>{ e.preventDefault(); alert('Join with code: '+code+' (wired next)') }
  return (
    <div className="card">
      <h2>Join a League</h2>
      <form onSubmit={join} className="grid">
        <input className="input" placeholder="Enter invite code" value={code} onChange={e=>setCode(e.target.value)} />
        <button className="btn">Join</button>
      </form>
    </div>
  )
}
