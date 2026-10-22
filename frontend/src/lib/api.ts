import type {
  Asignacion,
  Kpi,
  Periodo,
  Reporte,
  ResumenApi,
  RolNombre,
  Usuario,
} from '../data/types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const TOKEN_KEY = 'bsc_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
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
    request<{ id: string; meta: number; real: number; nota?: string; periodo: Periodo }[]>(
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
}
