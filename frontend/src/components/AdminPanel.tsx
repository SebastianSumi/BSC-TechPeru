import { useEffect, useState } from 'react'
import { KeyRound, RefreshCcw, UserPlus, Users, Trash2, Link2 } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import type { Asignacion, Kpi, RolNombre, Usuario } from '../data/types'
import { Select } from './Select'

const ROLES: RolNombre[] = ['ADMIN', 'GERENTE', 'ANALISTA', 'RESPONSABLE']

function rolDescripcion(
  roles: { nombre: RolNombre; descripcion: string }[],
  rol: RolNombre,
): string {
  return roles.find((r) => r.nombre === rol)?.descripcion ?? ''
}

type Permiso = { area: string; accion: string; roles: RolNombre[] }

const TODOS: RolNombre[] = ['ADMIN', 'GERENTE', 'ANALISTA', 'RESPONSABLE']

const PERMISOS: Permiso[] = [
  { area: 'Estrategia', accion: 'Consultar dashboard, perspectivas, KPIs y reportes', roles: TODOS },
  { area: 'Estrategia', accion: 'Editar valores reales y registrar mediciones', roles: ['ADMIN', 'GERENTE', 'ANALISTA'] },
  { area: 'Estrategia', accion: 'Crear y editar objetivos estratégicos', roles: ['ADMIN', 'GERENTE'] },
  { area: 'Estrategia', accion: 'Crear indicadores en el diccionario KPI', roles: ['ADMIN', 'GERENTE'] },
  { area: 'Estrategia', accion: 'Editar indicadores, asignar equipo y desactivar', roles: ['ADMIN', 'GERENTE', 'RESPONSABLE'] },
  { area: 'Estrategia', accion: 'Ver historial de versiones del plan', roles: TODOS },
  { area: 'Estrategia', accion: 'Publicar o archivar versiones del plan', roles: ['ADMIN', 'GERENTE'] },
  { area: 'Proyectos', accion: 'Crear y eliminar iniciativas', roles: ['ADMIN', 'GERENTE'] },
  { area: 'Proyectos', accion: 'Editar iniciativas (fechas, avance, presupuesto, estado)', roles: ['ADMIN', 'GERENTE', 'ANALISTA'] },
  { area: 'Proyectos', accion: 'Crear tareas, resultados y recomendaciones', roles: TODOS },
  { area: 'Proyectos', accion: 'Registrar desviaciones y compromisos', roles: ['ADMIN', 'GERENTE', 'ANALISTA'] },
  { area: 'Proyectos', accion: 'Subir y validar evidencias', roles: TODOS },
  { area: 'Control', accion: 'Generar alertas automáticas por período', roles: ['ADMIN', 'GERENTE', 'ANALISTA'] },
  { area: 'Control', accion: 'Ver la auditoría de cambios', roles: ['ADMIN', 'GERENTE'] },
  { area: 'Control', accion: 'Importar mediciones masivamente (CSV)', roles: ['ADMIN', 'GERENTE', 'ANALISTA'] },
  { area: 'Control', accion: 'Solicitar aprobación de mediciones', roles: ['ADMIN', 'GERENTE', 'ANALISTA'] },
  { area: 'Control', accion: 'Aprobar o rechazar mediciones', roles: ['ADMIN', 'GERENTE'] },
  { area: 'Administración', accion: 'Gestionar períodos (crear, activar)', roles: ['ADMIN', 'GERENTE'] },
  { area: 'Administración', accion: 'Asignar objetivos (KPIs) a responsables', roles: ['ADMIN', 'GERENTE'] },
  { area: 'Administración', accion: 'Ver el listado de usuarios', roles: ['ADMIN', 'GERENTE'] },
  { area: 'Administración', accion: 'Crear usuarios y cambiar roles o estado', roles: ['ADMIN'] },
  { area: 'Administración', accion: 'Configuración global (umbrales, formato, agregación)', roles: ['ADMIN'] },
  { area: 'Administración', accion: 'Ponderaciones de las perspectivas', roles: ['ADMIN', 'GERENTE'] },
  { area: 'Administración', accion: 'Identidad de la compañía (sigla, color, visión y misión)', roles: ['ADMIN', 'GERENTE'] },
]

