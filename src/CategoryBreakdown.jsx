import { useState } from 'react'
import { deleteDoc, doc } from 'firebase/firestore'
import { db } from './firebase'
import { getCat, fmt, statusColor, pct } from './constants'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function CategoryBreakdown({ userId, categoryId, expenses, budget, onClose, onEdit, onRefresh }) {
  const cat = getCat(categoryId)
  const [deleting, setDeleting] = useState(null)

  const catExpenses = expenses
    .filter(e => e.category === categoryId)
    .sort((a, b) => {
      const da = a.date?.seconds ? a.date.seconds : new Date(a.date).getTime() / 1000
      const db_ = b.date?.seconds ? b.date.seconds : new Date(b.date).getTime() / 1000
      return db_ - da
    })

  const total = catExpenses.reduce((s, e) => s + e.amount, 0)

  // Group by note for breakdown chart
  const grouped = catExpenses.reduce((acc, e) => {
    const k = e.note.toLowerCase()
    if (!acc[k]) acc[k] = { label: e.note, total: 0, count: 0 }
    acc[k].total += e.amount
    acc[k].count++
    return acc
  }, {})
  const chartData = Object.values(grouped)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    setDeleting(id)
    try {
      await deleteDoc(doc(db, 'users', userId, 'expenses', id))
      onRefresh()
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (ts) => {
    try {
      const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts)
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    } catch { return '' }
  }

  const color = statusColor(total, budget)
  const pctUsed = pct(total, budget)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: `1px solid ${cat.color}20` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 38, height: 38, borderRadius: 10,
              background: `${cat.color}20`, display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
              flexShrink: 0,
            }}>{cat.icon}</span>
            <div>
              <h2 style={{ color: cat.color }}>{cat.label}</h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>
                {catExpenses.length} transaction{catExpenses.length !== 1 ? 's' : ''} this month
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: '1.2rem' }}>✕</button>
        </div>

        <div className="modal-body">
          {/* Stats row */}
          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Spent</span>
              <span className="amount" style={{ fontSize: '1.3rem', fontWeight: 500, color }}>{fmt(total)}</span>
            </div>
            {budget > 0 && (
              <>
                <div style={styles.statBox}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Budget</span>
                  <span className="amount" style={{ fontSize: '1.3rem', fontWeight: 500 }}>{fmt(budget)}</span>
                </div>
                <div style={styles.statBox}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {total > budget ? 'Over by' : 'Left'}
                  </span>
                  <span className="amount" style={{
                    fontSize: '1.3rem', fontWeight: 500,
                    color: total > budget ? 'var(--rose)' : 'var(--green)',
                  }}>
                    {total > budget ? fmt(total - budget) : fmt(budget - total)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Progress */}
          {budget > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Usage</span>
                <span className="amount" style={{ color }}>{Math.round(pctUsed)}%</span>
              </div>
              <div className="progress-track" style={{ height: 8 }}>
                <div className="progress-fill" style={{ width: `${pctUsed}%`, background: color }} />
              </div>
            </div>
          )}

          {/* Chart */}
          {chartData.length > 0 && (
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Breakdown by Description
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={110}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Sora' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ background: '#0e1525', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: '0.8rem' }}
                    formatter={(v) => [fmt(v), 'Spent']}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={cat.color} fillOpacity={1 - i * 0.06} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Transactions list */}
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Transactions
            </div>
            {catExpenses.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">{cat.icon}</div>
                <p>No expenses in {cat.label} this month</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {catExpenses.map(exp => (
                  <div key={exp.id} style={styles.txRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {exp.note}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {formatDate(exp.date)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span className="amount" style={{ fontWeight: 600, color: cat.color }}>
                        {fmt(exp.amount)}
                      </span>
                      <button className="btn-icon" onClick={() => { onEdit(exp); onClose() }} style={{ fontSize: '0.85rem' }}>✏️</button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(exp.id)}
                        disabled={deleting === exp.id}
                        style={{ fontSize: '0.85rem', color: 'var(--rose)' }}
                      >
                        {deleting === exp.id ? '...' : '🗑️'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  statsRow: {
    display: 'flex',
    gap: 1,
    background: 'var(--bg)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
  },
  statBox: {
    flex: 1,
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    borderRight: '1px solid var(--border)',
  },
  txRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
  },
}
