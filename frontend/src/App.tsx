import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ChevronRight,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Shield,
  SlidersHorizontal,
  Users as UsersIcon,
} from 'lucide-react'
import { AuthProvider, useAuth } from './store/useAuth'
import { useBsc } from './store/useBsc'
import { ESTADO_META, resumenPorPerspectiva } from './lib/bsc'
import { api } from './lib/api'
import { PERSPECTIVAS } from './data/kpis'
import { SemaforoDonut } from './components/SemaforoDonut'
import { RadarPerspectivas } from './components/RadarPerspectivas'
import { MetaRealChart } from './components/MetaRealChart'
import { KpiCard } from './components/KpiCard'
import { KpiModal } from './components/KpiModal'
import { SimuladorPanel } from './components/SimuladorPanel'
import { Login } from './components/Login'
import { Reportes } from './components/Reportes'
import { AdminPanel } from './components/AdminPanel'
import { PeriodoSelector } from './components/PeriodoSelector'
import type { KpiEvaluado, Periodo, PerspectivaId } from './data/types'

type Tab = 'dashboard' | PerspectivaId | 'simulador' | 'reportes' | 'admin'

function AppContent() {
  const { usuario, cargando, logout, puede } = useAuth()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [periodoId, setPeriodoId] = useState('')
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [sel, setSel] = useState<KpiEvaluado | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { kpis, evaluados, setReal, reset, dirty, resumenGlobal, source } =
    useBsc(periodoId || null)

  const resumenes = useMemo(() => resumenPorPerspectiva(kpis), [kpis])
  const selLive = sel ? evaluados.find((e) => e.id === sel.id) ?? null : null

  const cargarPeriodos = () => {
    api
      .listarPeriodos()
      .then((ps) => {
        setPeriodos(ps)
        if (!periodoId) {
          const activo = ps.find((p) => p.activo)
          if (activo) setPeriodoId(activo.id)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (usuario) cargarPeriodos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario])

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
        Cargando…
      </div>
    )
  }

  if (!usuario) return <Login />

  const TABS: { id: Tab; label: string; icono?: string; icon?: React.ReactNode; roles?: ('ADMIN' | 'GERENTE')[] }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { id: 'financiera', label: 'Financiera', icono: '💰' },
    { id: 'clientes', label: 'Clientes', icono: '👥' },
    { id: 'procesos', label: 'Procesos', icono: '🔧' },
    { id: 'aprendizaje', label: 'Aprendizaje', icono: '📚' },
    { id: 'simulador', label: 'Simulador', icon: <SlidersHorizontal size={15} /> },
    { id: 'reportes', label: 'Reportes', icon: <FileBarChart size={15} /> },
    { id: 'admin', label: 'Administración', icon: <UsersIcon size={15} />, roles: ['ADMIN', 'GERENTE'] },
  ]

  const tabsVisibles = TABS.filter((t) => !t.roles || puede(...t.roles))
  const puedeGestionar = puede('ADMIN', 'GERENTE')

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <header className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
              <Activity className="text-[#3b82f6]" /> Balanced Scorecard — TechPeru SAC
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              4 perspectivas · 12 objetivos · 36 KPIs · 2025
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: source === 'api' ? '#10b981' : '#f59e0b' }}
              />
              {source === 'api' ? 'Conectado al API (PostgreSQL)' : 'Datos locales (API offline)'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="rounded-xl border px-4 py-2 text-right"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <p className="text-[11px] text-[var(--muted)]">Índice global</p>
              <p className="text-2xl font-bold tabular-nums">{resumenGlobal.indiceGlobal}%</p>
              {dirty && <span className="text-[10px] text-[#f59e0b]">escenario simulado</span>}
            </div>
            <div
              className="rounded-xl border px-3 py-2 text-right"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <p className="flex items-center justify-end gap-1 text-xs font-semibold">
                <Shield size={12} className="text-[#3b82f6]" /> {usuario.rol}
              </p>
              <p className="text-[11px] text-[var(--muted)]">{usuario.nombre}</p>
              <button
                onClick={logout}
                className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-[#ef4444] hover:underline"
              >
                <LogOut size={10} /> Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1.5 overflow-x-auto pb-1">
          {tabsVisibles.map((t) => {
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
                {t.icon}
                {t.icono} {t.label}
              </button>
            )
          })}
        </nav>
        <PeriodoSelector
          periodos={periodos}
          periodoId={periodoId}
          onCambiar={setPeriodoId}
          onRecargar={cargarPeriodos}
          puedeGestionar={puedeGestionar}
          usuarioRol={usuario.rol}
        />
      </div>

      {tab === 'dashboard' && (
        <Dashboard evaluados={evaluados} resumenes={resumenes} resumenGlobal={resumenGlobal} onOpen={setSel} />
      )}

      {tab !== 'dashboard' &&
        tab !== 'simulador' &&
        tab !== 'reportes' &&
        tab !== 'admin' && (
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

      {tab === 'reportes' && <Reportes periodoId={periodoId || null} />}

      {tab === 'admin' && <AdminPanel />}

      {selLive && <KpiModal kpi={selLive} onClose={() => setSel(null)} />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
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
            <button
              key={p.id}
              onClick={() => onOpen({
                id: '',
                perspectivaId: p.id,
                objetivo: '',
                nombre: '',
                unidad: '',
                meta: 0,
                real: 0,
                inverso: false,
                accion: '',
                cumplimiento: r.indiceGlobal,
                estado: 'logrado',
              })}
              className="rounded-2xl border p-4 text-left"
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
            </button>
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
  const list = evaluados.filter((k) => k.perspectivaId === id)
  const r = resumenPorPerspectiva(evaluados)[id]
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
          <p className="mb-2 flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--muted)' }}>
            <ChevronRight size={14} /> {obj}
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
