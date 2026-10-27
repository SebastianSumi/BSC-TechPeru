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
  logrado: { label: 'LOGRADO', emoji: '✅', color: '#16845b', bg: '#e8f7ef' },
  riesgo: { label: 'EN RIESGO', emoji: '⚠️', color: '#b97708', bg: '#fff5dd' },
  critico: { label: 'CRÍTICO', emoji: '❌', color: '#c23a42', bg: '#ffebed' },
}
