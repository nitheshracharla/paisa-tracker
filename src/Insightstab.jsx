import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebase'
import { CATEGORIES, HOUSEHOLD, fmt, getCat, prevMonth, monthLabel, classifyNote, downloadCSV, statusColor } from './constants'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts'
 
export default function InsightsTab({ month, salary, expenses, spentBy, allocations }) {
  const [prevData, setPrevData] = useState({ salary: 0, expenses: [] })
  const [loadingPrev, setLoadingPrev] = useState(true)
 
  const prev = prevMonth(month)
 
  useEffect(() => {
    const load = async () => {
      setLoadingPrev(true)
      try {
        const q = query(collection(db, 'household', HOUSEHOLD, 'expenses'), where('month', '==', prev))
        const snap = await getDocs(q)
        const exps = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setPrevData({ expenses: exps })
      } catch { setPrevData({ expenses: [] }) }
      finally { setLoadingPrev(false) }
    }
    load()
  }, [prev])
 
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
  const prevSpent = prevData.expenses.reduce((s, e) => s + e.amount, 0)
  const netSaved = salary - totalSpent
  const savingsRate = salary > 0 ? Math.round((netSaved / salary) * 100) : 0
 
  // Budget adherence
  const catsWithBudget = CATEGORIES.filter(c => (allocations[c.id] || 0) > 0)
  const catsOnBudget = catsWithBudget.filter(c => (spentBy[c.id] || 0) <= salary * (allocations[c.id] || 0) / 100)
  const adherenceScore = catsWithBudget.length > 0 ? Math.round((catsOnBudget.length / catsWithBudget.length) * 100) : 100
 
  // Health score: mix of savings rate + budget adherence
  const healthScore = Math.round((savingsRate * 0.5) + (adherenceScore * 0.5))
  const healthLabel = healthScore >= 80 ? '🟢 Excellent' : healthScore >= 60 ? '🟡 On Track' : healthScore >= 40 ? '🟠 Needs Attention' : '🔴 Over Budget'
  const healthColor = healthScore >= 80 ? 'var(--green)' : healthScore >= 60 ? 'var(--green)' : healthScore >= 40 ? 'var(--amber)' : 'var(--rose)'
 
  // Daily avg
  const today = new Date()
  const [y, m] = month.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const daysSoFar = month === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    ? today.getDate() : daysInMonth
  const dailyAvg = daysSoFar > 0 ? totalSpent / daysSoFar : 0
  const projectedMonthly = dailyAvg * daysInMonth
 
  // Top 5 categories by spend
  const topCats = CATEGORIES
    .map(c => ({ ...c, spent: spentBy[c.id] || 0, budget: salary * (allocations[c.id] || 0) / 100 }))
    .filter(c => c.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5)
 
  // Most frequent notes
  const noteCounts = {}
  expenses.forEach(e => {
    const k = e.note.toLowerCase().trim()
    if (!noteCounts[k]) noteCounts[k] = { label: e.note, count: 0, total: 0, category: e.category }
    noteCounts[k].count++
    noteCounts[k].total += e.amount
  })
  const topNotes = Object.values(noteCounts).sort((a, b) => b.count - a.count).slice(0, 5)
 
  // Biggest single expense
  const biggestExp = expenses.length > 0
    ? expenses.reduce((max, e) => e.amount > max.amount ? e : max, expenses[0])
    : null
 
  // Day of week spending
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayTotals = Array(7).fill(0)
  expenses.forEach(e => {
    const d = e.date?.seconds ? new Date(e.date.seconds * 1000) : new Date(e.date)
    if (!isNaN(d)) dayTotals[d.getDay()] += e.amount
  })
  const dayChartData = dayNames.map((name, i) => ({ name, value: dayTotals[i] }))
  const peakDay = dayChartData.reduce((max, d) => d.value > max.value ? d : max, dayChartData[0])
 
  // Previous month per-category comparison
  const prevSpentBy = {}
  prevData.expenses.forEach(e => { prevSpentBy[e.category] = (prevSpentBy[e.category] || 0) + e.amount })
 
  // Month comparison bar chart (top 6 categories)
  const compData = CATEGORIES
    .filter(c => (spentBy[c.id] || 0) > 0 || (prevSpentBy[c.id] || 0) > 0)
    .map(c => ({ name: c.label.slice(0, 8), curr: spentBy[c.id] || 0, prev: prevSpentBy[c.id] || 0, color: c.color }))
    .sort((a, b) => b.curr - a.curr)
    .slice(0, 6)
 
  // Sub-category breakdown across all categories
  const subCatTotals = {}
  expenses.forEach(e => {
    const sub = classifyNote(e.note, e.category)
    if (sub) {
      const key = `${getCat(e.category).label} › ${sub}`
      subCatTotals[key] = (subCatTotals[key] || 0) + e.amount
    }
  })
  const topSubCats = Object.entries(subCatTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
 
  // Smart insights (text)
  const insights = []
  if (salary > 0) {
    const foodPct = Math.round(((spentBy.food || 0) / salary) * 100)
    if (foodPct > 20) insights.push({ icon: '🍱', text: `Food is ${foodPct}% of income — consider meal prepping to cut costs` })
    const prevFoodTotal = prevData.expenses.filter(e => e.category === 'food').reduce((s, e) => s + e.amount, 0)
    if (prevFoodTotal > 0 && (spentBy.food || 0) > prevFoodTotal * 1.2)
      insights.push({ icon: '📈', text: `Food spend is ${Math.round(((spentBy.food - prevFoodTotal) / prevFoodTotal) * 100)}% higher than last month` })
    if (savingsRate < 10 && salary > 0)
      insights.push({ icon: '⚠️', text: 'Savings below 10% — try the 50/30/20 rule' })
    if (savingsRate >= 20)
      insights.push({ icon: '🏆', text: `Great! You're saving ${savingsRate}% of income this month` })
    if (projectedMonthly > salary && daysSoFar < daysInMonth)
      insights.push({ icon: '🔮', text: `At this pace you'll spend ${fmt(projectedMonthly)} — ${fmt(projectedMonthly - salary)} over income` })
    if (peakDay.value > 0)
      insights.push({ icon: '📅', text: `${peakDay.name} is your biggest spending day (${fmt(peakDay.value)})` })
    const overCats = CATEGORIES.filter(c => salary * (allocations[c.id] || 0) / 100 > 0 && (spentBy[c.id] || 0) > salary * (allocations[c.id] || 0) / 100)
    if (overCats.length > 0)
      insights.push({ icon: '🚨', text: `Over budget in: ${overCats.map(c => c.label).join(', ')}` })
    if (prevSpent > 0) {
      const diff = totalSpent - prevSpent
      insights.push({ icon: diff > 0 ? '↑' : '↓', text: `${Math.abs(Math.round((diff / prevSpent) * 100))}% ${diff > 0 ? 'more' : 'less'} spend vs last month (${fmt(Math.abs(diff))})` })
    }
  }
 
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
 
      {/* Download button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => downloadCSV(expenses, month)}
          disabled={expenses.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--blue)', borderRadius: 8, padding: '8px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', opacity: expenses.length === 0 ? 0.4 : 1 }}
        >
          ⬇️ Export CSV
        </button>
      </div>
 
      {/* Health Score */}
      <div className="card" style={{ background: `linear-gradient(135deg, var(--bg-card) 0%, rgba(16,185,129,0.05) 100%)`, border: `1px solid ${healthColor}30` }}>
        <div style={s.cardTitle}>Month Health Score</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
          <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            <svg viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="36" cy="36" r="28" fill="none" stroke={healthColor} strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 28 * healthScore / 100} ${2 * Math.PI * 28}`}
                strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: healthColor }}>{healthScore}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: healthColor }}>{healthLabel}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {catsOnBudget.length}/{catsWithBudget.length} categories on budget · {savingsRate}% saved
            </div>
          </div>
        </div>
      </div>
 
      {/* Key stats */}
      <div style={s.grid3}>
        <StatBox label="Daily Avg" value={fmt(dailyAvg)} sub={`${daysSoFar}d tracked`} color="var(--blue)" />
        <StatBox label="Net Saved" value={fmt(netSaved)} sub={`${savingsRate}% rate`} color={netSaved >= 0 ? 'var(--green)' : 'var(--rose)'} />
        <StatBox label="Projected" value={fmt(projectedMonthly)} sub="end of month" color={projectedMonthly > salary ? 'var(--rose)' : 'var(--amber)'} />
      </div>
 
      {/* Smart Insights */}
      {insights.length > 0 && (
        <div className="card">
          <div style={s.cardTitle}>💡 Smart Insights</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {insights.map((ins, i) => (
              <div key={i} style={s.insightRow}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{ins.icon}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.4 }}>{ins.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
 
      {/* Top spend categories */}
      <div className="card">
        <div style={s.cardTitle}>Top Categories</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {topCats.length === 0
            ? <div className="empty" style={{ padding: '16px 0' }}><p>No expenses yet</p></div>
            : topCats.map(cat => {
              const color = statusColor(cat.spent, cat.budget)
              const pctOfTotal = totalSpent > 0 ? Math.round((cat.spent / totalSpent) * 100) : 0
              return (
                <div key={cat.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{cat.label}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{pctOfTotal}% of spend</span>
                    </div>
                    <span className="amount" style={{ fontWeight: 700, color, fontSize: '0.875rem' }}>{fmt(cat.spent)}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${cat.budget > 0 ? Math.min((cat.spent / cat.budget) * 100, 100) : 20}%`, background: color }} />
                  </div>
                </div>
              )
            })}
        </div>
      </div>
 
      {/* Sub-category breakdown */}
      {topSubCats.length > 0 && (
        <div className="card">
          <div style={s.cardTitle}>What You Spend On (Sub-categories)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {topSubCats.map(([key, total], i) => {
              const pctOfTotal = totalSpent > 0 ? Math.round((total / totalSpent) * 100) : 0
              return (
                <div key={i} style={s.subCatRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{key}</span>
                      <span className="amount" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{fmt(total)}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pctOfTotal * 3}%`, background: `hsl(${200 + i * 25}, 70%, 55%)` }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>{pctOfTotal}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
 
      {/* Day of week chart */}
      <div className="card">
        <div style={s.cardTitle}>Spending by Day of Week</div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={dayChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: '#0e1525', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: '0.78rem' }}
              formatter={v => [fmt(v), 'Spent']} cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {dayChartData.map((d, i) => (
                <Cell key={i} fill={d.name === peakDay.name && d.value > 0 ? 'var(--amber)' : 'rgba(59,130,246,0.6)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {peakDay.value > 0 && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
            {peakDay.name} is your highest spend day · {fmt(peakDay.value)}
          </div>
        )}
      </div>
 
      {/* vs Last Month */}
      {!loadingPrev && compData.some(d => d.prev > 0) && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={s.cardTitle}>vs Last Month</div>
            <div style={{ display: 'flex', gap: 12, fontSize: '0.68rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--green)', display: 'inline-block' }} /> This
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.2)', display: 'inline-block' }} /> Last
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={compData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#0e1525', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: '0.78rem' }}
                formatter={v => [fmt(v), '']}
              />
              <Bar dataKey="prev" fill="rgba(255,255,255,0.12)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="curr" radius={[3, 3, 0, 0]}>
                {compData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Last month total: </span>
              <span className="amount" style={{ fontWeight: 600 }}>{fmt(prevSpent)}</span>
            </div>
            <div style={{ fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>This month: </span>
              <span className="amount" style={{ fontWeight: 600, color: totalSpent > prevSpent ? 'var(--rose)' : 'var(--green)' }}>
                {fmt(totalSpent)} {prevSpent > 0 ? `(${totalSpent > prevSpent ? '+' : ''}${Math.round(((totalSpent - prevSpent) / prevSpent) * 100)}%)` : ''}
              </span>
            </div>
          </div>
        </div>
      )}
 
      {/* Most frequent expenses */}
      {topNotes.length > 0 && (
        <div className="card">
          <div style={s.cardTitle}>Most Frequent Expenses</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {topNotes.map((n, i) => {
              const cat = getCat(n.category)
              return (
                <div key={i} style={s.noteRow}>
                  <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{n.label}</span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>{cat.label}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="amount" style={{ fontSize: '0.875rem', fontWeight: 600 }}>{fmt(n.total)}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>×{n.count} times</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
 
      {/* Biggest single expense */}
      {biggestExp && (
        <div className="card" style={{ borderColor: `${getCat(biggestExp.category).color}30` }}>
          <div style={s.cardTitle}>Biggest Single Expense</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <span style={{ fontSize: '1.8rem' }}>{getCat(biggestExp.category).icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{biggestExp.note}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {getCat(biggestExp.category).label} · {(() => {
                  try { const d = biggestExp.date?.seconds ? new Date(biggestExp.date.seconds * 1000) : new Date(biggestExp.date); return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) } catch { return '' }
                })()}
              </div>
            </div>
            <span className="amount" style={{ fontSize: '1.1rem', fontWeight: 700, color: getCat(biggestExp.category).color }}>
              {fmt(biggestExp.amount)}
            </span>
          </div>
        </div>
      )}
 
      <div style={{ height: 8 }} />
    </div>
  )
}
 
function StatBox({ label, value, sub, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div className="amount" style={{ fontSize: '1rem', fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}
 
const s = {
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
  cardTitle: { fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 },
  insightRow: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '10px 12px', background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border)', borderRadius: 8,
  },
  subCatRow: { display: 'flex', alignItems: 'center', gap: 8 },
  noteRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '8px 10px', background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border)', borderRadius: 8,
  },
}
