import { useEffect, useState } from 'react'

import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import type { Config } from '../data/types'

export function ConfigPanel() {
  const { puede } = useAuth()
  const [config, setConfig] = useState<Config | null>(null)

  const cargar = () => api.obtenerConfig().then(setConfig).catch(() => {})
  useEffect(() => {
    cargar()
  }, [])

  const guardar = async () => {
    if (!config) return
    await api.actualizarConfig(config)
    cargar()
  }

  const esAdmin = puede('ADMIN')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {esAdmin && (
          <button
            onClick={guardar}
            className="rounded-lg border px-2.5 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            Guardar
          </button>
        )}
      </div>
      {config && (
        <div
          className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-2"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <label className="text-xs">
            <span className="text-[var(--muted)]">Empresa</span>
            <input
              value={config.empresa}
              onChange={(e) => setConfig({ ...config, empresa: e.target.value })}
              disabled={!esAdmin}
              className="mt-1 w-full rounded-lg border px-2 py-1.5"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            />
          </label>
          <label className="text-xs">
            <span className="text-[var(--muted)]">Umbral cumplido (%)</span>
            <input
              type="number"
              value={config.umbralCumplido}
              onChange={(e) => setConfig({ ...config, umbralCumplido: Number(e.target.value) })}
              disabled={!esAdmin}
              className="mt-1 w-full rounded-lg border px-2 py-1.5"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            />
          </label>
          <label className="text-xs">
            <span className="text-[var(--muted)]">Umbral alerta (%)</span>
            <input
              type="number"
              value={config.umbralAlerta}
              onChange={(e) => setConfig({ ...config, umbralAlerta: Number(e.target.value) })}
              disabled={!esAdmin}
              className="mt-1 w-full rounded-lg border px-2 py-1.5"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            />
          </label>
          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              checked={config.notificarCriticos}
              onChange={(e) => setConfig({ ...config, notificarCriticos: e.target.checked })}
              disabled={!esAdmin}
            />
            <span className="text-xs">Notificar KPIs críticos</span>
          </div>
        </div>
      )}
    </div>
  )
}
