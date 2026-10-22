import { useEffect, useState } from 'react'
import { GitBranch, Plus } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import type { PlanVersion } from '../data/types'

export function VersionesPanel() {
  const { puede } = useAuth()
  const [versiones, setVersiones] = useState<PlanVersion[]>([])
  const [form, setForm] = useState({ version: '', descripcion: '' })
  const [mostrar, setMostrar] = useState(false)

  const cargar = () => api.listarVersiones().then(setVersiones).catch(() => {})
  useEffect(() => {
    cargar()
  }, [])

  const crear = async () => {
    await api.crearVersion(form)
    setMostrar(false)
    cargar()
  }

  const publicar = async (id: string) => {
    await api.publicarVersion(id)
    cargar()
  }

  const puedeGestionar = puede('ADMIN', 'GERENTE')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <GitBranch size={18} className="text-[#a855f7]" /> Versiones del Plan Estratégico (RF-13)
        </h2>
        {puedeGestionar && (
          <button
            onClick={() => setMostrar((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <Plus size={13} /> Crear snapshot
          </button>
        )}
      </div>
      {mostrar && (
        <div
          className="grid gap-2 rounded-2xl border p-3 sm:grid-cols-3"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <input
            placeholder="Versión (v1.1)"
            value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <input
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <button
            onClick={crear}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: '#3b82f6' }}
          >
            Guardar snapshot
          </button>
        </div>
      )}
      <div className="space-y-2">
        {versiones.map((v) => (
          <div
            key={v.id}
            className="flex items-center justify-between rounded-2xl border p-3"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div>
              <p className="text-sm font-semibold">
                {v.version} — {v.estado}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {v.descripcion} · Creado {new Date(v.createdAt).toLocaleDateString()}
              </p>
            </div>
            {puedeGestionar && v.estado !== 'VIGENTE' && (
              <button onClick={() => publicar(v.id)} className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: 'var(--border)' }}>
                Publicar como vigente
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
