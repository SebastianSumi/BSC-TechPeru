import { useEffect, useState } from 'react'
import { Plus, Power } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import type { Perspectiva } from '../data/types'

const FORM_VACIO = {
  codigo: '',
  titulo: '',
  descripcion: '',
  orden: 0,
  icono: '◆',
  color: '#2563eb',
}

export function PerspectivasPanel() {
  const { puede } = useAuth()
  const puedeGestionar = puede('ADMIN', 'GERENTE')
  const [perspectivas, setPerspectivas] = useState<Perspectiva[]>([])
  const [mostrar, setMostrar] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)

  const cargar = () =>
    api.listarCatalogos(true).then(setPerspectivas).catch(() => {})
  useEffect(() => {
    cargar()
  }, [])

  const crear = async () => {
    if (!form.codigo.trim() || !form.titulo.trim()) return
    await api.crearCatalogo({
      codigo: form.codigo,
      titulo: form.titulo,
      descripcion: form.descripcion || undefined,
      orden: form.orden,
      icono: form.icono || undefined,
      color: form.color || undefined,
    })
    setForm(FORM_VACIO)
    setMostrar(false)
    cargar()
  }

  const alternar = async (p: Perspectiva) => {
    await api.actualizarCatalogo(p.id, { activo: !p.activo })
    cargar()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {puedeGestionar && (
          <button
            onClick={() => setMostrar((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <Plus size={13} /> Nueva perspectiva
          </button>
        )}
      </div>

      {mostrar && (
        <div
          className="grid gap-2 rounded-2xl border p-3 sm:grid-cols-3 lg:grid-cols-6"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <input
            placeholder="Código (FIN)"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <input
            placeholder="Nombre"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs sm:col-span-2"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <input
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs sm:col-span-2"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <input
            type="number"
            placeholder="Orden"
            value={form.orden}
            onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <input
            placeholder="Icono"
            value={form.icono}
            onChange={(e) => setForm({ ...form, icono: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="h-8 rounded-lg border px-1 py-0.5"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <button
            onClick={crear}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: '#3b82f6' }}
          >
            Guardar
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {perspectivas.map((p) => (
          <article
            key={p.id}
            className="bsc-card p-4"
            style={{ opacity: p.activo === false ? 0.5 : 1 }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span
                  className="tag"
                  style={{ background: `${p.color ?? '#3b82f6'}18`, color: p.color }}
                >
                  {p.icono} {p.codigo ?? p.id}
                </span>
                <p className="mt-2 text-sm font-semibold">{p.nombre}</p>
              </div>
              {puedeGestionar && (
                <button
                  onClick={() => alternar(p)}
                  className="rounded-lg border p-1.5"
                  title={p.activo === false ? 'Activar' : 'Desactivar'}
                >
                  <Power size={13} />
                </button>
              )}
            </div>
            <p className="mt-1 text-[11px] text-[var(--muted)]">{p.descripcion}</p>
            <p className="mt-2 text-[10px] text-[var(--muted)]">
              {p.activo === false ? 'Inactiva' : 'Activa'} · orden {p.orden ?? 0}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}
