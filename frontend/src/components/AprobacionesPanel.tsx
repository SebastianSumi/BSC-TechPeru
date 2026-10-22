import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import type { AprobacionItem } from '../data/types'

export function AprobacionesPanel() {
  const { puede } = useAuth()
  const [items, setItems] = useState<AprobacionItem[]>([])
  const [obs, setObs] = useState('')

  const cargar = () => api.aprobacionesPendientes().then(setItems).catch(() => {})
  useEffect(() => {
    cargar()
  }, [])

  const aprobar = async (id: string) => {
    await api.aprobarMedicion(id, obs)
    setObs('')
    cargar()
  }

  const rechazar = async (id: string) => {
    await api.rechazarMedicion(id, obs)
    setObs('')
    cargar()
  }

  const puedeAprobar = puede('ADMIN', 'GERENTE')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <CheckCircle2 size={18} className="text-[#22c55e]" /> Aprobaciones (RF-14)
        </h2>
      </div>
      <input
        placeholder="Observación (opcional)"
        value={obs}
        onChange={(e) => setObs(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-xs"
        style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
      />
      <div className="space-y-2">
        {items.map((m) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div>
              <p className="text-sm font-semibold">
                {m.kpi.id} — {m.kpi.nombre} ({m.periodo.nombre})
              </p>
              <p className="text-xs text-[var(--muted)]">
                Meta {m.meta} / Real {m.real} · Estado {m.estadoAprobacion} · Registrado por{' '}
                {m.registradoPor?.nombre ?? '-'}
              </p>
            </div>
            {puedeAprobar && (
              <div className="flex gap-2">
                <button
                  onClick={() => aprobar(m.id)}
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"
                  style={{ borderColor: '#22c55e' }}
                >
                  <CheckCircle2 size={12} /> Aprobar
                </button>
                <button
                  onClick={() => rechazar(m.id)}
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"
                  style={{ borderColor: '#ef4444' }}
                >
                  <XCircle size={12} /> Rechazar
                </button>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Clock size={14} /> Sin mediciones pendientes de aprobación.
          </p>
        )}
      </div>
    </div>
  )
}
