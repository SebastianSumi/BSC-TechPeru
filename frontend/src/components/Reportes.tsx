import { useEffect, useMemo, useState } from 'react'
import { Download, FileBarChart, Filter, Printer } from 'lucide-react'
import { api } from '../lib/api'
import { ESTADO_META } from '../lib/bsc'
import { PERSPECTIVAS } from '../data/kpis'
import { CumplimientoBar, EstadoBadge } from './EstadoBadge'
import { useAuth } from '../store/useAuth'
import type { Periodo, Reporte, Usuario } from '../data/types'

export function Reportes({ periodoId }: { periodoId?: string | null }) {
  const { puede } = useAuth()
  const [reporte, setReporte] = useState<Reporte | null>(null)
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [perspectiva, setPerspectiva] = useState('')
  const [periodo, setPeriodo] = useState(periodoId ?? '')
  const [usuario, setUsuario] = useState('')
  const [loading, setLoading] = useState(false)

  const puedeVerUsuarios = puede('ADMIN', 'GERENTE', 'ANALISTA')

  useEffect(() => {
    api.listarPeriodos().then(setPeriodos).catch(() => {})
    if (puedeVerUsuarios) api.listarUsuarios().then(setUsuarios).catch(() => {})
  }, [puedeVerUsuarios])

  useEffect(() => {
    setPeriodo(periodoId ?? '')
  }, [periodoId])

  useEffect(() => {
    setLoading(true)
    api
      .reporte({
        perspectivaId: perspectiva || undefined,
        periodoId: periodo || undefined,
        usuarioId: usuario || undefined,
      })
      .then(setReporte)
      .catch(() => setReporte(null))
      .finally(() => setLoading(false))
  }, [perspectiva, periodo, usuario])

  const exportCsv = useMemo(
    () => () => {
      if (!reporte) return
      const headers = ['Perspectiva', 'Objetivo', 'KPI', 'Unidad', 'Meta', 'Real', '% Cumpl.', 'Estado']
      const rows = reporte.kpis.map((k) => [
        k.perspectivaId,
        k.objetivo,
        k.nombre,
        k.unidad,
        k.meta,
        k.real,
        k.cumplimiento,
        k.estado,
      ])
      const csv = [headers, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n')
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-bsc-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    },
    [reporte],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <FileBarChart size={20} className="text-[#3b82f6]" /> Reportes dinámicos
        </h2>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            disabled={!reporte}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={() => window.print()}
            disabled={!reporte}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>

      <div
        className="flex flex-wrap items-end gap-3 rounded-2xl border p-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
          <Filter size={14} /> Filtros
        </span>

        <div>
          <label className="mb-1 block text-[11px] text-[var(--muted)]">Perspectiva</label>
          <select
            value={perspectiva}
            onChange={(e) => setPerspectiva(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-sm outline-none"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <option value="">Todas</option>
            {PERSPECTIVAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-[var(--muted)]">Período</label>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-sm outline-none"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <option value="">Sin período (base)</option>
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        {puedeVerUsuarios && (
          <div>
            <label className="mb-1 block text-[11px] text-[var(--muted)]">Responsable</label>
            <select
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="rounded-lg border px-3 py-1.5 text-sm outline-none"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <option value="">Todos</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && <p className="text-sm text-[var(--muted)]">Generando reporte…</p>}

      {reporte && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Índice global" valor={`${reporte.resumen.indiceGlobal}%`} color="#3b82f6" />
            <Metric label="Logrado" valor={reporte.resumen.logrado} color={ESTADO_META.logrado.color} />
            <Metric label="En riesgo" valor={reporte.resumen.riesgo} color={ESTADO_META.riesgo.color} />
            <Metric label="Crítico" valor={reporte.resumen.critico} color={ESTADO_META.critico.color} />
          </div>

          <div
            className="overflow-hidden rounded-2xl border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    <Th>KPI</Th>
                    <Th>Objetivo</Th>
                    <Th className="text-right">Meta</Th>
                    <Th className="text-right">Real</Th>
                    <Th className="text-right">% Cumpl.</Th>
                    <Th>Estado</Th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.kpis.map((k) => (
                    <tr key={k.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-3 py-2.5">
                        <p className="font-medium">{k.nombre}</p>
                        <div className="mt-1 w-32">
                          <CumplimientoBar pct={k.cumplimiento} estado={k.estado} />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-[var(--muted)]">{k.objetivo}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{k.meta}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{k.real}</td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{k.cumplimiento}%</td>
                      <td className="px-3 py-2.5">
                        <EstadoBadge estado={k.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {reporte.kpis.length === 0 && (
              <p className="p-6 text-center text-sm text-[var(--muted)]">
                No hay KPIs para los filtros seleccionados.
              </p>
            )}
          </div>

          {reporte.criticos.length > 0 && (
            <div
              className="rounded-2xl border p-4"
              style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.35)' }}
            >
              <p className="mb-2 text-sm font-semibold text-[#ef4444]">
                ❌ KPIs críticos ({reporte.criticos.length})
              </p>
              <ul className="space-y-1 text-sm">
                {reporte.criticos.map((k) => (
                  <li key={k.id} className="flex items-center justify-between gap-3">
                    <span>{k.nombre}</span>
                    <span className="font-semibold tabular-nums text-[#ef4444]">
                      {k.cumplimiento}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-center text-[11px] text-[var(--muted)]">
            Generado el {new Date(reporte.generadoEn).toLocaleString()}
          </p>
        </>
      )}
    </div>
  )
}

function Metric({ label, valor, color }: { label: string; valor: string | number; color: string }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
      <p className="text-2xl font-bold tabular-nums" style={{ color }}>
        {valor}
      </p>
    </div>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2.5 text-left text-xs font-semibold text-[var(--muted)] ${className}`}>
      {children}
    </th>
  )
}
