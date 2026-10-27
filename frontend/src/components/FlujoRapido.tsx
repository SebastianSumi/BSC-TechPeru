import { useEffect, useState } from 'react'
import { CheckSquare, Lightbulb, Save, Users, X } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import type { Kpi, Objetivo, Usuario } from '../data/types'

const INPUT: React.CSSProperties = {
  background: 'var(--surface-2)',
  borderColor: 'var(--border)',
  color: 'var(--text)',
}
const LABEL = 'mb-1 block text-[11px] font-semibold text-[var(--muted)]'

function Shell({
  titulo,
  subtitulo,
  onCerrado,
  children,
  ancho = 'max-w-md',
}: {
  titulo: string
  subtitulo?: string
  onCerrado: () => void
  children: React.ReactNode
  ancho?: string
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0c1e35]/55 p-4 backdrop-blur-sm"
      onClick={onCerrado}
    >
      <div
        className={`bsc-card my-6 w-full ${ancho} p-5`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold">{titulo}</h3>
            {subtitulo && (
              <p className="mt-0.5 text-[11px] text-[var(--muted)]">{subtitulo}</p>
            )}
          </div>
          <button
            onClick={onCerrado}
            className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-2)]"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Campo({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  )
}

const btnPrimario =
  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50'
const btnSecundario =
  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40'

export function Boton({
  variante = 'primario',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'secundario'
}) {
  return (
    <button
      {...props}
      className={
        (variante === 'primario' ? btnPrimario : btnSecundario) +
        (props.className ? ` ${props.className}` : '')
      }
      style={
        variante === 'primario'
          ? { background: '#3b82f6', ...props.style }
          : { background: 'var(--surface-2)', borderColor: 'var(--border)', ...props.style }
      }
    />
  )
}

