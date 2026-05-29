import { useState } from 'react'
import { deleteDoc, doc } from 'firebase/firestore'
import { db } from './firebase'
import { getCat, fmt, statusColor, pct, formatDate, HOUSEHOLD, classifyNote, SUB_CATEGORY_RULES, downloadCSV } from './constants'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

export default function CategoryBreakdown({ categoryId, expenses, budget, onClose, onEdit, onRefresh, month }) {
  const cat = getCat(categoryId)
  const [deleting, setDeleting] = useState(null)
  const [view, setView] = useState('grouped') // 'grouped' | 'list'
 
  const catExp = expenses
    .filter(e => e.category === categoryId)
    .sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
 
  const total = catExp.reduce((s, e) => s + e.amount, 0)
 
  // ── Smart sub-category grouping ────────────────────────────────────────────
  const hasSubRules = !!SUB_CATEGORY_RULES[categoryId]
 
  const subCatGroups = {} // { subCatLabel: { total, count, items[] } }
  const ungrouped = []   // expenses that didn't match any sub-category
 
  catExp.forEach(e => {
    const sub = classifyNote(e.note, categoryId)
    if (sub) {
      if (!subCatGroups[sub]) subCatGroups[sub] = { label: sub, total: 0, count: 0, items: [] }
      subCatGroups[sub].total += e.amount
      subCatGroups[sub].count++
      subCatGroups[sub].items.push(e)
    } else {
      ungrouped.push(e)
    }
  })
 
  // Also group ungrouped by exact note for the chart
  const noteGroups = {}
  ungrouped.forEach(e => {
    const k = e.note.toLowerCase()
    if (!noteGroups[k]) noteGroups[k] = { label: e.note, total: 0, count: 0, items: [] }
    noteGroups[k].total += e.amount
    noteGroups[k].count++
    noteGroups[k].items.push(e)
  })
 
  const subCatArr = Object.values(subCatGroups).sort((a, b) => b.total - a.total)
  const noteArr = Object.values(noteGroups).sort((a, b) => b.total - a.total)
 
  // Chart data: sub-categories first, then ungrouped note groups
  const chartData = [
    ...subCatArr.map(s => ({ name: s.label, value: s.total, isGrouped: true })),
    ...noteArr.map(n => ({ name: n.label, value: n.total, isGrouped: false })),
  ].slice(0, 10)
 
  // Pie data
  const pieData = chartData.map((d, i) => ({
    ...d,
    color: d.isGrouped ? cat.color : `${cat.color}${Math.max(30, 90 - i * 8).toString(16).padStart(2, '0')}`,
  }))
 
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    setDeleting(id)
    try { await deleteDoc(doc(db, 'household', HOUSEHOLD, 'expenses', id)); onRefresh() }
    finally { setDeleting(null) }
  }
 
  const color = statusColor(total, budget)
  const pctUsed = pct(total, budget)

  // Calculate insights
  const avgExpense = catExp.length > 0 ? total / catExp.length : 0
  const maxExpense = catExp.length > 0 ? Math.max(...catExp.map(e => e.amount)) : 0
  const mostFrequentType = subCatArr.length > 0 ? subCatArr[0].label : null
  const insights = []

  if (budget > 0) {
    const remaining = budget - total
    if (remaining < 0) {
      insights.push({ icon: '🚨', text: `Over budget by ${fmt(Math.abs(remaining))}` })
    } else if (remaining < budget * 0.1) {
      insights.push({ icon: '⚠️', text: `Only ${fmt(remaining)} left for this category` })
    } else {
      insights.push({ icon: '✅', text: `${fmt(remaining)} remaining in budget` })
    }
  }

  if (mostFrequentType) {
    insights.push({ icon: '🎯', text: `Most spending on ${mostFrequentType.toLowerCase()}` })
  }

  insights.push({ icon: '📊', text: `Avg expense: ${fmt(avgExpense)}, Highest: ${fmt(maxExpense)}` })

  const handleDownloadCategory = () => {
    const catExpenses = catExp.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
    downloadCSV(catExpenses, `${month}-${cat.label}`)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: `1px solid ${cat.color}25` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: `${cat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              {cat.icon}
            </span>
            <div>
              <h2 style={{ color: cat.color }}>{cat.label}</h2>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
                {catExp.length} transaction{catExp.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
 
        <div className="modal-body">
          {/* Download Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleDownloadCategory}
              disabled={catExp.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--blue)', borderRadius: 8, padding: '8px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', opacity: catExp.length === 0 ? 0.4 : 1 }}
            >
              ⬇️ Download
            </button>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="card" style={{ background: `linear-gradient(135deg, rgba(${cat.color.substring(1).match(/.{1,2}/g).map(x => parseInt(x, 16)).join(', ')}, 0.05) 0%, var(--bg-card) 100%)` }}>
              <div style={s.cardTitle}>💡 Insights</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {insights.map((ins, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{ins.icon}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.4 }}>{ins.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={s.statsRow}>
            <div style={s.statBox}>
              <span style={s.statLabel}>Spent</span>
              <span className="amount" style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{fmt(total)}</span>
            </div>
            {budget > 0 && <>
              <div style={s.statBox}>
                <span style={s.statLabel}>Budget</span>
                <span className="amount" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{fmt(budget)}</span>
              </div>
              <div style={s.statBox}>
                <span style={s.statLabel}>{total > budget ? 'Over' : 'Left'}</span>
                <span className="amount" style={{ fontSize: '1.1rem', fontWeight: 700, color: total > budget ? 'var(--rose)' : 'var(--green)' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>{Math.round(pctUsed)}% used</span>
                <span style={{ color }}>{total > budget ? `▲ ${fmt(total - budget)} over` : `${fmt(budget - total)} remaining`}</span>
              </div>
            </div>
          )}
 
          {/* Smart grouped breakdown */}
          {catExp.length > 0 && chartData.length > 1 && (
            <div>
              <div style={s.sectionLabel}>Spending Breakdown</div>
              <ResponsiveContainer width="100%" height={Math.min(chartData.length * 34 + 16, 240)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 50, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={105}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Sora' }}
                    axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ background: '#0e1525', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: '0.8rem' }}
                    formatter={v => [fmt(v), 'Spent']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}
                    label={{ position: 'right', fill: '#64748b', fontSize: 10, fontFamily: 'DM Mono', formatter: v => fmt(v) }}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={cat.color} fillOpacity={d.isGrouped ? 1 : 0.5} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {subCatArr.length > 0 && noteArr.length > 0 && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
                  Bright = auto-grouped · Dim = individual items
                </div>
              )}
            </div>
          )}
 
          {/* Sub-category summary cards */}
          {subCatArr.length > 0 && (
            <div>
              <div style={s.sectionLabel}>By Type</div>
              <div style={s.subGrid}>
                {subCatArr.map((sg, i) => (
                  <div key={i} style={{ ...s.subCard, borderColor: `${cat.color}30` }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: cat.color }}>{sg.label}</div>
                    <div className="amount" style={{ fontSize: '1rem', fontWeight: 700, marginTop: 4 }}>{fmt(sg.total)}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>×{sg.count} expense{sg.count !== 1 ? 's' : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
 
          {/* Toggle view */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setView('grouped')}
              style={{ ...s.toggleBtn, ...(view === 'grouped' ? s.toggleActive : {}) }}>
              📂 Grouped
            </button>
            <button
              onClick={() => setView('list')}
              style={{ ...s.toggleBtn, ...(view === 'list' ? s.toggleActive : {}) }}>
              📋 All {catExp.length} Items
            </button>
          </div>
 
          {/* Grouped view */}
          {view === 'grouped' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {subCatArr.map((sg, i) => (
                <div key={i}>
                  <div style={s.groupHeader}>
                    <span style={{ fontWeight: 600, color: cat.color, fontSize: '0.875rem' }}>{sg.label}</span>
                    <span className="amount" style={{ fontWeight: 700, color: cat.color }}>{fmt(sg.total)}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
                    {sg.items.map(exp => (
                      <ExpRow key={exp.id} exp={exp} cat={cat} onEdit={onEdit} onClose={onClose} onDelete={handleDelete} deleting={deleting} />
                    ))}
                  </div>
                </div>
              ))}
              {ungrouped.length > 0 && (
                <div>
                  <div style={s.groupHeader}>
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Other</span>
                    <span className="amount" style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{fmt(ungrouped.reduce((s, e) => s + e.amount, 0))}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
                    {ungrouped.map(exp => (
                      <ExpRow key={exp.id} exp={exp} cat={cat} onEdit={onEdit} onClose={onClose} onDelete={handleDelete} deleting={deleting} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
 
          {/* List view */}
          {view === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {catExp.length === 0
                ? <div className="empty"><div className="empty-icon">{cat.icon}</div><p>No expenses yet</p></div>
                : catExp.map(exp => (
                  <ExpRow key={exp.id} exp={exp} cat={cat} onEdit={onEdit} onClose={onClose} onDelete={handleDelete} deleting={deleting} showSubCat />
                ))}
            </div>
          )}
        </div>
 
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
 
function ExpRow({ exp, cat, onEdit, onClose, onDelete, deleting, showSubCat }) {
  const subCat = classifyNote(exp.note, exp.category)
  return (
    <div style={s.txRow}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {exp.note}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span>{formatDate(exp.date)}</span>
          {showSubCat && subCat && (
            <span style={{ background: `${cat.color}15`, color: cat.color, borderRadius: 4, padding: '1px 6px', fontSize: '0.65rem' }}>
              {subCat}
            </span>
          )}
        </div>
      </div>
      <span className="amount" style={{ fontWeight: 600, color: cat.color, flexShrink: 0 }}>{fmt(exp.amount)}</span>
      <button className="btn-icon" onClick={() => { onEdit(exp); onClose() }} style={{ fontSize: '0.9rem' }}>✏️</button>
      <button className="btn-icon" onClick={() => onDelete(exp.id)} disabled={deleting === exp.id}
        style={{ fontSize: '0.9rem', color: 'var(--rose)' }}>
        {deleting === exp.id ? '⏳' : '🗑️'}
      </button>
    </div>
  )
}
 
const s = {
  statsRow: { display: 'flex', gap: 1, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflow: 'hidden' },
  statBox: { flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4, borderRight: '1px solid var(--border)' },
  statLabel: { fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  sectionLabel: { fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, fontWeight: 600 },
  subGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 },
  subCard: { background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' },
  toggleBtn: { flex: 1, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer' },
  toggleActive: { background: 'var(--bg-card2)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.12)' },
  groupHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid var(--border)' },
  txRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' },
}
 
