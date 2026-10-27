import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import type { Desviacion, Kpi } from '../data/types'

export function DesviacionesPanel() {
  const { puede } = useAuth()
  const [desviaciones, setDesviaciones] = useState<Desviacion[]>([])
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [mostrar, setMostrar] = useState(false)
  const [form, setForm] = useState({ kpiId: '', causa: '', impacto: '', medidaCorrectiva: '' })

  const cargar = () => {
    api.listarDesviaciones().then(setDesviaciones).catch(() => {})
    api.listarKpis().then(setKpis).catch(() => {})
  }
  useEffect(() => {
    cargar()
  }, [])

  const crear = async () => {
    await api.crearDesviacion(form)
    setMostrar(false)
    setForm({ kpiId: '', causa: '', impacto: '', medidaCorrectiva: '' })
    cargar()
  }

  const puedeGestionar = puede('ADMIN', 'GERENTE', 'ANALISTA', 'RESPONSABLE')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {puedeGestionar && (
          <button
            onClick={() => setMostrar((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <Plus size={13} /> Registrar desviación
          </button>
        )}
      </div>
      {mostrar && (
        <div
          className="grid gap-2 rounded-2xl border p-3 sm:grid-cols-4"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <select
            value={form.kpiId}
            onChange={(e) => setForm({ ...form, kpiId: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <option value="">KPI...</option>
            {kpis.map((k) => (
              <option key={k.id} value={k.id}>
                {k.id} - {k.nombre}
              </option>
            ))}
          </select>
          <input
            placeholder="Causa"
            value={form.causa}
            onChange={(e) => setForm({ ...form, causa: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <input
            placeholder="Medida correctiva"
            value={form.medidaCorrectiva}
            onChange={(e) => setForm({ ...form, medidaCorrectiva: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
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
      <div className="space-y-2">
        {desviaciones.map((d) => (
          <div
            key={d.id}
            className="rounded-2xl border p-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                {d.kpi?.id} — {d.kpi?.nombre}
              </p>
              <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'var(--surface-2)' }}>
                {d.estado}
              </span>
            </div>
            <p className="mt-1 text-xs">
              <span className="text-[var(--muted)]">Causa:</span> {d.causa}
            </p>
            <p className="mt-1 text-xs">
              <span className="text-[var(--muted)]">Medida correctiva:</span> {d.medidaCorrectiva}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
