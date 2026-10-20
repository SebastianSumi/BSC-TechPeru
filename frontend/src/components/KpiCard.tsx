import { ChevronRight, TrendingDown } from 'lucide-react'
import { CumplimientoBar, EstadoBadge } from './EstadoBadge'
import type { KpiEvaluado } from '../data/types'

export function KpiCard({ kpi, onOpen }: { kpi: KpiEvaluado; onOpen: (k: KpiEvaluado) => void }) {
  return (
    <button
      onClick={() => onOpen(kpi)}
      className="group w-full rounded-xl border p-3.5 text-left transition-all hover:-translate-y-0.5"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug">{kpi.nombre}</span>
        <ChevronRight size={16} className="mt-0.5 shrink-0 text-[var(--muted)] transition group-hover:text-white" />
      </div>

      <div className="mb-2.5 flex items-center gap-3 text-xs text-[var(--muted)]">
        <span>
          Meta: <b className="text-[var(--text)]">{kpi.meta} {kpi.unidad}</b>
        </span>
        <span>
          Real: <b className="text-[var(--text)]">{kpi.real} {kpi.unidad}</b>
        </span>
        {kpi.inverso && (
          <span className="inline-flex items-center gap-0.5 rounded bg-[var(--surface-2)] px-1.5 py-0.5" title="KPI inverso: menor es mejor">
            <TrendingDown size={11} /> inv
          </span>
        )}
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-lg font-bold tabular-nums">{kpi.cumplimiento}%</span>
        <EstadoBadge estado={kpi.estado} />
      </div>
      <CumplimientoBar pct={kpi.cumplimiento} estado={kpi.estado} />
    </button>
  )
}
