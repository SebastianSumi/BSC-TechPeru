import { ESTADO_META } from '../lib/bsc'
import type { Estado } from '../data/types'

export function EstadoBadge({ estado, pct }: { estado: Estado; pct?: number }) {
  const m = ESTADO_META[estado]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}44` }}
    >
      <span>{m.emoji}</span>
      {pct !== undefined ? `${pct}%` : m.label}
    </span>
  )
}

export function CumplimientoBar({ pct, estado }: { pct: number; estado: Estado }) {
  const color = ESTADO_META[estado].color
  const width = Math.min(100, Math.max(0, pct))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${width}%`, background: color }}
      />
    </div>
  )
}
