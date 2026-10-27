import { useEffect, useMemo, useState } from 'react'
import { Download, Filter, Printer, X } from 'lucide-react'
import { api } from '../lib/api'
import { ESTADO_META } from '../lib/bsc'
import { CumplimientoBar, EstadoBadge } from './EstadoBadge'
import { useAuth } from '../store/useAuth'
import type {
  Periodo,
  Perspectiva,
  ReporteObjetivo,
  ReporteObjetivoDetalle,
  ReporteObjetivos,
  Usuario,
} from '../data/types'
import { Select } from './Select'

export function Reportes({ periodoId }: { periodoId?: string | null }) {
  const { puede } = useAuth()
  const [reporte, setReporte] = useState<ReporteObjetivos | null>(null)
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [perspectivas, setPerspectivas] = useState<Perspectiva[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [perspectiva, setPerspectiva] = useState('')
  const [periodo, setPeriodo] = useState(periodoId ?? '')
  const [usuario, setUsuario] = useState('')
  const [estado, setEstado] = useState('')
  const [detalle, setDetalle] = useState<ReporteObjetivoDetalle | null>(null)
  const [loading, setLoading] = useState(false)

  const puedeVerUsuarios = puede('ADMIN', 'GERENTE')
  const filtros = useMemo(
    () => ({
      perspectivaId: perspectiva || undefined,
      responsableId: usuario || undefined,
      periodoId: periodo || undefined,
      estado: estado || undefined,
    }),
    [perspectiva, periodo, usuario, estado],
  )

  useEffect(() => {
    api.listarPeriodos().then(setPeriodos).catch(() => {})
    api.listarPerspectivas().then(setPerspectivas).catch(() => {})
    if (puedeVerUsuarios) api.listarUsuarios().then(setUsuarios).catch(() => {})
  }, [puedeVerUsuarios])

  useEffect(() => {
    setPeriodo(periodoId ?? '')
  }, [periodoId])

  useEffect(() => {
    setLoading(true)
    api
      .reporteObjetivos(filtros)
      .then(setReporte)
      .catch(() => setReporte(null))
      .finally(() => setLoading(false))
  }, [filtros])

  const exportar = async () => {
    const { blob, nombreArchivo } = await api.exportarReporteObjetivos(filtros)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivo || 'reporte-objetivos.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const abrirDetalle = (objetivo: ReporteObjetivo) => {
    setDetalle(null)
    api
      .reporteObjetivo(objetivo.id, {
        periodoId: periodo || undefined,
        estado: estado || undefined,
      })
      .then(setDetalle)
      .catch(() => setDetalle(null))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={exportar}
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

      <div className="bsc-card flex flex-wrap items-end gap-3 p-4">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
          <Filter size={14} /> Filtros
        </span>

        <div>
          <label className="mb-1 block text-[11px] text-[var(--muted)]">Perspectiva</label>
          <Select
            value={perspectiva}
            onChange={(e) => setPerspectiva(e.target.value)}
            className="bsc-select">
            <option value="">Todas</option>
            {perspectivas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-[var(--muted)]">Período</label>
          <Select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="bsc-select">
            <option value="">Sin período (base)</option>
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-[var(--muted)]">Estado</label>
          <Select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="bsc-select">
            <option value="">Todos</option>
            <option value="LOGRADO">Logrado</option>
            <option value="EN_RIESGO">En riesgo</option>
            <option value="CRITICO">Crítico</option>
          </Select>
        </div>

        {puedeVerUsuarios && (
          <div>
            <label className="mb-1 block text-[11px] text-[var(--muted)]">Responsable</label>
            <Select
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="bsc-select">
              <option value="">Todos</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.rol})
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {loading && <p className="text-sm text-[var(--muted)]">Generando reporte.</p>}

      {reporte && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Objetivos" valor={reporte.resumen.totalObjetivos} color="#3b82f6" />
            <Metric
              label="Cumplimiento"
              valor={`${reporte.resumen.promedioObjetivos}%`}
              color="#7354c8"
            />
            <Metric label="Logrados" valor={reporte.resumen.logrados} color={ESTADO_META.logrado.color} />
            <Metric label="En riesgo" valor={reporte.resumen.enRiesgo} color={ESTADO_META.riesgo.color} />
            <Metric label="Críticos" valor={reporte.resumen.criticos} color={ESTADO_META.critico.color} />
          </div>

          <div className="bsc-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="bsc-table">
                <thead>
                  <tr>
                    <Th>Objetivo</Th>
                    <Th>Perspectiva</Th>
                    <Th>Responsable</Th>
                    <Th className="text-right">KPIs</Th>
                    <Th className="text-right">% Cumpl.</Th>
                    <Th>Estado</Th>
                    <Th>Tareas</Th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.objetivos.map((o) => (
                    <tr
                      key={o.id}
                      className="cursor-pointer border-t transition hover:bg-[var(--surface-2)]"
                      style={{ borderColor: 'var(--border)' }}
                      onClick={() => abrirDetalle(o)}
                    >
                      <td className="px-3 py-2.5">
                        <p className="font-medium">{o.nombre}</p>
                        <p className="text-[10px] text-[var(--muted)]">{o.codigo}</p>
                      </td>
                      <td className="px-3 py-2.5 text-xs">{o.perspectivaNombre}</td>
                      <td className="px-3 py-2.5 text-xs text-[var(--muted)]">
                        {o.responsableNombre ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{o.totalKpis}</td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                        {o.cumplimiento}%
                      </td>
                      <td className="px-3 py-2.5">
                        <EstadoBadge estado={o.estadoKey} />
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-[var(--muted)]">
                        {o.tareas.completadas}/{o.tareas.total} completadas
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {reporte.objetivos.length === 0 && (
              <p className="p-6 text-center text-sm text-[var(--muted)]">
                No hay objetivos para los filtros seleccionados.
              </p>
            )}
          </div>

          <p className="text-center text-[11px] text-[var(--muted)]">
            Generado el {new Date(reporte.generadoEn).toLocaleString()}
          </p>
        </>
      )}

      {detalle && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setDetalle(null)}
        >
          <div
            className="bsc-card my-6 w-full max-w-5xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {detalle.codigo} · {detalle.perspectivaNombre}
                </p>
                <h2 className="text-lg font-bold">{detalle.nombre}</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">{detalle.descripcion}</p>
              </div>
              <button onClick={() => setDetalle(null)} className="rounded-lg border p-1.5">
                <X size={16} />
              </button>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-4">
              <Metric label="Cumplimiento" valor={`${detalle.cumplimiento}%`} color="#3b82f6" />
              <Metric label="KPIs" valor={detalle.totalKpis} color="#7354c8" />
              <Metric label="Tareas" valor={detalle.tareas.total} color="#b97708" />
              <Metric
                label="Evidencias"
                valor={detalle.evidencias?.length ?? 0}
                color="#16845b"
              />
            </div>

            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Indicadores
            </h3>
            <div className="overflow-x-auto">
              <table className="bsc-table">
                <thead>
                  <tr>
                    <Th>KPI</Th>
                    <Th className="text-right">Meta</Th>
                    <Th className="text-right">Real</Th>
                    <Th className="text-right">% Cumpl.</Th>
                    <Th>Estado</Th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.kpis.map((k) => (
                    <tr key={k.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-3 py-2">
                        <p className="font-medium">{k.nombre}</p>
                        <div className="mt-1 w-32">
                          <CumplimientoBar pct={k.cumplimiento} estado={k.estadoKey} />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{k.meta}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{k.real}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">
                        {k.cumplimiento}%
                      </td>
                      <td className="px-3 py-2">
                        <EstadoBadge estado={k.estadoKey} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Tareas y resultados
            </h3>
            <div className="space-y-2">
              {detalle.tareasDetalle.length === 0 && (
                <p className="text-xs text-[var(--muted)]">Sin tareas registradas.</p>
              )}
              {detalle.tareasDetalle.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border p-3"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{t.titulo}</p>
                    <span className="text-[10px] font-semibold text-[var(--muted)]">
                      {t.estado} · {t.avance}%
                    </span>
                  </div>
                  <div className="bsc-progress mt-2">
                    <span style={{ width: `${t.avance}%`, background: '#3b82f6' }} />
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    {t.responsable?.nombre ?? 'Sin responsable'} · {t.resultadosValidados}/
                    {t.totalResultados} resultados validados · {t.totalEvidencias} evidencias
                  </p>
                </div>
              ))}
            </div>

            {detalle.recomendacionFijada && (
              <div
                className="mt-5 rounded-xl border p-3"
                style={{ background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.35)' }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#3b82f6]">
                  Recomendación fijada
                </p>
                <p className="mt-1 text-sm">{detalle.recomendacionFijada}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ label, valor, color }: { label: string; valor: string | number; color: string }) {
  return (
    <div className="bsc-card p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
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
