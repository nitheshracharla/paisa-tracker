import { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { CATEGORIES, DEFAULT_ALLOCATIONS, fmt, HOUSEHOLD } from './constants'
 
export default function BudgetSetupModal({ month, salary: initSalary, allocations: initAlloc, onClose, onSaved }) {
  const [salary, setSalary] = useState(initSalary || '')
  const [alloc, setAlloc] = useState(() => ({ ...DEFAULT_ALLOCATIONS, ...initAlloc }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
 
  const totalPct = Object.values(alloc).reduce((s, v) => s + (Number(v) || 0), 0)
  const remaining = 100 - totalPct
  const sal = Number(salary) || 0
 
  const set = (id, val) => {
    const n = Math.max(0, Math.min(100, Number(val) || 0))
    setAlloc(prev => ({ ...prev, [id]: n }))
  }
 
  const handleSave = async () => {
    if (!salary || Number(salary) <= 0) { setError('Enter a valid salary.'); return }
    if (totalPct > 100) { setError(`Total is ${totalPct}% — must be 100% or less.`); return }
    setError(''); setLoading(true)
    try {
      await setDoc(doc(db, 'household', HOUSEHOLD, 'months', month), {
        salary: parseFloat(salary), allocations: alloc, updatedAt: new Date()
      }, { merge: true })
      onSaved({ salary: parseFloat(salary), allocations: alloc }); onClose()
    } catch { setError('Failed to save.') }
    finally { setLoading(false) }
  }
 
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2>⚙️ Budget Setup</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
 
        <div className="modal-body">
          <div className="field">
            <label>Monthly Salary / Income (₹)</label>
            <input
              type="number" inputMode="numeric" min="0" value={salary}
              onChange={e => setSalary(e.target.value)} placeholder="e.g. 80000" autoFocus
              style={{ fontSize: '1.4rem', textAlign: 'center' }}
            />
          </div>
 
          {/* Summary bar */}
          <div style={styles.summaryBar}>
            <div>
              <div style={styles.summLabel}>Allocated</div>
              <div className="amount" style={{ fontWeight: 700, color: totalPct > 100 ? 'var(--rose)' : totalPct === 100 ? 'var(--green)' : 'var(--amber)' }}>
                {totalPct}%
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="progress-track" style={{ height: 8 }}>
                <div className="progress-fill" style={{
                  width: `${Math.min(totalPct, 100)}%`,
                  background: totalPct > 100 ? 'var(--rose)' : totalPct === 100 ? 'var(--green)' : 'var(--amber)',
                }} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={styles.summLabel}>Free</div>
              <div className="amount" style={{ fontWeight: 700, color: remaining < 0 ? 'var(--rose)' : 'var(--text-muted)' }}>
                {remaining}%
              </div>
            </div>
          </div>
 
          {/* Category rows */}
          {CATEGORIES.map(cat => {
            const pctVal = alloc[cat.id] || 0
            const budgetAmt = sal > 0 ? sal * pctVal / 100 : 0
            return (
              <div key={cat.id} style={styles.row}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{cat.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{cat.label}</div>
                  {budgetAmt > 0 && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {fmt(budgetAmt)}/mo
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button className="btn-icon" style={{ fontSize: '1rem', width: 32, height: 32 }}
                    onClick={() => set(cat.id, pctVal - 1)}>−</button>
                  <input
                    type="number" min="0" max="100" value={pctVal}
                    onChange={e => set(cat.id, e.target.value)}
                    style={{ width: 52, textAlign: 'center', padding: '6px 4px', fontSize: '0.9rem' }}
                  />
                  <button className="btn-icon" style={{ fontSize: '1rem', width: 32, height: 32 }}
                    onClick={() => set(cat.id, pctVal + 1)}>+</button>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', width: 16 }}>%</span>
                </div>
              </div>
            )
          })}
 
          {error && <div className="error-box">{error}</div>}
        </div>
 
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Budget'}
          </button>
        </div>
      </div>
    </div>
  )
}
 
const styles = {
  summaryBar: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
  },
  summLabel: { fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 },
  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
  },
}
 
