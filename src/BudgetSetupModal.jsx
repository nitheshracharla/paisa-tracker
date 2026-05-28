import { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { CATEGORIES, DEFAULT_ALLOCATIONS, fmt } from './constants'

export default function BudgetSetupModal({ userId, month, salary: initSalary, allocations: initAlloc, onClose, onSaved }) {
  const [salary, setSalary] = useState(initSalary || '')
  const [alloc, setAlloc] = useState(() => ({ ...DEFAULT_ALLOCATIONS, ...initAlloc }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalPct = Object.values(alloc).reduce((s, v) => s + (Number(v) || 0), 0)
  const remaining = 100 - totalPct

  const set = (id, val) => {
    const n = Math.max(0, Math.min(100, Number(val) || 0))
    setAlloc(prev => ({ ...prev, [id]: n }))
  }

  const handleSave = async () => {
    if (!salary || isNaN(salary) || Number(salary) <= 0) {
      setError('Enter a valid salary.')
      return
    }
    if (totalPct > 100) {
      setError(`Total allocation is ${totalPct}% — reduce to 100% or less.`)
      return
    }
    setError('')
    setLoading(true)
    try {
      await setDoc(doc(db, 'users', userId, 'months', month), {
        salary: parseFloat(salary),
        allocations: alloc,
        updatedAt: new Date(),
      }, { merge: true })
      onSaved({ salary: parseFloat(salary), allocations: alloc })
      onClose()
    } catch (e) {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const sal = Number(salary) || 0

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2>💼 Budget Setup</h2>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: '1.2rem' }}>✕</button>
        </div>

        <div className="modal-body">
          {/* Salary */}
          <div className="field">
            <label>Monthly Salary / Income (₹)</label>
            <input
              type="number"
              min="0"
              value={salary}
              onChange={e => setSalary(e.target.value)}
              placeholder="e.g. 80000"
              autoFocus
            />
          </div>

          {/* Allocation summary */}
          <div style={styles.summary}>
            <div style={styles.summaryItem}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Allocated</span>
              <span className="amount" style={{ color: totalPct > 100 ? 'var(--rose)' : totalPct === 100 ? 'var(--green)' : 'var(--text)', fontWeight: 600 }}>
                {totalPct}%
              </span>
            </div>
            <div style={styles.divider} />
            <div style={styles.summaryItem}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Unallocated</span>
              <span className="amount" style={{ color: remaining < 0 ? 'var(--rose)' : remaining > 0 ? 'var(--amber)' : 'var(--green)', fontWeight: 600 }}>
                {remaining}%
              </span>
            </div>
            {sal > 0 && (
              <>
                <div style={styles.divider} />
                <div style={styles.summaryItem}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Unallocated</span>
                  <span className="amount" style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem' }}>
                    {fmt(sal * remaining / 100)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Progress bar */}
          <div className="progress-track">
            <div className="progress-fill" style={{
              width: `${Math.min(totalPct, 100)}%`,
              background: totalPct > 100 ? 'var(--rose)' : totalPct === 100 ? 'var(--green)' : 'var(--amber)',
            }} />
          </div>

          {/* Category rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CATEGORIES.map(cat => {
              const pctVal = alloc[cat.id] || 0
              const budgetAmt = sal > 0 ? sal * pctVal / 100 : 0
              return (
                <div key={cat.id} style={styles.row}>
                  <div style={styles.rowLabel}>
                    <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{cat.label}</div>
                      {budgetAmt > 0 && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {fmt(budgetAmt)}/mo
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={pctVal}
                      onChange={e => set(cat.id, e.target.value)}
                      style={{ width: 64, textAlign: 'center', padding: '6px 8px', fontSize: '0.875rem' }}
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', width: 16 }}>%</span>
                  </div>
                </div>
              )
            })}
          </div>

          {error && (
            <div style={{
              background: 'var(--rose-dim)', border: '1px solid rgba(244,63,94,0.2)',
              color: 'var(--rose)', borderRadius: 'var(--radius-sm)',
              padding: '10px 14px', fontSize: '0.8rem',
            }}>{error}</div>
          )}
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
  summary: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
  },
  summaryItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  divider: { width: 1, height: 28, background: 'var(--border)', flexShrink: 0 },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
  },
  rowLabel: { display: 'flex', alignItems: 'center', gap: 10 },
}
