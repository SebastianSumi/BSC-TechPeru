import { useCallback, useMemo, useState } from 'react'
import { KPIS } from '../data/kpis'
import { resumen } from '../lib/bsc'
import type { Kpi } from '../data/types'

export function useBsc() {
  const [kpis, setKpis] = useState<Kpi[]>(() => KPIS.map((k) => ({ ...k })))

  const setReal = useCallback((id: string, real: number) => {
    setKpis((prev) => prev.map((k) => (k.id === id ? { ...k, real } : k)))
  }, [])

  const reset = useCallback(() => {
    setKpis(KPIS.map((k) => ({ ...k })))
  }, [])

  const dirty = useMemo(
    () => kpis.some((k, i) => k.real !== KPIS[i].real),
    [kpis],
  )

  const resumenGlobal = useMemo(() => resumen(kpis), [kpis])

  return { kpis, setReal, reset, dirty, resumenGlobal }
}
