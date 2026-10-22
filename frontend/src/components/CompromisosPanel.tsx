import { useEffect, useState } from 'react'
import { Handshake, Plus } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import type { Compromiso } from '../data/types'

export function CompromisosPanel() {
  const { puede } = useAuth()
  const [compromisos, setCompromisos] = useState<Compromiso[]>([])
  const [mostrar, setMostrar] = useState(false)
  const [form, setForm] = useState({ reunion: '', descripcion: '' })

  const cargar = () => api.listarCompromisos().then(setCompromisos).catch(() => {})
  useEffect(() => {
    cargar()
  }, [])

  const crear = async () => {
    await api.crearCompromiso(form)
    setMostrar(false)
    cargar()
  }

  const puedeGestionar = puede('ADMIN', 'GERENTE', 'ANALISTA')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Handshake size={18} className="text-[#22c55e]" /> Seguimiento de Compromisos (RF-16)
        </h2>
        {puedeGestionar && (
          <button
            onClick={() => setMostrar((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <Plus size={13} /> Nuevo compromiso
          </button>
        )}
      </div>
      {mostrar && (
        <div
          className="grid gap-2 rounded-2xl border p-3 sm:grid-cols-3"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <input
            placeholder="Reunión"
            value={form.reunion}
            onChange={(e) => setForm({ ...form, reunion: e.target.value })}
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
            Guardar
          </button>
        </div>
      )}
      <div className="space-y-2">
        {compromisos.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-2xl border p-3"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div>
              <p className="text-sm font-semibold">{c.reunion}</p>
              <p className="text-xs text-[var(--muted)]">
                {c.descripcion} · Responsable: {c.responsable?.nombre ?? '-'}
              </p>
            </div>
            <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'var(--surface-2)' }}>
              {c.estado}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
