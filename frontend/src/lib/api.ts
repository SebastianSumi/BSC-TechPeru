import type {
  Alerta,
  AprobacionItem,
  Asignacion,
  Auditoria,
  Comparacion,
  Compromiso,
  Config,
  Desviacion,
  Empresa,
  EventoCalendario,
  Evidencia,
  Iniciativa,
  Kpi,
  MapaEstrategico,
  Objetivo,
  Periodo,
  Perspectiva,
  PlanVersion,
  RelacionCausal,
  Recomendacion,
  Reporte,
  ReporteObjetivoDetalle,
  ReporteObjetivos,
  ResumenApi,
  ResultadoTarea,
  RolNombre,
  Tarea,
  Usuario,
} from '../data/types'

const API_URL =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000`
const TOKEN_KEY = 'bsc_token'
const EMPRESA_KEY = 'bsc_empresa'
export const EMPRESA_DEFECTO = 'techperu'

export function getEmpresaActiva(): string {
  return localStorage.getItem(EMPRESA_KEY) || EMPRESA_DEFECTO
}

export function setEmpresaActiva(id: string) {
  localStorage.setItem(EMPRESA_KEY, id)
}

function conEmpresa(path: string) {
  if (path.startsWith('/empresas') || path.startsWith('/auth')) return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}empresa=${encodeURIComponent(getEmpresaActiva())}`
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function requestBlob(path: string, options: RequestInit = {}) {
  const token = getToken()
  const res = await fetch(`${API_URL}${conEmpresa(path)}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
  if (res.status === 401) setToken(null)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${options.method ?? 'GET'} ${path} -> ${res.status} ${body}`)
  }
  return {
    blob: await res.blob(),
    nombreArchivo:
      res.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/)?.[1] ??
      'archivo',
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${conEmpresa(path)}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
  if (res.status === 401) {
    setToken(null)
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${options.method ?? 'GET'} ${path} -> ${res.status} ${body}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  listarEmpresas: () => request<Empresa[]>('/empresas'),

  obtenerEmpresa: (id: string) => request<Empresa>(`/empresas/${id}`),

  login: (email: string, password: string) =>
    request<{ accessToken: string; usuario: Usuario }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<Usuario>('/auth/me'),

  listarUsuarios: () => request<Usuario[]>('/auth/usuarios'),

  crearUsuario: (data: {
    email: string
    nombre: string
    password: string
    rol: RolNombre
  }) =>
    request<Usuario>('/auth/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizarUsuario: (
    id: string,
    data: { nombre?: string; rol?: RolNombre; activo?: boolean },
  ) =>
    request<Usuario>(`/auth/usuarios/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  listarRoles: () =>
    request<{ id: string; nombre: RolNombre; descripcion: string }[]>('/auth/roles'),

  listarPeriodos: () => request<Periodo[]>('/periodos'),

  periodoActivo: () => request<Periodo | null>('/periodos/activo'),

  crearPeriodo: (data: { nombre: string; anio: number; trimestre: number }) =>
    request<Periodo>('/periodos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  activarPeriodo: (id: string) =>
    request<Periodo>(`/periodos/${id}/activar`, { method: 'PATCH' }),

  eliminarPeriodo: (id: string) =>
    request<void>(`/periodos/${id}`, { method: 'DELETE' }),

  listarPerspectivas: () => request<Perspectiva[]>('/perspectivas'),

  listarCatalogos: (incluirInactivos = false) =>
    request<Perspectiva[]>(
      `/catalogos${incluirInactivos ? '?incluirInactivos=true' : ''}`,
    ),
  crearCatalogo: (data: {
    codigo: string
    titulo: string
    descripcion?: string
    orden?: number
    icono?: string
    color?: string
    activo?: boolean
  }) =>
    request<Perspectiva>('/catalogos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  actualizarCatalogo: (
    id: string,
    data: {
      codigo?: string
      titulo?: string
      descripcion?: string
      orden?: number
      icono?: string
      color?: string
      activo?: boolean
    },
  ) =>
    request<Perspectiva>(`/catalogos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  desactivarCatalogo: (id: string) =>
    request<Perspectiva>(`/catalogos/${id}`, { method: 'DELETE' }),

  listarKpis: (periodoId?: string, perspectivaId?: string) => {
    const params = new URLSearchParams()
    if (periodoId) params.set('periodo', periodoId)
    if (perspectivaId) params.set('perspectiva', perspectivaId)
    const qs = params.toString()
    return request<Kpi[]>(`/kpis${qs ? `?${qs}` : ''}`)
  },

  resumen: (periodoId?: string) =>
    request<ResumenApi>(`/resumen${periodoId ? `?periodo=${periodoId}` : ''}`),

  setReal: (id: string, real: number) =>
    request<Kpi>(`/kpis/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ real }),
    }),

  mediciones: (kpiId: string) =>
    request<{ id: string; meta: number; real: number; nota?: string; periodo: Periodo; estadoAprobacion?: string }[]>(
      `/kpis/${kpiId}/mediciones`,
    ),

  upsertMedicion: (
    kpiId: string,
    data: { periodoId: string; meta: number; real: number; nota?: string },
  ) =>
    request(`/kpis/${kpiId}/mediciones`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listarAsignaciones: () => request<Asignacion[]>('/asignaciones'),

  misAsignaciones: () => request<Asignacion[]>('/asignaciones/mias'),

  crearAsignacion: (usuarioId: string, kpiId: string) =>
    request<Asignacion>('/asignaciones', {
      method: 'POST',
      body: JSON.stringify({ usuarioId, kpiId }),
    }),

  eliminarAsignacion: (id: string) =>
    request<void>(`/asignaciones/${id}`, { method: 'DELETE' }),

  reporte: (params: {
    perspectivaId?: string
    periodoId?: string
    usuarioId?: string
  } = {}) => {
    const qs = new URLSearchParams()
    if (params.perspectivaId) qs.set('perspectiva', params.perspectivaId)
    if (params.periodoId) qs.set('periodo', params.periodoId)
    if (params.usuarioId) qs.set('usuario', params.usuarioId)
    const q = qs.toString()
    return request<Reporte>(`/reportes${q ? `?${q}` : ''}`)
  },

  reporteObjetivos: (params: {
    perspectivaId?: string
    responsableId?: string
    periodoId?: string
    estado?: string
  } = {}) => {
    const qs = new URLSearchParams()
    if (params.perspectivaId) qs.set('perspectiva', params.perspectivaId)
    if (params.responsableId) qs.set('responsable', params.responsableId)
    if (params.periodoId) qs.set('periodo', params.periodoId)
    if (params.estado) qs.set('estado', params.estado)
    const q = qs.toString()
    return request<ReporteObjetivos>(`/reportes/objetivos${q ? `?${q}` : ''}`)
  },

  reporteObjetivo: (
    id: string,
    params: { periodoId?: string; estado?: string } = {},
  ) => {
    const qs = new URLSearchParams()
    if (params.periodoId) qs.set('periodo', params.periodoId)
    if (params.estado) qs.set('estado', params.estado)
    const q = qs.toString()
    return request<ReporteObjetivoDetalle>(
      `/reportes/objetivos/${id}${q ? `?${q}` : ''}`,
    )
  },

  exportarReporteObjetivos: (params: {
    perspectivaId?: string
    responsableId?: string
    periodoId?: string
    estado?: string
  } = {}) => {
    const qs = new URLSearchParams()
    if (params.perspectivaId) qs.set('perspectiva', params.perspectivaId)
    if (params.responsableId) qs.set('responsable', params.responsableId)
    if (params.periodoId) qs.set('periodo', params.periodoId)
    if (params.estado) qs.set('estado', params.estado)
    const q = qs.toString()
    return requestBlob(`/reportes/objetivos/exportar${q ? `?${q}` : ''}`)
  },

  // Objetivos
  listarObjetivos: (perspectivaId?: string) => {
    const qs = perspectivaId ? `?perspectiva=${perspectivaId}` : ''
    return request<Objetivo[]>(`/objetivos${qs}`)
  },
  obtenerObjetivo: (id: string) => request<Objetivo>(`/objetivos/${id}`),
  crearObjetivo: (data: {
    codigo?: string
    nombre: string
    descripcion?: string
    perspectivaId: string
    responsableId?: string
    ponderacion?: number
    orden?: number
  }) => request<Objetivo>('/objetivos', { method: 'POST', body: JSON.stringify(data) }),
  actualizarObjetivo: (id: string, data: Partial<Objetivo>) =>
    request<Objetivo>(`/objetivos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  desactivarObjetivo: (id: string) =>
    request<Objetivo>(`/objetivos/${id}`, { method: 'DELETE' }),

  // Indicadores / Diccionario
  diccionario: (perspectivaId?: string, periodoId?: string) => {
    const qs = new URLSearchParams()
    if (perspectivaId) qs.set('perspectiva', perspectivaId)
    if (periodoId) qs.set('periodo', periodoId)
    const q = qs.toString()
    return request<Kpi[]>(`/indicadores/diccionario${q ? `?${q}` : ''}`)
  },
  crearIndicador: (data: Partial<Kpi> & { id: string; perspectivaId: string; objetivoId: string }) =>
    request<Kpi>('/indicadores', { method: 'POST', body: JSON.stringify(data) }),
  actualizarIndicador: (id: string, data: Partial<Kpi>) =>
    request<Kpi>(`/indicadores/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  desactivarIndicador: (id: string) =>
    request<Kpi>(`/indicadores/${id}`, { method: 'DELETE' }),
  obtenerIndicador: (id: string) => request<Kpi>(`/indicadores/${id}`),
  asignarEquipo: (id: string, usuarioIds: string[]) =>
    request<Kpi>(`/indicadores/${id}/equipo`, {
      method: 'PATCH',
      body: JSON.stringify({ usuarioIds }),
    }),

  // Iniciativas
  listarIniciativas: (filtros: { objetivoId?: string; estado?: string } = {}) => {
    const qs = new URLSearchParams()
    if (filtros.objetivoId) qs.set('objetivo', filtros.objetivoId)
    if (filtros.estado) qs.set('estado', filtros.estado)
    const q = qs.toString()
    return request<Iniciativa[]>(`/iniciativas${q ? `?${q}` : ''}`)
  },
  crearIniciativa: (data: Partial<Iniciativa>) =>
    request<Iniciativa>('/iniciativas', { method: 'POST', body: JSON.stringify(data) }),
  actualizarIniciativa: (id: string, data: Partial<Iniciativa>) =>
    request<Iniciativa>(`/iniciativas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  eliminarIniciativa: (id: string) =>
    request<void>(`/iniciativas/${id}`, { method: 'DELETE' }),

  // Alertas
  listarAlertas: (estado?: string) =>
    request<Alerta[]>(`/alertas${estado ? `?estado=${estado}` : ''}`),
  crearAlerta: (data: Partial<Alerta>) =>
    request<Alerta>('/alertas', { method: 'POST', body: JSON.stringify(data) }),
  actualizarAlerta: (id: string, data: Partial<Alerta>) =>
    request<Alerta>(`/alertas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  generarAlertas: (periodoId: string) =>
    request<{ generadas: number }>(`/alertas/generar?periodo=${periodoId}`, { method: 'POST' }),

  // Desviaciones
  listarDesviaciones: (filtros: { kpiId?: string; estado?: string } = {}) => {
    const qs = new URLSearchParams()
    if (filtros.kpiId) qs.set('kpi', filtros.kpiId)
    if (filtros.estado) qs.set('estado', filtros.estado)
    const q = qs.toString()
    return request<Desviacion[]>(`/desviaciones${q ? `?${q}` : ''}`)
  },
  crearDesviacion: (data: Partial<Desviacion>) =>
    request<Desviacion>('/desviaciones', { method: 'POST', body: JSON.stringify(data) }),
  actualizarDesviacion: (id: string, data: Partial<Desviacion>) =>
    request<Desviacion>(`/desviaciones/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  eliminarDesviacion: (id: string) =>
    request<void>(`/desviaciones/${id}`, { method: 'DELETE' }),

  // Evidencias
  listarEvidencias: (filtros: {
    kpiId?: string
    medicionId?: string
    desviacionId?: string
    tareaId?: string
    resultadoTareaId?: string
  } = {}) => {
    const qs = new URLSearchParams()
    if (filtros.kpiId) qs.set('kpi', filtros.kpiId)
    if (filtros.medicionId) qs.set('medicion', filtros.medicionId)
    if (filtros.desviacionId) qs.set('desviacion', filtros.desviacionId)
    if (filtros.tareaId) qs.set('tarea', filtros.tareaId)
    if (filtros.resultadoTareaId) qs.set('resultado', filtros.resultadoTareaId)
    const q = qs.toString()
    return request<Evidencia[]>(`/evidencias${q ? `?${q}` : ''}`)
  },
  obtenerEvidencia: (id: string) => request<Evidencia>(`/evidencias/${id}`),
  crearEvidencia: (data: {
    tipo: string
    titulo: string
    kpiId?: string
    medicionId?: string
    desviacionId?: string
    tareaId?: string
    resultadoTareaId?: string
    descripcion?: string
    url?: string
    contenido?: string
    nombreArchivo?: string
    mimeType?: string
    tamano?: number
    contenidoBase64?: string
  }) =>
    request<Evidencia>('/evidencias', { method: 'POST', body: JSON.stringify(data) }),
  descargarEvidencia: (id: string) => requestBlob(`/evidencias/${id}/descargar`),
  eliminarEvidencia: (id: string) =>
    request<void>(`/evidencias/${id}`, { method: 'DELETE' }),

  // Recomendaciones
  listarRecomendaciones: (
    filtros: {
      objetivoId?: string
      kpiId?: string
      soloFijadas?: boolean
    } = {},
  ) => {
    const qs = new URLSearchParams()
    if (filtros.objetivoId) qs.set('objetivo', filtros.objetivoId)
    if (filtros.kpiId) qs.set('kpi', filtros.kpiId)
    if (filtros.soloFijadas) qs.set('soloFijadas', 'true')
    const q = qs.toString()
    return request<Recomendacion[]>(`/recomendaciones${q ? `?${q}` : ''}`)
  },
  crearRecomendacion: (data: {
    contenido: string
    objetivoId?: string
    kpiId?: string
  }) =>
    request<Recomendacion>('/recomendaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  actualizarRecomendacion: (id: string, data: { contenido: string }) =>
    request<Recomendacion>(`/recomendaciones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  fijarRecomendacion: (id: string, fijada: boolean) =>
    request<Recomendacion>(`/recomendaciones/${id}/fijar`, {
      method: 'PATCH',
      body: JSON.stringify({ fijada }),
    }),
  eliminarRecomendacion: (id: string) =>
    request<void>(`/recomendaciones/${id}`, { method: 'DELETE' }),

  // Tareas
  listarTareas: (
    filtros: {
      objetivoId?: string
      kpiId?: string
      responsableId?: string
      estado?: string
    } = {},
  ) => {
    const qs = new URLSearchParams()
    if (filtros.objetivoId) qs.set('objetivo', filtros.objetivoId)
    if (filtros.kpiId) qs.set('kpi', filtros.kpiId)
    if (filtros.responsableId) qs.set('responsable', filtros.responsableId)
    if (filtros.estado) qs.set('estado', filtros.estado)
    const q = qs.toString()
    return request<Tarea[]>(`/tareas${q ? `?${q}` : ''}`)
  },
  obtenerTarea: (id: string) => request<Tarea>(`/tareas/${id}`),
  crearTarea: (data: {
    titulo: string
    descripcion?: string
    objetivoId: string
    kpiId?: string
    responsableId?: string
    fechaInicio?: string
    fechaFin?: string
    estado?: string
    avance?: number
  }) => request<Tarea>('/tareas', { method: 'POST', body: JSON.stringify(data) }),
  actualizarTarea: (id: string, data: Partial<Tarea>) =>
    request<Tarea>(`/tareas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  eliminarTarea: (id: string) =>
    request<void>(`/tareas/${id}`, { method: 'DELETE' }),
  resultadosTarea: (id: string) =>
    request<ResultadoTarea[]>(`/tareas/${id}/resultados`),
  crearResultadoTarea: (
    id: string,
    data: { descripcion: string; valor?: number; fecha?: string },
  ) =>
    request<ResultadoTarea>(`/tareas/${id}/resultados`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  validarResultadoTarea: (
    id: string,
    data: {
      estadoValidacion: 'VALIDADO' | 'RECHAZADO'
      periodoId?: string
      valorAplicado?: number
    },
  ) =>
    request<ResultadoTarea>(`/tareas/resultados/${id}/validar`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Compromisos
  listarCompromisos: (filtros: { estado?: string; responsableId?: string } = {}) => {
    const qs = new URLSearchParams()
    if (filtros.estado) qs.set('estado', filtros.estado)
    if (filtros.responsableId) qs.set('responsable', filtros.responsableId)
    const q = qs.toString()
    return request<Compromiso[]>(`/compromisos${q ? `?${q}` : ''}`)
  },
  crearCompromiso: (data: Partial<Compromiso>) =>
    request<Compromiso>('/compromisos', { method: 'POST', body: JSON.stringify(data) }),
  actualizarCompromiso: (id: string, data: Partial<Compromiso>) =>
    request<Compromiso>(`/compromisos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  eliminarCompromiso: (id: string) =>
    request<void>(`/compromisos/${id}`, { method: 'DELETE' }),

  // Calendario
  listarCalendario: (periodoId?: string) =>
    request<EventoCalendario[]>(`/calendario${periodoId ? `?periodo=${periodoId}` : ''}`),
  crearEvento: (data: Partial<EventoCalendario>) =>
    request<EventoCalendario>('/calendario', { method: 'POST', body: JSON.stringify(data) }),
  actualizarEvento: (id: string, data: Partial<EventoCalendario>) =>
    request<EventoCalendario>(`/calendario/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  eliminarEvento: (id: string) =>
    request<void>(`/calendario/${id}`, { method: 'DELETE' }),

  // Versiones
  listarVersiones: () => request<PlanVersion[]>('/versiones'),
  obtenerVersion: (id: string) => request<PlanVersion>(`/versiones/${id}`),
  crearVersion: (data: { version: string; descripcion?: string; periodoId?: string; publicadoPor?: string }) =>
    request<PlanVersion>('/versiones', { method: 'POST', body: JSON.stringify(data) }),
  publicarVersion: (id: string) =>
    request<PlanVersion>(`/versiones/${id}/publicar`, { method: 'PATCH' }),
  archivarVersion: (id: string) =>
    request<PlanVersion>(`/versiones/${id}/archivar`, { method: 'PATCH' }),

  // Mapa estratégico
  mapaEstrategico: (periodoId?: string) =>
    request<MapaEstrategico>(`/mapa${periodoId ? `?periodo=${periodoId}` : ''}`),
  crearRelacion: (data: { causaId: string; efectoId: string; descripcion?: string }) =>
    request<RelacionCausal>('/mapa/relaciones', { method: 'POST', body: JSON.stringify(data) }),
  eliminarRelacion: (id: string) =>
    request<void>(`/mapa/relaciones/${id}`, { method: 'DELETE' }),

  // Comparación
  comparar: (a: string, b: string) =>
    request<Comparacion>(`/comparacion?a=${a}&b=${b}`),

  // Importación
  importarMediciones: (data: { periodoId: string; csv?: string; filas?: any[] }) =>
    request<{ periodo: string; totalFilas: number; importadas: number; errores: any[] }>('/importacion/mediciones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Aprobaciones
  aprobacionesPendientes: () => request<AprobacionItem[]>('/aprobaciones/pendientes'),
  solicitarAprobacion: (medicionId: string) =>
    request(`/aprobaciones/${medicionId}/solicitar`, { method: 'POST' }),
  aprobarMedicion: (medicionId: string, observacion?: string) =>
    request(`/aprobaciones/${medicionId}/aprobar`, { method: 'POST', body: JSON.stringify({ observacion }) }),
  rechazarMedicion: (medicionId: string, observacion?: string) =>
    request(`/aprobaciones/${medicionId}/rechazar`, { method: 'POST', body: JSON.stringify({ observacion }) }),
  historialAprobacion: (medicionId: string) => request(`/aprobaciones/historial/${medicionId}`),

  // Auditoría
  auditoria: (filtros: { entidad?: string; usuario?: string; limite?: number } = {}) => {
    const qs = new URLSearchParams()
    if (filtros.entidad) qs.set('entidad', filtros.entidad)
    if (filtros.usuario) qs.set('usuario', filtros.usuario)
    if (filtros.limite) qs.set('limite', String(filtros.limite))
    const q = qs.toString()
    return request<Auditoria[]>(`/auditoria${q ? `?${q}` : ''}`)
  },

  // Config
  obtenerConfig: () => request<Config>('/config'),
  actualizarConfig: (data: Partial<Config>) =>
    request<Config>('/config', { method: 'PATCH', body: JSON.stringify(data) }),
  actualizarPonderacionPerspectiva: (id: string, ponderacion: number) =>
    request(`/config/perspectivas/${id}/ponderacion`, { method: 'PATCH', body: JSON.stringify({ ponderacion }) }),
}

