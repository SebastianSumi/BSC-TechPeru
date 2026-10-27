import { useState } from 'react'
import { Activity, ArrowRight, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react'
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
      setError('Credenciales inválidas. Verifica tu correo y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="mb-9 flex items-center gap-2.5">
          <span className="bsc-brand-mark h-9 w-9">
            <Activity size={19} />
          </span>
          <span>
            <strong className="block text-[15px] font-bold tracking-tight text-[var(--navy)]">
              BSC TechPeru
            </strong>
            <small className="block text-[10px] text-[var(--muted)]">
              Balanced Scorecard 2025
            </small>
          </span>
        </div>

        <p className="page-head-eyebrow">Acceso corporativo</p>
        <h1 className="mt-1 text-[28px] font-extrabold leading-tight tracking-tight">
          Inicia sesión en tu<br />cuadro de mando
        </h1>
        <p className="mt-2 text-[13px] text-[var(--muted)]">
          Consulta el desempeño estratégico de TechPeru SAC y toma decisiones basadas en datos.
        </p>

        <form onSubmit={onSubmit} className="mt-7 grid gap-4">
          <div className="field-bsc">
            <label htmlFor="email">Correo electrónico</label>
            <div className="relative">
              <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="!pl-9"
                placeholder="usuario@techperu.pe"
              />
            </div>
          </div>

          <div className="field-bsc">
            <label htmlFor="password">Contraseña</label>
            <div className="relative">
              <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="!pl-9"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[11.5px] text-[#b91c1c]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-bsc btn-bsc-primary !py-2.5 text-[12px] disabled:opacity-60"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
            {loading ? 'Validando…' : 'Iniciar sesión'}
            {!loading && <ArrowRight size={14} className="ml-auto" />}
          </button>
        </form>

        <div className="demo-note">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-[var(--text)]">
            <ShieldCheck size={13} /> Cuentas de demostración
          </p>
          <div className="grid gap-1">
            {DEMO.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => {
                  setEmail(u.email)
                  setPassword(u.password)
                  setError('')
                }}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-white"
              >
                <span className="truncate">{u.email}</span>
                <span className="tag shrink-0">{u.rol}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <aside className="login-art">
        <div className="login-art-content">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a9c8ff]">
            Planeamiento estratégico
          </p>
          <h2>
            Gestiona la estrategia<br />con una mirada integral
          </h2>
          <p>
            Cuatro perspectivas, objetivos alineados e indicadores trazables para convertir el plan
            en decisiones medibles.
          </p>
          <div className="login-stats">
            <div>
              <b>4</b>
              <small>Perspectivas</small>
            </div>
            <div>
              <b>12</b>
              <small>Objetivos</small>
            </div>
            <div>
              <b>36</b>
              <small>Indicadores KPI</small>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
