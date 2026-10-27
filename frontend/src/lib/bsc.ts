import type { Estado, Kpi, KpiEvaluado, PerspectivaId, ResumenEstado } from '../data/types'

export function evaluar(kpi: Kpi): KpiEvaluado {
  const cumplimiento = typeof kpi.cumplimiento === 'number' ? kpi.cumplimiento : 0
  const estado: Estado = kpi.estado ?? (kpi.estadoKey as Estado | undefined) ?? 'critico'
  return { ...kpi, cumplimiento, estado }
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
  logrado: { label: 'LOGRADO', emoji: '✓', color: '#16845b', bg: '#e8f7ef' },
  riesgo: { label: 'EN RIESGO', emoji: '!', color: '#b97708', bg: '#fff5dd' },
  critico: { label: 'CRÍTICO', emoji: '✕', color: '#c23a42', bg: '#ffebed' },
}
