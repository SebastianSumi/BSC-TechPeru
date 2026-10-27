import { useState } from 'react'
import { Calendar, Check, Plus, X } from 'lucide-react'
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
    <div className="relative flex items-center gap-1.5">
      <Calendar size={14} className="hidden text-[var(--muted)] sm:block" />
      <select
        value={periodoId}
        onChange={(e) => onCambiar(e.target.value)}
        title="Período de evaluación"
        aria-label="Período de evaluación"
        className="max-w-[150px] rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold outline-none transition focus:border-[#93c5fd]"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
      >
        <option value="">Sin período</option>
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
          aria-label="Marcar como período activo"
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border transition hover:bg-[var(--surface-2)]"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--green)' }}
        >
          <Check size={13} />
        </button>
      )}

      {puedeGestionar && (
        <>
          <button
            onClick={() => setMostrarForm((v) => !v)}
            title="Nuevo período"
            aria-label="Nuevo período"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border transition hover:bg-[var(--surface-2)]"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {mostrarForm ? <X size={13} /> : <Plus size={13} />}
          </button>

          {mostrarForm && (
            <div
              className="absolute right-0 top-10 z-50 w-60 rounded-xl border p-3 shadow-lg"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                Crear período
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="field-bsc">
                  <label htmlFor="anio">Año</label>
                  <input
                    id="anio"
                    type="number"
                    value={form.anio}
                    onChange={(e) => setForm({ ...form, anio: Number(e.target.value) })}
                    className="!py-1.5 !text-[11px]"
                  />
                </div>
                <div className="field-bsc">
                  <label htmlFor="trimestre">Trimestre</label>
                  <select
                    id="trimestre"
                    value={form.trimestre}
                    onChange={(e) => setForm({ ...form, trimestre: Number(e.target.value) })}
                    className="!py-1.5 !text-[11px]"
                  >
                    {[1, 2, 3, 4].map((t) => (
                      <option key={t} value={t}>
                        Q{t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={crear} className="btn-bsc btn-bsc-primary mt-2 w-full !py-1.5">
                Crear período
              </button>
            </div>
          )}
        </>
      )}

      {usuarioRol && (
        <span className="hidden text-[10px] text-[var(--muted)] xl:inline">· {usuarioRol}</span>
      )}
    </div>
  )
}
