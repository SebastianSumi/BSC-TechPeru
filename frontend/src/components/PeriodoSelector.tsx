import { useState } from 'react'
import { Calendar, Plus, Check } from 'lucide-react'
import { api } from '../lib/api'
import type { Periodo } from '../data/types'

export function PeriodoSelector({
  periodos,
  periodoId,
  onCambiar,
  onRecargar,
  puedeGestionar,
  usuarioRol,
}: {
  periodos: Periodo[]
  periodoId: string
  onCambiar: (id: string) => void
  onRecargar: () => void
  puedeGestionar: boolean
  usuarioRol?: string
}) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ anio: 2026, trimestre: 1 })

  const crear = async () => {
    const nombre = `${form.anio}-Q${form.trimestre}`
    try {
      await api.crearPeriodo({ nombre, anio: form.anio, trimestre: form.trimestre })
      setMostrarForm(false)
      onRecargar()
    } catch {
      /* ignore */
    }
  }

  const activar = async (id: string) => {
    await api.activarPeriodo(id)
    onRecargar()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
        <Calendar size={14} /> Período
      </span>
      <select
        value={periodoId}
        onChange={(e) => onCambiar(e.target.value)}
        className="rounded-lg border px-3 py-1.5 text-sm outline-none"
        style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
      >
        <option value="">Sin período (base)</option>
        {periodos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
            {p.activo ? ' · activo' : ''}
          </option>
        ))}
      </select>

      {puedeGestionar && periodoId && (
        <button
          onClick={() => activar(periodoId)}
          title="Marcar como período activo"
          className="rounded-lg border px-2 py-1.5 text-xs transition"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <Check size={14} />
        </button>
      )}

      {puedeGestionar && (
        <>
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <Plus size={13} /> Período
          </button>
          {mostrarForm && (
            <div
              className="flex items-end gap-2 rounded-lg border p-2"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <div>
                <label className="block text-[10px] text-[var(--muted)]">Año</label>
                <input
                  type="number"
                  value={form.anio}
                  onChange={(e) => setForm({ ...form, anio: Number(e.target.value) })}
                  className="w-16 rounded border px-2 py-1 text-xs outline-none"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--muted)]">Trim.</label>
                <select
                  value={form.trimestre}
                  onChange={(e) => setForm({ ...form, trimestre: Number(e.target.value) })}
                  className="rounded border px-2 py-1 text-xs outline-none"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  {[1, 2, 3, 4].map((t) => (
                    <option key={t} value={t}>
                      Q{t}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={crear}
                className="rounded px-2.5 py-1 text-xs font-semibold text-white"
                style={{ background: '#3b82f6' }}
              >
                Crear
              </button>
            </div>
          )}
        </>
      )}
      {usuarioRol && (
        <span className="hidden text-[11px] text-[var(--muted)] sm:inline">
          · {usuarioRol}
        </span>
      )}
    </div>
  )
}
