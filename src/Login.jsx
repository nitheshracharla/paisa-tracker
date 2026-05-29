import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
        'auth/invalid-credential': 'Invalid email or password.',
      }
      setError(msgs[err.code] || 'Login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.grid} />
      <div style={styles.container}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>₹</span>
          <span style={styles.logoText}>paisa</span>
        </div>
        <p style={styles.tagline}>Track every rupee. Own your money.</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div style={styles.checkboxField}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              style={styles.checkbox}
            />
            <label htmlFor="rememberMe" style={styles.checkboxLabel}>Keep me logged in</label>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.9rem', marginTop: '4px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.note}>
          Two accounts supported. Create users in Firebase Console → Authentication.
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    pointerEvents: 'none',
  },
  container: {
    width: '100%',
    maxWidth: '380px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    position: 'relative',
    zIndex: 1,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    width: 44,
    height: 44,
    background: 'var(--green)',
    color: '#000',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
    fontWeight: '700',
    fontFamily: 'var(--font-mono)',
    flexShrink: 0,
    lineHeight: '44px',
    textAlign: 'center',
  },
  logoText: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: 'var(--text)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '-0.03em',
  },
  tagline: {
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
    marginTop: '-12px',
  },
  form: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  error: {
    background: 'var(--rose-dim)',
    border: '1px solid rgba(244,63,94,0.2)',
    color: 'var(--rose)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    fontSize: '0.8rem',
  },
  note: {
    color: 'var(--text-dim)',
    fontSize: '0.75rem',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  checkboxField: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: 'var(--green)',
  },
  checkboxLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    userSelect: 'none',
  },
}
