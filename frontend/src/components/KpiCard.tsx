import { ChevronRight, TrendingDown } from 'lucide-react'
import { CumplimientoBar, EstadoBadge } from './EstadoBadge'
import { ESTADO_META } from '../lib/bsc'
import type { KpiEvaluado } from '../data/types'

export function KpiCard({ kpi, onOpen }: { kpi: KpiEvaluado; onOpen: (k: KpiEvaluado) => void }) {
  const color = ESTADO_META[kpi.estado].color
  return (
    <button
      onClick={() => onOpen(kpi)}
      className="bsc-card group w-full p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold tracking-wide text-[#2d6bce]">{kpi.id}</p>
          <p className="mt-0.5 text-[12.5px] font-semibold leading-snug text-[var(--text)]">
            {kpi.nombre}
          </p>
        </div>
        <EstadoBadge estado={kpi.estado} />
      </div>

      <div className="mt-3.5 grid grid-cols-3 items-end gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">Meta</p>
          <p className="mt-0.5 text-[12px] font-semibold tabular-nums">
            {kpi.meta} <span className="text-[10px] font-normal text-[var(--muted)]">{kpi.unidad}</span>
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">Real</p>
          <p className="mt-0.5 text-[12px] font-semibold tabular-nums">
            {kpi.real} <span className="text-[10px] font-normal text-[var(--muted)]">{kpi.unidad}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">Cumpl.</p>
          <p className="mt-0.5 text-[15px] font-extrabold tabular-nums" style={{ color }}>
            {kpi.cumplimiento}%
          </p>
        </div>
      </div>

      <div className="mt-2.5">
        <CumplimientoBar pct={kpi.cumplimiento} estado={kpi.estado} />
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        {kpi.inverso ? (
          <span
            className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-[var(--muted)]"
            title="KPI inverso: menor es mejor"
          >
            <TrendingDown size={11} /> Menor es mejor
          </span>
        ) : (
          <span className="text-[9.5px] text-[var(--muted)]">Mayor es mejor</span>
        )}
        <span className="inline-flex items-center gap-0.5 text-[9.5px] font-semibold text-[#2d6bce]">
          Ver análisis
          <ChevronRight size={12} className="transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  )
}
