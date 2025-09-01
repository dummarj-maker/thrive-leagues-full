import React from 'react'
export default function Home({ session }){
  return (
    <div className="hero">
      <h1>Better Together</h1>
      <p>Draft your habits. Compete with your people. Thrive in real life.</p>
      <div className="grid">
        <div className="card">
          <h3>League Chat</h3>
          <p className="mono">Realtime chat lives here (wired in next passes).</p>
        </div>
        <div className="card">
          <h3>Announcements</h3>
          <p className="mono">Commissioner posts appear here.</p>
        </div>
      </div>
    </div>
  )
}