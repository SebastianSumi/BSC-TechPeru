import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronUp, Plus, Send, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import type {
  EstadoTarea,
  Kpi,
  Objetivo,
  ResultadoTarea,
  Tarea,
  Usuario,
} from '../data/types'

const ESTADOS: { value: EstadoTarea; label: string }[] = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_PROCESO', label: 'En proceso' },
  { value: 'COMPLETADA', label: 'Completada' },
  { value: 'CANCELADA', label: 'Cancelada' },
]

const FORM_VACIO = {
  titulo: '',
  descripcion: '',
  objetivoId: '',
  kpiId: '',
  responsableId: '',
  fechaInicio: '',
  fechaFin: '',
  estado: 'PENDIENTE' as EstadoTarea,
  avance: 0,
}

export function TareasPanel() {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [form, setForm] = useState(FORM_VACIO)
  const [mostrar, setMostrar] = useState(false)
  const [expandida, setExpandida] = useState<string | null>(null)
  const [resultado, setResultado] = useState({ descripcion: '', valor: '' })

  const cargar = () => {
    Promise.all([
      api.listarTareas(),
      api.listarObjetivos(),
      api.listarKpis(),
      api.listarUsuarios().catch(() => []),
    ]).then(([ts, os, ks, us]) => {
      setTareas(ts)
      setObjetivos(os)
      setKpis(ks)
      setUsuarios(us)
      setForm((f) => ({
        ...f,
        objetivoId: f.objetivoId || os[0]?.id || '',
      }))
    })
  }
  useEffect(() => {
    cargar()
  }, [])

  const kpisObjetivo = useMemo(
    () => kpis.filter((k) => !form.objetivoId || k.objetivoId === form.objetivoId),
    [kpis, form.objetivoId],
  )

  const crear = async () => {
    if (!form.titulo.trim() || !form.objetivoId) return
    await api.crearTarea({
      titulo: form.titulo,
      descripcion: form.descripcion || undefined,
      objetivoId: form.objetivoId,
      kpiId: form.kpiId || undefined,
      responsableId: form.responsableId || undefined,
      fechaInicio: form.fechaInicio || undefined,
      fechaFin: form.fechaFin || undefined,
      estado: form.estado,
      avance: form.avance,
    })
    setForm({ ...FORM_VACIO, objetivoId: objetivos[0]?.id || '' })
    setMostrar(false)
    cargar()
  }

  const actualizar = async (t: Tarea, data: Record<string, unknown>) => {
    await api.actualizarTarea(t.id, data as Partial<Tarea>)
    cargar()
  }

  const eliminar = async (id: string) => {
    await api.eliminarTarea(id)
    cargar()
  }

  const crearResultado = async (t: Tarea) => {
    if (!resultado.descripcion.trim()) return
    await api.crearResultadoTarea(t.id, {
      descripcion: resultado.descripcion,
      valor: resultado.valor === '' ? undefined : Number(resultado.valor),
    })
    setResultado({ descripcion: '', valor: '' })
    cargar()
  }

  const validar = async (
    r: ResultadoTarea,
    estadoValidacion: 'VALIDADO' | 'RECHAZADO',
  ) => {
    await api.validarResultadoTarea(r.id, { estadoValidacion })
    cargar()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          onClick={() => setMostrar((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <Plus size={13} /> Nueva tarea
        </button>
      </div>

      {mostrar && (
        <div
          className="grid gap-2 rounded-2xl border p-3 sm:grid-cols-2 lg:grid-cols-4"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <input
            placeholder="Título"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <select
            value={form.objetivoId}
            onChange={(e) =>
              setForm({ ...form, objetivoId: e.target.value, kpiId: '' })
            }
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <option value="">Objetivo...</option>
            {objetivos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.codigo} · {o.nombre}
              </option>
            ))}
          </select>
          <select
            value={form.kpiId}
            onChange={(e) => setForm({ ...form, kpiId: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <option value="">KPI (opcional)</option>
            {kpisObjetivo.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nombre}
              </option>
            ))}
          </select>
          <select
            value={form.responsableId}
            onChange={(e) => setForm({ ...form, responsableId: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <option value="">Sin responsable</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={form.fechaInicio}
            onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <input
            type="date"
            value={form.fechaFin}
            onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <select
            value={form.estado}
            onChange={(e) =>
              setForm({ ...form, estado: e.target.value as EstadoTarea })
            }
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            max={100}
            value={form.avance}
            onChange={(e) => setForm({ ...form, avance: Number(e.target.value) })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <input
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs sm:col-span-2"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <button
            onClick={crear}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: '#3b82f6' }}
          >
            Guardar
          </button>
        </div>
      )}

      <div className="space-y-2">
        {tareas.map((t) => {
          const abierta = expandida === t.id
          const avance = Number(t.avance)
          return (
            <div
              key={t.id}
              className="rounded-2xl border p-3"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{t.titulo}</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {t.objetivo?.codigo ?? t.objetivoId} ·{' '}
                    {t.responsable?.nombre ?? 'Sin responsable'} ·{' '}
                    {t.kpi?.nombre ?? 'Sin KPI'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    value={t.estado}
                    onChange={(e) => actualizar(t, { estado: e.target.value })}
                    className="rounded-lg border px-2 py-1 text-[10px]"
                    style={{
                      background: 'var(--surface-2)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    {ESTADOS.map((e) => (
                      <option key={e.value} value={e.value}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => eliminar(t.id)}
                    className="rounded-lg border p-1.5 text-[#ef4444]"
                    title="Eliminar tarea"
                  >
                    <Trash2 size={13} />
                  </button>
                  <button
                    onClick={() => setExpandida(abierta ? null : t.id)}
                    className="rounded-lg border p-1.5"
                  >
                    {abierta ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={avance}
                  onChange={(e) => actualizar(t, { avance: Number(e.target.value) })}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full"
                  style={{ background: 'var(--border)', accentColor: '#3b82f6' }}
                />
                <span className="w-9 text-right text-[10px] font-semibold tabular-nums">
                  {avance}%
                </span>
              </div>

              {abierta && (
                <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Resultados
                  </p>
                  {(t.resultados ?? []).map((r) => (
                    <div
                      key={r.id}
                      className="rounded-lg border p-2"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs">{r.descripcion}</p>
                        <span
                          className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                          style={{
                            background:
                              r.estadoValidacion === 'VALIDADO'
                                ? '#e8f7ef'
                                : r.estadoValidacion === 'RECHAZADO'
                                  ? '#ffebed'
                                  : '#fff5dd',
                            color:
                              r.estadoValidacion === 'VALIDADO'
                                ? '#16845b'
                                : r.estadoValidacion === 'RECHAZADO'
                                  ? '#c23a42'
                                  : '#b97708',
                          }}
                        >
                          {r.estadoValidacion}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                        {r.valor !== null && r.valor !== undefined ? `Valor: ${r.valor} · ` : ''}
                        {r.aplicadoKpi ? 'Aplicado al KPI' : 'No aplicado al KPI'}
                      </p>
                      {r.estadoValidacion === 'PENDIENTE' && (
                        <div className="mt-1 flex gap-1">
                          <button
                            onClick={() => validar(r, 'VALIDADO')}
                            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] text-[#16845b]"
                          >
                            <Check size={11} /> Validar
                          </button>
                          <button
                            onClick={() => validar(r, 'RECHAZADO')}
                            className="rounded-lg border px-2 py-1 text-[10px] text-[#c23a42]"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {(t.resultados ?? []).length === 0 && (
                    <p className="text-[11px] text-[var(--muted)]">Sin resultados.</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    <input
                      placeholder="Descripción del resultado"
                      value={resultado.descripcion}
                      onChange={(e) =>
                        setResultado({ ...resultado, descripcion: e.target.value })
                      }
                      className="min-w-40 flex-1 rounded-lg border px-2 py-1.5 text-xs"
                      style={{
                        background: 'var(--surface-2)',
                        borderColor: 'var(--border)',
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Valor"
                      value={resultado.valor}
                      onChange={(e) =>
                        setResultado({ ...resultado, valor: e.target.value })
                      }
                      className="w-24 rounded-lg border px-2 py-1.5 text-xs"
                      style={{
                        background: 'var(--surface-2)',
                        borderColor: 'var(--border)',
                      }}
                    />
                    <button
                      onClick={() => crearResultado(t)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white"
                      style={{ background: '#3b82f6' }}
                    >
                      <Send size={12} /> Registrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {tareas.length === 0 && (
        <p className="text-center text-sm text-[var(--muted)]">Sin tareas registradas.</p>
      )}
    </div>
  )
}
