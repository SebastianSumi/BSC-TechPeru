import { useState } from 'react'

import { api } from '../lib/api'
import type { Comparacion, Periodo } from '../data/types'

export function ComparacionPanel({ periodos }: { periodos: Periodo[] }) {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [res, setRes] = useState<Comparacion | null>(null)
  const [cargando, setCargando] = useState(false)

  const comparar = async () => {
    if (!a || !b) return
    setCargando(true)
    try {
      setRes(await api.comparar(a, b))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={a}
            onChange={(e) => setA(e.target.value)}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <option value="">Período A</option>
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <span className="text-xs text-[var(--muted)]">vs</span>
          <select
            value={b}
            onChange={(e) => setB(e.target.value)}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <option value="">Período B</option>
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <button
            onClick={comparar}
            disabled={!a || !b || cargando}
            className="rounded-lg border px-2.5 py-1.5 text-xs disabled:opacity-50"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            Comparar
          </button>
        </div>
      </div>
      {res && (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-4">
            {res.porPerspectiva.map((p) => (
              <div
                key={p.perspectivaId}
                className="rounded-2xl border p-3"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <p className="text-xs font-semibold">{p.perspectiva}</p>
                <p className="text-sm tabular-nums">
                  {p.cumplimientoA}% → {p.cumplimientoB}%{' '}
                  <span style={{ color: p.variacion >= 0 ? '#22c55e' : '#ef4444' }}>
                    ({p.variacion >= 0 ? '+' : ''}
                    {p.variacion}%)
                  </span>
                </p>
              </div>
            ))}
          </div>
          <div className="bsc-card table-scroll">
            <table className="bsc-table">
              <thead>
                <tr>
                  <th className="p-2 text-left">KPI</th>
                  <th className="p-2 text-left">Perspectiva</th>
                  <th className="p-2 text-right">{res.periodoA?.nombre}</th>
                  <th className="p-2 text-right">{res.periodoB?.nombre}</th>
                  <th className="p-2 text-right">Variación</th>
                  <th className="p-2 text-center">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {res.kpis.map((k) => (
                  <tr key={k.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="p-2">
                      {k.id} — {k.nombre}
                    </td>
                    <td className="p-2 text-[var(--muted)]">{k.perspectiva}</td>
                    <td className="p-2 text-right tabular-nums">{k.cumplimientoA}%</td>
                    <td className="p-2 text-right tabular-nums">{k.cumplimientoB}%</td>
                    <td
                      className="p-2 text-right tabular-nums"
                      style={{ color: k.variacion >= 0 ? '#22c55e' : '#ef4444' }}
                    >
                      {k.variacion >= 0 ? '+' : ''}
                      {k.variacion}%
                    </td>
                    <td className="p-2 text-center">{k.tendencia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
