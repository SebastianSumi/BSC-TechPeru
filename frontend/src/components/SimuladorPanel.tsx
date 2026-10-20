import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import { PERSPECTIVAS } from '../data/kpis'
import { evaluar } from '../lib/bsc'
import type { Kpi } from '../data/types'

export function SimuladorPanel({
  kpis,
  setReal,
  reset,
  dirty,
  expandedId,
  onToggle,
}: {
  kpis: Kpi[]
  setReal: (id: string, real: number) => void
  reset: () => void
  dirty: boolean
  expandedId: string | null
  onToggle: (id: string) => void
}) {
  return (
    <div className="rounded-2xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <SlidersHorizontal size={18} className="text-[var(--muted)]" /> Simulador de escenarios
        </h2>
        <button
          onClick={reset}
          disabled={!dirty}
          className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-40"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <RotateCcw size={13} /> Restaurar
        </button>
      </div>

      <p className="mb-4 text-xs text-[var(--muted)]">
        Ajusta el valor <b>Real</b> de cada KPI y observa cómo cambia el índice global en vivo.
      </p>

      <div className="space-y-4">
        {PERSPECTIVAS.map((p) => (
          <div key={p.id}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: p.color }}>
              {p.icono} {p.nombre}
            </p>
            <div className="space-y-2.5">
              {kpis
                .filter((k) => k.perspectiva === p.id)
                .map((k) => {
                  const ev = evaluar(k)
                  const min = 0
                  const max = k.inverso ? Math.round(k.meta * 3) : Math.round(k.meta * 2)
                  const step = max <= 20 ? 0.1 : 1
                  const isExp = expandedId === k.id
                  return (
                    <div
                      key={k.id}
                      className="rounded-lg border p-2.5"
                      style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                    >
                      <button
                        onClick={() => onToggle(k.id)}
                        className="flex w-full items-center justify-between gap-2 text-left"
                      >
                        <span className="text-xs font-medium">{k.nombre}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--muted)' }}>
                            {k.real} {k.unidad}
                          </span>
                          <span className="text-xs font-bold tabular-nums" style={{ color: '#fff' }}>
                            {ev.cumplimiento}%
                          </span>
                        </span>
                      </button>
                      {isExp && (
                        <div className="mt-3 flex items-center gap-3">
                          <input
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={k.real}
                            onChange={(e) => setReal(k.id, Number(e.target.value))}
                            className="h-1.5 w-full cursor-pointer appearance-none rounded-full"
                            style={{ background: 'var(--border)', accentColor: p.color }}
                          />
                          <input
                            type="number"
                            value={k.real}
                            step={step}
                            min={min}
                            onChange={(e) => setReal(k.id, Number(e.target.value))}
                            className="w-20 rounded-md border px-2 py-1 text-xs tabular-nums outline-none"
                            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
