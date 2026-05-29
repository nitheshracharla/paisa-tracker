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
  rent: 25, emi: 15, food: 15, travel: 5, fuel: 5, savings: 10,
  utility: 5, healthcare: 3, entertainment: 3, shopping: 5,
  subscriptions: 2, education: 2, miscellaneous: 5,
}
 
// ── Sub-category keyword rules ───────────────────────────────────────────────
export const SUB_CATEGORY_RULES = {
  food: {
    'Beverages':        ['tea', 'coffee', 'chai', 'juice', 'lassi', 'buttermilk', 'smoothie', 'shake', 'cold coffee', 'lemonade', 'soda', 'drink', 'coconut water', 'nimbu', 'jaljeera', 'milkshake', 'horlicks', 'boost', 'bournvita', 'hot chocolate', 'green tea', 'herbal'],
    'Breakfast':        ['dosa', 'idli', 'poha', 'upma', 'paratha', 'sandwich', 'bread', 'omelette', 'egg', 'breakfast', 'vada', 'uttapam', 'puri', 'bhature', 'aloo puri', 'cornflakes', 'cereal', 'toast', 'idly', 'medu vada', 'pesarattu', 'appam', 'puttu'],
    'Lunch':            ['lunch', 'rice', 'dal', 'sabzi', 'thali', 'biryani', 'pulao', 'curry', 'roti', 'chapati', 'afternoon meal', 'meals', 'sambar rice', 'curd rice', 'lemon rice'],
    'Dinner':           ['dinner', 'night food', 'supper', 'pizza', 'burger', 'pasta', 'noodles', 'chinese', 'north indian', 'mughlai'],
    'Snacks':           ['snack', 'chips', 'biscuit', 'cookie', 'namkeen', 'popcorn', 'samosa', 'kachori', 'bhajji', 'pakora', 'chaat', 'panipuri', 'bhelpuri', 'street food', 'pani puri', 'sev puri', 'dabeli', 'vada pav', 'pav bhaji'],
    'Sweets & Desserts':['sweet', 'dessert', 'ice cream', 'kulfi', 'halwa', 'mithai', 'cake', 'pastry', 'chocolate', 'brownie', 'gulab jamun', 'rasgulla', 'ladoo', 'barfi', 'kheer'],
    'Online Orders':    ['swiggy', 'zomato', 'delivery', 'online order', 'food delivery', 'dunzo'],
    'Groceries':        ['grocery', 'vegetables', 'veggies', 'fruits', 'milk', 'supermarket', 'kirana', 'market', 'mandi', 'ration', 'provisions', 'bigbasket', 'blinkit', 'zepto', 'instamart', 'dmart'],
    'Restaurants':      ['restaurant', 'hotel', 'cafe', 'dhaba', 'canteen', 'mess', 'cafeteria', 'bistro', 'lounge', 'bar', 'pub', 'eatery'],
  },
  travel: {
    'Auto / Cab':   ['auto', 'cab', 'ola', 'uber', 'rapido', 'rickshaw', 'taxi', 'tuk tuk', 'autorickshaw'],
    'Metro / Bus':  ['metro', 'bus', 'local train', 'transit', 'ticket', 'pass', 'commute', 'bmtc', 'ksrtc', 'dtc', 'best bus'],
    'Train':        ['train', 'irctc', 'railway', 'rail', 'sleeper', 'ac coach', 'tatkal'],
    'Flight':       ['flight', 'air', 'airline', 'airport', 'boarding', 'indigo', 'air india', 'spicejet', 'vistara', 'goair'],
    'Hotel / Stay': ['hotel', 'stay', 'lodge', 'hostel', 'accommodation', 'room', 'oyo', 'airbnb', 'resort', 'inn', 'guesthouse'],
    'Intercity':    ['intercity', 'highway', 'outstation', 'trip', 'tour', 'vacation', 'holiday'],
    'Toll':         ['toll', 'fastag', 'toll booth'],
  },
  fuel: {
    'Petrol':      ['petrol', 'fuel fill', 'fill up', 'pump', 'filling station'],
    'Diesel':      ['diesel'],
    'EV Charging': ['ev', 'electric', 'charging', 'charge', 'ather', 'ola electric'],
    'Fastag / Toll':['fastag', 'toll', 'highway toll'],
    'Maintenance': ['service', 'oil change', 'tyre', 'tire', 'puncture', 'repair', 'wash'],
  },
  utility: {
    'Electricity':    ['electricity', 'electric bill', 'power', 'bescom', 'tneb', 'mseb', 'cesc', 'adani electricity'],
    'Internet':       ['internet', 'wifi', 'broadband', 'jio fiber', 'airtel fiber', 'bsnl broadband', 'act'],
    'Mobile':         ['recharge', 'mobile bill', 'phone bill', 'prepaid', 'postpaid', 'jio', 'airtel', 'vi ', 'vodafone', 'bsnl mobile'],
    'Gas / LPG':      ['gas', 'lpg', 'cylinder', 'cooking gas', 'hp gas', 'indane', 'bharat gas'],
    'Water':          ['water', 'water bill', 'bwssb', 'water board'],
    'Maintenance':    ['maintenance', 'society', 'apartment', 'association fee', 'parking'],
  },
  healthcare: {
    'Doctor':      ['doctor', 'consultation', 'clinic', 'hospital', 'checkup', 'opd', 'physician', 'specialist', 'dr.', 'appointment'],
    'Medicine':    ['medicine', 'pharmacy', 'tablet', 'capsule', 'drug', 'medplus', 'apollo pharmacy', 'netmeds', '1mg', 'strips', 'syrup'],
    'Lab Tests':   ['lab', 'test', 'blood test', 'scan', 'xray', 'x-ray', 'report', 'pathology', 'diagnostic', 'thyrocare', 'lal path'],
    'Gym / Fitness':['gym', 'fitness', 'yoga', 'workout', 'sports', 'swimming', 'membership', 'cult fit', 'cult.fit', 'crossfit', 'zumba'],
    'Dental':      ['dental', 'dentist', 'teeth', 'tooth', 'braces'],
    'Optical':     ['optical', 'spectacles', 'glasses', 'contact lens', 'lenskart'],
  },
  entertainment: {
    'Movies':        ['movie', 'cinema', 'theatre', 'pvr', 'inox', 'bookmyshow', 'film', 'multiplex'],
    'Dining Out':    ['dinner out', 'restaurant', 'dining', 'eat out', 'cafe date', 'brunch', 'bistro'],
    'Events':        ['event', 'concert', 'show', 'game', 'cricket', 'stadium', 'match', 'live show', 'comedy', 'stand up'],
    'Gaming':        ['game', 'gaming', 'playstation', 'xbox', 'steam', 'play store', 'in-app'],
    'Streaming':     ['netflix', 'prime video', 'hotstar', 'zee5', 'sony liv', 'disney', 'mxplayer', 'youtube premium', 'spotify'],
    'Outings':       ['outing', 'picnic', 'park', 'mall', 'bowling', 'amusement', 'theme park', 'zoo'],
  },
  shopping: {
    'Clothing':       ['clothes', 'shirt', 'tshirt', 't-shirt', 'jeans', 'dress', 'saree', 'kurta', 'shoes', 'footwear', 'apparel', 'top', 'trouser', 'pant', 'jacket', 'hoodie', 'sneakers', 'chappal', 'sandal'],
    'Electronics':    ['phone', 'laptop', 'mobile', 'gadget', 'electronics', 'earphone', 'earbuds', 'charger', 'cable', 'power bank', 'headphone', 'speaker', 'keyboard', 'mouse', 'hard disk'],
    'Personal Care':  ['haircut', 'salon', 'spa', 'grooming', 'cosmetics', 'makeup', 'skincare', 'shampoo', 'soap', 'face wash', 'moisturizer', 'perfume', 'deodorant', 'beard', 'wax', 'threading'],
    'Home & Kitchen': ['home', 'kitchen', 'utensil', 'furniture', 'decor', 'cleaning', 'detergent', 'broom', 'mop', 'bedsheet', 'pillow', 'curtain'],
    'Online Shopping':['amazon', 'flipkart', 'myntra', 'meesho', 'ajio', 'nykaa', 'online purchase', 'order'],
    'Stationery':     ['pen', 'notebook', 'stationery', 'paper', 'book', 'diary', 'folder'],
  },
  subscriptions: {
    'OTT':         ['netflix', 'prime', 'hotstar', 'zee5', 'sony', 'disney', 'mxplayer', 'youtube'],
    'Music':       ['spotify', 'gaana', 'jiosaavn', 'apple music', 'music'],
    'Cloud':       ['google one', 'icloud', 'dropbox', 'onedrive', 'cloud storage'],
    'Productivity':['notion', 'figma', 'canva', 'adobe', 'microsoft 365', 'office', 'slack'],
    'News/Learning':['medium', 'coursera', 'udemy', 'linkedin', 'newspaper', 'magazine'],
  },
  education: {
    'Courses':     ['course', 'class', 'coaching', 'tuition', 'workshop', 'training', 'certification', 'udemy', 'coursera'],
    'Books':       ['book', 'textbook', 'study material', 'notes'],
    'School/College':['fee', 'tuition fee', 'college', 'school', 'university', 'hostel fee', 'exam fee'],
    'Stationery':  ['pen', 'notebook', 'stationery', 'pen drive'],
  },
  miscellaneous: {
    'Gifts':       ['gift', 'present', 'birthday', 'anniversary', 'wedding', 'baby shower', 'housewarming'],
    'Charity':     ['donation', 'charity', 'temple', 'church', 'mosque', 'tithe', 'ngo'],
    'ATM / Cash':  ['atm', 'cash withdrawal', 'cash'],
    'Bank Charges':['bank charge', 'bank fee', 'penalty', 'fine', 'late fee'],
    'Pet':         ['pet', 'dog', 'cat', 'vet', 'pet food', 'grooming'],
  },
}
 
