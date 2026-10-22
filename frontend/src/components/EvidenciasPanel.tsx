import { useEffect, useState } from 'react'
import { Paperclip, Plus } from 'lucide-react'
import { api } from '../lib/api'
import type { Evidencia, Kpi } from '../data/types'

export function EvidenciasPanel() {
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [mostrar, setMostrar] = useState(false)
  const [form, setForm] = useState({ kpiId: '', titulo: '', url: '', tipo: 'ENLACE', descripcion: '' })

  const cargar = () => {
    api.listarEvidencias().then(setEvidencias).catch(() => {})
    api.listarKpis().then(setKpis).catch(() => {})
  }
  useEffect(() => {
    cargar()
  }, [])

  const crear = async () => {
    await api.crearEvidencia(form)
    setMostrar(false)
    cargar()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Paperclip size={18} className="text-[#06b6d4]" /> Evidencias (RF-17)
        </h2>
        <button
          onClick={() => setMostrar((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <Plus size={13} /> Añadir evidencia
        </button>
      </div>
      {mostrar && (
        <div
          className="grid gap-2 rounded-2xl border p-3 sm:grid-cols-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <select
            value={form.kpiId}
            onChange={(e) => setForm({ ...form, kpiId: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <option value="">KPI...</option>
            {kpis.map((k) => (
              <option key={k.id} value={k.id}>
                {k.id}
              </option>
            ))}
          </select>
          <input
            placeholder="Título"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <input
            placeholder="URL/Enlace"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
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
      <div className="grid gap-2 sm:grid-cols-2">
        {evidencias.map((e) => (
          <a
            key={e.id}
            href={e.url || '#'}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border p-3"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <p className="text-sm font-semibold">{e.titulo}</p>
            <p className="text-xs text-[var(--muted)]">
              {e.kpiId} · {e.tipo} · {new Date(e.createdAt).toLocaleDateString()}
            </p>
          </a>
        ))}
      </div>
    </div>
  )
}
