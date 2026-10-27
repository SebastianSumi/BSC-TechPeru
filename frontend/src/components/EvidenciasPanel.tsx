import { useEffect, useState } from 'react'
import { Download, FileText, Link2, Paperclip, Plus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import type { Evidencia, Kpi, Tarea, TipoEvidencia } from '../data/types'
import { Select } from './Select'

type FormEvidencia = {
  tipo: TipoEvidencia
  titulo: string
  kpiId: string
  tareaId: string
  resultadoTareaId: string
  url: string
  contenido: string
  descripcion: string
  nombreArchivo: string
  mimeType: string
  tamano: number
  contenidoBase64: string
}

const FORM_VACIO: FormEvidencia = {
  tipo: 'ENLACE',
  titulo: '',
  kpiId: '',
  tareaId: '',
  resultadoTareaId: '',
  url: '',
  contenido: '',
  descripcion: '',
  nombreArchivo: '',
  mimeType: '',
  tamano: 0,
  contenidoBase64: '',
}

export function EvidenciasPanel() {
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [mostrar, setMostrar] = useState(false)
  const [form, setForm] = useState<FormEvidencia>(FORM_VACIO)

  const cargar = () => {
    api.listarEvidencias().then(setEvidencias).catch(() => {})
    api.listarKpis().then(setKpis).catch(() => {})
    api.listarTareas().then(setTareas).catch(() => {})
  }
  useEffect(() => {
    cargar()
  }, [])

  const seleccionarArchivo = async (file: File | null) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo supera el límite de 10 MB')
      return
    }
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const resultado = String(reader.result ?? '')
        resolve(resultado.includes(',') ? resultado.split(',')[1] : resultado)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    setForm((f) => ({
      ...f,
      nombreArchivo: file.name,
      mimeType: file.type || 'application/octet-stream',
      tamano: file.size,
      contenidoBase64: base64,
    }))
  }

  const crear = async () => {
    if (!form.titulo.trim()) return
    await api.crearEvidencia({
      tipo: form.tipo,
      titulo: form.titulo,
      kpiId: form.kpiId || undefined,
      tareaId: form.tareaId || undefined,
      resultadoTareaId: form.resultadoTareaId || undefined,
      descripcion: form.descripcion || undefined,
      url: form.tipo === 'ENLACE' ? form.url || undefined : undefined,
      contenido: form.tipo === 'TEXTO' ? form.contenido || undefined : undefined,
      nombreArchivo: form.tipo === 'ARCHIVO' ? form.nombreArchivo : undefined,
      mimeType: form.tipo === 'ARCHIVO' ? form.mimeType : undefined,
      tamano: form.tipo === 'ARCHIVO' ? form.tamano : undefined,
      contenidoBase64: form.tipo === 'ARCHIVO' ? form.contenidoBase64 : undefined,
    })
    setMostrar(false)
    setForm(FORM_VACIO)
    cargar()
  }

  const descargar = async (e: Evidencia) => {
    const { blob, nombreArchivo } = await api.descargarEvidencia(e.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = e.nombreArchivo || nombreArchivo
    a.click()
    URL.revokeObjectURL(url)
  }

  const eliminar = async (id: string) => {
    await api.eliminarEvidencia(id)
    cargar()
  }

  const IconoTipo =
    form.tipo === 'ARCHIVO' ? Paperclip : form.tipo === 'TEXTO' ? FileText : Link2

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          onClick={() => setMostrar((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <Plus size={13} /> Añadir evidencia
        </button>
      </div>
      {mostrar && (
        <div
          className="grid gap-2 rounded-2xl border p-3 sm:grid-cols-2 lg:grid-cols-4"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <Select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoEvidencia })}
            className="bsc-select">
            <option value="ENLACE">Enlace</option>
            <option value="TEXTO">Texto</option>
            <option value="ARCHIVO">Archivo</option>
          </Select>
          <input
            placeholder="Título"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
          <Select
            value={form.kpiId}
            onChange={(e) => setForm({ ...form, kpiId: e.target.value })}
            className="bsc-select">
            <option value="">KPI (opcional)</option>
            {kpis.map((k) => (
              <option key={k.id} value={k.id}>
                {k.codigo ?? k.id} · {k.nombre}
              </option>
            ))}
          </Select>
          <Select
            value={form.tareaId}
            onChange={(e) => setForm({ ...form, tareaId: e.target.value })}
            className="bsc-select">
            <option value="">Tarea (opcional)</option>
            {tareas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.titulo}
              </option>
            ))}
          </Select>

          {form.tipo === 'ENLACE' && (
            <input
              placeholder="URL"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="rounded-lg border px-2 py-1.5 text-xs sm:col-span-2"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            />
          )}
          {form.tipo === 'TEXTO' && (
            <textarea
              placeholder="Contenido de la evidencia"
              value={form.contenido}
              onChange={(e) => setForm({ ...form, contenido: e.target.value })}
              className="rounded-lg border px-2 py-1.5 text-xs sm:col-span-2"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            />
          )}
          {form.tipo === 'ARCHIVO' && (
            <label
              className="flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-xs"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <IconoTipo size={14} />
              {form.nombreArchivo || 'Seleccionar archivo (máx. 10 MB)'}
              <input
                type="file"
                className="hidden"
                onChange={(e) => seleccionarArchivo(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
          <input
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-xs sm:col-span-2"
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
      <div className="grid gap-2 sm:grid-cols-2">
        {evidencias.map((e) => (
          <div
            key={e.id}
            className="rounded-2xl border p-3"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  {e.tipo === 'ARCHIVO' ? (
                    <Paperclip size={13} />
                  ) : e.tipo === 'TEXTO' ? (
                    <FileText size={13} />
                  ) : (
                    <Link2 size={13} />
                  )}
                  {e.titulo}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {e.kpi?.nombre ?? e.kpiId ?? 'Sin KPI'} · {e.tipo} ·{' '}
                  {new Date(e.createdAt).toLocaleDateString()}
                </p>
                {e.descripcion && (
                  <p className="mt-1 line-clamp-2 text-[11px] text-[var(--muted)]">
                    {e.descripcion}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                {e.tipo === 'ARCHIVO' && (
                  <button
                    onClick={() => descargar(e)}
                    className="rounded-lg border p-1.5"
                    title="Descargar"
                  >
                    <Download size={13} />
                  </button>
                )}
                {e.tipo === 'ENLACE' && e.url && (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border p-1.5"
                    title="Abrir enlace"
                  >
                    <Link2 size={13} />
                  </a>
                )}
                <button
                  onClick={() => eliminar(e.id)}
                  className="rounded-lg border p-1.5 text-[#ef4444]"
                  title="Eliminar"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {e.tipo === 'TEXTO' && e.contenido && (
              <p
                className="mt-2 rounded-lg p-2 text-[11px]"
                style={{ background: 'var(--surface-2)' }}
              >
                {e.contenido}
              </p>
            )}
          </div>
        ))}
      </div>
      {evidencias.length === 0 && (
        <p className="text-center text-sm text-[var(--muted)]">Sin evidencias registradas.</p>
      )}
    </div>
  )
}
