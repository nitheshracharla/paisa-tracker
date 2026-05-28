import { useState } from 'react'
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { CATEGORIES, getCat } from './constants'

export default function AddExpenseModal({ userId, month, onClose, onSaved, editExpense }) {
  const editing = !!editExpense
  const [category, setCategory] = useState(editExpense?.category || CATEGORIES[2].id)
  const [amount, setAmount] = useState(editExpense?.amount || '')
  const [note, setNote] = useState(editExpense?.note || '')
  const [date, setDate] = useState(
    editExpense?.date
      ? new Date(editExpense.date.seconds * 1000).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cat = getCat(category)

  const handleSave = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('Enter a valid amount.')
      return
    }
    if (!note.trim()) {
      setError('Add a note (e.g. Breakfast, Electricity bill).')
      return
    }
    setError('')
    setLoading(true)
    try {
      const expDate = new Date(date + 'T12:00:00')
      const payload = {
        category,
        amount: parseFloat(amount),
        note: note.trim(),
        date: expDate,
        month,
        updatedAt: serverTimestamp(),
      }
      if (editing) {
        await updateDoc(doc(db, 'users', userId, 'expenses', editExpense.id), payload)
      } else {
        await addDoc(collection(db, 'users', userId, 'expenses'), {
          ...payload,
          createdAt: serverTimestamp(),
        })
      }
      onSaved()
      onClose()
    } catch (e) {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{editing ? 'Edit Expense' : 'Add Expense'}</h2>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: '1.2rem' }}>✕</button>
        </div>

        <div className="modal-body">
          {/* Category */}
          <div className="field">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${cat.color}30`,
          }}>
            <span style={{ fontSize: '1.4rem' }}>{cat.icon}</span>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Selected</div>
              <div style={{ fontWeight: 600, color: cat.color, fontSize: '0.9rem' }}>{cat.label}</div>
            </div>
          </div>

          {/* Amount */}
          <div className="field">
            <label>Amount (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>

          {/* Note */}
          <div className="field">
            <label>Note / Description</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Breakfast, Monthly rent, Petrol fill-up"
              maxLength={80}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 2 }}>
              Be specific — this shows in your breakdown view
            </span>
          </div>

          {/* Date */}
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          {error && (
            <div style={{
              background: 'var(--rose-dim)',
              border: '1px solid rgba(244,63,94,0.2)',
              color: 'var(--rose)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.8rem',
            }}>{error}</div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : editing ? 'Update' : 'Add Expense'}
          </button>
        </div>
      </div>
    </div>
  )
}
