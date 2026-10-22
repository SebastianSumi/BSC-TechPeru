import { useEffect, useState } from 'react'
import { Target, Plus } from 'lucide-react'
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
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Target size={18} className="text-[#10b981]" /> Objetivos Estratégicos (RF-03)
        </h2>
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
            <div
              key={o.id}
              className="rounded-2xl border p-4"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  {p?.icono} {o.codigo} — {o.nombre}
                </p>
                <span className="text-xs font-bold" style={{ color: p?.color }}>
                  {o.indice ?? 0}%
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">{o.descripcion}</p>
              <div className="mt-2 text-[11px] text-[var(--muted)]">
                Ponderación {o.ponderacion ?? 0}% · KPIs {o._count?.kpis ?? 0}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
