import { useState } from 'react'
import { Activity, Loader2 } from 'lucide-react'
import { useAuth } from '../store/useAuth'

const DEMO = [
  { email: 'admin@techperu.pe', password: 'admin123', rol: 'ADMIN' },
  { email: 'gerente@techperu.pe', password: 'gerente123', rol: 'GERENTE' },
  { email: 'analista@techperu.pe', password: 'analista123', rol: 'ANALISTA' },
  { email: 'responsable@techperu.pe', password: 'responsable123', rol: 'RESPONSABLE' },
]

export function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('admin@techperu.pe')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch {
      setError('Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div
        className="w-full max-w-md rounded-2xl border p-6"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Activity className="text-[#3b82f6]" /> BSC TechPeru SAC
        </h1>
        <p className="mt-1 mb-5 text-sm text-[var(--muted)]">
          Balanced Scorecard 2025 · Inicia sesión
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>

          {error && <p className="text-sm text-[#ef4444]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ background: '#3b82f6' }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Iniciar sesión
          </button>
        </form>

        <div className="mt-5 rounded-xl border p-3" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
          <p className="mb-2 text-xs font-semibold text-[var(--muted)]">Usuarios de demostración</p>
          <div className="space-y-1">
            {DEMO.map((u) => (
              <button
                key={u.email}
                onClick={() => {
                  setEmail(u.email)
                  setPassword(u.password)
                }}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-[var(--surface)]"
              >
                <span>{u.email}</span>
                <span className="rounded bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                  {u.rol}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
