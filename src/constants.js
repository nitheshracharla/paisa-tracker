export const CATEGORIES = [
  { id: 'rent',          label: 'Rent',           icon: '🏠', color: '#3b82f6' },
  { id: 'emi',           label: 'EMI / Loan',      icon: '🏦', color: '#8b5cf6' },
  { id: 'food',          label: 'Food',            icon: '🍱', color: '#f59e0b' },
  { id: 'travel',        label: 'Travel',          icon: '✈️', color: '#06b6d4' },
  { id: 'fuel',          label: 'Fuel',            icon: '⛽', color: '#f97316' },
  { id: 'savings',       label: 'Savings',         icon: '💰', color: '#10b981' },
  { id: 'utility',       label: 'Utility',         icon: '💡', color: '#eab308' },
  { id: 'healthcare',    label: 'Healthcare',      icon: '🏥', color: '#ec4899' },
  { id: 'entertainment', label: 'Entertainment',   icon: '🎬', color: '#a855f7' },
  { id: 'shopping',      label: 'Shopping',        icon: '🛍️', color: '#14b8a6' },
  { id: 'subscriptions', label: 'Subscriptions',   icon: '📱', color: '#6366f1' },
  { id: 'education',     label: 'Education',       icon: '📚', color: '#0ea5e9' },
  { id: 'miscellaneous', label: 'Miscellaneous',   icon: '📦', color: '#94a3b8' },
]

export const DEFAULT_ALLOCATIONS = {
  rent: 25,
  emi: 15,
  food: 15,
  travel: 5,
  fuel: 5,
  savings: 10,
  utility: 5,
  healthcare: 3,
  entertainment: 3,
  shopping: 5,
  subscriptions: 2,
  education: 2,
  miscellaneous: 5,
}

export const fmt = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export const fmtFull = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const pct = (spent, budget) => {
  if (!budget) return 0
  return Math.min((spent / budget) * 100, 100)
}

export const statusColor = (spent, budget) => {
  if (!budget) return 'var(--text-muted)'
  const ratio = spent / budget
  if (ratio >= 1) return 'var(--rose)'
  if (ratio >= 0.8) return 'var(--amber)'
  return 'var(--green)'
}

export const monthKey = (date) => {
  const d = date || new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const monthLabel = (key) => {
  const [y, m] = key.split('-')
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export const prevMonth = (key) => {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return monthKey(d)
}

export const nextMonth = (key) => {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m, 1)
  return monthKey(d)
}

export const getCat = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
