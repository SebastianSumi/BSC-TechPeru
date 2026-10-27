import { useEffect, useState } from 'react'

import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import type { Config, Empresa, Perspectiva } from '../data/types'

export function ConfigPanel({ empresaId }: { empresaId: string }) {
  const { puede } = useAuth()
  const [config, setConfig] = useState<Config | null>(null)
  const [perspectivas, setPerspectivas] = useState<Perspectiva[]>([])
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [ponderaciones, setPonderaciones] = useState<Record<string, number>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const esAdmin = puede('ADMIN')
  const puedeEmpresa = puede('ADMIN', 'GERENTE')

  const cargar = async () => {
    setCargando(true)
    setError('')
    try {
      const [c, p, e] = await Promise.all([
        api.obtenerConfig(),
        api.listarPerspectivas(),
        api.obtenerEmpresa(empresaId),
      ])
      setConfig(c)
      setPerspectivas(p)
      setEmpresa(e)
      setPonderaciones(
        Object.fromEntries(p.map((x) => [x.id, x.ponderacion ?? 0])),
      )
    } catch (err) {
      setError(
        `No se pudo cargar la configuración: ${err instanceof Error ? err.message : String(err)}`,
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  const guardarConfig = async () => {
    if (!config) return
    setError('')
    setMsg('')
    try {
      await api.actualizarConfig(config)
      setMsg('Configuración guardada')
      cargar()
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err))
    }
  }

  const guardarPonderaciones = async () => {
    setError('')
    setMsg('')
    try {
      for (const p of perspectivas) {
        const valor = ponderaciones[p.id]
        if (valor !== undefined && valor !== (p.ponderacion ?? 0)) {
          await api.actualizarPonderacionPerspectiva(p.id, valor)
        }
      }
      setMsg('Ponderaciones guardadas')
      cargar()
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err))
    }
  }

  const guardarEmpresa = async () => {
    if (!empresa) return
    setError('')
    setMsg('')
    try {
      await api.actualizarEmpresa(empresaId, {
        sigla: empresa.sigla,
        sector: empresa.sector,
        color: empresa.color,
        descripcion: empresa.descripcion,
      })
      setMsg('Compañía actualizada')
      cargar()
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err))
    }
  }

  if (cargando) {
    return <p className="text-sm text-[var(--muted)]">Cargando configuración…</p>
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
          {error}
        </p>
      )}
      {msg && <p className="text-sm text-[#10b981]">{msg}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--muted)]">
          Parámetros de evaluación del BSC de{' '}
          <span className="font-semibold" style={{ color: 'var(--text)' }}>
            {empresa?.nombre ?? config?.empresa ?? ''}
          </span>
          . Los umbrales afectan el semáforo y la generación de alertas.
        </p>
        {esAdmin && (
          <button
            onClick={guardarConfig}
            className="rounded-lg border px-2.5 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            Guardar configuración
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
            <span className="text-[var(--muted)]">Año base</span>
            <input
              type="number"
              min={2000}
              max={2100}
              value={config.anioBase}
              onChange={(e) => setConfig({ ...config, anioBase: Number(e.target.value) })}
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

      <div
        className="rounded-2xl border p-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold">Ponderación por perspectiva</h3>
            <p className="text-[11px] text-[var(--muted)]">
              Peso de cada perspectiva en el índice global cuando la agregación es ponderada.
            </p>
          </div>
          {puedeEmpresa && (
            <button
              onClick={guardarPonderaciones}
              className="rounded-lg border px-2.5 py-1.5 text-xs"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              Guardar ponderaciones
            </button>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {perspectivas.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <span className="flex min-w-0 items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: p.color }}
                />
                <span className="truncate">{p.nombre}</span>
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={ponderaciones[p.id] ?? 0}
                onChange={(e) =>
                  setPonderaciones({
                    ...ponderaciones,
                    [p.id]: Number(e.target.value),
                  })
                }
                disabled={!puedeEmpresa}
                className="w-20 rounded-md border px-2 py-1 text-xs"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl border p-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold">Compañía activa</h3>
            <p className="text-[11px] text-[var(--muted)]">
              Identidad visible en el conmutador y en los reportes. La visión y la misión se
              editan en la pestaña <span className="font-semibold">Visión y Misión</span>.
            </p>
          </div>
          {puedeEmpresa && (
            <button
              onClick={guardarEmpresa}
              className="rounded-lg border px-2.5 py-1.5 text-xs"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              Guardar compañía
            </button>
          )}
        </div>
        {empresa ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs">
              <span className="text-[var(--muted)]">Sigla</span>
              <input
                value={empresa.sigla}
                onChange={(e) => setEmpresa({ ...empresa, sigla: e.target.value })}
                maxLength={8}
                disabled={!puedeEmpresa}
                className="mt-1 w-full rounded-lg border px-2 py-1.5"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
              />
            </label>
            <label className="text-xs">
              <span className="text-[var(--muted)]">Sector</span>
              <input
                value={empresa.sector}
                onChange={(e) => setEmpresa({ ...empresa, sector: e.target.value })}
                disabled={!puedeEmpresa}
                className="mt-1 w-full rounded-lg border px-2 py-1.5"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
              />
            </label>
            <label className="text-xs">
              <span className="text-[var(--muted)]">Color institucional</span>
              <span className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={empresa.color}
                  onChange={(e) => setEmpresa({ ...empresa, color: e.target.value })}
                  disabled={!puedeEmpresa}
                  className="h-8 w-10 cursor-pointer rounded border"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                />
                <span className="font-mono text-[11px]">{empresa.color}</span>
              </span>
            </label>
            <label className="text-xs sm:col-span-2">
              <span className="text-[var(--muted)]">Descripción</span>
              <textarea
                value={empresa.descripcion}
                onChange={(e) => setEmpresa({ ...empresa, descripcion: e.target.value })}
                rows={3}
                maxLength={400}
                disabled={!puedeEmpresa}
                className="mt-1 w-full rounded-lg border px-2 py-1.5"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
              />
            </label>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">Compañía no encontrada.</p>
        )}
      </div>
    </div>
  )
}
