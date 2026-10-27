import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import type { MapaEstrategico, Objetivo, Periodo } from '../data/types'

const COL: Record<string, string> = {
  financiera: '#16845b',
  clientes: '#2563eb',
  procesos: '#b97708',
  aprendizaje: '#7354c8',
}

const ORD = ['aprendizaje', 'procesos', 'clientes', 'financiera']

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <span className="text-[11px] text-[var(--muted)]">Período</span>
        <select
          value={periodoId}
          onChange={(e) => setPeriodoId(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-xs outline-none"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
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
        <p className="text-sm text-[var(--muted)]">Cargando mapa…</p>
      ) : (
        <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-4">
          {ORD.map((pid) => {
            const objs = porPerspectiva[pid] ?? []
            const nombre = mapa?.perspectivas.find((p) => p.id === pid)?.nombre ?? pid
            const color = COL[pid] ?? '#64748b'
            const promedio = objs.length
              ? Math.round(objs.reduce((a, o) => a + (o.indice ?? 0), 0) / objs.length)
              : 0
            return (
              <section key={pid} className="bsc-card overflow-hidden">
                <header
                  className="border-b px-4 py-3"
                  style={{ background: `${color}10`, borderColor: `${color}22` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p
                        className="text-[10px] font-extrabold uppercase tracking-[0.12em]"
                        style={{ color }}
                      >
                        Perspectiva
                      </p>
                      <p className="mt-0.5 text-[12px] font-bold text-[var(--text)]">{nombre}</p>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                      style={{ background: `${color}18`, color }}
                    >
                      {promedio}%
                    </span>
                  </div>
                  <p className="mt-1.5 text-[9.5px] text-[var(--muted)]">
                    {objs.length} objetivo(s) estratégico(s)
                  </p>
                </header>

                <div className="space-y-2 p-3">
                  {objs.length === 0 && (
                    <p className="py-4 text-center text-[11px] text-[var(--muted)]">Sin objetivos</p>
                  )}
                  {objs.map((o) => (
                    <article
                      key={o.id}
                      className="rounded-lg border p-3 transition hover:shadow-sm"
                      style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="tag">{o.codigo}</span>
                        <span className="text-[11px] font-bold tabular-nums" style={{ color }}>
                          {o.indice ?? 0}%
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11.5px] font-semibold leading-snug">{o.nombre}</p>
                      {o.descripcion && (
                        <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-[var(--muted)]">
                          {o.descripcion}
                        </p>
                      )}
                      <div className="bsc-progress mt-2">
                        <span style={{ width: `${Math.min(100, o.indice ?? 0)}%`, background: color }} />
                      </div>
                      <p className="mt-1.5 text-[9.5px] text-[var(--muted)]">
                        Ponderación {o.ponderacion ?? 0}%
                        {typeof o._count?.kpis === 'number' && ` · ${o._count.kpis} KPI`}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <section className="bsc-card bsc-panel">
        <div className="bsc-panel-head">
          <div>
            <h2>Relaciones de causa y efecto</h2>
            <p>Hipótesis estratégica que conecta las perspectivas del mapa.</p>
          </div>
          <span className="tag">{mapa?.relaciones?.length ?? 0} relaciones</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(mapa?.relaciones ?? []).length === 0 && (
            <p className="text-[11px] text-[var(--muted)]">No hay relaciones registradas.</p>
          )}
          {(mapa?.relaciones ?? []).map((r) => {
            const causa = mapa?.objetivos.find((o) => o.id === r.causaId)
            const efecto = mapa?.objetivos.find((o) => o.id === r.efectoId)
            return (
              <span
                key={r.id}
                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10.5px]"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
              >
                <span className="font-bold" style={{ color: COL[causa?.perspectivaId ?? ''] }}>
                  {causa?.codigo}
                </span>
                <span className="text-[var(--muted)]">→</span>
                <span className="font-bold" style={{ color: COL[efecto?.perspectivaId ?? ''] }}>
                  {efecto?.codigo}
                </span>
              </span>
            )
          })}
        </div>
      </section>
    </div>
  )
}
