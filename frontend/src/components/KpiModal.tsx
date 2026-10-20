import { X, Target, Activity, Lightbulb, TrendingDown } from 'lucide-react'
import { CumplimientoBar, EstadoBadge } from './EstadoBadge'
import { ESTADO_META } from '../lib/bsc'
import type { KpiEvaluado } from '../data/types'

export function KpiModal({ kpi, onClose }: { kpi: KpiEvaluado; onClose: () => void }) {
  const m = ESTADO_META[kpi.estado]
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl border p-5 sm:rounded-2xl"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-[var(--muted)]">{kpi.objetivo}</p>
            <h3 className="mt-0.5 text-lg font-semibold leading-tight">{kpi.nombre}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="my-4 grid grid-cols-3 gap-3">
          <Stat icon={<Target size={14} />} label="Meta" value={`${kpi.meta} ${kpi.unidad}`} />
          <Stat icon={<Activity size={14} />} label="Real" value={`${kpi.real} ${kpi.unidad}`} />
          <Stat icon={<Lightbulb size={14} />} label="Cumpl." value={`${kpi.cumplimiento}%`} color={m.color} />
        </div>

        <div className="mb-3 flex items-center justify-between">
          <EstadoBadge estado={kpi.estado} />
          {kpi.inverso && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
              <TrendingDown size={12} /> KPI inverso (menor = mejor)
            </span>
          )}
        </div>
        <CumplimientoBar pct={kpi.cumplimiento} estado={kpi.estado} />

        <div
          className="mt-4 rounded-xl border p-3.5 text-sm leading-relaxed"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
            <Lightbulb size={13} /> ANÁLISIS / ACCIÓN RECOMENDADA
          </p>
          {kpi.accion}
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border p-3 text-center" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
      <p className="mb-1 flex items-center justify-center gap-1 text-[11px] text-[var(--muted)]">
        {icon} {label}
      </p>
      <p className="text-sm font-bold tabular-nums" style={{ color: color ?? 'var(--text)' }}>
        {value}
      </p>
    </div>
  )
}
