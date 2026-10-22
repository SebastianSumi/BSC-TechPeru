import { useEffect, useMemo, useState } from 'react'
import { Network } from 'lucide-react'
import { api } from '../lib/api'
import type { MapaEstrategico, Objetivo, Periodo } from '../data/types'

export function MapaEstrategicoView({ periodos }: { periodos: Periodo[] }) {
  const [mapa, setMapa] = useState<MapaEstrategico | null>(null)
  const [periodoId, setPeriodoId] = useState('')
  const [cargando, setCargando] = useState(true)

  const cargar = () => {
    setCargando(true)
    api
      .mapaEstrategico(periodoId || undefined)
      .then(setMapa)
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoId])

  const porPerspectiva = useMemo(() => {
    const out: Record<string, Objetivo[]> = {}
    for (const o of mapa?.objetivos ?? []) {
      out[o.perspectivaId] = out[o.perspectivaId] || []
      out[o.perspectivaId].push(o)
    }
    return out
  }, [mapa])

  const col = {
    financiera: '#10b981',
    clientes: '#3b82f6',
    procesos: '#f59e0b',
    aprendizaje: '#8b5cf6',
  } as Record<string, string>

  const ord = ['aprendizaje', 'procesos', 'clientes', 'financiera']

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Network size={18} className="text-[#3b82f6]" /> Mapa Estratégico (Causa-Efecto)
        </h2>
        <select
          value={periodoId}
          onChange={(e) => setPeriodoId(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-sm"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <option value="">Sin período</option>
          {periodos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>
      {cargando ? (
        <p className="text-sm text-[var(--muted)]">Cargando…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {ord.map((pid) => (
            <div
              key={pid}
              className="rounded-2xl border p-3"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <p className="mb-2 text-sm font-semibold capitalize" style={{ color: col[pid] }}>
                {mapa?.perspectivas.find((p) => p.id === pid)?.nombre ?? pid}
              </p>
              <div className="space-y-2">
                {(porPerspectiva[pid] ?? []).map((o) => (
                  <div
                    key={o.id}
                    className="rounded-xl border p-3"
                    style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                  >
                    <p className="text-xs font-semibold">{o.codigo}</p>
                    <p className="text-xs text-[var(--muted)]">{o.nombre}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span>Pond. {o.ponderacion ?? 0}%</span>
                      <span className="font-semibold" style={{ color: col[pid] }}>
                        {o.indice ?? 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div
        className="rounded-2xl border p-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="mb-2 text-sm font-semibold">Relaciones de causa-efecto</p>
        <div className="flex flex-wrap gap-2">
          {(mapa?.relaciones ?? []).map((r) => {
            const c = mapa?.objetivos.find((o) => o.id === r.causaId)?.codigo
            const e = mapa?.objetivos.find((o) => o.id === r.efectoId)?.codigo
            return (
              <span
                key={r.id}
                className="rounded-lg border px-2 py-1 text-[11px]"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
              >
                {c} → {e}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
