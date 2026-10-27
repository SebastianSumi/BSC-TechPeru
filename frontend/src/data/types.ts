export type PerspectivaId = 'financiera' | 'clientes' | 'procesos' | 'aprendizaje'

export type Estado = 'logrado' | 'riesgo' | 'critico'
export type EstadoCumplimiento = 'LOGRADO' | 'EN_RIESGO' | 'CRITICO'
export type EstadoTarea = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA'
export type EstadoValidacion = 'PENDIENTE' | 'VALIDADO' | 'RECHAZADO'
export type TipoEvidencia = 'TEXTO' | 'ARCHIVO' | 'ENLACE'
export type UnidadMedida =
  | 'PORCENTAJE'
  | 'SOLES'
  | 'PUNTOS'
  | 'DIAS'
  | 'SEMANAS'
  | 'HORAS'
  | 'NUMERO_ORDEN'
export type Agregacion = 'ULTIMO' | 'SUMA' | 'PROMEDIO' | 'ACUMULADO'
export type AgregacionObjetivo = 'PROMEDIO' | 'PONDERADO' | 'MINIMO'

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
  codigo?: string
  nombre: string
  descripcion?: string
  icono: string
  color: string
  ponderacion?: number
  orden?: number
  activo?: boolean
  empresaId?: string | null
}

export interface Objetivo {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  perspectivaId: string
  perspectiva?: Perspectiva
  responsableId?: string | null
  responsable?: Usuario | null
  ponderacion?: number
  activo?: boolean
  orden?: number
  indice?: number
  _count?: { kpis: number; tareas?: number }
}

export interface Kpi {
  id: string
  codigo?: string | null
  perspectivaId: string
  objetivoId?: string
  objetivoRef?: Objetivo
  objetivo: string
  nombre: string
  unidad: string
  unidadMedida?: UnidadMedida | null
  meta: number
  real: number
  inverso: boolean
  tipo?: TipoKpi
  frecuencia?: Frecuencia
  formula?: string
  fuenteDatos?: string
  responsableValidacion?: string
  responsableId?: string | null
  responsable?: Usuario | null
  asignaciones?: Asignacion[]
  umbralCumplido?: number
  umbralAlerta?: number
  rangoMin?: number | null
  rangoMax?: number | null
  decimales?: number | null
  agregacionPeriodos?: Agregacion
  accion: string
  orden?: number
  activo?: boolean
  ponderacion?: number
  cumplimiento?: number
  cumplimientoBruto?: number
  porcentaje?: string
  estado?: Estado
  estadoKey?: Estado
  formulaCalculo?: string
  valido?: boolean
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
  asignaciones?: { id: string }[]
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
  empresaId?: string
  medicionId?: string
  kpiId?: string
  kpi?: { id: string; nombre: string } | null
  desviacionId?: string
  tareaId?: string | null
  tarea?: { id: string; titulo: string } | null
  resultadoTareaId?: string | null
  resultadoTarea?: { id: string; descripcion: string } | null
  tipo: TipoEvidencia | string
  titulo: string
  url?: string
  contenido?: string | null
  nombreArchivo?: string | null
  mimeType?: string | null
  tamano?: number | null
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
  empresaId?: string | null
  anioBase: number
  umbralCumplido: number
  umbralAlerta: number
  decimalesReporte: number
  formatoPorcentaje: 'DECIMAL' | 'ENTERO' | 'AUTO'
  limitarPorcentaje: boolean
  agregacionObjetivo: AgregacionObjetivo
  agregacionPeriodos: Agregacion
  agregacionResultados: 'NINGUNA' | Agregacion
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
  vision?: string
  mision?: string
  activo: boolean
  _count?: { objetivos: number; kpis: number; periodos: number }
}

export interface Recomendacion {
  id: string
  contenido: string
  autorId: string
  autor?: Usuario
  objetivoId?: string | null
  objetivo?: { id: string; codigo: string; nombre: string } | null
  kpiId?: string | null
  kpi?: { id: string; nombre: string } | null
  fijada: boolean
  createdAt: string
  updatedAt: string
}

export interface ResultadoTarea {
  id: string
  tareaId: string
  descripcion: string
  valor?: number | string | null
  autorId: string
  autor?: Usuario
  fecha: string
  estadoValidacion: EstadoValidacion
  validadoPorId?: string | null
  validadoPor?: Usuario | null
  validadoEn?: string | null
  aplicadoKpi: boolean
  evidencias?: Evidencia[]
  createdAt: string
}

export interface Tarea {
  id: string
  titulo: string
  descripcion?: string
  objetivoId: string
  objetivo?: Objetivo
  kpiId?: string | null
  kpi?: Pick<Kpi, 'id' | 'codigo' | 'nombre' | 'unidad' | 'unidadMedida'> | null
  responsableId?: string | null
  responsable?: Usuario | null
  creadorId: string
  creador?: Usuario
  fechaInicio: string
  fechaFin?: string | null
  estado: EstadoTarea
  avance: number | string
  resultados?: ResultadoTarea[]
  evidencias?: Evidencia[]
  createdAt: string
  updatedAt: string
}

export interface ReporteObjetivoKpi {
  id: string
  codigo: string | null
  nombre: string
  perspectivaId: string
  perspectivaNombre: string
  responsableId: string | null
  responsableNombre: string | null
  meta: number
  real: number
  unidad: string
  unidadMedida: string | null
  ponderacion: number
  cumplimiento: number
  estado: EstadoCumplimiento
  estadoKey: Estado
  porcentaje: string
  recomendacionFijada: string | null
  historial?: HistorialKpi[]
}

export interface HistorialKpi {
  medicionId: string
  periodoId: string
  periodo: string
  anio: number
  trimestre: number
  meta: number
  real: number
  cumplimiento: number
  estado: EstadoCumplimiento
  estadoKey: Estado
  porcentaje: string
}

export interface ReporteObjetivo {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  perspectivaId: string
  perspectivaNombre: string
  perspectivaColor: string
  responsableId: string | null
  responsableNombre: string | null
  ponderacion: number
  cumplimiento: number
  estado: EstadoCumplimiento
  estadoKey: Estado
  totalKpis: number
  logrado: number
  riesgo: number
  critico: number
  recomendacionFijada: string | null
  tareas: {
    total: number
    pendientes: number
    enProceso: number
    completadas: number
  }
  kpis: ReporteObjetivoKpi[]
  evidencias?: Evidencia[]
  versiones?: PlanVersion[]
}

export interface ReporteObjetivos {
  generadoEn: string
  filtros: {
    empresaId: string
    perspectivaId?: string
    responsableId?: string
    periodoId?: string
    estado?: string
    usuarioId?: string
  }
  reglas: Config
  resumen: {
    totalObjetivos: number
    totalKpis: number
    promedioObjetivos: number
    logrados: number
    enRiesgo: number
    criticos: number
  }
  objetivos: ReporteObjetivo[]
}

export interface ReporteObjetivoDetalle extends ReporteObjetivo {
  tareasDetalle: Array<{
    id: string
    titulo: string
    descripcion: string
    estado: EstadoTarea
    avance: number
    fechaInicio: string
    fechaFin: string | null
    responsable: Usuario | null
    totalResultados: number
    resultadosValidados: number
    totalEvidencias: number
  }>
}
