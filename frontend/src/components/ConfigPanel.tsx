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
          <label className="text-xs">
            <span className="text-[var(--muted)]">Decimales en reportes</span>
            <input
              type="number"
              min={0}
              max={6}
              value={config.decimalesReporte ?? 2}
              onChange={(e) =>
                setConfig({ ...config, decimalesReporte: Number(e.target.value) })
              }
              disabled={!esAdmin}
              className="mt-1 w-full rounded-lg border px-2 py-1.5"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            />
          </label>
          <label className="text-xs">
            <span className="text-[var(--muted)]">Formato de porcentaje</span>
            <select
              value={config.formatoPorcentaje ?? 'DECIMAL'}
              onChange={(e) =>
                setConfig({
                  ...config,
                  formatoPorcentaje: e.target.value as Config['formatoPorcentaje'],
                })
              }
              disabled={!esAdmin}
              className="mt-1 w-full rounded-lg border px-2 py-1.5"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <option value="DECIMAL">Decimal</option>
              <option value="ENTERO">Entero</option>
              <option value="AUTO">Automático</option>
            </select>
          </label>
          <label className="text-xs">
            <span className="text-[var(--muted)]">Agregación de objetivos</span>
            <select
              value={config.agregacionObjetivo ?? 'PROMEDIO'}
              onChange={(e) =>
                setConfig({
                  ...config,
                  agregacionObjetivo: e.target.value as Config['agregacionObjetivo'],
                })
              }
              disabled={!esAdmin}
              className="mt-1 w-full rounded-lg border px-2 py-1.5"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <option value="PROMEDIO">Promedio</option>
              <option value="PONDERADO">Ponderado</option>
              <option value="MINIMO">Mínimo</option>
            </select>
          </label>
          <label className="text-xs">
            <span className="text-[var(--muted)]">Agregación entre períodos</span>
            <select
              value={config.agregacionPeriodos ?? 'ULTIMO'}
              onChange={(e) =>
                setConfig({
                  ...config,
                  agregacionPeriodos: e.target.value as Config['agregacionPeriodos'],
                })
              }
              disabled={!esAdmin}
              className="mt-1 w-full rounded-lg border px-2 py-1.5"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <option value="ULTIMO">Último</option>
              <option value="SUMA">Suma</option>
              <option value="PROMEDIO">Promedio</option>
              <option value="ACUMULADO">Acumulado</option>
            </select>
          </label>
          <label className="text-xs">
            <span className="text-[var(--muted)]">Agregación de resultados de tareas</span>
            <select
              value={config.agregacionResultados ?? 'NINGUNA'}
              onChange={(e) =>
                setConfig({
                  ...config,
                  agregacionResultados: e.target
                    .value as Config['agregacionResultados'],
                })
              }
              disabled={!esAdmin}
              className="mt-1 w-full rounded-lg border px-2 py-1.5"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <option value="NINGUNA">No aplicar</option>
              <option value="SUMA">Suma</option>
              <option value="ULTIMO">Último</option>
              <option value="PROMEDIO">Promedio</option>
            </select>
          </label>
          <div className="flex flex-col gap-2 pt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.limitarPorcentaje ?? false}
                onChange={(e) =>
                  setConfig({ ...config, limitarPorcentaje: e.target.checked })
                }
                disabled={!esAdmin}
              />
              <span className="text-xs">Limitar porcentaje a 100%</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.notificarCriticos}
                onChange={(e) =>
                  setConfig({ ...config, notificarCriticos: e.target.checked })
                }
                disabled={!esAdmin}
              />
              <span className="text-xs">Notificar KPIs críticos</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.requiereEvidencia ?? false}
                onChange={(e) =>
                  setConfig({ ...config, requiereEvidencia: e.target.checked })
                }
                disabled={!esAdmin}
              />
              <span className="text-xs">Requerir evidencia</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.requiereAprobacion ?? false}
                onChange={(e) =>
                  setConfig({ ...config, requiereAprobacion: e.target.checked })
                }
                disabled={!esAdmin}
              />
              <span className="text-xs">Requerir aprobación</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
