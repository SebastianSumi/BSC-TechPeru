import { useEffect, useMemo, useState } from 'react'
import { Pin, PinOff, Plus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import type { Kpi, Objetivo, Recomendacion } from '../data/types'
import { Select } from './Select'

export function RecomendacionesPanel() {
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([])
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [filtroObjetivo, setFiltroObjetivo] = useState('')
  const [filtroKpi, setFiltroKpi] = useState('')
  const [soloFijadas, setSoloFijadas] = useState(false)
  const [mostrar, setMostrar] = useState(false)
  const [form, setForm] = useState({ contenido: '', objetivoId: '', kpiId: '' })

  const cargar = () => {
    Promise.all([
      api.listarRecomendaciones({
        objetivoId: filtroObjetivo || undefined,
        kpiId: filtroKpi || undefined,
        soloFijadas,
      }),
      api.listarObjetivos(),
      api.listarKpis(),
    ])
      .then(([rs, os, ks]) => {
        setRecomendaciones(rs)
        setObjetivos(os)
        setKpis(ks)
        setForm((f) => ({
          ...f,
          objetivoId: f.objetivoId || os[0]?.id || '',
        }))
      })
      .catch(() => {})
  }
  useEffect(() => {
    cargar()
  }, [filtroObjetivo, filtroKpi, soloFijadas])

  const kpisFiltro = useMemo(
    () =>
      kpis.filter(
        (k) => !form.objetivoId || k.objetivoId === form.objetivoId,
      ),
    [kpis, form.objetivoId],
  )

  const crear = async () => {
    if (!form.contenido.trim() || (!form.objetivoId && !form.kpiId)) return
    await api.crearRecomendacion({
      contenido: form.contenido,
      objetivoId: form.objetivoId || undefined,
      kpiId: form.kpiId || undefined,
    })
    setForm({ contenido: '', objetivoId: objetivos[0]?.id || '', kpiId: '' })
    setMostrar(false)
    cargar()
  }

  const fijar = async (r: Recomendacion) => {
    await api.fijarRecomendacion(r.id, !r.fijada)
    cargar()
  }

  const eliminar = async (id: string) => {
    await api.eliminarRecomendacion(id)
    cargar()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filtroObjetivo}
            onChange={(e) => {
              setFiltroObjetivo(e.target.value)
              setFiltroKpi('')
            }}
            className="px-2.5 bsc-select">
            <option value="">Todos los objetivos</option>
            {objetivos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.codigo} · {o.nombre}
              </option>
            ))}
          </Select>
          <Select
            value={filtroKpi}
            onChange={(e) => setFiltroKpi(e.target.value)}
            className="px-2.5 bsc-select">
            <option value="">Todos los KPI</option>
            {kpis
              .filter(
                (k) => !filtroObjetivo || k.objetivoId === filtroObjetivo,
              )
              .map((k) => (
                <option key={k.id} value={k.id}>
                  {k.codigo ?? k.id} · {k.nombre}
                </option>
              ))}
          </Select>
          <label className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <input
              type="checkbox"
              checked={soloFijadas}
              onChange={(e) => setSoloFijadas(e.target.checked)}
            />
            Solo fijadas
          </label>
        </div>
        <button
          onClick={() => setMostrar((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <Plus size={13} /> Nueva recomendación
        </button>
      </div>

      {mostrar && (
        <div
          className="grid gap-2 rounded-2xl border p-3 sm:grid-cols-2 lg:grid-cols-4"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <textarea
            placeholder="Contenido de la recomendación"
            value={form.contenido}
            onChange={(e) => setForm({ ...form, contenido: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs sm:col-span-2"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <Select
            value={form.objetivoId}
            onChange={(e) =>
              setForm({ ...form, objetivoId: e.target.value, kpiId: '' })
            }
            className="bsc-select">
            <option value="">Sin objetivo</option>
            {objetivos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.codigo} · {o.nombre}
              </option>
            ))}
          </Select>
          <Select
            value={form.kpiId}
            onChange={(e) => setForm({ ...form, kpiId: e.target.value })}
            className="bsc-select">
            <option value="">Sin KPI</option>
            {kpisFiltro.map((k) => (
              <option key={k.id} value={k.id}>
                {k.codigo ?? k.id} · {k.nombre}
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

      <div className="grid gap-2 sm:grid-cols-2">
        {recomendaciones.map((r) => (
          <article
            key={r.id}
            className="rounded-2xl border p-3"
            style={{
              background: 'var(--surface)',
              borderColor: r.fijada ? 'rgba(59,130,246,0.5)' : 'var(--border)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm leading-relaxed">{r.contenido}</p>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => fijar(r)}
                  className="rounded-lg border p-1.5"
                  title={r.fijada ? 'Quitar fijada' : 'Fijar recomendación'}
                  style={{ color: r.fijada ? '#3b82f6' : undefined }}
                >
                  {r.fijada ? <PinOff size={13} /> : <Pin size={13} />}
                </button>
                <button
                  onClick={() => eliminar(r.id)}
                  className="rounded-lg border p-1.5 text-[#ef4444]"
                  title="Eliminar"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-[var(--muted)]">
              {r.objetivo?.codigo ?? 'General'} · {r.kpi?.nombre ?? 'Sin KPI'} ·{' '}
              {r.autor?.nombre ?? 'Autor'} ·{' '}
              {new Date(r.createdAt).toLocaleDateString()}
            </p>
          </article>
        ))}
      </div>
      {recomendaciones.length === 0 && (
        <p className="text-center text-sm text-[var(--muted)]">
          Sin recomendaciones registradas.
        </p>
      )}
    </div>
  )
}