export function AdminPanel() {
  const { puede } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [roles, setRoles] = useState<{ nombre: RolNombre; descripcion: string }[]>([])
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState({ email: '', nombre: '', password: '', rol: 'ANALISTA' as RolNombre })
  const [asig, setAsig] = useState({ usuarioId: '', kpiId: '' })
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const esAdmin = puede('ADMIN')

  const cargar = async () => {
    setCargando(true)
    setError('')
    try {
      const [u, k, a, r] = await Promise.all([
        api.listarUsuarios(),
        api.listarKpis(),
        api.listarAsignaciones(),
        api.listarRoles().catch(() => [] as { nombre: RolNombre; descripcion: string }[]),
      ])
      setUsuarios(u)
      setKpis(k)
      setAsignaciones(a)
      setRoles(r)
    } catch (err) {
      setError(
        `No se pudo cargar la información: ${err instanceof Error ? err.message : String(err)}`,
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMsg('')
    try {
      await api.crearUsuario(form)
      setForm({ email: '', nombre: '', password: '', rol: 'ANALISTA' })
      setMsg('Usuario creado')
      cargar()
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err))
    }
  }

  const cambiarRol = async (id: string, rol: RolNombre) => {
    try {
      await api.actualizarUsuario(id, { rol })
      setMsg('Rol actualizado')
      cargar()
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err))
    }
  }

  const toggleActivo = async (u: Usuario) => {
    try {
      await api.actualizarUsuario(u.id, { activo: !(u.activo ?? true) })
      setMsg((u.activo ?? true) ? 'Usuario desactivado' : 'Usuario activado')
      cargar()
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err))
    }
  }

  const crearAsignacion = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMsg('')
    if (!asig.usuarioId || !asig.kpiId) return
    try {
      await api.crearAsignacion(asig.usuarioId, asig.kpiId)
      setMsg('Objetivo asignado')
      setAsig({ usuarioId: '', kpiId: '' })
      cargar()
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err))
    }
  }

  const quitarAsignacion = async (id: string) => {
    try {
      await api.eliminarAsignacion(id)
      setMsg('Asignación eliminada')
      cargar()
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err))
    }
  }

  const activos = usuarios.filter((u) => u.activo ?? true).length
  const porRol = ROLES.map((r) => ({ rol: r, total: usuarios.filter((u) => u.rol === r).length }))

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <ResumenUsuarios
          titulo="Usuarios"
          valor={usuarios.length}
          detalle={`${activos} activos`}
          icon={<Users size={16} />}
        />
        <ResumenUsuarios
          titulo="Objetivos asignados"
          valor={asignaciones.length}
          detalle="asignaciones vigentes"
          icon={<Link2 size={16} />}
        />
        <div className="bsc-card p-4">
          <p className="text-xs text-[var(--muted)]">Por rol</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {porRol.map((p) => (
              <span
                key={p.rol}
                className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
              >
                {p.rol}: {p.total}
              </span>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
          {error}
          <button onClick={cargar} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold underline">
            <RefreshCcw size={12} /> Reintentar
          </button>
        </p>
      )}
      {msg && <p className="text-sm text-[#10b981]">{msg}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bsc-card bsc-panel">
          <div className="bsc-panel-head">
            <div>
              <h2>Usuarios</h2>
              <p>Administra roles y estado de las cuentas.</p>
            </div>
          </div>
          {cargando ? (
            <p className="text-sm text-[var(--muted)]">Cargando usuarios…</p>
          ) : usuarios.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No hay usuarios para mostrar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="bsc-table">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left text-xs text-[var(--muted)]">Nombre</th>
                    <th className="px-2 py-2 text-left text-xs text-[var(--muted)]">Rol</th>
                    <th className="px-2 py-2 text-left text-xs text-[var(--muted)]">Objetivos</th>
                    <th className="px-2 py-2 text-left text-xs text-[var(--muted)]">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-2 py-2">
                        <p className="font-medium">{u.nombre}</p>
                        <p className="text-[11px] text-[var(--muted)]">{u.email}</p>
                      </td>
                      <td className="px-2 py-2">
                        {esAdmin ? (
                          <Select
                            value={u.rol}
                            onChange={(e) => cambiarRol(u.id, e.target.value as RolNombre)}
                            className="bsc-select--sm"
                            title={rolDescripcion(roles, u.rol)}
                          >
                            {(roles.length ? roles.map((r) => r.nombre) : ROLES).map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <span className="text-xs">{u.rol}</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        {u.asignaciones?.length ?? asignaciones.filter((a) => a.usuario?.id === u.id).length}
                      </td>
                      <td className="px-2 py-2">
                        {esAdmin ? (
                          <button
                            onClick={() => toggleActivo(u)}
                            className="rounded px-2 py-0.5 text-[11px] font-semibold"
                            style={{
                              background: (u.activo ?? true) ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                              color: (u.activo ?? true) ? '#10b981' : '#ef4444',
                            }}
                          >
                            {(u.activo ?? true) ? 'Activo' : 'Inactivo'}
                          </button>
                        ) : (
                          <span className="text-xs text-[var(--muted)]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {esAdmin && (
          <form onSubmit={crearUsuario} className="bsc-card bsc-panel">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-bold">
              <UserPlus size={16} /> Nuevo usuario
            </p>
            <div className="space-y-3">
              <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
              <Input label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
              <Input label="Contraseña" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />
              <div>
                <label className="mb-1 block text-[11px] text-[var(--muted)]">Rol</label>
                <Select
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value as RolNombre })}
                >
                  {(roles.length ? roles.map((r) => r.nombre) : ROLES).map((r) => (
                    <option key={r} value={r}>
                      {r}
                      {rolDescripcion(roles, r) ? ` · ${rolDescripcion(roles, r)}` : ''}
                    </option>
                  ))}
                </Select>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ background: 'var(--blue)' }}
              >
                Crear usuario
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bsc-card bsc-panel">
        <p className="mb-1 flex items-center gap-1.5 text-sm font-bold">
          <KeyRound size={16} /> Permisos por rol
        </p>
        <p className="mb-3 text-xs text-[var(--muted)]">
          Matriz de capacidades según los roles del sistema. Los permisos se aplican en el
          backend: cada endpoint verifica el rol antes de ejecutar la operación.
        </p>
        <div className="overflow-x-auto">
          <table className="bsc-table">
            <thead>
              <tr>
                <th className="px-2 py-2 text-left text-xs text-[var(--muted)]">Área</th>
                <th className="px-2 py-2 text-left text-xs text-[var(--muted)]">Capacidad</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-2 py-2 text-center text-xs text-[var(--muted)]">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISOS.map((p) => (
                <tr key={p.accion} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-2 py-2 text-[11px] text-[var(--muted)]">{p.area}</td>
                  <td className="px-2 py-2 text-xs">{p.accion}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-2 py-2 text-center">
                      {p.roles.includes(r) ? (
                        <span className="font-bold text-[#10b981]">✓</span>
                      ) : (
                        <span className="text-[var(--muted)]">·</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bsc-card bsc-panel">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-bold">
          <Link2 size={16} /> Asignación de objetivos (KPIs) a responsables
        </p>

        <form onSubmit={crearAsignacion} className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[11px] text-[var(--muted)]">Usuario</label>
            <Select
              value={asig.usuarioId}
              onChange={(e) => setAsig({ ...asig, usuarioId: e.target.value })}
            >
              <option value="">Selecciona…</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.rol})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-[var(--muted)]">Objetivo / KPI</label>
            <Select
              value={asig.kpiId}
              onChange={(e) => setAsig({ ...asig, kpiId: e.target.value })}
            >
              <option value="">Selecciona…</option>
              {kpis.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.codigo ?? k.id} · {k.nombre}
                </option>
              ))}
            </Select>
          </div>
          <button
            type="submit"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: 'var(--blue)' }}
          >
            Asignar
          </button>
        </form>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {asignaciones.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{a.kpi?.nombre}</p>
                <p className="truncate text-[11px] text-[var(--muted)]">{a.usuario?.nombre}</p>
              </div>
              <button
                onClick={() => quitarAsignacion(a.id)}
                className="shrink-0 rounded p-1 text-[#ef4444] hover:bg-[rgba(239,68,68,0.15)]"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {asignaciones.length === 0 && (
            <p className="text-xs text-[var(--muted)]">Sin asignaciones.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ResumenUsuarios({
  titulo,
  valor,
  detalle,
  icon,
}: {
  titulo: string
  valor: number
  detalle: string
  icon: React.ReactNode
}) {
  return (
    <div className="bsc-card p-4">
      <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
        {icon} {titulo}
      </p>
      <p className="mt-1 text-2xl font-bold">{valor}</p>
      <p className="text-[11px] text-[var(--muted)]">{detalle}</p>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] text-[var(--muted)]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
        style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
      />
    </div>
  )
}
