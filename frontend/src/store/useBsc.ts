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

export function useBsc(periodoId?: string | null) {
  const [kpis, setKpis] = useState<Kpi[]>(() => mapLocal())
  const [resumenApi, setResumenApi] = useState<ResumenApi | null>(null)
  const [source, setSource] = useState<'local' | 'api'>('local')

  const cargar = useCallback(() => {
    const pid = periodoId ?? undefined
    Promise.all([api.listarKpis(pid), api.resumen(pid)])
      .then(([ks, rs]) => {
        if (Array.isArray(ks) && ks.length > 0) {
          setKpis(ks)
          setResumenApi(rs)
          setSource('api')
        }
      })
      .catch(() => setSource('local'))
  }, [periodoId])

  useEffect(() => {
    cargar()
  }, [cargar])

  const setReal = useCallback(
    (id: string, real: number) => {
      setKpis((prev) => prev.map((k) => (k.id === id ? { ...k, real } : k)))
      if (source === 'api') api.setReal(id, real).catch(() => {})
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
