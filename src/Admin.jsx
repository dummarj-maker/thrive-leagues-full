import React from 'react'
export default function Admin(){
  return (
    <div className="grid">
      <div className="card">
        <h2>Commissioner Admin</h2>
        <ul>
          <li>Edit league details</li>
          <li>Invite/remove members</li>
          <li>Enable/disable paid switches</li>
          <li>Force finalize week</li>
        </ul>
      </div>
      <div className="card">
        <h3>Invite Code</h3>
        <p className="mono">Invite code & share link will show here.</p>
      </div>
    </div>
  )
}
