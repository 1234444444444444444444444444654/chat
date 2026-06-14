'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'register') {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        setLoading(false)
        return
      }
    }

    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/chat')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>✦</div>
        <h1 style={styles.title}>ChatApp</h1>
        <p style={styles.subtitle}>
          {mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta gratis'}
        </p>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(mode === 'login' ? styles.tabActive : {}) }}
            onClick={() => { setMode('login'); setError('') }}
          >
            Iniciar sesión
          </button>
          <button
            style={{ ...styles.tab, ...(mode === 'register' ? styles.tabActive : {}) }}
            onClick={() => { setMode('register'); setError('') }}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={submit} style={styles.form}>
          {mode === 'register' && (
            <input
              name="name"
              placeholder="Tu nombre"
              value={form.name}
              onChange={handle}
              required
              style={styles.input}
            />
          )}
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handle}
            required
            style={styles.input}
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handle}
            required
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
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
  },
  card: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    fontSize: '32px',
    color: 'var(--accent)',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: 'var(--text)',
  },
  subtitle: {
    color: 'var(--text2)',
    fontSize: '14px',
    textAlign: 'center',
  },
  tabs: {
    display: 'flex',
    background: 'var(--bg3)',
    borderRadius: '10px',
    padding: '4px',
    gap: '4px',
    width: '100%',
  },
  tab: {
    flex: 1,
    padding: '8px',
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    color: 'var(--text2)',
    fontSize: '14px',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'var(--bg2)',
    color: 'var(--text)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
  },
  input: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: 'var(--text)',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.15s',
  },
  error: {
    color: 'var(--danger)',
    fontSize: '13px',
    textAlign: 'center',
  },
  btn: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '13px',
    fontSize: '15px',
    fontWeight: '600',
    marginTop: '4px',
    transition: 'background 0.15s',
  },
}
