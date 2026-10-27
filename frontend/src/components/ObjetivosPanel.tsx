import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import type { Objetivo } from '../data/types'
import { PERSPECTIVAS } from '../data/kpis'

export function ObjetivosPanel() {
  const { puede } = useAuth()
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [mostrar, setMostrar] = useState(false)
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    perspectivaId: 'financiera',
    descripcion: '',
    ponderacion: 0,
  })

  const cargar = () => api.listarObjetivos().then(setObjetivos).catch(() => {})
  useEffect(() => {
    cargar()
  }, [])

  const crear = async () => {
    await api.crearObjetivo(form)
    setMostrar(false)
    setForm({ codigo: '', nombre: '', perspectivaId: 'financiera', descripcion: '', ponderacion: 0 })
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
          className="grid gap-2 rounded-2xl border p-3 sm:grid-cols-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <input
            placeholder="Código (OBJ-F1)"
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
            {PERSPECTIVAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
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
          const p = PERSPECTIVAS.find((x) => x.id === o.perspectivaId)
          return (
            <article key={o.id} className="bsc-card p-4 transition hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="tag" style={{ background: `${p?.color}14`, color: p?.color }}>
                    {p?.icono} {o.codigo}
                  </span>
                  <p className="mt-1.5 text-[12.5px] font-semibold leading-snug">{o.nombre}</p>
                </div>
                <span className="text-[15px] font-extrabold tabular-nums" style={{ color: p?.color }}>
                  {o.indice ?? 0}%
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--muted)]">
                {o.descripcion}
              </p>
              <div className="bsc-progress mt-3">
                <span
                  style={{ width: `${Math.min(100, o.indice ?? 0)}%`, background: p?.color }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--muted)]">
                <span>Ponderación {o.ponderacion ?? 0}%</span>
                <span>{o._count?.kpis ?? 0} KPI asociados</span>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
