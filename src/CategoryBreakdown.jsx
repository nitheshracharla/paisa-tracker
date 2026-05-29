import { useState } from 'react'
import { deleteDoc, doc } from 'firebase/firestore'
import { db } from './firebase'
import { getCat, fmt, statusColor, pct, formatDate, HOUSEHOLD } from './constants'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function CategoryBreakdown({ categoryId, expenses, budget, onClose, onEdit, onRefresh }) {
  const cat = getCat(categoryId)
  const [deleting, setDeleting] = useState(null)

  const catExp = expenses
    .filter(e => e.category === categoryId)
    .sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))

  const total = catExp.reduce((s, e) => s + e.amount, 0)

  const grouped = catExp.reduce((acc, e) => {
    const k = e.note.toLowerCase()
    if (!acc[k]) acc[k] = { label: e.note, total: 0, count: 0 }
    acc[k].total += e.amount; acc[k].count++
    return acc
  }, {})
  const chartData = Object.values(grouped).sort((a, b) => b.total - a.total).slice(0, 8)

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    setDeleting(id)
    try { await deleteDoc(doc(db, 'household', HOUSEHOLD, 'expenses', id)); onRefresh() }
    finally { setDeleting(null) }
  }

  const color = statusColor(total, budget)
  const pctUsed = pct(total, budget)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header" style={{ borderBottom: `1px solid ${cat.color}25` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 38, height: 38, borderRadius: 10,
              background: `${cat.color}20`, display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
            }}>{cat.icon}</span>
            <div>
              <h2 style={{ color: cat.color }}>{cat.label}</h2>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
                {catExp.length} transaction{catExp.length !== 1 ? 's' : ''} this month
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Stats */}
          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Spent</span>
              <span className="amount" style={{ fontSize: '1.2rem', fontWeight: 600, color }}>{fmt(total)}</span>
            </div>
            {budget > 0 && <>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>Budget</span>
                <span className="amount" style={{ fontSize: '1.2rem', fontWeight: 600 }}>{fmt(budget)}</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>{total > budget ? 'Over' : 'Left'}</span>
                <span className="amount" style={{ fontSize: '1.2rem', fontWeight: 600, color: total > budget ? 'var(--rose)' : 'var(--green)' }}>
                  {total > budget ? fmt(total - budget) : fmt(budget - total)}
                </span>
              </div>
            </>}
          </div>

          {budget > 0 && (
            <div>
              <div className="progress-track" style={{ height: 8 }}>
                <div className="progress-fill" style={{ width: `${pctUsed}%`, background: color }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>{Math.round(pctUsed)}% used</span>
                <span style={{ color }}>{total > budget ? `▲ ${fmt(total - budget)} over budget` : `${fmt(budget - total)} remaining`}</span>
              </div>
            </div>
          )}

          {/* Chart */}
          {chartData.length > 1 && (
            <div>
              <div style={styles.sectionLabel}>Breakdown by Description</div>
              <ResponsiveContainer width="100%" height={Math.min(chartData.length * 36 + 20, 220)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="label" width={100}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Sora' }}
                    axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ background: '#0e1525', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: '0.8rem' }}
                    formatter={v => [fmt(v), 'Spent']}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={cat.color} fillOpacity={1 - i * 0.07} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Transactions */}
          <div>
            <div style={styles.sectionLabel}>Transactions</div>
            {catExp.length === 0 ? (
              <div className="empty"><div className="empty-icon">{cat.icon}</div><p>No expenses yet</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {catExp.map(exp => (
                  <div key={exp.id} style={styles.txRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {exp.note}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{formatDate(exp.date)}</div>
                    </div>
                    <span className="amount" style={{ fontWeight: 600, color: cat.color, flexShrink: 0 }}>{fmt(exp.amount)}</span>
                    <button className="btn-icon" onClick={() => { onEdit(exp); onClose() }} style={{ fontSize: '0.9rem' }}>✏️</button>
                    <button className="btn-icon" onClick={() => handleDelete(exp.id)} disabled={deleting === exp.id}
                      style={{ fontSize: '0.9rem', color: 'var(--rose)' }}>
                      {deleting === exp.id ? '⏳' : '🗑️'}
                    </button>
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
  statsRow: { display: 'flex', gap: 1, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflow: 'hidden' },
  statBox: { flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4, borderRight: '1px solid var(--border)' },
  statLabel: { fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  sectionLabel: { fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 },
  txRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' },
}
