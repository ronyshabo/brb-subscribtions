import React from 'react'
import SubscriptionLookup from './pages/SubscriptionLookup'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <img src="/brb-logo.png" alt="BRB Coffee" className="logo" onError={e => e.target.style.display='none'} />
        <h1>BRB Subscriptions</h1>
      </header>
      <main className="app-main">
        <SubscriptionLookup />
      </main>
    </div>
  )
}

export default App