/** Asigna (equipo) personas a un KPI: reemplaza la lista de responsables. */
export function ModalAsignarEquipo({
  kpi,
  onCerrado,
  onGuardado,
}: {
  kpi: Pick<Kpi, 'id' | 'codigo' | 'nombre'>
  onCerrado: () => void
  onGuardado?: () => void
}) {
  const { usuario, puede } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [sel, setSel] = useState<string[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const editable = puede('ADMIN', 'GERENTE', 'RESPONSABLE')

  useEffect(() => {
    api
      .listarUsuarios()
      .then((us) => setUsuarios(us.filter((u) => u.activo !== false)))
      .catch(() => setError('No se pudo cargar el directorio de usuarios.'))
    api
      .obtenerIndicador(kpi.id)
      .then((k) => setSel((k.asignaciones ?? []).map((a) => a.usuarioId)))
      .catch(() => {})
  }, [kpi.id])

  const alternar = (id: string) =>
    setSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const guardar = async () => {
    setGuardando(true)
    setError('')
    try {
      await api.asignarEquipo(kpi.id, sel)
      onGuardado?.()
      onCerrado()
    } catch {
      setError('No se pudo guardar el equipo. Verifica tus permisos.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Shell
      titulo="Asignar equipo del KPI"
      subtitulo={`${kpi.codigo ?? kpi.id} · ${kpi.nombre}`}
      onCerrado={onCerrado}
    >
      {!editable && (
        <p className="mb-3 rounded-lg border px-3 py-2 text-[11px]" style={{ borderColor: 'var(--border)' }}>
          Tu rol ({usuario?.rol}) no permite modificar el equipo.
        </p>
      )}
      <div className="max-h-72 space-y-1.5 overflow-y-auto">
        {usuarios.length === 0 && (
          <p className="text-xs text-[var(--muted)]">Sin usuarios disponibles.</p>
        )}
        {usuarios.map((u) => (
          <label
            key={u.id}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-xs transition hover:bg-[var(--surface-2)]"
            style={{ borderColor: 'var(--border)' }}
          >
            <input
              type="checkbox"
              checked={sel.includes(u.id)}
              onChange={() => alternar(u.id)}
              disabled={!editable}
              className="h-3.5 w-3.5"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{u.nombre}</span>
              <span className="block text-[10px] text-[var(--muted)]">
                {u.email} · {u.rol}
              </span>
            </span>
          </label>
        ))}
      </div>
      {error && <p className="mt-2 text-[11px] text-[#ef4444]">{error}</p>}
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-[11px] text-[var(--muted)]">{sel.length} seleccionado(s)</span>
        <div className="flex gap-2">
          <Boton variante="secundario" onClick={onCerrado}>
            Cancelar
          </Boton>
          <Boton onClick={guardar} disabled={guardando || !editable}>
            <Save size={13} /> {guardando ? 'Guardando…' : 'Guardar equipo'}
          </Boton>
        </div>
      </div>
    </Shell>
  )
}

/** Crea una tarea ligada a un objetivo y, opcionalmente, a un KPI. */
export function ModalNuevaTarea({
  objetivoId,
  kpi,
  onCerrado,
  onCreada,
}: {
  objetivoId?: string | null
  kpi?: Pick<Kpi, 'id' | 'codigo' | 'nombre'> | null
  onCerrado: () => void
  onCreada?: () => void
}) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    responsableId: '',
    fechaFin: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listarUsuarios().then((us) => setUsuarios(us.filter((u) => u.activo !== false))).catch(() => {})
  }, [])

  const guardar = async () => {
    if (!form.titulo.trim() || !objetivoId) return
    setGuardando(true)
    setError('')
    try {
      await api.crearTarea({
        titulo: form.titulo.trim(),
        descripcion: form.descripcion || undefined,
        objetivoId,
        kpiId: kpi?.id,
        responsableId: form.responsableId || undefined,
        fechaFin: form.fechaFin || undefined,
      })
      onCreada?.()
      onCerrado()
    } catch {
      setError('No se pudo crear la tarea.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Shell
      titulo="Nueva tarea"
      subtitulo={
        kpi
          ? `KPI ${kpi.codigo ?? kpi.id} · ${kpi.nombre}`
          : 'Ligada al objetivo seleccionado'
      }
      onCerrado={onCerrado}
    >
      {!objetivoId ? (
        <p className="text-xs text-[var(--muted)]">
          Selecciona un objetivo o un KPI con objetivo para crear tareas.
        </p>
      ) : (
        <div className="space-y-3">
          <Campo label="Título *">
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej: Revisar campaña Q4"
              className="w-full rounded-lg border px-3 py-1.5 text-xs outline-none"
              style={INPUT}
            />
          </Campo>
          <Campo label="Descripción">
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              rows={3}
              placeholder="Detalle de la acción"
              className="w-full resize-none rounded-lg border px-3 py-1.5 text-xs outline-none"
              style={INPUT}
            />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Responsable">
              <select
                value={form.responsableId}
                onChange={(e) => setForm({ ...form, responsableId: e.target.value })}
                className="w-full rounded-lg border px-3 py-1.5 text-xs outline-none"
                style={INPUT}
              >
                <option value="">Sin asignar</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Fecha límite">
              <input
                type="date"
                value={form.fechaFin}
                onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                className="w-full rounded-lg border px-3 py-1.5 text-xs outline-none"
                style={INPUT}
              />
            </Campo>
          </div>
          {error && <p className="text-[11px] text-[#ef4444]">{error}</p>}
          <div className="flex justify-end gap-2">
            <Boton variante="secundario" onClick={onCerrado}>
              Cancelar
            </Boton>
            <Boton onClick={guardar} disabled={guardando || !form.titulo.trim()}>
              <CheckSquare size={13} /> {guardando ? 'Creando…' : 'Crear tarea'}
            </Boton>
          </div>
        </div>
      )}
    </Shell>
  )
}

/** Crea una recomendación ligada a un objetivo y/o KPI. */
export function ModalNuevaRecomendacion({
  objetivoId,
  kpi,
  onCerrado,
  onCreada,
}: {
  objetivoId?: string | null
  kpi?: Pick<Kpi, 'id' | 'codigo' | 'nombre'> | null
  onCerrado: () => void
  onCreada?: () => void
}) {
  const [contenido, setContenido] = useState('')
  const [fijada, setFijada] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const guardar = async () => {
    if (!contenido.trim()) return
    setGuardando(true)
    setError('')
    try {
      const rec = await api.crearRecomendacion({
        contenido: contenido.trim(),
        objetivoId: objetivoId || undefined,
        kpiId: kpi?.id,
      })
      if (fijada) await api.fijarRecomendacion(rec.id, true)
      onCreada?.()
      onCerrado()
    } catch {
      setError('No se pudo crear la recomendación.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Shell
      titulo="Nueva recomendación"
      subtitulo={
        kpi
          ? `KPI ${kpi.codigo ?? kpi.id} · ${kpi.nombre}`
          : 'Ligada al objetivo seleccionado'
      }
      onCerrado={onCerrado}
    >
      <div className="space-y-3">
        <Campo label="Recomendación *">
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            rows={5}
            placeholder="Ej: Reajustar la meta de ventas considerando la caída del canal online."
            className="w-full resize-none rounded-lg border px-3 py-1.5 text-xs outline-none"
            style={INPUT}
          />
        </Campo>
        <label className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
          <input
            type="checkbox"
            checked={fijada}
            onChange={(e) => setFijada(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          Fijarla (aparecerá en Reportes)
        </label>
        {error && <p className="text-[11px] text-[#ef4444]">{error}</p>}
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrado}>
            Cancelar
          </Boton>
          <Boton onClick={guardar} disabled={guardando || !contenido.trim()}>
            <Lightbulb size={13} /> {guardando ? 'Guardando…' : 'Guardar'}
          </Boton>
        </div>
      </div>
    </Shell>
  )
}

/** Resumen corto del equipo asignado a un KPI. */
export function EquipoResumen({ kpi }: { kpi: Pick<Kpi, 'asignaciones'> }) {
  const equipo = kpi.asignaciones ?? []
  if (equipo.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-[var(--muted)]">
        <Users size={11} /> Sin equipo
      </span>
    )
  }
  const nombres = equipo
    .map((a) => a.usuario?.nombre)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ')
  return (
    <span
      className="inline-flex max-w-full items-center gap-1 text-[10px] text-[var(--muted)]"
      title={equipo.map((a) => a.usuario?.nombre).join(', ')}
    >
      <Users size={11} />
      <span className="truncate">
        {nombres}
        {equipo.length > 3 ? ` +${equipo.length - 3}` : ''}
      </span>
    </span>
  )
}

export type { Objetivo }
