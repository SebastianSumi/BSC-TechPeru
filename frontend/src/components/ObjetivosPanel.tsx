import { useEffect, useState } from 'react'
import { CheckSquare, Lightbulb, Pencil, Plus, Target } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import {
  Boton,
  ModalNuevaRecomendacion,
  ModalNuevaTarea,
} from './FlujoRapido'
import type { Objetivo, Perspectiva, ReporteObjetivo, Usuario } from '../data/types'
import { Select } from './Select'

const INPUT: React.CSSProperties = {
  background: 'var(--surface-2)',
  borderColor: 'var(--border)',
  color: 'var(--text)',
}
const LABEL = 'mb-1 block text-[10px] font-semibold text-[var(--muted)]'

export function ObjetivosPanel({
  onVerKpis,
}: {
  onVerKpis?: (objetivoId: string) => void
}) {
  const { puede } = useAuth()
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [perspectivas, setPerspectivas] = useState<Perspectiva[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [reportes, setReportes] = useState<Record<string, ReporteObjetivo>>({})
  const [mostrar, setMostrar] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [nuevoKpiDe, setNuevoKpiDe] = useState<Objetivo | null>(null)
  const [modal, setModal] = useState<
    | { tipo: 'tarea'; objetivo: Objetivo }
    | { tipo: 'recomendacion'; objetivo: Objetivo }
    | null
  >(null)
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    perspectivaId: '',
    descripcion: '',
    responsableId: '',
    ponderacion: 0,
  })
  const [formEdicion, setFormEdicion] = useState({
    nombre: '',
    descripcion: '',
    responsableId: '',
    ponderacion: 0,
  })
  const [formKpi, setFormKpi] = useState({
    id: '',
    nombre: '',
    meta: '',
    real: '0',
    unidad: '',
    tipo: 'MAYOR_MEJOR',
  })
  const [errorKpi, setErrorKpi] = useState('')

  const puedeGestionar = puede('ADMIN', 'GERENTE')

  const cargar = () => {
    Promise.all([
      api.listarObjetivos(),
      api.listarPerspectivas(),
      api.listarUsuarios().catch(() => [] as Usuario[]),
      api.reporteObjetivos().catch(() => null),
    ]).then(([os, ps, us, reporte]) => {
      setObjetivos(os)
      setPerspectivas(ps)
      setUsuarios(us.filter((u) => u.activo !== false))
      setReportes(
        Object.fromEntries((reporte?.objetivos ?? []).map((o) => [o.id, o])),
      )
      setForm((f) => ({ ...f, perspectivaId: f.perspectivaId || ps[0]?.id || '' }))
    })
  }
  useEffect(() => {
    cargar()
  }, [])

  const crear = async () => {
    if (!form.nombre.trim() || !form.perspectivaId) return
    await api.crearObjetivo({
      nombre: form.nombre,
      codigo: form.codigo || undefined,
      perspectivaId: form.perspectivaId,
      descripcion: form.descripcion || undefined,
      responsableId: form.responsableId || undefined,
      ponderacion: form.ponderacion || undefined,
    })
    setMostrar(false)
    setForm({
      codigo: '',
      nombre: '',
      perspectivaId: perspectivas[0]?.id || '',
      descripcion: '',
      responsableId: '',
      ponderacion: 0,
    })
    cargar()
  }

  const abrirEdicion = (o: Objetivo) => {
    setEditando(o.id)
    setFormEdicion({
      nombre: o.nombre,
      descripcion: o.descripcion ?? '',
      responsableId: o.responsableId ?? '',
      ponderacion: o.ponderacion ?? 0,
    })
  }

  const guardarEdicion = async (o: Objetivo) => {
    try {
      await api.actualizarObjetivo(o.id, {
        nombre: formEdicion.nombre,
        descripcion: formEdicion.descripcion,
        responsableId: formEdicion.responsableId || null,
        ponderacion: Number(formEdicion.ponderacion) || 0,
      })
      setEditando(null)
      cargar()
    } catch {
      window.alert('No se pudo actualizar el objetivo.')
    }
  }

  const crearKpi = async () => {
    if (!nuevoKpiDe) return
    setErrorKpi('')
    if (!formKpi.id.trim() || !formKpi.nombre.trim()) {
      setErrorKpi('Código y nombre son obligatorios.')
      return
    }
    const meta = Number(formKpi.meta)
    if (!Number.isFinite(meta)) {
      setErrorKpi('La meta debe ser un número.')
      return
    }
    try {
      await api.crearIndicador({
        id: formKpi.id.trim(),
        codigo: formKpi.id.trim(),
        nombre: formKpi.nombre.trim(),
        perspectivaId: nuevoKpiDe.perspectivaId,
        objetivoId: nuevoKpiDe.id,
        meta,
        real: Number(formKpi.real) || 0,
        unidad: formKpi.unidad.trim() || 'UNIDAD',
        tipo: formKpi.tipo as never,
        accion: '',
      })
      setNuevoKpiDe(null)
      setFormKpi({ id: '', nombre: '', meta: '', real: '0', unidad: '', tipo: 'MAYOR_MEJOR' })
      cargar()
    } catch (e) {
      setErrorKpi(
        e instanceof Error && e.message ? e.message : 'No se pudo crear el indicador.',
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {puedeGestionar && (
          <Boton onClick={() => setMostrar((v) => !v)}>
            <Plus size={13} /> Nuevo objetivo
          </Boton>
        )}
      </div>

      {mostrar && (
        <div
          className="grid gap-2 rounded-2xl border p-3 sm:grid-cols-3 lg:grid-cols-6"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <input
            placeholder="Código (opcional)"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={INPUT}
          />
          <input
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs sm:col-span-2"
            style={INPUT}
          />
          <Select
            value={form.perspectivaId}
            onChange={(e) => setForm({ ...form, perspectivaId: e.target.value })}
            className="bsc-select"
          >
            {perspectivas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
          <Select
            value={form.responsableId}
            onChange={(e) => setForm({ ...form, responsableId: e.target.value })}
            className="bsc-select"
          >
            <option value="">Sin responsable</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre} ({u.rol})
              </option>
            ))}
          </Select>
          <input
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs sm:col-span-2"
            style={INPUT}
          />
          <Boton onClick={crear}>Guardar</Boton>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {objetivos.map((o) => {
          const p = o.perspectiva ?? perspectivas.find((x) => x.id === o.perspectivaId)
          const r = reportes[o.id]
          const editandoEste = editando === o.id
          return (
            <article key={o.id} className="bsc-card p-4 transition hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span
                    className="tag"
                    style={{ background: `${p?.color ?? '#3b82f6'}14`, color: p?.color }}
                  >
                    {p?.icono} {o.codigo}
                  </span>
                  {editandoEste ? (
                    <input
                      value={formEdicion.nombre}
                      onChange={(e) => setFormEdicion({ ...formEdicion, nombre: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border px-2 py-1 text-xs font-semibold"
                      style={INPUT}
                    />
                  ) : (
                    <p className="mt-1.5 text-[12.5px] font-semibold leading-snug">{o.nombre}</p>
                  )}
                </div>
                <span
                  className="text-[15px] font-extrabold tabular-nums"
                  style={{ color: p?.color ?? '#3b82f6' }}
                >
                  {r ? `${r.cumplimiento}%` : '—'}
                </span>
              </div>

              {editandoEste ? (
                <textarea
                  rows={2}
                  value={formEdicion.descripcion}
                  onChange={(e) =>
                    setFormEdicion({ ...formEdicion, descripcion: e.target.value })
                  }
                  className="mt-2 w-full resize-none rounded-lg border px-2 py-1 text-[11px]"
                  style={INPUT}
                  placeholder="Descripción"
                />
              ) : (
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--muted)]">
                  {o.descripcion}
                </p>
              )}

              <div className="bsc-progress mt-3">
                <span
                  style={{
                    width: `${Math.min(100, r?.cumplimiento ?? 0)}%`,
                    background: p?.color ?? '#3b82f6',
                  }}
                />
              </div>

              {editandoEste && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Select
                    value={formEdicion.responsableId}
                    onChange={(e) =>
                      setFormEdicion({ ...formEdicion, responsableId: e.target.value })
                    }
                    className="text-[11px] bsc-select"
                  >
                    <option value="">Sin responsable</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} ({u.rol})
                      </option>
                    ))}
                  </Select>
                  <input
                    type="number"
                    value={formEdicion.ponderacion}
                    onChange={(e) =>
                      setFormEdicion({ ...formEdicion, ponderacion: Number(e.target.value) })
                    }
                    placeholder="Ponderación"
                    className="rounded-lg border px-2 py-1.5 text-[11px]"
                    style={INPUT}
                  />
                </div>
              )}

              <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--muted)]">
                <span>{o.responsable?.nombre ?? 'Sin responsable'}</span>
                <span>
                  {o._count?.kpis ?? 0} KPI · {o._count?.tareas ?? 0} tareas
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                {editandoEste ? (
                  <>
                    <Boton onClick={() => guardarEdicion(o)}>Guardar</Boton>
                    <Boton variante="secundario" onClick={() => setEditando(null)}>
                      Cancelar
                    </Boton>
                  </>
                ) : (
                  <>
                    {puedeGestionar && (
                      <MiniBtn titulo="Editar objetivo" onClick={() => abrirEdicion(o)}>
                        <Pencil size={12} />
                      </MiniBtn>
                    )}
                    {puedeGestionar && (
                      <MiniBtn titulo="Nuevo KPI para este objetivo" onClick={() => setNuevoKpiDe(o)}>
                        <Plus size={12} />
                      </MiniBtn>
                    )}
                    <MiniBtn titulo="Nueva tarea" onClick={() => setModal({ tipo: 'tarea', objetivo: o })}>
                      <CheckSquare size={12} />
                    </MiniBtn>
                    <MiniBtn
                      titulo="Nueva recomendación"
                      onClick={() => setModal({ tipo: 'recomendacion', objetivo: o })}
                    >
                      <Lightbulb size={12} />
                    </MiniBtn>
                    {onVerKpis && (
                      <button
                        onClick={() => onVerKpis(o.id)}
                        className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-[#3b82f6] hover:underline"
                      >
                        <Target size={12} /> Ver KPIs
                      </button>
                    )}
                  </>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {objetivos.length === 0 && (
        <p className="text-center text-sm text-[var(--muted)]">
          Aún no hay objetivos. Crea el primero con “Nuevo objetivo”.
        </p>
      )}

      {nuevoKpiDe && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0c1e35]/55 p-4 backdrop-blur-sm"
          onClick={() => setNuevoKpiDe(null)}
        >
          <div
            className="bsc-card my-6 w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-bold">Nuevo KPI</h3>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">
              {nuevoKpiDe.codigo} · {nuevoKpiDe.nombre}
            </p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className={LABEL}>Código *</span>
                <input
                  value={formKpi.id}
                  onChange={(e) => setFormKpi({ ...formKpi, id: e.target.value })}
                  placeholder="F1.9"
                  className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                  style={INPUT}
                />
              </label>
              <label className="block">
                <span className={LABEL}>Nombre *</span>
                <input
                  value={formKpi.nombre}
                  onChange={(e) => setFormKpi({ ...formKpi, nombre: e.target.value })}
                  placeholder="Participación de mercado"
                  className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                  style={INPUT}
                />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className={LABEL}>Meta *</span>
                  <input
                    type="number"
                    value={formKpi.meta}
                    onChange={(e) => setFormKpi({ ...formKpi, meta: e.target.value })}
                    className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                    style={INPUT}
                  />
                </label>
                <label className="block">
                  <span className={LABEL}>Real</span>
                  <input
                    type="number"
                    value={formKpi.real}
                    onChange={(e) => setFormKpi({ ...formKpi, real: e.target.value })}
                    className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                    style={INPUT}
                  />
                </label>
                <label className="block">
                  <span className={LABEL}>Unidad</span>
                  <input
                    value={formKpi.unidad}
                    onChange={(e) => setFormKpi({ ...formKpi, unidad: e.target.value })}
                    placeholder="%"
                    className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                    style={INPUT}
                  />
                </label>
              </div>
              <label className="block">
                <span className={LABEL}>Dirección</span>
                <Select
                  value={formKpi.tipo}
                  onChange={(e) => setFormKpi({ ...formKpi, tipo: e.target.value })}
                  className="px-2.5 bsc-select"
                >
                  <option value="MAYOR_MEJOR">Mayor es mejor</option>
                  <option value="MENOR_MEJOR">Menor es mejor</option>
                  <option value="RANGO">Rango objetivo</option>
                </Select>
              </label>
              {errorKpi && <p className="text-[11px] text-[#ef4444]">{errorKpi}</p>}
              <div className="flex justify-end gap-2">
                <Boton variante="secundario" onClick={() => setNuevoKpiDe(null)}>
                  Cancelar
                </Boton>
                <Boton onClick={crearKpi}>Crear KPI</Boton>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal?.tipo === 'tarea' && (
        <ModalNuevaTarea
          objetivoId={modal.objetivo.id}
          onCerrado={() => setModal(null)}
          onCreada={cargar}
        />
      )}
      {modal?.tipo === 'recomendacion' && (
        <ModalNuevaRecomendacion
          objetivoId={modal.objetivo.id}
          onCerrado={() => setModal(null)}
        />
      )}
    </div>
  )
}

function MiniBtn({
  titulo,
  onClick,
  children,
}: {
  titulo: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      title={titulo}
      aria-label={titulo}
      onClick={onClick}
      className="rounded-md border p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
      style={{ borderColor: 'var(--border)' }}
    >
      {children}
    </button>
  )
}
