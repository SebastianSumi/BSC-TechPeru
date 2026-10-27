import { ESTADO_META } from '../lib/bsc'
import type { Estado } from '../data/types'

export function EstadoBadge({ estado, pct }: { estado: Estado; pct?: number }) {
  const m = ESTADO_META[estado]
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide"
      style={{ background: m.bg, color: m.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
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
