import { useEffect, useState } from 'react'
import { CheckSquare, Lightbulb, Plus, Trash2, Users, X } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import {
  Boton,
  EquipoResumen,
  ModalAsignarEquipo,
  ModalNuevaRecomendacion,
  ModalNuevaTarea,
} from './FlujoRapido'
import type { Kpi, Objetivo, Periodo, Perspectiva } from '../data/types'
import { EstadoBadge } from './EstadoBadge'

const INPUT: React.CSSProperties = {
  background: 'var(--surface-2)',
  borderColor: 'var(--border)',
  color: 'var(--text)',
}
const LABEL = 'mb-1 block text-[10px] font-semibold text-[var(--muted)]'

const FORM_VACIO = {
  id: '',
  codigo: '',
  nombre: '',
  perspectivaId: '',
  objetivoId: '',
  meta: '',
  real: '0',
  unidad: '',
  tipo: 'MAYOR_MEJOR',
  frecuencia: 'MENSUAL',
  formula: '',
  fuenteDatos: '',
  responsableValidacion: '',
  umbralCumplido: '90',
  umbralAlerta: '75',
  accion: '',
}

type Form = typeof FORM_VACIO

export function DiccionarioPanel({
  periodos,
  filtroObjetivo = '',
  onLimpiarFiltro,
}: {
  periodos: Periodo[]
  filtroObjetivo?: string
  onLimpiarFiltro?: () => void
}) {
  const { puede } = useAuth()
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [perspectivas, setPerspectivas] = useState<Perspectiva[]>([])
  const [periodoId, setPeriodoId] = useState('')
  const [perspectivaId, setPerspectivaId] = useState('')
  const [objetivoFiltro, setObjetivoFiltro] = useState(filtroObjetivo)
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState<Form>(FORM_VACIO)
  const [errorForm, setErrorForm] = useState('')
  const [modal, setModal] = useState<
    | { tipo: 'equipo'; kpi: Kpi }
    | { tipo: 'tarea'; kpi: Kpi }
    | { tipo: 'recomendacion'; kpi: Kpi }
    | null
  >(null)

  const puedeCrear = puede('ADMIN', 'GERENTE')
  const puedeAsignar = puede('ADMIN', 'GERENTE', 'RESPONSABLE')

  useEffect(() => {
    api.listarPerspectivas().then(setPerspectivas).catch(() => {})
    api
      .listarObjetivos()
      .then(setObjetivos)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (filtroObjetivo) setObjetivoFiltro(filtroObjetivo)
  }, [filtroObjetivo])

  const cargar = () => {
    setCargando(true)
    api
      .diccionario(perspectivaId || undefined, periodoId || undefined)
      .then((ks) => setKpis(ks))
      .catch(() => setKpis([]))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoId, perspectivaId])

  const objetivosVisibles = objetivos.filter(
    (o) => !form.perspectivaId || o.perspectivaId === form.perspectivaId,
  )

  const kpisFiltrados = kpis.filter(
    (k) => !objetivoFiltro || k.objetivoId === objetivoFiltro,
  )

  const crear = async () => {
    setErrorForm('')
    if (!form.id.trim() || !form.nombre.trim() || !form.perspectivaId || !form.objetivoId) {
      setErrorForm('Código, nombre, perspectiva y objetivo son obligatorios.')
      return
    }
    const meta = Number(form.meta)
    if (!Number.isFinite(meta)) {
      setErrorForm('La meta debe ser un número.')
      return
    }
    try {
      await api.crearIndicador({
        id: form.id.trim(),
        codigo: form.codigo.trim() || form.id.trim(),
        nombre: form.nombre.trim(),
        perspectivaId: form.perspectivaId,
        objetivoId: form.objetivoId,
        meta,
        real: Number(form.real) || 0,
        unidad: form.unidad.trim() || 'UNIDAD',
        tipo: form.tipo as Kpi['tipo'],
        frecuencia: form.frecuencia as Kpi['frecuencia'],
        formula: form.formula.trim() || undefined,
        fuenteDatos: form.fuenteDatos.trim() || undefined,
        responsableValidacion: form.responsableValidacion.trim() || undefined,
        umbralCumplido: Number(form.umbralCumplido) || 90,
        umbralAlerta: Number(form.umbralAlerta) || 75,
        accion: form.accion.trim(),
      })
      setMostrarForm(false)
      setForm({ ...FORM_VACIO, perspectivaId: form.perspectivaId, objetivoId: '' })
      cargar()
    } catch (e) {
      setErrorForm(
        e instanceof Error && e.message ? e.message : 'No se pudo crear el indicador (¿código duplicado?).',
      )
    }
  }

  const desactivar = async (k: Kpi) => {
    if (!window.confirm(`¿Desactivar el indicador ${k.codigo ?? k.id}?`)) return
    try {
      await api.desactivarIndicador(k.id)
      cargar()
    } catch {
      window.alert('No se pudo desactivar el indicador.')
    }
  }

  const cambiarPerspectivaForm = (id: string) =>
    setForm((f) => ({ ...f, perspectivaId: id, objetivoId: '' }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={perspectivaId}
            onChange={(e) => setPerspectivaId(e.target.value)}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={INPUT}
          >
            <option value="">Todas las perspectivas</option>
            {perspectivas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <select
            value={periodoId}
            onChange={(e) => setPeriodoId(e.target.value)}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={INPUT}
          >
            <option value="">Sin período</option>
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <select
            value={objetivoFiltro}
            onChange={(e) => setObjetivoFiltro(e.target.value)}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={INPUT}
          >
            <option value="">Todos los objetivos</option>
            {objetivos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.codigo} · {o.nombre}
              </option>
            ))}
          </select>
          {objetivoFiltro && onLimpiarFiltro && (
            <button
              onClick={() => {
                setObjetivoFiltro('')
                onLimpiarFiltro()
              }}
              className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--text)]"
            >
              <X size={12} /> Quitar filtro de objetivo
            </button>
          )}
        </div>
        {puedeCrear && (
          <Boton onClick={() => setMostrarForm((v) => !v)}>
            <Plus size={13} /> Nuevo indicador
          </Boton>
        )}
      </div>

      {mostrarForm && (
        <div
          className="space-y-3 rounded-2xl border p-4"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--muted)]">
            Nuevo indicador (KPI)
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className={LABEL}>Código *</span>
              <input
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="F1.9"
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                style={INPUT}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={LABEL}>Nombre *</span>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Participación de mercado"
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                style={INPUT}
              />
            </label>
            <label className="block">
              <span className={LABEL}>Unidad</span>
              <input
                value={form.unidad}
                onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                placeholder="%, S/, pts"
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                style={INPUT}
              />
            </label>
            <label className="block">
              <span className={LABEL}>Perspectiva *</span>
              <select
                value={form.perspectivaId}
                onChange={(e) => cambiarPerspectivaForm(e.target.value)}
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                style={INPUT}
              >
                <option value="">Selecciona…</option>
                {perspectivas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className={LABEL}>Objetivo *</span>
              <select
                value={form.objetivoId}
                onChange={(e) => setForm({ ...form, objetivoId: e.target.value })}
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                style={INPUT}
              >
                <option value="">
                  {form.perspectivaId ? 'Selecciona…' : 'Elige primero la perspectiva'}
                </option>
                {objetivosVisibles.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.codigo} · {o.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={LABEL}>Dirección</span>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                style={INPUT}
              >
                <option value="MAYOR_MEJOR">Mayor es mejor</option>
                <option value="MENOR_MEJOR">Menor es mejor</option>
                <option value="RANGO">Rango objetivo</option>
              </select>
            </label>
            <label className="block">
              <span className={LABEL}>Frecuencia</span>
              <select
                value={form.frecuencia}
                onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                style={INPUT}
              >
                <option value="MENSUAL">Mensual</option>
                <option value="TRIMESTRAL">Trimestral</option>
                <option value="SEMESTRAL">Semestral</option>
                <option value="ANUAL">Anual</option>
              </select>
            </label>
            <label className="block">
              <span className={LABEL}>Meta *</span>
              <input
                type="number"
                value={form.meta}
                onChange={(e) => setForm({ ...form, meta: e.target.value })}
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                style={INPUT}
              />
            </label>
            <label className="block">
              <span className={LABEL}>Valor inicial (real)</span>
              <input
                type="number"
                value={form.real}
                onChange={(e) => setForm({ ...form, real: e.target.value })}
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                style={INPUT}
              />
            </label>
            <label className="block">
              <span className={LABEL}>Umbral logrado ≥ %</span>
              <input
                type="number"
                value={form.umbralCumplido}
                onChange={(e) => setForm({ ...form, umbralCumplido: e.target.value })}
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                style={INPUT}
              />
            </label>
            <label className="block">
              <span className={LABEL}>Umbral riesgo ≥ %</span>
              <input
                type="number"
                value={form.umbralAlerta}
                onChange={(e) => setForm({ ...form, umbralAlerta: e.target.value })}
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                style={INPUT}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={LABEL}>Fórmula</span>
              <input
                value={form.formula}
                onChange={(e) => setForm({ ...form, formula: e.target.value })}
                placeholder="Ventas / Mercado total"
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                style={INPUT}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={LABEL}>Fuente de datos</span>
              <input
                value={form.fuenteDatos}
                onChange={(e) => setForm({ ...form, fuenteDatos: e.target.value })}
                placeholder="ERP, encuestas, BI…"
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                style={INPUT}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={LABEL}>Responsable de validación</span>
              <input
                value={form.responsableValidacion}
                onChange={(e) => setForm({ ...form, responsableValidacion: e.target.value })}
                placeholder="Nombre del validador"
                className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                style={INPUT}
              />
            </label>
            <label className="block sm:col-span-4">
              <span className={LABEL}>Acción recomendada / nota</span>
              <textarea
                rows={2}
                value={form.accion}
                onChange={(e) => setForm({ ...form, accion: e.target.value })}
                placeholder="Qué hacer si el indicador entra en crítico"
                className="w-full resize-none rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                style={INPUT}
              />
            </label>
          </div>
          {errorForm && <p className="text-[11px] text-[#ef4444]">{errorForm}</p>}
          <div className="flex justify-end gap-2">
            <Boton variante="secundario" onClick={() => setMostrarForm(false)}>
              Cancelar
            </Boton>
            <Boton onClick={crear}>Crear indicador</Boton>
          </div>
        </div>
      )}

      <div className="bsc-card table-scroll">
        <table className="bsc-table">
          <thead>
            <tr>
              <th className="p-2 text-left">Código</th>
              <th className="p-2 text-left">Indicador</th>
              <th className="p-2 text-left">Objetivo</th>
              <th className="p-2 text-left">Fórmula</th>
              <th className="p-2 text-left">Unidad</th>
              <th className="p-2 text-left">Frecuencia</th>
              <th className="p-2 text-left">Fuente</th>
              <th className="p-2 text-left">Equipo</th>
              <th className="p-2 text-right">Meta</th>
              <th className="p-2 text-right">Real</th>
              <th className="p-2 text-center">Cumpl.</th>
              <th className="p-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {kpisFiltrados.map((k) => (
              <tr key={k.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="p-2 font-semibold">{k.codigo ?? k.id}</td>
                <td className="p-2">{k.nombre}</td>
                <td className="p-2 text-[var(--muted)]">
                  {k.objetivoRef?.codigo ? `${k.objetivoRef.codigo} · ` : ''}
                  {k.objetivoRef?.nombre ?? k.objetivo}
                </td>
                <td className="p-2 text-[var(--muted)]">{k.formula}</td>
                <td className="p-2">{k.unidadMedida ?? k.unidad}</td>
                <td className="p-2">{k.frecuencia}</td>
                <td className="p-2 text-[var(--muted)]">{k.fuenteDatos}</td>
                <td className="p-2">
                  <EquipoResumen kpi={k} />
                </td>
                <td className="p-2 text-right tabular-nums">{k.meta}</td>
                <td className="p-2 text-right tabular-nums">{k.real}</td>
                <td className="p-2 text-center">
                  <EstadoBadge estado={k.estadoKey ?? k.estado ?? 'critico'} pct={k.cumplimiento ?? 0} />
                </td>
                <td className="p-2">
                  <div className="flex items-center justify-center gap-1">
                    {puedeAsignar && (
                      <button
                        title="Asignar equipo"
                        onClick={() => setModal({ tipo: 'equipo', kpi: k })}
                        className="rounded-md border p-1.5 transition hover:bg-[var(--surface-2)]"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <Users size={13} />
                      </button>
                    )}
                    <button
                      title="Nueva tarea"
                      onClick={() => setModal({ tipo: 'tarea', kpi: k })}
                      className="rounded-md border p-1.5 transition hover:bg-[var(--surface-2)]"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <CheckSquare size={13} />
                    </button>
                    <button
                      title="Nueva recomendación"
                      onClick={() => setModal({ tipo: 'recomendacion', kpi: k })}
                      className="rounded-md border p-1.5 transition hover:bg-[var(--surface-2)]"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <Lightbulb size={13} />
                    </button>
                    {puedeAsignar && (
                      <button
                        title="Desactivar indicador"
                        onClick={() => desactivar(k)}
                        className="rounded-md border p-1.5 text-[#ef4444] transition hover:bg-[var(--surface-2)]"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cargando && (
          <p className="p-3 text-center text-xs text-[var(--muted)]">Cargando…</p>
        )}
        {!cargando && kpisFiltrados.length === 0 && (
          <p className="p-6 text-center text-sm text-[var(--muted)]">
            Sin indicadores. Crea el primero con “Nuevo indicador”.
          </p>
        )}
      </div>

      {modal?.tipo === 'equipo' && (
        <ModalAsignarEquipo
          kpi={modal.kpi}
          onCerrado={() => setModal(null)}
          onGuardado={cargar}
        />
      )}
      {modal?.tipo === 'tarea' && (
        <ModalNuevaTarea
          objetivoId={modal.kpi.objetivoId}
          kpi={modal.kpi}
          onCerrado={() => setModal(null)}
          onCreada={cargar}
        />
      )}
      {modal?.tipo === 'recomendacion' && (
        <ModalNuevaRecomendacion
          objetivoId={modal.kpi.objetivoId}
          kpi={modal.kpi}
          onCerrado={() => setModal(null)}
        />
      )}
    </div>
  )
}
