export type PerspectivaId = 'financiera' | 'clientes' | 'procesos' | 'aprendizaje'

export type Estado = 'logrado' | 'riesgo' | 'critico'

export type RolNombre = 'ADMIN' | 'GERENTE' | 'ANALISTA' | 'RESPONSABLE'

export type TipoKpi = 'MAYOR_MEJOR' | 'MENOR_MEJOR' | 'RANGO'
export type Frecuencia = 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'
export type EstadoIniciativa = 'PLANIFICADA' | 'EN_CURSO' | 'EN_RIESGO' | 'COMPLETADA' | 'CANCELADA'
export type EstadoAlerta = 'NUEVA' | 'RECONOCIDA' | 'RESUELTA' | 'DESCARTADA'
export type SeveridadAlerta = 'INFO' | 'ADVERTENCIA' | 'CRITICA'
export type EstadoAprobacion = 'BORRADOR' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'
export type EstadoCompromiso = 'PENDIENTE' | 'EN_PROCESO' | 'CUMPLIDO' | 'VENCIDO' | 'CANCELADO'
export type EstadoVersion = 'BORRADOR' | 'VIGENTE' | 'ARCHIVADA'

export interface Perspectiva {
  id: PerspectivaId
  nombre: string
  icono: string
  color: string
  ponderacion?: number
  orden?: number
}

export interface Objetivo {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  perspectivaId: string
  perspectiva?: Perspectiva
  ponderacion?: number
  activo?: boolean
  orden?: number
  indice?: number
  _count?: { kpis: number }
}

export interface Kpi {
  id: string
  perspectivaId: PerspectivaId
  objetivoId?: string
  objetivoRef?: Objetivo
  objetivo: string
  nombre: string
  unidad: string
  meta: number
  real: number
  inverso: boolean
  tipo?: TipoKpi
  frecuencia?: Frecuencia
  formula?: string
  fuenteDatos?: string
  responsableValidacion?: string
  umbralCumplido?: number
  umbralAlerta?: number
  rangoMin?: number | null
  rangoMax?: number | null
  accion: string
  orden?: number
  activo?: boolean
  ponderacion?: number
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
  createdAt?: string
}

export interface Reporte {
  generadoEn: string
  filtros: { perspectivaId?: string; periodoId?: string; usuarioId?: string }
  resumen: ResumenEstado
  porPerspectiva: ResumenPerspectiva[]
  kpis: KpiEvaluado[]
  criticos: KpiEvaluado[]
}

export interface Iniciativa {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  objetivoId: string
  objetivoRef?: Objetivo
  kpiId?: string
  kpi?: Kpi
  responsableId?: string
  responsable?: Usuario
  fechaInicio: string
  fechaFin?: string
  presupuesto?: number
  avance?: number
  estado: EstadoIniciativa
}

export interface Alerta {
  id: string
  kpiId?: string
  kpi?: { id: string; nombre: string }
  periodoId?: string
  tipo: string
  severidad: SeveridadAlerta
  mensaje: string
  estado: EstadoAlerta
  destinatarioId?: string
  destinatario?: Usuario
  leida?: boolean
  createdAt: string
  resueltaEn?: string
}

export interface Desviacion {
  id: string
  kpiId: string
  kpi?: { id: string; nombre: string; objetivo: string }
  periodoId?: string
  causa: string
  impacto?: string
  medidaCorrectiva?: string
  responsableId?: string
  responsable?: Usuario
  fechaLimite?: string
  estado: EstadoCompromiso
  createdAt: string
  evidencias?: Evidencia[]
}

export interface Evidencia {
  id: string
  medicionId?: string
  kpiId?: string
  desviacionId?: string
  tipo: string
  titulo: string
  url?: string
  descripcion?: string
  subidoPorId?: string
  subidoPor?: Usuario
  createdAt: string
}

export interface Compromiso {
  id: string
  reunion: string
  descripcion: string
  objetivoId?: string
  objetivoRef?: Objetivo
  kpiId?: string
  kpi?: Kpi
  responsableId?: string
  responsable?: Usuario
  fechaLimite?: string
  estado: EstadoCompromiso
  createdAt: string
}

export interface PlanVersion {
  id: string
  version: string
  descripcion?: string
  periodoId?: string
  periodo?: Periodo
  estado: EstadoVersion
  snapshot: unknown
  publicadoPor?: string
  createdAt: string
  vigenteDesde?: string
}

export interface EventoCalendario {
  id: string
  titulo: string
  tipo: string
  fecha: string
  periodoId?: string
  periodo?: Periodo
  responsableId?: string
  responsable?: Usuario
  completado?: boolean
  descripcion?: string
}

export interface Auditoria {
  id: string
  usuarioId?: string
  usuario?: { id: string; nombre: string; email: string }
  accion: string
  entidad: string
  entidadId?: string
  detalle?: unknown
  createdAt: string
}

export interface Config {
  id: string
  empresa: string
  anioBase: number
  umbralCumplido: number
  umbralAlerta: number
  notificarCriticos: boolean
  requiereAprobacion: boolean
  requiereEvidencia: boolean
  updatedAt: string
}

export interface RelacionCausal {
  id: string
  causaId: string
  efectoId: string
  descripcion?: string
}

export interface MapaEstrategico {
  perspectivaOrden: string[]
  perspectivas: Perspectiva[]
  objetivos: Objetivo[]
  relaciones: RelacionCausal[]
}

export interface Comparacion {
  periodoA: { id: string; nombre: string } | null
  periodoB: { id: string; nombre: string } | null
  porPerspectiva: {
    perspectivaId: string
    perspectiva: string
    cumplimientoA: number
    cumplimientoB: number
    variacion: number
    kpis: number
  }[]
  kpis: {
    id: string
    nombre: string
    perspectivaId: string
    perspectiva: string
    cumplimientoA: number
    cumplimientoB: number
    variacion: number
    tendencia: 'mejora' | 'deterioro' | 'estable'
  }[]
}

export interface AprobacionItem {
  id: string
  kpiId: string
  kpi: { id: string; nombre: string; objetivo: string }
  periodo: { id: string; nombre: string }
  meta: number
  real: number
  nota?: string
  estadoAprobacion: EstadoAprobacion
  registradoPor?: Usuario
  createdAt: string
  updatedAt: string
  aprobaciones?: unknown[]
}

export interface Empresa {
  id: string
  nombre: string
  sigla: string
  sector: string
  color: string
  descripcion: string
  activo: boolean
  _count?: { objetivos: number; kpis: number; periodos: number }
}
