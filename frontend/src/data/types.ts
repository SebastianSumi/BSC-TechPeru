export type PerspectivaId = 'financiera' | 'clientes' | 'procesos' | 'aprendizaje'

export type Estado = 'logrado' | 'riesgo' | 'critico'

export type RolNombre = 'ADMIN' | 'GERENTE' | 'ANALISTA' | 'RESPONSABLE'

export interface Perspectiva {
  id: PerspectivaId
  nombre: string
  icono: string
  color: string
}

export interface Kpi {
  id: string
  perspectivaId: PerspectivaId
  objetivo: string
  nombre: string
  unidad: string
  meta: number
  real: number
  inverso: boolean
  accion: string
  cumplimiento?: number
  estado?: Estado
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

export interface ResumenPerspectiva extends ResumenEstado {
  id: PerspectivaId
  nombre: string
  icono: string
  color: string
}

export interface ResumenApi extends ResumenEstado {
  porPerspectiva: ResumenPerspectiva[]
}

export interface Usuario {
  id: string
  email: string
  nombre: string
  rol: RolNombre
  activo?: boolean
}

export interface Periodo {
  id: string
  nombre: string
  anio: number
  trimestre: number
  fechaInicio: string
  fechaFin: string
  activo: boolean
}

export interface Asignacion {
  id: string
  usuarioId: string
  kpiId: string
  usuario?: Usuario
  kpi?: Kpi
}

export interface Reporte {
  generadoEn: string
  filtros: { perspectivaId?: string; periodoId?: string; usuarioId?: string }
  resumen: ResumenEstado
  porPerspectiva: ResumenPerspectiva[]
  kpis: KpiEvaluado[]
  criticos: KpiEvaluado[]
}
