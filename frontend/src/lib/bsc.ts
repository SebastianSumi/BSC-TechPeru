import type { Estado, Kpi, KpiEvaluado, PerspectivaId, ResumenEstado } from '../data/types'

export function calcularCumplimiento(meta: number, real: number, inverso: boolean): number {
  if (real === 0) return 0
  const pct = inverso ? (meta / real) * 100 : (real / meta) * 100
  return Math.round(pct * 10) / 10
}

export function clasificarEstado(pct: number): Estado {
  if (pct >= 90) return 'logrado'
  if (pct >= 75) return 'riesgo'
  return 'critico'
}

export function evaluar(kpi: Kpi): KpiEvaluado {
  const cumplimiento = calcularCumplimiento(kpi.meta, kpi.real, kpi.inverso)
  return { ...kpi, cumplimiento, estado: clasificarEstado(cumplimiento) }
}

export function evaluarTodos(kpis: Kpi[]): KpiEvaluado[] {
  return kpis.map(evaluar)
}

export function resumen(kpis: Kpi[]): ResumenEstado {
  const ev = evaluarTodos(kpis)
  const logrado = ev.filter((k) => k.estado === 'logrado').length
  const riesgo = ev.filter((k) => k.estado === 'riesgo').length
  const critico = ev.filter((k) => k.estado === 'critico').length
  const indiceGlobal =
    ev.reduce((acc, k) => acc + k.cumplimiento, 0) / (ev.length || 1)
  return {
    logrado,
    riesgo,
    critico,
    total: ev.length,
    indiceGlobal: Math.round(indiceGlobal * 10) / 10,
  }
}

export function resumenPorPerspectiva(kpis: Kpi[]): Record<PerspectivaId, ResumenEstado> {
  const ids: PerspectivaId[] = ['financiera', 'clientes', 'procesos', 'aprendizaje']
  const out = {} as Record<PerspectivaId, ResumenEstado>
  for (const id of ids) {
    out[id] = resumen(kpis.filter((k) => k.perspectivaId === id))
  }
  return out
}

export const ESTADO_META: Record<Estado, { label: string; emoji: string; color: string; bg: string }> = {
  logrado: { label: 'LOGRADO', emoji: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  riesgo: { label: 'EN RIESGO', emoji: '⚠️', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  critico: { label: 'CRÍTICO', emoji: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}