export const classifyNote = (note, categoryId) => {
  const rules = SUB_CATEGORY_RULES[categoryId]
  if (!rules) return null
  const lower = note.toLowerCase().trim()
  for (const [subCat, keywords] of Object.entries(rules)) {
    if (keywords.some(k => lower.includes(k))) return subCat
  }
  return null
}
 
// ── Helpers ──────────────────────────────────────────────────────────────────
export const fmt = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
 
export const pct = (spent, budget) => {
  if (!budget) return 0
  return Math.min((spent / budget) * 100, 100)
}
 
export const statusColor = (spent, budget) => {
  if (!budget) return 'var(--text-muted)'
  const r = spent / budget
  if (r >= 1) return 'var(--rose)'
  if (r >= 0.8) return 'var(--amber)'
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
  return monthKey(new Date(y, m - 2, 1))
}
 
export const nextMonth = (key) => {
  const [y, m] = key.split('-').map(Number)
  return monthKey(new Date(y, m, 1))
}
 
export const getCat = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
 
export const formatDate = (ts) => {
  try {
    const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  } catch { return '' }
}
 
export const HOUSEHOLD = 'main'
 
// ── CSV Export ───────────────────────────────────────────────────────────────
export const downloadCSV = (expenses, month) => {
  const header = ['Date', 'Category', 'Sub-Category', 'Description', 'Amount (₹)']
  const rows = [...expenses]
    .sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
    .map(e => {
      const cat = getCat(e.category)
      const subCat = classifyNote(e.note, e.category) || '—'
      const date = formatDate(e.date)
      return [date, cat.label, subCat, `"${e.note.replace(/"/g, '""')}"`, e.amount]
    })
  const csv = [header, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `paisa-expenses-${month}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
 
