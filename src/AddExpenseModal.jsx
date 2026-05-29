import { useState } from 'react'
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { CATEGORIES, getCat, HOUSEHOLD } from './constants'

export default function AddExpenseModal({ month, onClose, onSaved, editExpense }) {
  const editing = !!editExpense
  const [category, setCategory] = useState(editExpense?.category || 'food')
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
    if (!amount || isNaN(amount) || Number(amount) <= 0) { setError('Enter a valid amount.'); return }
    if (!note.trim()) { setError('Add a note — e.g. Breakfast, Petrol fill-up'); return }
    setError(''); setLoading(true)
    try {
      const expDate = new Date(date + 'T12:00:00')
      const payload = { category, amount: parseFloat(amount), note: note.trim(), date: expDate, month, updatedAt: serverTimestamp() }
      if (editing) {
        await updateDoc(doc(db, 'household', HOUSEHOLD, 'expenses', editExpense.id), payload)
      } else {
        await addDoc(collection(db, 'household', HOUSEHOLD, 'expenses'), { ...payload, createdAt: serverTimestamp() })
      }
      onSaved(); onClose()
    } catch (e) { setError('Failed to save. Try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.3rem' }}>{cat.icon}</span>
            <h2>{editing ? 'Edit Expense' : 'Add Expense'}</h2>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: '1.1rem' }}>✕</button>
        </div>

        <div className="modal-body">
          {/* Amount — big and prominent */}
          <div className="field">
            <label>Amount (₹)</label>
            <input
              type="number" inputMode="decimal" min="0" step="1"
              value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0" autoFocus
              style={{ fontSize: '2rem', padding: '14px', textAlign: 'center', letterSpacing: '-0.02em' }}
            />
          </div>

          {/* Category grid */}
          <div className="field">
            <label>Category</label>
            <div style={styles.catGrid}>
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  style={{
                    ...styles.catBtn,
                    background: category === c.id ? `${c.color}20` : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${category === c.id ? c.color : 'rgba(255,255,255,0.07)'}`,
                    color: category === c.id ? c.color : 'var(--text-muted)',
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{c.icon}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, marginTop: 2, lineHeight: 1.2 }}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="field">
            <label>Description</label>
            <input
              type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Breakfast, Monthly rent, Petrol fill-up"
              maxLength={80}
            />
          </div>

          {/* Date */}
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {error && <div className="error-box">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : editing ? 'Update' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  catGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },
  catBtn: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '10px 4px', borderRadius: 10,
    gap: 4, cursor: 'pointer', transition: 'all 0.15s',
    minHeight: 60,
  },
}
