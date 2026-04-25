import React, { useState } from 'react'
import { collection, getDocs, doc, updateDoc, query, where, limit } from 'firebase/firestore'
import { db } from '../firebase/config'
import './SubscriptionLookup.css'

const SubscriptionLookup = () => {
  const [phone, setPhone] = useState('')
  const [subscription, setSubscription] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)
  const [useLoading, setUseLoading] = useState(false)

  const handleLookup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    setSubscription(null)

    try {
      const normalizedPhone = phone.trim()
      const subscribersRef = collection(db, 'subscribers')
      const lookupQuery = query(subscribersRef, where('phone', '==', normalizedPhone), limit(1))
      const querySnapshot = await getDocs(lookupQuery)

      const found = querySnapshot.docs.length
        ? { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() }
        : null

      if (found) {
        setSubscription(found)
      } else {
        setError('No subscription found for this phone number.')
      }
    } catch (err) {
      setError('Error looking up subscription. Please try again.')
    }

    setLoading(false)
  }

  const handleUseDrink = async () => {
    if (!subscription) return
    setUseLoading(true)
    setError(null)
    setSuccess(null)

    const today = new Date().toISOString().slice(0, 10)
    const lastUsedDate = subscription.lastUsedDate
    const drinksToday = lastUsedDate !== today ? 0 : (subscription.drinksToday || 0)

    if (subscription.drinksRemaining <= 0) {
      setError('No drinks remaining on this subscription.')
      setUseLoading(false)
      return
    }

    if (drinksToday >= 3) {
      setError('Daily limit reached — max 3 drinks per day.')
      setUseLoading(false)
      return
    }

    try {
      const subRef = doc(db, 'subscribers', subscription.id)
      const newDrinksRemaining = subscription.drinksRemaining - 1
      const newDrinksToday = drinksToday + 1

      await updateDoc(subRef, {
        drinksRemaining: newDrinksRemaining,
        drinksToday: newDrinksToday,
        lastUsedDate: today,
      })

      setSubscription({
        ...subscription,
        drinksRemaining: newDrinksRemaining,
        drinksToday: newDrinksToday,
        lastUsedDate: today,
      })
      setSuccess('✓ Drink redeemed successfully!')
    } catch (err) {
      setError('Failed to redeem drink. Please try again.')
    }

    setUseLoading(false)
  }

  const handleReset = () => {
    setPhone('')
    setSubscription(null)
    setError(null)
    setSuccess(null)
  }

  const today = new Date().toISOString().slice(0, 10)
  const drinksUsedToday = subscription
    ? (subscription.lastUsedDate === today ? (subscription.drinksToday || 0) : 0)
    : 0
  const dailyLimitReached = drinksUsedToday >= 3
  const noRemaining = subscription?.drinksRemaining <= 0
  const canUseDrink = !dailyLimitReached && !noRemaining

  return (
    <div className="lookup-container">
      <div className="lookup-card">
        <h2 className="lookup-title">Check Subscription</h2>
        <p className="lookup-subtitle">Enter the customer's phone number</p>

        <form onSubmit={handleLookup} className="lookup-form">
          <input
            type="tel"
            className="phone-input"
            placeholder="e.g. 5125551234"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            disabled={loading}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !phone.trim()}>
            {loading ? 'Searching…' : 'Look Up'}
          </button>
        </form>

        {error && (
          <div className="message message-error">{error}</div>
        )}

        {success && (
          <div className="message message-success">{success}</div>
        )}

        {subscription && (
          <div className="subscriber-card">
            <div className="subscriber-info">
              <div className="info-row">
                <span className="info-label">Name</span>
                <span className="info-value">{subscription.name || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Phone</span>
                <span className="info-value">{subscription.phone}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Plan</span>
                <span className="info-value">
                  {subscription.type === 'open' ? 'BRB Member (Open)' : 'Specific Drink'}
                </span>
              </div>
              {subscription.type === 'specific' && subscription.drink && (
                <div className="info-row">
                  <span className="info-label">Drink</span>
                  <span className="info-value">{subscription.drink}</span>
                </div>
              )}
            </div>

            <div className="drinks-display">
              <div className={`drinks-count ${noRemaining ? 'drinks-empty' : ''}`}>
                <span className="drinks-number">{subscription.drinksRemaining}</span>
                <span className="drinks-label">drinks remaining</span>
              </div>
              <div className="drinks-daily">
                <span className="daily-number">{drinksUsedToday}</span>
                <span className="daily-label">/ 3 used today</span>
              </div>
            </div>

            {noRemaining && (
              <div className="status-badge status-empty">Subscription depleted</div>
            )}
            {dailyLimitReached && !noRemaining && (
              <div className="status-badge status-limit">Daily limit reached</div>
            )}

            <div className="action-row">
              <button
                className={`btn btn-redeem ${!canUseDrink ? 'btn-disabled' : ''}`}
                onClick={handleUseDrink}
                disabled={useLoading || !canUseDrink}
              >
                {useLoading ? 'Processing…' : 'Redeem Drink'}
              </button>
              <button className="btn btn-secondary" onClick={handleReset}>
                New Search
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SubscriptionLookup
