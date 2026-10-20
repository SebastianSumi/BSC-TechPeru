import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { ESTADO_META } from '../lib/bsc'
import type { ResumenEstado } from '../data/types'

export function SemaforoDonut({ resumen }: { resumen: ResumenEstado }) {
  const data = useMemo(
    () => [
      { name: 'Logrado', value: resumen.logrado, color: ESTADO_META.logrado.color },
      { name: 'En riesgo', value: resumen.riesgo, color: ESTADO_META.riesgo.color },
      { name: 'Crítico', value: resumen.critico, color: ESTADO_META.critico.color },
    ].filter((d) => d.value > 0),
    [resumen],
  )

  return (
    <div className="relative h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={62}
            outerRadius={88}
            paddingAngle={3}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{resumen.indiceGlobal}%</span>
        <span className="text-[11px] text-[var(--muted)]">Índice global</span>
      </div>
    </div>
  )
}
