import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import type { Objetivo, Perspectiva, ReporteObjetivo, Usuario } from '../data/types'

export function ObjetivosPanel() {
  const { puede } = useAuth()
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [perspectivas, setPerspectivas] = useState<Perspectiva[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [reportes, setReportes] = useState<Record<string, ReporteObjetivo>>({})
  const [mostrar, setMostrar] = useState(false)
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    perspectivaId: '',
    descripcion: '',
    responsableId: '',
    ponderacion: 0,
  })

  const cargar = () => {
    Promise.all([
      api.listarObjetivos(),
      api.listarPerspectivas(),
      api.listarUsuarios().catch(() => []),
      api.reporteObjetivos().catch(() => null),
    ]).then(([os, ps, us, reporte]) => {
      setObjetivos(os)
      setPerspectivas(ps)
      setUsuarios(us.filter((u) => u.activo !== false))
      setReportes(
        Object.fromEntries((reporte?.objetivos ?? []).map((o) => [o.id, o])),
      )
      setForm((f) => ({
        ...f,
        perspectivaId: f.perspectivaId || ps[0]?.id || '',
      }))
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

  const puedeGestionar = puede('ADMIN', 'GERENTE')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {puedeGestionar && (
          <button
            onClick={() => setMostrar((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <Plus size={13} /> Nuevo objetivo
          </button>
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
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <input
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs sm:col-span-2"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <select
            value={form.perspectivaId}
            onChange={(e) => setForm({ ...form, perspectivaId: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            {perspectivas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
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
      <div className="grid gap-3 sm:grid-cols-2">
        {objetivos.map((o) => {
          const p = o.perspectiva ?? perspectivas.find((x) => x.id === o.perspectivaId)
          const r = reportes[o.id]
          return (
            <article key={o.id} className="bsc-card p-4 transition hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="tag" style={{ background: `${p?.color ?? '#3b82f6'}14`, color: p?.color }}>
                    {p?.icono} {o.codigo}
                  </span>
                  <p className="mt-1.5 text-[12.5px] font-semibold leading-snug">{o.nombre}</p>
                </div>
                <span
                  className="text-[15px] font-extrabold tabular-nums"
                  style={{ color: p?.color ?? '#3b82f6' }}
                >
                  {r ? `${r.cumplimiento}%` : '—'}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--muted)]">
                {o.descripcion}
              </p>
              <div className="bsc-progress mt-3">
                <span
                  style={{
                    width: `${Math.min(100, r?.cumplimiento ?? 0)}%`,
                    background: p?.color ?? '#3b82f6',
                  }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--muted)]">
                <span>{o.responsable?.nombre ?? 'Sin responsable'}</span>
                <span>
                  {o._count?.kpis ?? 0} KPI · {o._count?.tareas ?? 0} tareas
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
