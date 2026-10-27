import { useState } from 'react'

import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import type { Periodo } from '../data/types'
import { Select } from './Select'

export function ImportPanel({ periodos }: { periodos: Periodo[] }) {
  const { puede } = useAuth()
  const [periodoId, setPeriodoId] = useState('')
  const [csv, setCsv] = useState('kpiId,meta,real\nF1.1,18,16.5\n')
  const [res, setRes] = useState<any>(null)
  const [cargando, setCargando] = useState(false)

  const importar = async () => {
    if (!periodoId) return
    setCargando(true)
    try {
      setRes(await api.importarMediciones({ periodoId, csv }))
    } catch (e: any) {
      setRes({ error: e.message })
    } finally {
      setCargando(false)
    }
  }

  const puedeImportar = puede('ADMIN', 'GERENTE', 'ANALISTA')

  return (
    <div className="space-y-4">
      {puedeImportar && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Select
              value={periodoId}
              onChange={(e) => setPeriodoId(e.target.value)}
              className="bsc-select">
              <option value="">Selecciona un período…</option>
              {periodos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Select>
            <button
              onClick={importar}
              disabled={!periodoId || cargando}
              className="rounded-lg border px-2.5 py-1.5 text-xs disabled:opacity-50"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              Importar CSV
            </button>
          </div>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={8}
            className="w-full rounded-2xl border p-3 font-mono text-xs"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          />
        </div>
      )}
      {res && (
        <div
          className="rounded-2xl border p-3 text-xs"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {res.error ? (
            <p className="text-[#ef4444]">{res.error}</p>
          ) : (
            <p>
              Período {res.periodo}: {res.importadas}/{res.totalFilas} importadas, {res.errores?.length ?? 0}{' '}
              errores
            </p>
          )}
        </div>
      )}
    </div>
  )
}
