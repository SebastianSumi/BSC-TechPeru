import { useEffect, useState } from 'react'

import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import type { Auditoria } from '../data/types'

export function AuditoriaPanel() {
  const { puede } = useAuth()
  const [logs, setLogs] = useState<Auditoria[]>([])

  const cargar = () => api.auditoria({ limite: 150 }).then(setLogs).catch(() => {})
  useEffect(() => {
    cargar()
  }, [])

  if (!puede('ADMIN', 'GERENTE')) {
    return <p className="text-sm text-[var(--muted)]">Acceso restringido a ADMIN/GERENTE.</p>
  }

  return (
    <div className="space-y-4">
      <div className="bsc-card table-scroll">
        <table className="bsc-table">
          <thead>
            <tr>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Usuario</th>
              <th className="p-2 text-left">Acción</th>
              <th className="p-2 text-left">Entidad</th>
              <th className="p-2 text-left">Entidad ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="p-2">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="p-2">{l.usuario?.nombre ?? '-'}</td>
                <td className="p-2">{l.accion}</td>
                <td className="p-2">{l.entidad}</td>
                <td className="p-2 font-mono text-[10px]">{l.entidadId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
