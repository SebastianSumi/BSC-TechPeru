import { useEffect, useState } from 'react'
import { RefreshCcw } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import type { Alerta, Periodo } from '../data/types'

export function AlertasPanel({ periodos }: { periodos: Periodo[] }) {
  const { puede } = useAuth()
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [periodoId, setPeriodoId] = useState('')
  const [generando, setGenerando] = useState(false)

  const cargar = () => api.listarAlertas().then(setAlertas).catch(() => {})
  useEffect(() => {
    cargar()
  }, [])

  const generar = async () => {
    if (!periodoId) return
    setGenerando(true)
    try {
      await api.generarAlertas(periodoId)
      cargar()
    } finally {
      setGenerando(false)
    }
  }

  const reconocer = async (id: string) => {
    await api.actualizarAlerta(id, { estado: 'RECONOCIDA' })
    cargar()
  }

  const resolver = async (id: string) => {
    await api.actualizarAlerta(id, { estado: 'RESUELTA' })
    cargar()
  }

  const puedeGestionar = puede('ADMIN', 'GERENTE', 'ANALISTA')
  const sevColor: Record<string, string> = {
    INFO: '#94a3b8',
    ADVERTENCIA: '#f59e0b',
    CRITICA: '#ef4444',
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {puedeGestionar && (
          <div className="flex items-center gap-2">
            <select
              value={periodoId}
              onChange={(e) => setPeriodoId(e.target.value)}
              className="rounded-lg border px-2 py-1.5 text-xs"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <option value="">Período...</option>
              {periodos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <button
              onClick={generar}
              disabled={!periodoId || generando}
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs disabled:opacity-50"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <RefreshCcw size={13} className={generando ? 'animate-spin' : ''} /> Generar alertas
            </button>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {alertas.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full" style={{ background: sevColor[a.severidad] }} />
              <div>
                <p className="text-sm">{a.mensaje}</p>
                <p className="text-[11px] text-[var(--muted)]">
                  {a.tipo} · {a.severidad} · {a.estado} · {new Date(a.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {a.estado === 'NUEVA' && (
                <button onClick={() => reconocer(a.id)} className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: 'var(--border)' }}>
                  Reconocer
                </button>
              )}
              {(a.estado === 'NUEVA' || a.estado === 'RECONOCIDA') && (
                <button onClick={() => resolver(a.id)} className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: 'var(--border)' }}>
                  Resolver
                </button>
              )}
            </div>
          </div>
        ))}
        {alertas.length === 0 && <p className="text-sm text-[var(--muted)]">Sin alertas.</p>}
      </div>
    </div>
  )
}
