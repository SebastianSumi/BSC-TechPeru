import { useMemo, useState } from 'react'
import { Activity, LayoutDashboard, SlidersHorizontal } from 'lucide-react'
import { useBsc } from './store/useBsc'
import { evaluarTodos, ESTADO_META, resumenPorPerspectiva } from './lib/bsc'
import { PERSPECTIVAS } from './data/kpis'
import { SemaforoDonut } from './components/SemaforoDonut'
import { RadarPerspectivas } from './components/RadarPerspectivas'
import { MetaRealChart } from './components/MetaRealChart'
import { KpiCard } from './components/KpiCard'
import { KpiModal } from './components/KpiModal'
import { SimuladorPanel } from './components/SimuladorPanel'
import type { KpiEvaluado, PerspectivaId } from './data/types'

type Tab = 'dashboard' | PerspectivaId | 'simulador'

const TABS: { id: Tab; label: string; icono?: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'financiera', label: 'Financiera', icono: '💰' },
  { id: 'clientes', label: 'Clientes', icono: '👥' },
  { id: 'procesos', label: 'Procesos', icono: '🔧' },
  { id: 'aprendizaje', label: 'Aprendizaje', icono: '📚' },
  { id: 'simulador', label: 'Simulador' },
]

export default function App() {
  const { kpis, setReal, reset, dirty, resumenGlobal } = useBsc()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [sel, setSel] = useState<KpiEvaluado | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const evaluados = useMemo(() => evaluarTodos(kpis), [kpis])
  const resumenes = useMemo(() => resumenPorPerspectiva(kpis), [kpis])

  const selLive = sel ? evaluados.find((e) => e.id === sel.id) ?? null : null

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <header className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
              <Activity className="text-[#3b82f6]" /> Balanced Scorecard — TechPeru SAC
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              4 perspectivas · 12 objetivos estratégicos · 36 KPIs · 2025
            </p>
          </div>
          <div
            className="rounded-xl border px-4 py-2 text-right"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <p className="text-[11px] text-[var(--muted)]">Índice global</p>
            <p className="text-2xl font-bold tabular-nums">
              {resumenGlobal.indiceGlobal}%
            </p>
            {dirty && <span className="text-[10px] text-[#f59e0b]">escenario simulado</span>}
          </div>
        </div>
      </header>

      <nav className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3.5 py-2 text-sm font-medium transition"
              style={{
                background: active ? 'var(--surface-2)' : 'transparent',
                borderColor: active ? '#3b82f6' : 'var(--border)',
                color: active ? '#fff' : 'var(--muted)',
              }}
            >
              {t.id === 'dashboard' && <LayoutDashboard size={15} />}
              {t.id === 'simulador' && <SlidersHorizontal size={15} />}
              {t.icono} {t.label}
            </button>
          )
        })}
      </nav>

      {tab === 'dashboard' && (
        <Dashboard evaluados={evaluados} resumenes={resumenes} resumenGlobal={resumenGlobal} onOpen={setSel} />
      )}

      {tab !== 'dashboard' && tab !== 'simulador' && (
        <PerspectivaView id={tab} evaluados={evaluados} onOpen={setSel} />
      )}

      {tab === 'simulador' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SimuladorPanel
            kpis={kpis}
            setReal={setReal}
            reset={reset}
            dirty={dirty}
            expandedId={expandedId}
            onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
          />
          <div className="space-y-6">
            <Card title="Índice global en vivo">
              <SemaforoDonut resumen={resumenGlobal} />
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <Conteo label="Logrado" valor={resumenGlobal.logrado} color={ESTADO_META.logrado.color} />
                <Conteo label="En riesgo" valor={resumenGlobal.riesgo} color={ESTADO_META.riesgo.color} />
                <Conteo label="Crítico" valor={resumenGlobal.critico} color={ESTADO_META.critico.color} />
              </div>
            </Card>
            <Card title="Cumplimiento por perspectiva">
              <RadarPerspectivas resumenes={resumenes} />
            </Card>
          </div>
        </div>
      )}

      {selLive && <KpiModal kpi={selLive} onClose={() => setSel(null)} />}
    </div>
  )
}

function Dashboard({
  evaluados,
  resumenes,
  resumenGlobal,
  onOpen,
}: {
  evaluados: KpiEvaluado[]
  resumenes: ReturnType<typeof resumenPorPerspectiva>
  resumenGlobal: ReturnType<typeof useBsc>['resumenGlobal']
  onOpen: (k: KpiEvaluado) => void
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card title="Semáforo ejecutivo">
          <SemaforoDonut resumen={resumenGlobal} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <Conteo label="Logrado" valor={resumenGlobal.logrado} color={ESTADO_META.logrado.color} />
            <Conteo label="En riesgo" valor={resumenGlobal.riesgo} color={ESTADO_META.riesgo.color} />
            <Conteo label="Crítico" valor={resumenGlobal.critico} color={ESTADO_META.critico.color} />
          </div>
        </Card>
        <Card title="Cumplimiento por perspectiva">
          <RadarPerspectivas resumenes={resumenes} />
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PERSPECTIVAS.map((p) => {
          const r = resumenes[p.id]
          return (
            <div
              key={p.id}
              className="rounded-2xl border p-4"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span>{p.icono}</span> {p.nombre}
              </p>
              <p className="text-3xl font-bold tabular-nums" style={{ color: p.color }}>
                {r.indiceGlobal}%
              </p>
              <div className="mt-2 flex gap-2 text-xs text-[var(--muted)]">
                <span>✅ {r.logrado}</span>
                <span>⚠️ {r.riesgo}</span>
                <span>❌ {r.critico}</span>
              </div>
            </div>
          )
        })}
      </div>

      <Card title="Meta vs Real — todos los KPIs">
        <MetaRealChart kpis={evaluados} />
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold">Explorador de KPIs (36)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {evaluados.map((k) => (
            <KpiCard key={k.id} kpi={k} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PerspectivaView({
  id,
  evaluados,
  onOpen,
}: {
  id: PerspectivaId
  evaluados: KpiEvaluado[]
  onOpen: (k: KpiEvaluado) => void
}) {
  const p = PERSPECTIVAS.find((x) => x.id === id)!
  const list = evaluados.filter((k) => k.perspectiva === id)
  const r = resumenPorPerspectiva(
    evaluados.map((e) => ({ ...e })),
  )[id]

  const objetivos = [...new Set(list.map((k) => k.objetivo))]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold">
          {p.icono} {p.nombre}
        </h2>
        <span className="text-sm font-bold tabular-nums" style={{ color: p.color }}>
          {r.indiceGlobal}%
        </span>
      </div>

      {objetivos.map((obj) => (
        <div key={obj}>
          <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--muted)' }}>
            {obj}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list
              .filter((k) => k.objetivo === obj)
              .map((k) => (
                <KpiCard key={k.id} kpi={k} onOpen={onOpen} />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  )
}

function Conteo({ label, valor, color }: { label: string; valor: number; color: string }) {
  return (
    <div className="rounded-lg border py-2" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
      <p className="text-xl font-bold tabular-nums" style={{ color }}>
        {valor}
      </p>
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
    </div>
  )
}
