import { useEffect, useState } from 'react'
import { UserPlus, Users as UsersIcon, Trash2, Link2 } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import type { Asignacion, Kpi, RolNombre, Usuario } from '../data/types'

const ROLES: RolNombre[] = ['ADMIN', 'GERENTE', 'ANALISTA', 'RESPONSABLE']

export function AdminPanel() {
  const { puede } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [form, setForm] = useState({ email: '', nombre: '', password: '', rol: 'ANALISTA' as RolNombre })
  const [asig, setAsig] = useState({ usuarioId: '', kpiId: '' })
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const esAdmin = puede('ADMIN')

  const cargar = () => {
    api.listarUsuarios().then(setUsuarios).catch(() => {})
    api.listarKpis().then(setKpis).catch(() => {})
    api.listarAsignaciones().then(setAsignaciones).catch(() => {})
  }

  useEffect(cargar, [])

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
      setError(String(err))
    }
  }

  const cambiarRol = async (id: string, rol: RolNombre) => {
    await api.actualizarUsuario(id, { rol })
    cargar()
  }

  const toggleActivo = async (u: Usuario) => {
    await api.actualizarUsuario(u.id, { activo: !(u.activo ?? true) })
    cargar()
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
      setError(String(err))
    }
  }

  const quitarAsignacion = async (id: string) => {
    await api.eliminarAsignacion(id)
    cargar()
  }

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <UsersIcon size={20} className="text-[#3b82f6]" /> Usuarios, roles y asignación de objetivos
      </h2>

      {error && <p className="text-sm text-[#ef4444]">{error}</p>}
      {msg && <p className="text-sm text-[#10b981]">{msg}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div
          className="rounded-2xl border p-4"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="mb-3 text-sm font-semibold">Usuarios</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                  <th className="px-2 py-2 text-left text-xs text-[var(--muted)]">Nombre</th>
                  <th className="px-2 py-2 text-left text-xs text-[var(--muted)]">Rol</th>
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
                        <select
                          value={u.rol}
                          onChange={(e) => cambiarRol(u.id, e.target.value as RolNombre)}
                          className="rounded-md border px-2 py-1 text-xs outline-none"
                          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs">{u.rol}</span>
                      )}
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
        </div>

        {esAdmin && (
          <form
            onSubmit={crearUsuario}
            className="rounded-2xl border p-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
              <UserPlus size={16} /> Nuevo usuario
            </p>
            <div className="space-y-3">
              <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
              <Input label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
              <Input label="Contraseña" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />
              <div>
                <label className="mb-1 block text-[11px] text-[var(--muted)]">Rol</label>
                <select
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value as RolNombre })}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ background: '#3b82f6' }}
              >
                Crear usuario
              </button>
            </div>
          </form>
        )}
      </div>

      <div
        className="rounded-2xl border p-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <Link2 size={16} /> Asignación de objetivos (KPIs) a responsables
        </p>

        <form onSubmit={crearAsignacion} className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[11px] text-[var(--muted)]">Usuario</label>
            <select
              value={asig.usuarioId}
              onChange={(e) => setAsig({ ...asig, usuarioId: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <option value="">Selecciona…</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.rol})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-[var(--muted)]">Objetivo / KPI</label>
            <select
              value={asig.kpiId}
              onChange={(e) => setAsig({ ...asig, kpiId: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <option value="">Selecciona…</option>
              {kpis.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nombre}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: '#3b82f6' }}
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
