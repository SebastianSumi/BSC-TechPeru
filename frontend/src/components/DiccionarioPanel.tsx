import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { api } from '../lib/api'
import type { Kpi, Periodo } from '../data/types'
import { PERSPECTIVAS } from '../data/kpis'
import { EstadoBadge } from './EstadoBadge'

export function DiccionarioPanel({ periodos }: { periodos: Periodo[] }) {
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [periodoId, setPeriodoId] = useState('')
  const [perspectivaId, setPerspectivaId] = useState('')
  const [cargando, setCargando] = useState(true)

  const cargar = () => {
    setCargando(true)
    api
      .diccionario(perspectivaId || undefined, periodoId || undefined)
      .then(setKpis)
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoId, perspectivaId])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <BookOpen size={18} className="text-[#8b5cf6]" /> Diccionario de Indicadores (RF-04/RF-20)
        </h2>
        <div className="flex gap-2">
          <select
            value={perspectivaId}
            onChange={(e) => setPerspectivaId(e.target.value)}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <option value="">Todas las perspectivas</option>
            {PERSPECTIVAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <select
            value={periodoId}
            onChange={(e) => setPeriodoId(e.target.value)}
            className="rounded-lg border px-2 py-1.5 text-xs"
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
      </div>
      <div className="overflow-x-auto rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              <th className="p-2 text-left">Código</th>
              <th className="p-2 text-left">Indicador</th>
              <th className="p-2 text-left">Objetivo</th>
              <th className="p-2 text-left">Fórmula</th>
              <th className="p-2 text-left">Unidad</th>
              <th className="p-2 text-left">Frecuencia</th>
              <th className="p-2 text-left">Fuente</th>
              <th className="p-2 text-left">Resp. validación</th>
              <th className="p-2 text-right">Meta</th>
              <th className="p-2 text-right">Real</th>
              <th className="p-2 text-center">Umbrales</th>
              <th className="p-2 text-center">Cumpl.</th>
            </tr>
          </thead>
          <tbody>
            {kpis.map((k) => (
              <tr key={k.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="p-2 font-semibold">{k.id}</td>
                <td className="p-2">{k.nombre}</td>
                <td className="p-2 text-[var(--muted)]">{k.objetivo}</td>
                <td className="p-2 text-[var(--muted)]">{k.formula}</td>
                <td className="p-2">{k.unidad}</td>
                <td className="p-2">{k.frecuencia}</td>
                <td className="p-2 text-[var(--muted)]">{k.fuenteDatos}</td>
                <td className="p-2 text-[var(--muted)]">{k.responsableValidacion}</td>
                <td className="p-2 text-right tabular-nums">{k.meta}</td>
                <td className="p-2 text-right tabular-nums">{k.real}</td>
                <td className="p-2 text-center text-[var(--muted)]">
                  ≥{k.umbralCumplido ?? 90} / ≥{k.umbralAlerta ?? 75}
                </td>
                <td className="p-2 text-center">
                  <EstadoBadge estado={(k.estado as never) ?? 'riesgo'} pct={k.cumplimiento ?? 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cargando && <p className="p-3 text-center text-xs text-[var(--muted)]">Cargando…</p>}
      </div>
    </div>
  )
}
