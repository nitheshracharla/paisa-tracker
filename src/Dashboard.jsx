import { useState, useEffect, useCallback } from 'react'
import { signOut } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import {
  CATEGORIES, DEFAULT_ALLOCATIONS, fmt, pct, statusColor,
  monthKey, monthLabel, prevMonth, nextMonth, getCat, formatDate,
  HOUSEHOLD, downloadCSV
} from './constants'
import AddExpenseModal from './AddExpenseModal'
import BudgetSetupModal from './BudgetSetupModal'
import CategoryBreakdown from './CategoryBreakdown'
import InsightsTab from './InsightsTab'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
 
const TABS = [
  { id: 'home',     icon: '🏠', label: 'Home' },
  { id: 'budget',   icon: '🎯', label: 'Budget' },
  { id: 'add',      icon: '+',  label: 'Add',   fab: true },
  { id: 'insights', icon: '📊', label: 'Stats' },
  { id: 'history',  icon: '🧾', label: 'History' },
]
 
export default function Dashboard({ user }) {
  const [month, setMonth] = useState(monthKey())
  const [salary, setSalary] = useState(0)
  const [allocations, setAllocations] = useState(DEFAULT_ALLOCATIONS)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('home')
  const [showAdd, setShowAdd] = useState(false)
  const [showBudget, setShowBudget] = useState(false)
  const [breakdown, setBreakdown] = useState(null)
  const [editExpense, setEditExpense] = useState(null)
  const [carriedOver, setCarriedOver] = useState(false)
 
  const loadData = useCallback(async () => {
    setLoading(true)
    setCarriedOver(false)
    try {
      const mRef = doc(db, 'household', HOUSEHOLD, 'months', month)
      const mDoc = await getDoc(mRef)
 
      if (mDoc.exists()) {
        const d = mDoc.data()
        setSalary(d.salary || 0)
        setAllocations({ ...DEFAULT_ALLOCATIONS, ...d.allocations })
      } else {
        // ── Budget carry-over: copy from most recent previous month ────────
        let copied = false
        let checkMonth = prevMonth(month)
        for (let i = 0; i < 6; i++) {   // look back up to 6 months
          const prevRef = doc(db, 'household', HOUSEHOLD, 'months', checkMonth)
          const prevDoc = await getDoc(prevRef)
          if (prevDoc.exists()) {
            const d = prevDoc.data()
            const carryAlloc = { ...DEFAULT_ALLOCATIONS, ...d.allocations }
            setSalary(d.salary || 0)
            setAllocations(carryAlloc)
            // Auto-save carry-over so both users see it immediately
            await setDoc(mRef, {
              salary: d.salary || 0,
              allocations: carryAlloc,
              carriedOverFrom: checkMonth,
              updatedAt: new Date(),
            })
            setCarriedOver(true)
            copied = true
            break
          }
          checkMonth = prevMonth(checkMonth)
        }
        if (!copied) {
          setSalary(0)
          setAllocations(DEFAULT_ALLOCATIONS)
        }
      }
 
      const q = query(
        collection(db, 'household', HOUSEHOLD, 'expenses'),
        where('month', '==', month)
      )
      const snap = await getDocs(q)
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [month])
 
  useEffect(() => { loadData() }, [loadData])
 
  // Computed
  const spentBy = {}
  CATEGORIES.forEach(c => { spentBy[c.id] = 0 })
  expenses.forEach(e => { spentBy[e.category] = (spentBy[e.category] || 0) + e.amount })
 
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
  const netSaved = salary - totalSpent
  const savingsTarget = salary * (allocations.savings || 0) / 100
 
  const pieData = CATEGORIES.filter(c => spentBy[c.id] > 0)
    .map(c => ({ name: c.label, value: spentBy[c.id], color: c.color }))
 
  const sortedExpenses = [...expenses].sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
 
  const openEdit = (exp) => { setEditExpense(exp); setShowAdd(true) }
  const handleTabPress = (t) => {
    if (t.id === 'add') { setShowAdd(true); return }
    setTab(t.id)
  }
 
  return (
    <div style={s.root}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <div style={s.brand}>
            <span style={s.brandIcon}>₹</span>
            <span style={s.brandName}>paisa</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>shared · {user.email.split('@')[0]}</div>
        </div>
        <div style={s.monthPicker}>
          <button style={s.monthBtn} onClick={() => setMonth(prevMonth(month))}>‹</button>
          <span style={s.monthText}>{monthLabel(month)}</span>
          <button style={s.monthBtn} onClick={() => setMonth(nextMonth(month))}>›</button>
        </div>
        <button onClick={() => signOut(auth)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, flexShrink: 0 }}>
          Exit
        </button>
      </header>
 
      {/* Content */}
      <main style={s.main}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <div className="loader-ring spin" />
          </div>
        ) : (
          <>
            {carriedOver && (
              <div style={s.carryBanner}>
                <span>🔄</span>
                <span style={{ fontSize: '0.78rem' }}>Budget carried over from last month — tap ⚙️ Edit to adjust</span>
              </div>
            )}
            {tab === 'home' && (
              <HomeTab salary={salary} totalSpent={totalSpent} netSaved={netSaved}
                savingsTarget={savingsTarget} pieData={pieData} sortedExpenses={sortedExpenses}
                spentBy={spentBy} allocations={allocations} setBreakdown={setBreakdown}
                setShowAdd={setShowAdd} setShowBudget={setShowBudget} />
            )}
            {tab === 'budget' && (
              <BudgetTab salary={salary} spentBy={spentBy} allocations={allocations}
                setBreakdown={setBreakdown} setShowBudget={setShowBudget} />
            )}
            {tab === 'insights' && (
              <InsightsTab month={month} salary={salary} expenses={expenses}
                spentBy={spentBy} allocations={allocations} />
            )}
            {tab === 'history' && (
              <HistoryTab expenses={sortedExpenses} month={month} onEdit={openEdit} />
            )}
          </>
        )}
        <div style={{ height: 'calc(var(--nav-h) + var(--safe-bottom) + 16px)' }} />
      </main>
 
      {/* Bottom Nav */}
      <nav style={s.nav}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => handleTabPress(t)}
            style={t.fab ? s.fab : { ...s.navBtn, color: tab === t.id ? 'var(--green)' : 'var(--text-muted)' }}>
            {t.fab
              ? <span style={s.fabIcon}>+</span>
              : <>
                  <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{t.icon}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.03em', marginTop: 2 }}>{t.label}</span>
                  {tab === t.id && <span style={s.activeDot} />}
                </>
            }
          </button>
        ))}
      </nav>
 
      {/* Modals */}
      {showAdd && (
        <AddExpenseModal month={month}
          onClose={() => { setShowAdd(false); setEditExpense(null) }}
          onSaved={loadData} editExpense={editExpense} />
      )}
      {showBudget && (
        <BudgetSetupModal month={month} salary={salary} allocations={allocations}
          onClose={() => setShowBudget(false)}
          onSaved={({ salary: sl, allocations: al }) => { setSalary(sl); setAllocations(al) }} />
      )}
      {breakdown && (
        <CategoryBreakdown categoryId={breakdown} expenses={expenses}
          budget={salary * (allocations[breakdown] || 0) / 100}
          onClose={() => setBreakdown(null)} onEdit={openEdit} onRefresh={loadData} />
      )}
    </div>
  )
}
 
