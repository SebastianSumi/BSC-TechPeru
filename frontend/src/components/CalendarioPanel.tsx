import { useEffect, useState } from 'react'

import { api } from '../lib/api'
import type { EventoCalendario, Periodo } from '../data/types'

export function CalendarioPanel({ periodos }: { periodos: Periodo[] }) {
  const [eventos, setEventos] = useState<EventoCalendario[]>([])
  const [periodoId, setPeriodoId] = useState('')

  const cargar = () => api.listarCalendario(periodoId || undefined).then(setEventos).catch(() => {})
  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoId])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <select
          value={periodoId}
          onChange={(e) => setPeriodoId(e.target.value)}
          className="rounded-lg border px-2 py-1.5 text-xs"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <option value="">Todos</option>
          {periodos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        {eventos.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between rounded-2xl border p-3"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div>
              <p className="text-sm font-semibold">{e.titulo}</p>
              <p className="text-xs text-[var(--muted)]">
                {e.tipo} · {e.periodo?.nombre ?? '-'} · {new Date(e.fecha).toLocaleDateString()}
              </p>
            </div>
            <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: e.completado ? '#10b98122' : 'var(--surface-2)' }}>
              {e.completado ? 'Completado' : 'Pendiente'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
