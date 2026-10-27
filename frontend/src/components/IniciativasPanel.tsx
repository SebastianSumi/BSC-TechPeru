import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/useAuth'
import type { Iniciativa, Objetivo } from '../data/types'
import { Select } from './Select'

export function IniciativasPanel() {
  const { puede } = useAuth()
  const [iniciativas, setIniciativas] = useState<Iniciativa[]>([])
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [mostrar, setMostrar] = useState(false)
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    objetivoId: '',
    presupuesto: 0,
  })

  const cargar = () => {
    api.listarIniciativas().then(setIniciativas).catch(() => {})
    api.listarObjetivos().then(setObjetivos).catch(() => {})
  }
  useEffect(() => {
    cargar()
  }, [])

  const crear = async () => {
    await api.crearIniciativa(form)
    setMostrar(false)
    cargar()
  }

  const puedeGestionar = puede('ADMIN', 'GERENTE')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {puedeGestionar && (
          <button
            onClick={() => setMostrar((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          >
            <Plus size={13} /> Nueva iniciativa
          </button>
        )}
      </div>
      {mostrar && (
        <div
          className="grid gap-2 rounded-2xl border p-3 sm:grid-cols-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <input
            placeholder="Código"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <input
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs sm:col-span-2"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <Select
            value={form.objetivoId}
            onChange={(e) => setForm({ ...form, objetivoId: e.target.value })}
            className="bsc-select">
            <option value="">Selecciona un objetivo…</option>
            {objetivos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.codigo} · {o.nombre}
              </option>
            ))}
          </Select>
          <button
            onClick={crear}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: '#3b82f6' }}
          >
            Guardar
          </button>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {iniciativas.map((ini) => (
          <div
            key={ini.id}
            className="rounded-2xl border p-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                {ini.codigo} — {ini.nombre}
              </p>
              <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'var(--surface-2)' }}>
                {ini.estado}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Responsable: {ini.responsable?.nombre ?? '-'} · Presupuesto: S/ {ini.presupuesto ?? 0}
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full" style={{ background: 'var(--surface-2)' }}>
              <div
                className="h-1.5 rounded-full"
                style={{ width: `${Math.min(100, ini.avance ?? 0)}%`, background: '#3b82f6' }}
              />
            </div>
            <p className="mt-1 text-[10px] text-[var(--muted)]">Avance {ini.avance ?? 0}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}
