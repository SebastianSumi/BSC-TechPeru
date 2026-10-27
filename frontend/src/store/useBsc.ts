import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { evaluarTodos, resumen } from '../lib/bsc'
import { KPIS } from '../data/kpis'
import type { Kpi, ResumenApi } from '../data/types'

function mapLocal(): Kpi[] {
  return KPIS.map((k) => ({
    id: k.id,
    perspectivaId: k.perspectivaId,
    objetivo: k.objetivo,
    nombre: k.nombre,
    unidad: k.unidad,
    meta: k.meta,
    real: k.real,
    inverso: k.inverso,
    accion: k.accion,
  }))
}

const RESUMEN_VACIO: ResumenApi = {
  indiceGlobal: 0,
  logrado: 0,
  riesgo: 0,
  critico: 0,
  total: 0,
  porPerspectiva: [],
}

export type FuenteDatos = 'local' | 'api' | 'sin-datos'

export function useBsc(periodoId?: string | null, empresaId?: string) {
  const esDemoLocal = !empresaId || empresaId === 'techperu'
  const [kpis, setKpis] = useState<Kpi[]>(() => (esDemoLocal ? mapLocal() : []))
  const [resumenApi, setResumenApi] = useState<ResumenApi | null>(null)
  const [source, setSource] = useState<FuenteDatos>('local')

  const cargar = useCallback(() => {
    const pid = periodoId ?? undefined
    const local = !empresaId || empresaId === 'techperu'
    Promise.all([api.listarKpis(pid), api.resumen(pid)])
      .then(([ks, rs]) => {
        if (!Array.isArray(ks)) return
        if (ks.length > 0) {
          setKpis(ks)
          setResumenApi(rs)
          setSource('api')
        } else if (!local) {
          setKpis([])
          setResumenApi(RESUMEN_VACIO)
          setSource('api')
        } else {
          setSource('local')
        }
      })
      .catch(() => setSource(local ? 'local' : 'sin-datos'))
  }, [periodoId, empresaId])

  useEffect(() => {
    cargar()
  }, [cargar])

  const setReal = useCallback(
    (id: string, real: number) => {
      setKpis((prev) => prev.map((k) => (k.id === id ? { ...k, real } : k)))
      if (source === 'api') {
        api
          .setReal(id, real)
          .then((actualizado) =>
            setKpis((prev) =>
              prev.map((k) => (k.id === id ? { ...k, ...actualizado } : k)),
            ),
          )
          .catch(() => {})
      }
    },
    [source],
  )

  const reset = useCallback(() => cargar(), [cargar])

  const dirty = useMemo(
    () =>
      kpis.some((k) => {
        const orig = KPIS.find((o) => o.id === k.id)
        return orig ? k.real !== orig.real : false
      }),
    [kpis],
  )

  const evaluados = useMemo(() => evaluarTodos(kpis), [kpis])
  const resumenGlobal = useMemo(
    () => resumenApi ?? resumen(kpis),
    [resumenApi, kpis],
  )

  return { kpis, evaluados, setReal, reset, dirty, resumenGlobal, source, recargar: cargar }
}
