export type PerspectivaId = 'financiera' | 'clientes' | 'procesos' | 'aprendizaje'

export type Estado = 'logrado' | 'riesgo' | 'critico'

export interface Perspectiva {
  id: PerspectivaId
  nombre: string
  icono: string
  color: string
}

export interface Kpi {
  id: string
  perspectiva: PerspectivaId
  objetivo: string
  nombre: string
  unidad: string
  meta: number
  real: number
  inverso: boolean
  accion: string
}

export interface KpiEvaluado extends Kpi {
  cumplimiento: number
  estado: Estado
}

export interface ResumenEstado {
  logrado: number
  riesgo: number
  critico: number
  total: number
  indiceGlobal: number
}
