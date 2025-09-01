import React from 'react'
export default function OwnerConsole(){
  return (
    <div className="grid">
      <div className="card">
        <h2>Owner Console</h2>
        <ul>
          <li>Homepage motto & copy</li>
          <li>Toggle plans & defaults</li>
          <li>Category labels/colors/icons</li>
          <li>Promo codes (FIRSTFREE)</li>
        </ul>
        <p className="mono">Restricted to owner account (wire RLS + checks next).</p>
      </div>
    </div>
  )
}
