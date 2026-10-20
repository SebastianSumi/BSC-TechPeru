import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ESTADO_META } from '../lib/bsc'
import type { KpiEvaluado } from '../data/types'

export function MetaRealChart({ kpis }: { kpis: KpiEvaluado[] }) {
  const data = kpis.map((k) => ({
    nombre: k.nombre.length > 22 ? k.nombre.slice(0, 20) + '…' : k.nombre,
    Meta: k.meta,
    Real: k.real,
    color: ESTADO_META[k.estado].color,
  }))

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="nombre"
            angle={-40}
            textAnchor="end"
            interval={0}
            height={80}
            tick={{ fill: 'var(--muted)', fontSize: 10 }}
          />
          <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: 'var(--text)',
            }}
          />
          <Bar dataKey="Meta" fill="#3f4d6b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Real" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
