import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, getEmpresaActiva, setEmpresaActiva } from '../lib/api'
import type { Empresa } from '../data/types'

export function useEmpresa(activo = true) {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [activaId, setActivaId] = useState<string>(() => getEmpresaActiva())
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!activo) return
    api
      .listarEmpresas()
      .then((lista) => {
        setEmpresas(lista)
        const guardada = getEmpresaActiva()
        if (!lista.some((e) => e.id === guardada)) {
          const primera = lista[0]?.id
          if (primera) {
            setEmpresaActiva(primera)
            setActivaId(primera)
          }
        }
      })
      .catch(() => setEmpresas([]))
      .finally(() => setCargando(false))
  }, [activo])

  const cambiar = useCallback((id: string) => {
    setEmpresaActiva(id)
    setActivaId(id)
  }, [])

  const activa = useMemo(
    () => empresas.find((e) => e.id === activaId) ?? null,
    [empresas, activaId],
  )

  return { empresas, activa, activaId, cargando, cambiar }
}
