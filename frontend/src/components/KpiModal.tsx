import { X, Target, Activity, Lightbulb, TrendingDown, TrendingUp } from 'lucide-react'
import { CumplimientoBar, EstadoBadge } from './EstadoBadge'
import { ESTADO_META } from '../lib/bsc'
import type { KpiEvaluado } from '../data/types'

export function KpiModal({ kpi, onClose }: { kpi: KpiEvaluado; onClose: () => void }) {
  const m = ESTADO_META[kpi.estado]
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0c1e35]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-t-2xl border bg-white shadow-2xl sm:rounded-2xl"
        style={{ borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b px-5 py-4" style={{ borderColor: 'var(--border)', background: '#fbfdff' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#7890ac]">
                Indicador KPI · {kpi.id}
              </p>
              <h3 className="mt-1 text-[18px] font-bold leading-tight tracking-tight">{kpi.nombre}</h3>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{kpi.objetivo}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-2)]"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-3 gap-2.5">
            <Stat icon={<Target size={13} />} label="Meta" value={`${kpi.meta} ${kpi.unidad}`} />
            <Stat icon={<Activity size={13} />} label="Real" value={`${kpi.real} ${kpi.unidad}`} />
            <Stat
              icon={<Lightbulb size={13} />}
              label="Cumplimiento"
              value={`${kpi.cumplimiento}%`}
              color={m.color}
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <EstadoBadge estado={kpi.estado} />
            {kpi.inverso ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
                <TrendingDown size={12} /> KPI inverso (menor = mejor)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
                <TrendingUp size={12} /> KPI directo (mayor = mejor)
              </span>
            )}
          </div>
          <div className="mt-2">
            <CumplimientoBar pct={kpi.cumplimiento} estado={kpi.estado} />
          </div>

          <div
            className="mt-4 rounded-xl border p-3.5 text-[12px] leading-relaxed"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[var(--muted)]">
              <Lightbulb size={13} /> Análisis / acción recomendada
            </p>
            {kpi.accion}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color?: string
}) {
  return (
    <div
      className="rounded-xl border p-3 text-center"
      style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
    >
      <p className="mb-1 flex items-center justify-center gap-1 text-[10px] font-semibold text-[var(--muted)]">
        {icon} {label}
      </p>
      <p className="text-[14px] font-bold tabular-nums" style={{ color: color ?? 'var(--text)' }}>
        {value}
      </p>
    </div>
  )
}
