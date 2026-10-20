import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { PERSPECTIVAS } from '../data/kpis'
import type { PerspectivaId, ResumenEstado } from '../data/types'

export function RadarPerspectivas({
  resumenes,
}: {
  resumenes: Record<PerspectivaId, ResumenEstado>
}) {
  const data = PERSPECTIVAS.map((p) => ({
    perspectiva: p.nombre.split(' ')[0],
    valor: resumenes[p.id].indiceGlobal,
  }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="perspectiva" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} />
          <Radar dataKey="valor" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.35} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