// ── Home Tab ──────────────────────────────────────────────────────────────────
function HomeTab({ salary, totalSpent, netSaved, savingsTarget, pieData, sortedExpenses, spentBy, allocations, setBreakdown, setShowAdd, setShowBudget }) {
  const overBudgetCats = CATEGORIES.filter(c => {
    const b = salary * (allocations[c.id] || 0) / 100
    return b > 0 && spentBy[c.id] > b
  })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {salary === 0 && (
        <div style={s.banner} onClick={() => setShowBudget(true)}>
          <span>📋</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Set up your budget</div>
            <div style={{ fontSize: '0.75rem', marginTop: 2, opacity: 0.8 }}>Tap to add salary & allocations</div>
          </div>
          <span>›</span>
        </div>
      )}
      {overBudgetCats.length > 0 && (
        <div style={s.alertBanner}>
          <span>⚠️</span>
          <span style={{ fontSize: '0.82rem' }}>Over budget: {overBudgetCats.map(c => c.label).join(', ')}</span>
        </div>
      )}
      <div style={s.grid2}>
        <SumCard label="Income" value={fmt(salary)} icon="💼" color="var(--green)" />
        <SumCard label="Spent" value={fmt(totalSpent)} icon="💸" color={statusColor(totalSpent, salary)}
          sub={salary > 0 ? `${Math.round(pct(totalSpent, salary))}% used` : ''} />
        <SumCard label="Saved" value={fmt(netSaved)} icon="🏦"
          color={netSaved >= 0 ? 'var(--green)' : 'var(--rose)'}
          sub={savingsTarget > 0 ? `Target ${fmt(savingsTarget)}` : ''} />
        <SumCard label="Remaining" value={fmt(Math.max(salary - totalSpent, 0))} icon="🎯" color="var(--blue)" />
      </div>
      <div className="card">
        <div style={s.cardTitle}>Top Spending</div>
        {pieData.length === 0 ? (
          <div className="empty" style={{ padding: '20px 0' }}><div className="empty-icon">📊</div><p>No expenses yet</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {pieData.slice(0, 5).map((d, i) => {
              const cat = CATEGORIES.find(c => c.label === d.name)
              const budget = salary * (allocations[cat?.id] || 0) / 100
              return (
                <div key={i} style={s.topCatRow} onClick={() => cat && setBreakdown(cat.id)}>
                  <span style={{ fontSize: '1.1rem', width: 24 }}>{cat?.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 500 }}>{d.name}</span>
                      <span className="amount" style={{ fontWeight: 600, color: d.color }}>{fmt(d.value)}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${budget > 0 ? Math.min((d.value / budget) * 100, 100) : 20}%`, background: d.color }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {pieData.length > 1 && (
        <div className="card">
          <div style={s.cardTitle}>Spending Split</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={2} dataKey="value">
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0e1525', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: '0.8rem' }} formatter={v => [fmt(v), '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={s.cardTitle}>Recent</div>
          <button onClick={() => setShowAdd(true)} style={{ background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--green)', borderRadius: 6, padding: '5px 12px', fontSize: '0.8rem', fontWeight: 600 }}>+ Add</button>
        </div>
        {sortedExpenses.length === 0 ? (
          <div className="empty" style={{ padding: '20px 0' }}><p>No transactions yet</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sortedExpenses.slice(0, 5).map(exp => {
              const cat = getCat(exp.category)
              return (
                <div key={exp.id} style={s.txRow} onClick={() => setBreakdown(exp.category)}>
                  <span style={{ ...s.txIcon, background: `${cat.color}15` }}>{cat.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.note}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>{cat.label} · {formatDate(exp.date)}</div>
                  </div>
                  <span className="amount" style={{ fontWeight: 600, color: cat.color, flexShrink: 0 }}>-{fmt(exp.amount)}</span>
                </div>
              )
            })}
            {sortedExpenses.length > 5 && (
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: 4 }}>
                +{sortedExpenses.length - 5} more in History tab
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
 
// ── Budget Tab ────────────────────────────────────────────────────────────────
function BudgetTab({ salary, spentBy, allocations, setBreakdown, setShowBudget }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>All Categories</div>
        <button onClick={() => setShowBudget(true)}
          style={{ background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--green)', borderRadius: 6, padding: '5px 12px', fontSize: '0.8rem', fontWeight: 600 }}>
          ⚙️ Edit Budget
        </button>
      </div>
      {CATEGORIES.map(cat => {
        const spent = spentBy[cat.id] || 0
        const budget = salary * (allocations[cat.id] || 0) / 100
        const color = statusColor(spent, budget)
        const over = budget > 0 && spent > budget
        return (
          <div key={cat.id} style={s.budgetRow} onClick={() => setBreakdown(cat.id)}>
            <div style={{ ...s.txIcon, background: `${cat.color}15`, fontSize: '1.1rem' }}>{cat.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{cat.label}</span>
                  {over && <span className="chip chip-rose" style={{ marginLeft: 6, fontSize: '0.6rem', padding: '1px 6px' }}>Over</span>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="amount" style={{ fontSize: '0.875rem', fontWeight: 600, color }}>{fmt(spent)}</span>
                  {budget > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}> / {fmt(budget)}</span>}
                </div>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${budget > 0 ? Math.min((spent / budget) * 100, 100) : 0}%`, background: color }} />
              </div>
              {budget > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  <span>{allocations[cat.id] || 0}% of salary</span>
                  <span style={{ color: over ? 'var(--rose)' : 'var(--text-muted)' }}>
                    {over ? `▲ ${fmt(spent - budget)} over` : `${fmt(budget - spent)} left`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
 
// ── History Tab ───────────────────────────────────────────────────────────────
function HistoryTab({ expenses, month, onEdit }) {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.category === filter)
 
  const grouped = filtered.reduce((acc, e) => {
    const key = formatDate(e.date)
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})
 
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {expenses.length} transactions
        </div>
        <button
          onClick={() => downloadCSV(expenses, month)}
          disabled={expenses.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--blue)', borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', opacity: expenses.length === 0 ? 0.4 : 1 }}
        >
          ⬇️ CSV
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setFilter('all')} style={{ ...s.filterChip, ...(filter === 'all' ? s.filterActive : {}) }}>All</button>
        {CATEGORIES.filter(c => expenses.some(e => e.category === c.id)).map(c => (
          <button key={c.id} onClick={() => setFilter(c.id)}
            style={{ ...s.filterChip, ...(filter === c.id ? { ...s.filterActive, borderColor: c.color, color: c.color, background: `${c.color}15` } : {}) }}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty"><div className="empty-icon">🧾</div><p>No transactions</p></div>
      ) : (
        Object.entries(grouped).map(([date, exps]) => (
          <div key={date}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, paddingLeft: 4 }}>
              {date} · {fmt(exps.reduce((s, e) => s + e.amount, 0))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {exps.map(exp => {
                const cat = getCat(exp.category)
                return (
                  <div key={exp.id} style={s.txRow} onClick={() => onEdit(exp)}>
                    <span style={{ ...s.txIcon, background: `${cat.color}15` }}>{cat.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.note}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>{cat.label}</div>
                    </div>
                    <span className="amount" style={{ fontWeight: 600, color: cat.color, flexShrink: 0 }}>-{fmt(exp.amount)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
 
function SumCard({ label, value, icon, color, sub }) {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -4, right: 4, fontSize: '2rem', opacity: 0.08 }}>{icon}</div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div className="amount" style={{ fontSize: '1.1rem', fontWeight: 600, color, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}
 
const s = {
  root: { display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--bg)' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 10, padding: '12px 16px',
    background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0, zIndex: 100,
    paddingTop: 'max(12px, calc(env(safe-area-inset-top) + 8px))',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 8 },
  brandIcon: { width: 28, height: 28, background: 'var(--green)', color: '#000', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', lineHeight: '28px', textAlign: 'center', flexShrink: 0 },
  brandName: { fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.03em' },
  monthPicker: { display: 'flex', alignItems: 'center', gap: 2, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '3px 4px' },
  monthBtn: { background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.1rem', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, lineHeight: 1 },
  monthText: { fontSize: '0.74rem', fontWeight: 600, minWidth: 100, textAlign: 'center' },
  main: { flex: 1, padding: '14px 16px', overflowY: 'auto' },
  nav: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    height: 'calc(var(--nav-h) + var(--safe-bottom))',
    paddingBottom: 'var(--safe-bottom)',
    background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', zIndex: 200,
  },
  navBtn: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', position: 'relative', minHeight: 52 },
  activeDot: { position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--green)' },
  fab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' },
  fabIcon: { width: 48, height: 48, borderRadius: '50%', background: 'var(--green)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 300, lineHeight: 1, boxShadow: '0 0 20px rgba(16,185,129,0.35)', marginBottom: 6 },
  carryBanner: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, color: 'var(--blue)', marginBottom: 4 },
  banner: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius)', color: 'var(--amber)', cursor: 'pointer' },
  alertBanner: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--rose-dim)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 8, color: 'var(--rose)' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  cardTitle: { fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 },
  topCatRow: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  txRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' },
  txIcon: { width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 },
  budgetRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' },
  filterChip: { flexShrink: 0, padding: '6px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' },
  filterActive: { background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--green)' },
}
