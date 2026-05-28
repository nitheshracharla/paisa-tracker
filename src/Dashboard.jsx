import { useState, useEffect, useCallback } from 'react'
import { signOut } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import {
  CATEGORIES, DEFAULT_ALLOCATIONS, fmt, fmtFull, pct, statusColor,
  monthKey, monthLabel, prevMonth, nextMonth, getCat
} from './constants'
import AddExpenseModal from './AddExpenseModal'
import BudgetSetupModal from './BudgetSetupModal'
import CategoryBreakdown from './CategoryBreakdown'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard({ user }) {
  const [month, setMonth] = useState(monthKey())
  const [salary, setSalary] = useState(0)
  const [allocations, setAllocations] = useState(DEFAULT_ALLOCATIONS)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showBudget, setShowBudget] = useState(false)
  const [breakdown, setBreakdown] = useState(null) // categoryId
  const [editExpense, setEditExpense] = useState(null)

  const isCurrentMonth = month === monthKey()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Load month config
      const mDoc = await getDoc(doc(db, 'users', user.uid, 'months', month))
      if (mDoc.exists()) {
        const data = mDoc.data()
        setSalary(data.salary || 0)
        setAllocations({ ...DEFAULT_ALLOCATIONS, ...data.allocations })
      } else {
        setSalary(0)
        setAllocations(DEFAULT_ALLOCATIONS)
      }

      // Load expenses
      const q = query(
        collection(db, 'users', user.uid, 'expenses'),
        where('month', '==', month)
      )
      const snap = await getDocs(q)
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [month, user.uid])

  useEffect(() => { loadData() }, [loadData])

  // Totals
  const spentByCategory = {}
  CATEGORIES.forEach(c => { spentByCategory[c.id] = 0 })
  expenses.forEach(e => {
    if (spentByCategory[e.category] !== undefined) spentByCategory[e.category] += e.amount
    else spentByCategory[e.category] = e.amount
  })

  const totalSpent = Object.values(spentByCategory).reduce((s, v) => s + v, 0)
  const totalBudgeted = CATEGORIES.reduce((s, c) => s + (salary * (allocations[c.id] || 0) / 100), 0)
  const savingsTarget = salary * (allocations.savings || 0) / 100
  const netSaved = salary - totalSpent

  // Pie chart data (non-zero categories)
  const pieData = CATEGORIES
    .filter(c => spentByCategory[c.id] > 0)
    .map(c => ({ name: c.label, value: spentByCategory[c.id], color: c.color }))

  const handleLogout = () => signOut(auth)

  const recentExpenses = [...expenses]
    .sort((a, b) => {
      const ta = a.date?.seconds || 0
      const tb = b.date?.seconds || 0
      return tb - ta
    })
    .slice(0, 6)

  const formatDate = (ts) => {
    try {
      const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts)
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    } catch { return '' }
  }

  return (
    <div style={styles.root}>
      {/* ─── Sidebar ─────────────────────────── */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <span style={styles.brandIcon}>₹</span>
          <span style={styles.brandName}>paisa</span>
        </div>

        <nav style={styles.nav}>
          <div style={styles.navItem} className="nav-item active">
            <span>📊</span><span>Dashboard</span>
          </div>
        </nav>

        <div style={{ flex: 1 }} />

        {/* User info */}
        <div style={styles.userBox}>
          <div style={styles.avatar}>{user.email[0].toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', padding: 0, marginTop: 2 }}
            >
              Sign out →
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main ────────────────────────────── */}
      <main style={styles.main}>
        {/* Top bar */}
        <div style={styles.topbar}>
          <div>
            <h1 style={styles.pageTitle}>Overview</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
              {salary > 0 ? `Salary: ${fmt(salary)}` : 'Set up your budget to get started'}
            </p>
          </div>

          {/* Month nav */}
          <div style={styles.monthNav}>
            <button className="btn-icon" style={styles.monthBtn} onClick={() => setMonth(prevMonth(month))}>‹</button>
            <span style={styles.monthLabel}>{monthLabel(month)}</span>
            <button
              className="btn-icon"
              style={{ ...styles.monthBtn, opacity: isCurrentMonth ? 0.3 : 1 }}
              onClick={() => !isCurrentMonth && setMonth(nextMonth(month))}
              disabled={isCurrentMonth}
            >›</button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" onClick={() => setShowBudget(true)} style={{ fontSize: '0.82rem', padding: '8px 14px' }}>
              ⚙️ Budget
            </button>
            <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ fontSize: '0.82rem', padding: '8px 16px' }}>
              + Add Expense
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="loader-ring spin" />
          </div>
        ) : (
          <>
            {/* ─── Summary cards ─── */}
            <div style={styles.summaryRow}>
              <SummaryCard
                label="Total Income"
                value={fmt(salary)}
                sub="this month"
                accent="var(--green)"
                icon="💼"
              />
              <SummaryCard
                label="Total Spent"
                value={fmt(totalSpent)}
                sub={salary > 0 ? `${Math.round(pct(totalSpent, salary))}% of salary` : ''}
                accent={statusColor(totalSpent, salary)}
                icon="💸"
              />
              <SummaryCard
                label="Net Savings"
                value={fmt(netSaved)}
                sub={savingsTarget > 0 ? `Target: ${fmt(savingsTarget)}` : ''}
                accent={netSaved >= 0 ? 'var(--green)' : 'var(--rose)'}
                icon="🏦"
              />
              <SummaryCard
                label="Budgeted"
                value={fmt(totalBudgeted)}
                sub={`${fmt(salary - totalBudgeted)} unallocated`}
                accent="var(--blue)"
                icon="🎯"
              />
            </div>

            {/* ─── Categories grid ─── */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Budget Tracker</div>
              {salary === 0 && (
                <div style={styles.banner}>
                  <span>📋</span>
                  <span>Set your salary & budget allocations to track spending.</span>
                  <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 14px', flexShrink: 0 }} onClick={() => setShowBudget(true)}>
                    Set Up Now
                  </button>
                </div>
              )}
              <div style={styles.catGrid}>
                {CATEGORIES.map(cat => {
                  const spent = spentByCategory[cat.id] || 0
                  const budget = salary * (allocations[cat.id] || 0) / 100
                  const used = pct(spent, budget)
                  const color = statusColor(spent, budget)
                  const overBudget = budget > 0 && spent > budget

                  return (
                    <div
                      key={cat.id}
                      style={{ ...styles.catCard, cursor: 'pointer' }}
                      onClick={() => setBreakdown(cat.id)}
                      onMouseEnter={e => e.currentTarget.style.borderColor = `${cat.color}40`}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div style={styles.catHeader}>
                        <div style={{ ...styles.catIcon, background: `${cat.color}15` }}>
                          {cat.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{cat.label}</div>
                          {budget > 0 && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                              {allocations[cat.id]}% · {fmt(budget)}
                            </div>
                          )}
                        </div>
                        {overBudget && <span className="chip chip-rose" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>Over</span>}
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'baseline' }}>
                          <span className="amount" style={{ fontSize: '1rem', fontWeight: 600, color }}>
                            {fmt(spent)}
                          </span>
                          {budget > 0 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              / {fmt(budget)}
                            </span>
                          )}
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${budget > 0 ? Math.min((spent / budget) * 100, 100) : 0}%`,
                              background: color,
                            }}
                          />
                        </div>
                        {budget > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            <span>{Math.round(used)}% used</span>
                            <span style={{ color: overBudget ? 'var(--rose)' : 'inherit' }}>
                              {overBudget ? `▲ ${fmt(spent - budget)} over` : `${fmt(budget - spent)} left`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ─── Bottom row: chart + recent ─── */}
            <div style={styles.bottomRow}>
              {/* Pie chart */}
              <div className="card" style={{ flex: '0 0 300px' }}>
                <div style={styles.sectionTitle}>Spending Split</div>
                {pieData.length === 0 ? (
                  <div className="empty">
                    <div className="empty-icon">📊</div>
                    <p>No expenses yet this month</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: '#0e1525', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: '0.8rem' }}
                          formatter={(v) => [fmt(v), '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      {pieData.slice(0, 5).map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                          <span style={{ flex: 1, color: 'var(--text-muted)' }}>{d.name}</span>
                          <span className="amount" style={{ color: 'var(--text)' }}>{fmt(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Recent expenses */}
              <div className="card" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={styles.sectionTitle}>Recent Transactions</div>
                  <button className="btn-ghost" style={{ fontSize: '0.78rem', padding: '5px 12px' }} onClick={() => setShowAdd(true)}>
                    + Add
                  </button>
                </div>
                {recentExpenses.length === 0 ? (
                  <div className="empty">
                    <div className="empty-icon">🧾</div>
                    <p>No transactions this month</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {recentExpenses.map(exp => {
                      const cat = getCat(exp.category)
                      return (
                        <div
                          key={exp.id}
                          style={styles.txRow}
                          onClick={() => setBreakdown(exp.category)}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        >
                          <div style={{ ...styles.txIcon, background: `${cat.color}15` }}>{cat.icon}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {exp.note}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>
                              {cat.label} · {formatDate(exp.date)}
                            </div>
                          </div>
                          <span className="amount" style={{ fontWeight: 600, color: cat.color, flexShrink: 0 }}>
                            -{fmt(exp.amount)}
                          </span>
                        </div>
                      )
                    })}
                    {expenses.length > 6 && (
                      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        +{expenses.length - 6} more · click a category for full list
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* ─── Modals ─── */}
      {showAdd && (
        <AddExpenseModal
          userId={user.uid}
          month={month}
          onClose={() => { setShowAdd(false); setEditExpense(null) }}
          onSaved={loadData}
          editExpense={editExpense}
        />
      )}
      {showBudget && (
        <BudgetSetupModal
          userId={user.uid}
          month={month}
          salary={salary}
          allocations={allocations}
          onClose={() => setShowBudget(false)}
          onSaved={({ salary: s, allocations: a }) => { setSalary(s); setAllocations(a) }}
        />
      )}
      {breakdown && (
        <CategoryBreakdown
          userId={user.uid}
          categoryId={breakdown}
          expenses={expenses}
          budget={salary * (allocations[breakdown] || 0) / 100}
          onClose={() => setBreakdown(null)}
          onEdit={(exp) => { setEditExpense(exp); setShowAdd(true) }}
          onRefresh={loadData}
        />
      )}
    </div>
  )
}

function SummaryCard({ label, value, sub, accent, icon }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 160, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -10, right: -10, fontSize: '3rem', opacity: 0.07, pointerEvents: 'none' }}>
        {icon}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {label}
      </div>
      <div className="amount" style={{ fontSize: '1.35rem', fontWeight: 500, color: accent, lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 5 }}>{sub}</div>
      )}
    </div>
  )
}

const styles = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg)',
  },
  sidebar: {
    width: 220,
    background: 'var(--bg-card)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    position: 'sticky',
    top: 0,
    height: '100vh',
    flexShrink: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
    paddingLeft: 4,
  },
  brandIcon: {
    width: 32, height: 32,
    background: 'var(--green)',
    color: '#000',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    fontSize: '1rem',
    lineHeight: '32px',
    textAlign: 'center',
    flexShrink: 0,
  },
  brandName: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    fontSize: '1.2rem',
    color: 'var(--text)',
    letterSpacing: '-0.03em',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: 4 },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 8,
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--text)',
    background: 'var(--green-dim)',
    border: '1px solid rgba(16,185,129,0.1)',
  },
  userBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
  },
  avatar: {
    width: 32, height: 32,
    background: 'var(--green)',
    color: '#000',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.875rem',
    flexShrink: 0,
    lineHeight: '32px',
    textAlign: 'center',
  },
  main: {
    flex: 1,
    padding: '28px 32px',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  pageTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  monthNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '4px',
    marginLeft: 'auto',
  },
  monthBtn: {
    width: 28, height: 28,
    background: 'transparent',
    border: 'none',
    color: 'var(--text)',
    fontSize: '1.2rem',
    cursor: 'pointer',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: '0.82rem',
    fontWeight: 600,
    padding: '0 8px',
    color: 'var(--text)',
    minWidth: 130,
    textAlign: 'center',
  },
  summaryRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },
  section: { display: 'flex', flexDirection: 'column', gap: 16 },
  sectionTitle: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 4,
  },
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    background: 'var(--amber-dim)',
    border: '1px solid rgba(245,158,11,0.2)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.82rem',
    color: 'var(--amber)',
    flexWrap: 'wrap',
  },
  catGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
  },
  catCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '16px',
    transition: 'all 0.2s ease',
  },
  catHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },
  catIcon: {
    width: 34, height: 34,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    flexShrink: 0,
  },
  bottomRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    paddingBottom: 32,
  },
  txRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  txIcon: {
    width: 32, height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    flexShrink: 0,
  },
}
